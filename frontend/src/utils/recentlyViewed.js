// 최근 본 상품 — localStorage 기반 단순 유틸.
// ProductDetail.vue가 saveRecent()로 기록하고, Home.vue 등에서 pickRecentFromList()로 화면용 배열을 구성한다.

const KEY = 'osaka_recent';
const MAX = 10;

function safeLoadIds() {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = JSON.parse(raw || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function safeSaveIds(ids) {
  try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* quota exceeded 등은 무시 */ }
}

// 최근 본 상품 ID 추가 (가장 앞에 둠, 중복 제거)
export function saveRecent(product) {
  if (!product?.id) return;
  let ids = safeLoadIds();
  ids = ids.filter(id => id !== product.id);
  ids.unshift(product.id);
  if (ids.length > MAX) ids = ids.slice(0, MAX);
  safeSaveIds(ids);
}

// 화면에서 사용할 ID 배열 (옵션: 특정 ID 제외 — 상품 상세에서 자기 자신 제거할 때 사용)
export function loadRecentIds({ exclude = null } = {}) {
  let ids = safeLoadIds();
  if (exclude != null) ids = ids.filter(id => id !== exclude);
  return ids;
}

// 이미 가지고 있는 상품 배열에서 최근 본 순서로 골라 반환. exclude로 자기 자신 제외 가능.
// 서버에서 별도로 fetch 하지 않아도 됨 — Home.vue가 이미 /api/products 호출한 결과를 재사용.
export function pickRecentFromList(products, { exclude = null, limit = 8 } = {}) {
  if (!Array.isArray(products) || products.length === 0) return [];
  const ids = loadRecentIds({ exclude });
  if (!ids.length) return [];
  const byId = new Map(products.map(p => [p.id, p]));
  const out = [];
  for (const id of ids) {
    const p = byId.get(id);
    if (p) out.push(p);
    if (out.length >= limit) break;
  }
  return out;
}

// 외부에서 동일 KEY 참조가 필요할 때
export const RECENT_KEY = KEY;
