const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');
const { adminMiddleware } = require('../middleware/auth');

// 관리자 전용 로그인 (아이디/비밀번호 방식)
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const ADMIN_ID = 'osakamarket0316';
  const ADMIN_PW = 'osakamarket0316';

  if (username !== ADMIN_ID || password !== ADMIN_PW) {
    return res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않습니다' });
  }

  const admin = await db('users').where('role', 'admin').first();
  if (!admin) return res.status(404).json({ error: '관리자 계정이 없습니다' });

  const token = jwt.sign(
    { id: admin.id, role: 'admin' },
    process.env.JWT_SECRET || 'osakamarket_secret',
    { expiresIn: '7d' }
  );
  res.json({ token, user: { id: admin.id, name: admin.name, role: admin.role } });
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

// 문의 읽음 처리
router.patch('/inquiries/:id/read', adminMiddleware, async (req, res) => {
  await db('inquiries').where('id', req.params.id).update({ status: 'read' });
  res.json({ message: '읽음 처리되었습니다' });
});

router.get('/orders', adminMiddleware, async (req, res) => {
  const orders = await db('orders').orderBy('created_at', 'desc');
  res.json(orders.map(o => ({
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

router.get('/users', adminMiddleware, async (req, res) => {
  const users = await db('users').select('id', 'name', 'email', 'role', 'created_at');
  res.json(users);
});

router.get('/products', adminMiddleware, async (req, res) => {
  res.json(await db('products').orderBy('id'));
});

router.post('/products', adminMiddleware, async (req, res) => {
  const [id] = await db('products').insert(req.body);
  const product = await db('products').where('id', id).first();
  res.status(201).json(product);
});

router.put('/products/:id', adminMiddleware, async (req, res) => {
  await db('products').where('id', req.params.id).update(req.body);
  const product = await db('products').where('id', req.params.id).first();
  if (!product) return res.status(404).json({ error: '상품을 찾을 수 없습니다' });
  res.json(product);
});

router.delete('/products/:id', adminMiddleware, async (req, res) => {
  const count = await db('products').where('id', req.params.id).del();
  if (!count) return res.status(404).json({ error: '상품을 찾을 수 없습니다' });
  res.json({ message: '삭제되었습니다' });
});

module.exports = router;
