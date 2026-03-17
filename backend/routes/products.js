const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const { category, gender, search, sort } = req.query;
    let query = db('products');

    if (category) query = query.where('category', category);
    if (search) {
      query = query.where(function() {
        this.whereILike('name', `%${search}%`)
            .orWhereILike('description', `%${search}%`);
      });
    }
    if (sort === 'price_asc') query = query.orderBy('price', 'asc');
    else if (sort === 'price_desc') query = query.orderBy('price', 'desc');
    else if (sort === 'rating') query = query.orderBy('rating', 'desc');
    else query = query.orderBy('id', 'desc');

    let products = await query;
    // gender 필터: 해당 성별 카테고리에 속하는 상품만
    if (gender) {
      const cats = await db('categories').where('gender', gender);
      const slugSet = new Set(cats.map(c => c.slug));
      products = products.filter(p => slugSet.has(p.category));
    }
    res.json({ products, total: products.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await db('products').where('id', req.params.id).first();
    if (!product) return res.status(404).json({ error: '상품을 찾을 수 없습니다' });
    res.json(product);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
