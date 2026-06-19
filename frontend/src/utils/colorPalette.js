// 컬러 이름 → hex / 흰색 계열은 시인성 확보용 border 플래그.
// ProductDetail / ProductCard / QuickShop 등에서 공통으로 사용.

export const COLOR_PALETTE = {
  '블랙':       { hex: '#1a1a1a' },
  '화이트':     { hex: '#ffffff', border: true },
  '아이보리':   { hex: '#f5f0e1', border: true },
  '네이비':     { hex: '#1b2845' },
  '그레이':     { hex: '#a8a8a8' },
  '차콜그레이': { hex: '#36454f' },
  '베이지':     { hex: '#d2b48c' }
};

// JSON 문자열(colors)을 색상 객체 배열로 안전하게 변환.
// 등록되지 않은 이름은 회색 + border 로 폴백.
export function parseColors(jsonString) {
  if (!jsonString) return [];
  try {
    const arr = JSON.parse(jsonString);
    if (!Array.isArray(arr)) return [];
    return arr.map((name) => ({
      name,
      ...(COLOR_PALETTE[name] || { hex: '#ccc', border: true })
    }));
  } catch {
    return [];
  }
}

export function parseSizes(jsonString) {
  if (!jsonString) return [];
  try {
    const arr = JSON.parse(jsonString);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
