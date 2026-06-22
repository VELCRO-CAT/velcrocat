const express = require('express');
const router = express.Router();
const db = require('../db');
const { adminMiddleware } = require('../middleware/auth');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 공개 — 누구나 구독 가능. 중복은 멱등 처리.
router.post('/subscribe', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: '올바른 이메일을 입력해주세요' });
    }

    const existing = await db('newsletter_subscribers').where({ email }).first();
    if (existing) {
      return res.json({ ok: true, alreadySubscribed: true });
    }

    await db('newsletter_subscribers').insert({
      email,
      source: 'site_footer'
    });
    res.status(201).json({ ok: true });
  } catch (e) {
    console.error('[newsletter /subscribe]', e.message);
    res.status(500).json({ error: '구독 처리에 실패했습니다' });
  }
});

// 관리자 목록 조회 (최근 500건)
router.get('/', adminMiddleware, async (req, res) => {
  try {
    const rows = await db('newsletter_subscribers')
      .orderBy('created_at', 'desc')
      .limit(500);
    res.json(rows);
  } catch (e) {
    console.error('[newsletter GET]', e.message);
    res.status(500).json({ error: '목록 조회에 실패했습니다' });
  }
});

module.exports = router;
