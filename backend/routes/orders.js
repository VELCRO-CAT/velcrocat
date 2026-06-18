const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

function safeParse(json, fallback) {
  try { return json ? JSON.parse(json) : fallback; } catch { return fallback; }
}

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { items, total, paymentMethod, shippingAddress, merchant_uid } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: '주문 상품이 없습니다' });
    }
    const totalAmount = Number(total);
    if (!Number.isFinite(totalAmount) || totalAmount < 0) {
      return res.status(400).json({ error: '주문 금액이 올바르지 않습니다' });
    }

    const orderNo = merchant_uid || 'ORD-' + Date.now();
    // status는 클라이언트 입력을 신뢰하지 않는다. 결제 확인 전 주문은 'pending'으로 생성한다.
    await db('orders').insert({
      order_no: orderNo,
      user_id: req.user.id,
      user_name: req.user.name,
      user_email: req.user.email,
      items_json: JSON.stringify(items),
      total: totalAmount,
      payment_method: paymentMethod || 'card',
      shipping_address_json: JSON.stringify(shippingAddress),
      status: 'pending'
    });

    // 관리자 알림 생성
    await db('notifications').insert({
      type: 'order',
      title: '새 주문이 접수되었습니다',
      message: `${req.user.name}님이 ₩${totalAmount.toLocaleString()} 주문`,
      reference_id: orderNo,
      is_read: false
    });

    res.status(201).json({ message: '주문이 완료되었습니다', orderNo });
  } catch (e) {
    console.error('주문 생성 실패:', e);
    res.status(500).json({ error: '주문 처리 중 오류가 발생했습니다' });
  }
});

// 결제 실패 시 주문 취소
router.post('/cancel', authMiddleware, async (req, res) => {
  try {
    const { merchant_uid } = req.body;
    if (!merchant_uid) return res.status(400).json({ error: '주문번호가 없습니다' });
    await db('orders').where('order_no', merchant_uid).update({ status: 'cancelled' });
    res.json({ message: '주문이 취소되었습니다' });
  } catch (e) {
    console.error('주문 취소 실패:', e);
    res.status(500).json({ error: '주문 취소 중 오류가 발생했습니다' });
  }
});

router.get('/my', authMiddleware, async (req, res) => {
  try {
    const orders = await db('orders').where('user_id', req.user.id).orderBy('created_at', 'desc');
    res.json(orders.map(o => ({
      ...o,
      items: safeParse(o.items_json, []),
      shippingAddress: safeParse(o.shipping_address_json, null)
    })));
  } catch (e) {
    console.error('주문 조회 실패:', e);
    res.status(500).json({ error: '주문 내역을 불러오지 못했습니다' });
  }
});

module.exports = router;
