const express = require('express');
const router = express.Router();
const db = require('../db');
const { adminMiddleware } = require('../middleware/auth');

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

// ─── 관리자용 ───

// 알림 신청 목록 (상품 정보 join, 미통보 우선)
router.get('/restock', adminMiddleware, async (req, res) => {
  try {
    const rows = await db('restock_notifications as rn')
      .leftJoin('products as p', 'p.id', 'rn.product_id')
      .select(
        'rn.id', 'rn.product_id', 'rn.email', 'rn.color', 'rn.size',
        'rn.notified', 'rn.created_at',
        'p.name as product_name', 'p.image as product_image', 'p.stock as product_stock'
      )
      .orderBy('rn.notified', 'asc')   // 미통보 먼저
      .orderBy('rn.created_at', 'desc');
    res.json(rows);
  } catch (e) {
    console.error('[notify GET /restock]', e.message);
    res.status(500).json({ error: '알림 목록 조회에 실패했습니다' });
  }
});

// 통보 완료 표시 (수동 이메일 발송 후 체크)
router.put('/restock/:id/notify', adminMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const count = await db('restock_notifications').where('id', id).update({ notified: true });
    if (!count) return res.status(404).json({ error: '항목을 찾을 수 없습니다' });
    res.json({ ok: true });
  } catch (e) {
    console.error('[notify PUT]', e.message);
    res.status(500).json({ error: '통보 처리에 실패했습니다' });
  }
});

// 일괄 통보 처리 (상품 단위)
router.put('/restock/product/:productId/notify-all', adminMiddleware, async (req, res) => {
  try {
    const pid = Number(req.params.productId);
    const count = await db('restock_notifications').where({ product_id: pid, notified: false }).update({ notified: true });
    res.json({ ok: true, updated: count });
  } catch (e) {
    console.error('[notify PUT all]', e.message);
    res.status(500).json({ error: '일괄 통보 처리에 실패했습니다' });
  }
});

// 알림 신청 삭제
router.delete('/restock/:id', adminMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const count = await db('restock_notifications').where('id', id).del();
    if (!count) return res.status(404).json({ error: '항목을 찾을 수 없습니다' });
    res.json({ ok: true });
  } catch (e) {
    console.error('[notify DELETE]', e.message);
    res.status(500).json({ error: '삭제에 실패했습니다' });
  }
});

module.exports = router;
