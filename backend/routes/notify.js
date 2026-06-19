const express = require('express');
const router = express.Router();
const db = require('../db');

// 재입고 알림 신청 (누구나 가능)
router.post('/restock', async (req, res) => {
  try {
    const { productId, email, color, size } = req.body || {};

    if (!productId || !email) {
      return res.status(400).json({ error: '상품과 이메일은 필수입니다' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: '올바른 이메일 형식이 아닙니다' });
    }

    // 동일 (productId, email, color, size) 중복 신청 차단 — 멱등
    const existing = await db('restock_notifications')
      .where({ product_id: productId, email })
      .where(function () {
        if (color) this.where('color', color);
        else this.whereNull('color');
      })
      .where(function () {
        if (size) this.where('size', size);
        else this.whereNull('size');
      })
      .first();

    if (existing) {
      return res.json({ ok: true, message: '이미 알림 신청이 되어 있습니다' });
    }

    await db('restock_notifications').insert({
      product_id: productId,
      email,
      color: color || null,
      size: size || null,
      notified: false
    });

    res.status(201).json({ ok: true });
  } catch (e) {
    console.error('[notify /restock]', e.message);
    res.status(500).json({ error: '알림 신청 처리에 실패했습니다' });
  }
});

module.exports = router;
