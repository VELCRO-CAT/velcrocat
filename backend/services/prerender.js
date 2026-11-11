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

const DEFAULT_DESC = '벨크로캣(VELCROCAT, VCAT) - 일본식 의류의 트렌드와 스타일링. 가디건, 니트, 풀오버 등 프리미엄 울 100% 의류';

// 정적 페이지 메타 — frontend/src/router/index.js의 route meta.title/description과 맞춰둠
const STATIC_PAGE_META = {
  '/brand': { title: '벨크로캣(VELCROCAT) | 브랜드 소개', description: DEFAULT_DESC },
  '/products': { title: '전체 상품 | 벨크로캣(VELCROCAT)', description: '벨크로캣(VELCROCAT) 전체 상품 - 가디건, 니트, 풀오버 등 프리미엄 울 100% 의류를 만나보세요.' },
  '/story': { title: '브랜드 스토리 | 벨크로캣(VELCROCAT)', description: DEFAULT_DESC },
  '/contact': { title: '문의하기 | 벨크로캣(VELCROCAT)', description: '벨크로캣(VELCROCAT)에 궁금한 점을 문의해보세요.' },
  '/terms': { title: '이용약관 | 벨크로캣(VELCROCAT)', description: DEFAULT_DESC },
  '/privacy': { title: '개인정보처리방침 | 벨크로캣(VELCROCAT)', description: DEFAULT_DESC },
  '/refund': { title: '환불정책 | 벨크로캣(VELCROCAT)', description: DEFAULT_DESC },
  '/cookies': { title: '쿠키 정책 | 벨크로캣(VELCROCAT)', description: DEFAULT_DESC }
};

function getStaticMeta(reqPath) {
  const page = STATIC_PAGE_META[reqPath];
  if (!page) return null;
  return {
    title: page.title,
    description: page.description,
    image: absoluteUrl(null),
    url: `${SITE_URL}${reqPath}`
  };
}

module.exports = { getProductMeta, getStaticMeta, absoluteUrl, truncate, SITE_URL };
