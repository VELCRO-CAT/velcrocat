const express = require('express');
const router = express.Router();
const db = require('../db');

const SITE_URL = process.env.SITE_URL || 'https://vcat.kr';

const STATIC_PAGES = [
  { loc: '/brand', priority: '1.0' },
  { loc: '/products', priority: '0.9' },
  { loc: '/story', priority: '0.8' },
  { loc: '/contact', priority: '0.7' }
];

router.get('/sitemap.xml', async (req, res) => {
  try {
    const products = await db('products').select('id', 'updated_at').orderBy('id', 'desc');

    const staticUrls = STATIC_PAGES.map(p =>
      `  <url>\n    <loc>${SITE_URL}${p.loc}</loc>\n    <priority>${p.priority}</priority>\n  </url>`
    ).join('\n');

    const productUrls = products.map(p => {
      const lastmod = p.updated_at ? new Date(p.updated_at).toISOString().slice(0, 10) : '';
      return `  <url>\n    <loc>${SITE_URL}/products/${p.id}</loc>\n` +
        (lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : '') +
        `    <priority>0.6</priority>\n  </url>`;
    }).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${staticUrls}\n${productUrls}\n</urlset>\n`;

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  } catch (e) {
    console.error('[sitemap] 생성 실패:', e);
    res.status(500).send('sitemap generation failed');
  }
});

module.exports = router;
