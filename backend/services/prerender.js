const db = require('../db');

const SITE_URL = process.env.SITE_URL || 'https://vcat.kr';

function absoluteUrl(src) {
  if (!src) return `${SITE_URL}/og-image.png`;
  return src.startsWith('http') ? src : `${SITE_URL}${src}`;
}

function truncate(text, max) {
  if (!text) return '';
  const clean = String(text).replace(/\s+/g, ' ').trim();
  return clean.length > max ? clean.slice(0, max - 1) + '…' : clean;
}

// 상품 상세 메타 — 없는 상품(id)이면 null 반환 (호출부에서 기본 템플릿 그대로 내려줌)
async function getProductMeta(id) {
  const product = await db('products').where('id', id).first();
  if (!product) return null;

  const title = `${product.name} | VELCROCAT`;
  const description = truncate(
    product.description || `${product.name} - 벨크로캣(VELCROCAT) 일본식 의류`,
    150
  );
  const image = absoluteUrl(product.image);
  const url = `${SITE_URL}/products/${product.id}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description,
    image,
    url,
    brand: { '@type': 'Brand', name: 'VELCROCAT' },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'KRW',
      price: String(product.price),
      availability: product.stock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock'
    }
  };

  return { title, description, image, url, jsonLd };
}

module.exports = { getProductMeta, absoluteUrl, truncate, SITE_URL };
