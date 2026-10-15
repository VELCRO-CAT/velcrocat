const fs = require('fs');
const path = require('path');
const { getProductMeta } = require('../services/prerender');

const DIST_INDEX_PATH = path.join(__dirname, '..', '..', 'frontend', 'dist', 'index.html');

let cachedTemplate = null;
function getTemplate() {
  if (cachedTemplate) return cachedTemplate;
  if (!fs.existsSync(DIST_INDEX_PATH)) return null;
  cachedTemplate = fs.readFileSync(DIST_INDEX_PATH, 'utf8');
  return cachedTemplate;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// 템플릿의 메타 태그들을 상품별 정보로 치환. 템플릿에 없는 태그(twitter: 등)는
// 이미 index.html에 기본값이 있으므로 항상 치환 대상이 존재한다는 전제.
function injectMeta(html, meta) {
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);
  const image = escapeHtml(meta.image);
  const url = escapeHtml(meta.url);

  let out = html
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${description}" />`)
    .replace(/<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${title}" />`)
    .replace(/<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${description}" />`)
    .replace(/<meta property="og:image" content="[^"]*"\s*\/?>/, `<meta property="og:image" content="${image}" />`)
    .replace(/<meta property="og:url" content="[^"]*"\s*\/?>/, `<meta property="og:url" content="${url}" />`)
    .replace(/<meta name="twitter:title" content="[^"]*"\s*\/?>/, `<meta name="twitter:title" content="${title}" />`)
    .replace(/<meta name="twitter:description" content="[^"]*"\s*\/?>/, `<meta name="twitter:description" content="${description}" />`)
    .replace(/<meta name="twitter:image" content="[^"]*"\s*\/?>/, `<meta name="twitter:image" content="${image}" />`);

  if (/<link rel="canonical" href="[^"]*"\s*\/?>/.test(out)) {
    out = out.replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${url}" />`);
  } else {
    out = out.replace('</head>', `  <link rel="canonical" href="${url}" />\n  </head>`);
  }

  if (meta.jsonLd) {
    const script = `  <script type="application/ld+json">${JSON.stringify(meta.jsonLd)}</script>\n`;
    out = out.replace('</head>', `${script}  </head>`);
  }

  return out;
}

// 상품 상세 페이지 — 존재하지 않는 id면 기본 템플릿 그대로 내려서 클라이언트가 404를 그리게 둔다
async function prerenderProduct(req, res, next) {
  try {
    const template = getTemplate();
    if (!template) return next(); // 빌드 전(dist 없음) 등은 그냥 다음으로 (개발 환경 보호)

    const meta = await getProductMeta(req.params.id);
    const html = meta ? injectMeta(template, meta) : template;
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (e) {
    console.error('[prerenderMeta] 오류:', e);
    next();
  }
}

module.exports = { prerenderProduct, injectMeta, getTemplate };
