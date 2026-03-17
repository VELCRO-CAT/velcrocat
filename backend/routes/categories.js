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
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
