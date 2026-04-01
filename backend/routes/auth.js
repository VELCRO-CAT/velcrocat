const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// 네이버 로그인 URL 생성
router.get('/naver', (req, res) => {
  const state = Math.random().toString(36).substring(2);
  const url = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${process.env.NAVER_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.NAVER_CALLBACK_URL)}&state=${state}`;
  res.json({ url });
});

// 네이버 콜백 처리
router.post('/naver/callback', async (req, res) => {
  const { code, state } = req.body;
  if (!code) return res.status(400).json({ error: '인증 코드가 없습니다' });

  try {
    // 1. 액세스 토큰 요청
    const tokenRes = await fetch(`https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id=${process.env.NAVER_CLIENT_ID}&client_secret=${process.env.NAVER_CLIENT_SECRET}&code=${code}&state=${state}`);
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      return res.status(400).json({ error: '네이버 인증에 실패했습니다' });
    }

    // 2. 사용자 정보 요청
    const profileRes = await fetch('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const profileData = await profileRes.json();

    if (profileData.resultcode !== '00') {
      return res.status(400).json({ error: '사용자 정보를 가져올 수 없습니다' });
    }

    const { id: naverId, name, email } = profileData.response;

    // 3. 기존 유저 확인 (이메일 또는 네이버 ID로)
    let user = await db('users').where('email', email).first();

    if (user) {
      // 기존 유저 - 네이버 ID 연동 (아직 안 되어있으면)
      if (!user.naver_id) {
        await db('users').where('id', user.id).update({ naver_id: naverId });
      }
    } else {
      // 신규 유저 - 자동 회원가입
      const [id] = await db('users').insert({
        name: name || '네이버 사용자',
        email,
        password: '',
        role: 'user',
        naver_id: naverId
      });
      user = { id, name: name || '네이버 사용자', email, role: 'user' };

      // 관리자 알림
      await db('notifications').insert({
        type: 'user',
        title: '새 회원이 가입했습니다 (네이버)',
        message: `${user.name}님 (${email})`,
        reference_id: String(id),
        is_read: false
      });
    }

    const { password: _, ...safeUser } = user;
    res.json({ message: '로그인되었습니다', token: generateToken(safeUser), user: safeUser });
  } catch (err) {
    console.error('네이버 로그인 오류:', err);
    res.status(500).json({ error: '로그인 처리 중 오류가 발생했습니다' });
  }
});

module.exports = router;
