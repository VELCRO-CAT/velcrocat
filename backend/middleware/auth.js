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

// 다른 회원에게 관리자 권한을 주고 뺏을 수 있는 건 이 계정 하나뿐
const SUPER_ADMIN_EMAIL = 'osakamarket0316@osakamarket.kr';

async function superAdminMiddleware(req, res, next) {
  await adminMiddleware(req, res, () => {
    if (req.user.email !== SUPER_ADMIN_EMAIL) {
      return res.status(403).json({ error: '최고 관리자만 할 수 있습니다' });
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

module.exports = { authMiddleware, adminMiddleware, superAdminMiddleware, optionalAuthMiddleware, SUPER_ADMIN_EMAIL };
