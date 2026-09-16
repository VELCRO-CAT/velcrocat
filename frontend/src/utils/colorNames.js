// 상품 컬러명은 DB/admin에 한국어로만 저장되어 있어(예: '차콜그레이'),
// 화면 표시용으로만 로케일별 이름을 매핑한다.
const COLOR_NAME_MAP = {
  '블랙':     { en: 'Black',   zh: '黑色',   ja: 'ブラック' },
  '화이트':   { en: 'White',   zh: '白色',   ja: 'ホワイト' },
  '아이보리': { en: 'Ivory',   zh: '象牙白', ja: 'アイボリー' },
  '네이비':   { en: 'Navy',    zh: '藏青色', ja: 'ネイビー' },
  '그레이':   { en: 'Grey',    zh: '灰色',   ja: 'グレー' },
  '차콜그레이': { en: 'Charcoal Grey', zh: '炭灰色', ja: 'チャコールグレー' },
  '베이지':   { en: 'Beige',   zh: '米色',   ja: 'ベージュ' }
};

export function localizeColorName(koreanName, locale) {
  if (!koreanName) return koreanName;
  if (locale === 'ko' || !locale) return koreanName;
  const entry = COLOR_NAME_MAP[koreanName];
  return entry?.[locale] || koreanName;
}
