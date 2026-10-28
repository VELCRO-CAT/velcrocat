const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');
const { adminMiddleware, superAdminMiddleware, SUPER_ADMIN_EMAIL } = require('../middleware/auth');

// 최고 관리자 전용 로그인 (아이디/비밀번호 방식) — 이 계정(SUPER_ADMIN_EMAIL) 하나에 로그인
// 수단이 2개 있는 것. 이 계정만 다른 회원에게 관리자 권한을 주고 뺏을 수 있음
// (승격된 회원은 role=admin이어도 superAdminMiddleware에서 이메일이 안 맞아 거부됨).
// 승격된 일반/카카오/네이버 회원은 각자 평소 로그인으로 /admin 접근.
// 아이디/비밀번호는 .env에 설정 (SUPER_ADMIN_USERNAME / SUPER_ADMIN_PASSWORD, _2)

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const matchesAccount1 = username === process.env.SUPER_ADMIN_USERNAME && password === process.env.SUPER_ADMIN_PASSWORD;
  const matchesAccount2 = username === process.env.SUPER_ADMIN_USERNAME2 && password === process.env.SUPER_ADMIN_PASSWORD2;
  if (!matchesAccount1 && !matchesAccount2) {
    return res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않습니다' });
  }

  const admin = await db('users').where('email', SUPER_ADMIN_EMAIL).first();
  if (!admin) return res.status(404).json({ error: '관리자 계정이 없습니다' });

  const token = jwt.sign(
    { id: admin.id, role: 'admin' },
    process.env.JWT_SECRET || 'osakamarket_secret',
    { expiresIn: '7d' }
  );
  res.json({ token, user: { id: admin.id, name: admin.name, email: admin.email, role: admin.role, username } });
});

// 회원 관리자 권한 부여/해제 — 최고 관리자만 가능
router.patch('/users/:id/role', superAdminMiddleware, async (req, res) => {
  const { role } = req.body;
  if (!['admin', 'user'].includes(role)) {
    return res.status(400).json({ error: '잘못된 권한 값입니다' });
  }
  const target = await db('users').where('id', req.params.id).first();
  if (!target) return res.status(404).json({ error: '회원을 찾을 수 없습니다' });
  await db('users').where('id', req.params.id).update({ role });
  res.json({ success: true });
});

router.get('/stats', adminMiddleware, async (req, res) => {
  const [productCount, orderCount, userCount, revenueResult, inquiryCount] = await Promise.all([
    db('products').count('id as count').first(),
    db('orders').count('id as count').first(),
    db('users').where('role', 'user').count('id as count').first(),
    db('orders').where('status', 'paid').sum('total as total').first(),
    db('inquiries').count('id as count').first()
  ]);
  res.json({
    totalProducts: productCount.count,
    totalOrders: orderCount.count,
    totalUsers: userCount.count,
    totalRevenue: revenueResult.total || 0,
    totalInquiries: inquiryCount.count
  });
});

// 문의 목록 조회
router.get('/inquiries', adminMiddleware, async (req, res) => {
  const inquiries = await db('inquiries').orderBy('created_at', 'desc');
  res.json(inquiries);
});

// 문의 읽음 처리 + 해당 알림도 읽음 처리
router.patch('/inquiries/:id/read', adminMiddleware, async (req, res) => {
  await db('inquiries').where('id', req.params.id).update({ status: 'read' });
  // 해당 문의의 알림도 읽음 처리
  await db('notifications').where('type', 'inquiry').where('reference_id', String(req.params.id)).update({ is_read: true });
  res.json({ message: '읽음 처리되었습니다' });
});

router.get('/orders', adminMiddleware, async (req, res) => {
  const orders = await db('orders').orderBy('created_at', 'desc');
  res.json(orders.map(({ guest_password, ...o }) => ({
    ...o,
    items: JSON.parse(o.items_json),
    shippingAddress: o.shipping_address_json ? JSON.parse(o.shipping_address_json) : null
  })));
});

router.patch('/orders/:id/status', adminMiddleware, async (req, res) => {
  await db('orders').where('id', req.params.id).update({ status: req.body.status });
  const order = await db('orders').where('id', req.params.id).first();
  res.json(order);
});

router.delete('/orders/:id', adminMiddleware, async (req, res) => {
  const count = await db('orders').where('id', req.params.id).del();
  if (!count) return res.status(404).json({ error: '주문을 찾을 수 없습니다' });
  res.json({ message: '삭제되었습니다' });
});

router.delete('/inquiries/:id', adminMiddleware, async (req, res) => {
  const count = await db('inquiries').where('id', req.params.id).del();
  if (!count) return res.status(404).json({ error: '문의를 찾을 수 없습니다' });
  res.json({ message: '삭제되었습니다' });
});

// 알림 목록 (읽지 않은 것만)
router.get('/notifications', adminMiddleware, async (req, res) => {
  const notifications = await db('notifications').orderBy('created_at', 'desc');
  const unread = notifications.filter(n => !n.is_read);
  res.json({ notifications: unread, total: notifications.length });
});

// 알림 전체 읽음 처리 (반드시 :id 라우트보다 위에)
router.patch('/notifications/read-all', adminMiddleware, async (req, res) => {
  await db('notifications').where('is_read', false).update({ is_read: true });
  res.json({ message: '전체 읽음 처리되었습니다' });
});

// 알림 개별 읽음 처리
router.patch('/notifications/:id/read', adminMiddleware, async (req, res) => {
  await db('notifications').where('id', req.params.id).update({ is_read: true });
  res.json({ message: '읽음 처리되었습니다' });
});

router.get('/users', adminMiddleware, async (req, res) => {
  const users = await db('users').select('id', 'name', 'email', 'role', 'created_at', 'kakao_id', 'naver_id');
  res.json(users);
});

router.get('/products', adminMiddleware, async (req, res) => {
  res.json(await db('products').orderBy('id', 'desc'));
});

// products 테이블의 실제 컬럼만 골라 반환 (잉여 필드/id/timestamps 제거)
async function pickProductColumns(body) {
  const info = await db('products').columnInfo();
  const cols = Object.keys(info);
  const out = {};
  for (const c of cols) {
    if (c === 'id' || c === 'created_at' || c === 'updated_at') continue;
    if (body[c] !== undefined) out[c] = body[c];
  }
  return out;
}

router.post('/products', adminMiddleware, async (req, res) => {
  try {
    const data = await pickProductColumns(req.body);
    const [{ id }] = await db('products').insert(data).returning('id');
    const product = await db('products').where('id', id).first();
    res.status(201).json(product);
  } catch (e) {
    console.error('[admin POST /products]', e.message);
    res.status(500).json({ error: '상품 추가에 실패했습니다' });
  }
});

router.put('/products/:id', adminMiddleware, async (req, res) => {
  try {
    const data = await pickProductColumns(req.body);
    await db('products').where('id', req.params.id).update(data);
    const product = await db('products').where('id', req.params.id).first();
    if (!product) return res.status(404).json({ error: '상품을 찾을 수 없습니다' });
    res.json(product);
  } catch (e) {
    console.error('[admin PUT /products]', e.message);
    res.status(500).json({ error: '상품 수정에 실패했습니다' });
  }
});

router.delete('/products/:id', adminMiddleware, async (req, res) => {
  const count = await db('products').where('id', req.params.id).del();
  if (!count) return res.status(404).json({ error: '상품을 찾을 수 없습니다' });
  res.json({ message: '삭제되었습니다' });
});

module.exports = router;
