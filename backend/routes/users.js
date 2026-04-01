const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

// 이메일 전송 설정 (네이버 SMTP)
const transporter = nodemailer.createTransport({
  host: 'smtp.naver.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// 인증코드 임시 저장 (메모리 기반, 서버 재시작 시 초기화)
const resetCodes = new Map();
const registerCodes = new Map();

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// 회원가입 이메일 인증코드 발송
router.post('/register/send-code', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: '이메일을 입력해주세요' });

  const exists = await db('users').where('email', email).first();
  if (exists) return res.status(409).json({ error: '이미 사용 중인 이메일입니다' });

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = Date.now() + 15 * 60 * 1000;
  registerCodes.set(email, { code, expiresAt, attempts: 0 });

  if (process.env.MAIL_USER && process.env.MAIL_PASS) {
    try {
      await transporter.sendMail({
        from: `"오사카마켓" <${process.env.MAIL_USER}>`,
        to: email,
        subject: '[오사카마켓] 회원가입 이메일 인증코드',
        html: `
          <div style="max-width:480px;margin:0 auto;font-family:'Apple SD Gothic Neo',sans-serif;padding:40px 20px">
            <h2 style="text-align:center;letter-spacing:2px;margin-bottom:30px">OSAKA MARKET</h2>
            <p style="color:#333">회원가입을 위한 이메일 인증코드입니다.</p>
            <div style="text-align:center;margin:30px 0;padding:20px;background:#f5f5f5;border-radius:8px">
              <span style="font-size:32px;letter-spacing:8px;font-weight:bold">${code}</span>
            </div>
            <p style="color:#999;font-size:13px">이 코드는 15분간 유효합니다.<br>본인이 요청하지 않았다면 이 메일을 무시해주세요.</p>
          </div>
        `
      });
    } catch (err) {
      console.error('이메일 발송 실패:', err.message);
      console.log(`[회원가입 인증] ${email} → 인증코드: ${code}`);
    }
  } else {
    console.log(`[회원가입 인증] ${email} → 인증코드: ${code}`);
  }

  res.json({ message: '인증코드가 발송되었습니다' });
});

// 회원가입 인증코드 확인
router.post('/register/verify-code', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: '이메일과 인증코드를 입력해주세요' });

  const record = registerCodes.get(email);
  if (!record) return res.status(400).json({ error: '인증코드를 먼저 요청해주세요' });

  if (record.attempts >= 5) {
    registerCodes.delete(email);
    return res.status(429).json({ error: '시도 횟수를 초과했습니다. 다시 요청해주세요' });
  }

  if (Date.now() > record.expiresAt) {
    registerCodes.delete(email);
    return res.status(400).json({ error: '인증코드가 만료되었습니다. 다시 요청해주세요' });
  }

  record.attempts++;

  if (record.code !== code) {
    return res.status(400).json({ error: '인증코드가 올바르지 않습니다' });
  }

  // 인증 성공 - 토큰 발급
  const verifyToken = jwt.sign({ email, purpose: 'register' }, process.env.JWT_SECRET, { expiresIn: '30m' });
  registerCodes.delete(email);

  res.json({ message: '이메일 인증이 완료되었습니다', verifyToken });
});

// 회원가입 (이메일 인증 완료 후)
router.post('/register', async (req, res) => {
  const { name, email, password, verifyToken } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: '모든 항목을 입력해주세요' });
  if (password.length < 6) return res.status(400).json({ error: '비밀번호는 6자 이상이어야 합니다' });

  // 이메일 인증 토큰 검증
  if (!verifyToken) return res.status(400).json({ error: '이메일 인증이 필요합니다' });
  try {
    const payload = jwt.verify(verifyToken, process.env.JWT_SECRET);
    if (payload.purpose !== 'register' || payload.email !== email) {
      return res.status(400).json({ error: '이메일 인증 정보가 올바르지 않습니다' });
    }
  } catch {
    return res.status(400).json({ error: '이메일 인증이 만료되었습니다. 다시 인증해주세요' });
  }

  const exists = await db('users').where('email', email).first();
  if (exists) return res.status(409).json({ error: '이미 사용 중인 이메일입니다' });

  const hashed = await bcrypt.hash(password, 10);
  const [id] = await db('users').insert({ name, email, password: hashed, role: 'user' });
  const user = { id, name, email, role: 'user' };

  // 관리자 알림 생성
  await db('notifications').insert({
    type: 'user',
    title: '새 회원이 가입했습니다',
    message: `${name}님 (${email})`,
    reference_id: String(id),
    is_read: false
  });

  res.status(201).json({ message: '회원가입이 완료되었습니다', token: generateToken(user), user });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요' });

  const user = await db('users').where('email', email).first();
  if (!user) return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다' });

  const { password: _, ...safeUser } = user;
  res.json({ message: '로그인되었습니다', token: generateToken(safeUser), user: safeUser });
});

router.get('/me', authMiddleware, async (req, res) => {
  const user = await db('users').where('id', req.user.id).first();
  const { password, ...safeUser } = user;
  res.json(safeUser);
});

// 프로필 수정 (이름, 이메일)
router.put('/me', authMiddleware, async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: '이름과 이메일을 입력해주세요' });

  // 이메일 중복 확인 (본인 제외)
  const exists = await db('users').where('email', email).where('id', '!=', req.user.id).first();
  if (exists) return res.status(409).json({ error: '이미 사용 중인 이메일입니다' });

  await db('users').where('id', req.user.id).update({ name, email });
  const user = await db('users').where('id', req.user.id).first();
  const { password: _, ...safeUser } = user;

  // 이메일 변경 시 토큰 재발급
  const token = generateToken(safeUser);
  res.json({ message: '정보가 수정되었습니다', user: safeUser, token });
});

// 비밀번호 변경 (로그인 상태)
router.put('/me/password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: '모든 항목을 입력해주세요' });
  if (newPassword.length < 6) return res.status(400).json({ error: '새 비밀번호는 6자 이상이어야 합니다' });

  const user = await db('users').where('id', req.user.id).first();
  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) return res.status(400).json({ error: '현재 비밀번호가 올바르지 않습니다' });

  const hashed = await bcrypt.hash(newPassword, 10);
  await db('users').where('id', req.user.id).update({ password: hashed });

  res.json({ message: '비밀번호가 변경되었습니다' });
});

// 회원 탈퇴
router.delete('/me', authMiddleware, async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: '비밀번호를 입력해주세요' });

  const user = await db('users').where('id', req.user.id).first();
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: '비밀번호가 올바르지 않습니다' });

  await db('users').where('id', req.user.id).del();
  res.json({ message: '회원 탈퇴가 완료되었습니다' });
});

// 비밀번호 찾기 - 인증코드 발송
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: '이메일을 입력해주세요' });

  const user = await db('users').where('email', email).first();
  if (!user) return res.status(404).json({ error: '등록되지 않은 이메일입니다' });

  // 6자리 인증코드 생성
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15분

  resetCodes.set(email, { code, expiresAt, attempts: 0 });

  // 이메일 발송 시도
  if (process.env.MAIL_USER && process.env.MAIL_PASS) {
    try {
      await transporter.sendMail({
        from: `"오사카마켓" <${process.env.MAIL_USER}>`,
        to: email,
        subject: '[오사카마켓] 비밀번호 재설정 인증코드',
        html: `
          <div style="max-width:480px;margin:0 auto;font-family:'Apple SD Gothic Neo',sans-serif;padding:40px 20px">
            <h2 style="text-align:center;letter-spacing:2px;margin-bottom:30px">OSAKA MARKET</h2>
            <p style="color:#333">비밀번호 재설정을 위한 인증코드입니다.</p>
            <div style="text-align:center;margin:30px 0;padding:20px;background:#f5f5f5;border-radius:8px">
              <span style="font-size:32px;letter-spacing:8px;font-weight:bold">${code}</span>
            </div>
            <p style="color:#999;font-size:13px">이 코드는 15분간 유효합니다.<br>본인이 요청하지 않았다면 이 메일을 무시해주세요.</p>
          </div>
        `
      });
    } catch (err) {
      console.error('이메일 발송 실패:', err.message);
      console.log(`[비밀번호 재설정] ${email} → 인증코드: ${code}`);
    }
  } else {
    console.log(`[비밀번호 재설정] ${email} → 인증코드: ${code}`);
  }

  res.json({ message: '인증코드가 발송되었습니다' });
});

// 인증코드 확인
router.post('/verify-reset-code', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: '이메일과 인증코드를 입력해주세요' });

  const record = resetCodes.get(email);
  if (!record) return res.status(400).json({ error: '인증코드를 먼저 요청해주세요' });

  if (record.attempts >= 5) {
    resetCodes.delete(email);
    return res.status(429).json({ error: '시도 횟수를 초과했습니다. 다시 요청해주세요' });
  }

  if (Date.now() > record.expiresAt) {
    resetCodes.delete(email);
    return res.status(400).json({ error: '인증코드가 만료되었습니다. 다시 요청해주세요' });
  }

  record.attempts++;

  if (record.code !== code) {
    return res.status(400).json({ error: '인증코드가 올바르지 않습니다' });
  }

  // 인증 성공 - 재설정 토큰 발급
  const resetToken = jwt.sign({ email, purpose: 'reset' }, process.env.JWT_SECRET, { expiresIn: '10m' });
  resetCodes.delete(email);

  res.json({ message: '인증이 완료되었습니다', resetToken });
});

// 비밀번호 재설정
router.post('/reset-password', async (req, res) => {
  const { resetToken, password } = req.body;
  if (!resetToken || !password) return res.status(400).json({ error: '모든 항목을 입력해주세요' });
  if (password.length < 6) return res.status(400).json({ error: '비밀번호는 6자 이상이어야 합니다' });

  try {
    const payload = jwt.verify(resetToken, process.env.JWT_SECRET);
    if (payload.purpose !== 'reset') throw new Error('invalid token');

    const hashed = await bcrypt.hash(password, 10);
    await db('users').where('email', payload.email).update({ password: hashed });

    res.json({ message: '비밀번호가 변경되었습니다' });
  } catch {
    res.status(400).json({ error: '유효하지 않은 요청입니다. 다시 시도해주세요' });
  }
});

module.exports = router;
