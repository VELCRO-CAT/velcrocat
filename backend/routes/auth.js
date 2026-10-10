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
      const [{ id }] = await db('users').insert({
        name: name || '네이버 사용자',
        email,
        password: '',
        role: 'user',
        naver_id: naverId
      }).returning('id');
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

// 카카오 로그인 URL 생성
router.get('/kakao', (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.KAKAO_CLIENT_ID,
    redirect_uri: process.env.KAKAO_CALLBACK_URL,
    response_type: 'code'
  });
  res.json({ url: `https://kauth.kakao.com/oauth/authorize?${params.toString()}` });
});

// 카카오 콜백 처리
router.post('/kakao/callback', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: '인증 코드가 없습니다' });

  try {
    // 1. 액세스 토큰 요청
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.KAKAO_CLIENT_ID,
      redirect_uri: process.env.KAKAO_CALLBACK_URL,
      code
    });
    if (process.env.KAKAO_CLIENT_SECRET) {
      tokenParams.set('client_secret', process.env.KAKAO_CLIENT_SECRET);
    }
    const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
      body: tokenParams
    });
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      return res.status(400).json({ error: '카카오 인증에 실패했습니다' });
    }

    // 2. 사용자 정보 요청
    const profileRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const profileData = await profileRes.json();

    if (!profileData.id) {
      return res.status(400).json({ error: '사용자 정보를 가져올 수 없습니다' });
    }

    const kakaoId = String(profileData.id);
    const email = profileData.kakao_account?.email;
    const name = profileData.kakao_account?.profile?.nickname;

    if (!email) {
      // 카카오 동의항목에서 "카카오계정(이메일)"이 필수 동의로 설정돼 있지 않거나
      // 사용자가 이메일 제공에 동의하지 않은 경우. 이메일이 없으면 기존 회원 식별/가입이 불가능함.
      return res.status(400).json({ error: '카카오 계정의 이메일 제공에 동의해주셔야 로그인할 수 있습니다' });
    }

    // 3. 기존 유저 확인 (이메일 또는 카카오 ID로)
    let user = await db('users').where('email', email).first();

    if (user) {
      // 기존 유저 - 카카오 ID 연동 (아직 안 되어있으면)
      if (!user.kakao_id) {
        await db('users').where('id', user.id).update({ kakao_id: kakaoId });
      }
    } else {
      // 신규 유저 - 자동 회원가입
      const [{ id }] = await db('users').insert({
        name: name || '카카오 사용자',
        email,
        password: '',
        role: 'user',
        kakao_id: kakaoId
      }).returning('id');
      user = { id, name: name || '카카오 사용자', email, role: 'user' };

      // 관리자 알림
      await db('notifications').insert({
        type: 'user',
        title: '새 회원이 가입했습니다 (카카오)',
        message: `${user.name}님 (${email})`,
        reference_id: String(id),
        is_read: false
      });
    }

    const { password: _, ...safeUser } = user;
    res.json({ message: '로그인되었습니다', token: generateToken(safeUser), user: safeUser });
  } catch (err) {
    console.error('카카오 로그인 오류:', err);
    res.status(500).json({ error: '로그인 처리 중 오류가 발생했습니다' });
  }
});

module.exports = router;
