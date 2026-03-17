const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: '모든 항목을 입력해주세요' });
  if (password.length < 6) return res.status(400).json({ error: '비밀번호는 6자 이상이어야 합니다' });

  const exists = await db('users').where('email', email).first();
  if (exists) return res.status(409).json({ error: '이미 사용 중인 이메일입니다' });

  const hashed = await bcrypt.hash(password, 10);
  const [id] = await db('users').insert({ name, email, password: hashed, role: 'user' });
  const user = { id, name, email, role: 'user' };
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

module.exports = router;
