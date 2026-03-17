const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

router.post('/', authMiddleware, async (req, res) => {
  const { items, total, paymentMethod, shippingAddress, merchant_uid, status } = req.body;
  if (!items || items.length === 0) return res.status(400).json({ error: '주문 상품이 없습니다' });

  const orderNo = merchant_uid || 'ORD-' + Date.now();
  await db('orders').insert({
    order_no: orderNo,
    user_id: req.user.id,
    user_name: req.user.name,
    user_email: req.user.email,
    items_json: JSON.stringify(items),
    total,
    payment_method: paymentMethod || 'card',
    shipping_address_json: JSON.stringify(shippingAddress),
    status: status || 'paid'
  });

  res.status(201).json({ message: '주문이 완료되었습니다', orderNo });
});

// 결제 실패 시 주문 취소
router.post('/cancel', authMiddleware, async (req, res) => {
  const { merchant_uid } = req.body;
  if (!merchant_uid) return res.status(400).json({ error: '주문번호가 없습니다' });
  await db('orders').where('order_no', merchant_uid).update({ status: 'cancelled' });
  res.json({ message: '주문이 취소되었습니다' });
});

router.get('/my', authMiddleware, async (req, res) => {
  const orders = await db('orders').where('user_id', req.user.id).orderBy('created_at', 'desc');
  res.json(orders.map(o => ({
    ...o,
    items: JSON.parse(o.items_json),
    shippingAddress: o.shipping_address_json ? JSON.parse(o.shipping_address_json) : null
  })));
});

module.exports = router;
