import { useI18n } from 'vue-i18n';
import { localizeColorName } from '../utils/colorNames';

// 상품/카테고리처럼 DB에 name, name_en, name_zh, name_ja 식으로
// 언어별 컬럼이 나뉘어 저장된 데이터를 위한 헬퍼.
// 번역이 비어있으면 한국어(name) 값으로 자동 폴백.
export function useLocalized() {
  const { locale } = useI18n();

  function lf(obj, field) {
    if (!obj) return '';
    if (locale.value === 'ko') return obj[field] || '';
    const localized = obj[`${field}_${locale.value}`];
    return localized && localized.trim() ? localized : (obj[field] || '');
  }

  function colorName(name) {
    return localizeColorName(name, locale.value);
  }

  return { lf, locale, colorName };
}
