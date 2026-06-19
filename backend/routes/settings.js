const express = require('express');
const router = express.Router();
const db = require('../db');
const { adminMiddleware } = require('../middleware/auth');

// /public 에서 노출해도 안전한 키 화이트리스트.
// (네이버 API 키 같은 민감 정보가 새지 않도록 반드시 명시.)
const PUBLIC_KEYS = [
  'hero_kicker',
  'hero_title_main',
  'hero_title_sub',
  'hero_cta_text',
  'hero_cta_link',
  'editorial_image_url',
  'editorial_quote',
  'lookbook_image_url',
  'lookbook_title',
  'lookbook_caption',
  'mosaic_men_image',
  'mosaic_women_image',
  'mosaic_unisex_image',
  'collection_label'
];

function rowsToObject(rows) {
  const out = {};
  for (const r of rows) {
    out[r.key] = r.value;
  }
  return out;
}

// 공개 — 누구나 접근 가능, 화이트리스트 키만 반환
router.get('/public', async (req, res) => {
  try {
    const rows = await db('settings').whereIn('key', PUBLIC_KEYS);
    res.json(rowsToObject(rows));
  } catch (e) {
    console.error('[settings /public]', e.message);
    res.json({}); // fail-soft — 프론트가 defaults로 폴백
  }
});

// 관리자 전체 조회 (PUBLIC_KEYS 만 노출, 민감 키 차단)
router.get('/', adminMiddleware, async (req, res) => {
  try {
    const rows = await db('settings').whereIn('key', PUBLIC_KEYS);
    res.json(rowsToObject(rows));
  } catch (e) {
    console.error('[settings GET]', e.message);
    res.status(500).json({ error: '설정을 불러오지 못했습니다' });
  }
});

// 관리자 upsert
router.put('/:key', adminMiddleware, async (req, res) => {
  try {
    const key = req.params.key;
    if (!PUBLIC_KEYS.includes(key)) {
      return res.status(400).json({ error: '허용되지 않은 설정 키입니다' });
    }
    const incoming = req.body?.value;
    const value = typeof incoming === 'string' ? incoming : JSON.stringify(incoming ?? '');

    const existing = await db('settings').where('key', key).first();
    if (existing) {
      await db('settings').where('key', key).update({
        value,
        updated_at: new Date().toISOString()
      });
    } else {
      await db('settings').insert({ key, value });
    }
    res.json({ ok: true, key, value });
  } catch (e) {
    console.error('[settings PUT]', e.message);
    res.status(500).json({ error: '설정 저장에 실패했습니다: ' + e.message });
  }
});

module.exports = router;
