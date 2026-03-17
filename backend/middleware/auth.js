const jwt = require('jsonwebtoken');
const db = require('../db');

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '로그인이 필요합니다' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'osakamarket_secret');
    const user = await db('users').where('id', decoded.id).first();
    if (!user) return res.status(401).json({ error: '사용자를 찾을 수 없습니다' });
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ error: '토큰이 유효하지 않습니다' });
  }
}

async function adminMiddleware(req, res, next) {
  await authMiddleware(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: '관리자 권한이 필요합니다' });
    }
    next();
  });
}

module.exports = { authMiddleware, adminMiddleware };
