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

// 로그인 여부와 무관하게 통과시키되, 유효한 토큰이 있으면 req.user를 채워준다 (비회원 주문용)
async function optionalAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return next();
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'osakamarket_secret');
    const user = await db('users').where('id', decoded.id).first();
    if (user) req.user = user;
  } catch (e) { /* 토큰이 유효하지 않아도 비회원으로 계속 진행 */ }
  next();
}

module.exports = { authMiddleware, adminMiddleware, optionalAuthMiddleware };
