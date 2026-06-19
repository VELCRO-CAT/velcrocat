import { defineStore } from 'pinia';
import axios from 'axios';

// 사이트 전반에서 사용하는 편집 가능한 설정의 기본값.
// 백엔드/네트워크 실패 또는 admin이 비워둔 키는 이 값으로 fallback 한다.
export const SETTINGS_DEFAULTS = {
  hero_kicker:        'VELCROCAT — SEOUL',
  hero_title_main:    '2026',
  hero_title_sub:     'SPRING COLLECTION',
  hero_cta_text:      'SHOP THE COLLECTION',
  hero_cta_link:      '/products',

  editorial_image_url: '',
  editorial_quote:     '일상에 스며드는 감각적인 스타일,\n과하지 않은 심플함의 가치.',

  lookbook_image_url:  '',
  lookbook_title:      '2026 SPRING LOOKBOOK',
  lookbook_caption:    '울 100%, 한 벌의 완성도.',

  mosaic_men_image:    '',
  mosaic_women_image:  '',
  mosaic_unisex_image: '',

  collection_label:    '2026 SPRING'
};

// /public 엔드포인트가 노출해도 되는 키 (백엔드와 일치시켜야 함)
export const PUBLIC_SETTING_KEYS = Object.keys(SETTINGS_DEFAULTS);

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    values: { ...SETTINGS_DEFAULTS },
    loaded: false
  }),
  actions: {
    async load() {
      try {
        const res = await axios.get('/api/settings/public');
        // 빈 문자열은 default로 fallback 되도록 spread 순서 주의
        const incoming = res.data || {};
        const merged = { ...SETTINGS_DEFAULTS };
        for (const k of PUBLIC_SETTING_KEYS) {
          if (incoming[k] !== undefined && incoming[k] !== null && incoming[k] !== '') {
            merged[k] = incoming[k];
          }
        }
        this.values = merged;
      } catch {
        // fail-soft: defaults 유지
      } finally {
        this.loaded = true;
      }
    },
    get(key) {
      const v = this.values[key];
      return (v === undefined || v === null || v === '') ? SETTINGS_DEFAULTS[key] : v;
    },
    // admin 페이지에서 호출 (낙관적 업데이트 + 저장)
    async update(key, value) {
      this.values = { ...this.values, [key]: value };
      const token = localStorage.getItem('token');
      await axios.put(
        `/api/settings/${encodeURIComponent(key)}`,
        { value },
        { headers: { Authorization: token ? `Bearer ${token}` : '' } }
      );
    }
  }
});
