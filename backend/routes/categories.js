const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const categories = await db('categories');
    // Add product count
    const withCount = await Promise.all(categories.map(async (cat) => {
      const count = await db('products').where('category', cat.slug).count('id as count').first();
      return { ...cat, count: count.count };
    }));
    res.json(withCount);
  } catch (e) {
    console.error('카테고리 조회 실패:', e);
    res.status(500).json({ error: '카테고리를 불러오지 못했습니다' });
  }
});

module.exports = router;
