import { createI18n } from 'vue-i18n';
import ko from '../locales/ko.js';
import en from '../locales/en.js';
import zh from '../locales/zh.js';
import ja from '../locales/ja.js';

export const SUPPORTED_LOCALES = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' }
];

function detectLocale() {
  const saved = localStorage.getItem('velcrocat_locale');
  if (saved && SUPPORTED_LOCALES.some(l => l.code === saved)) return saved;
  const nav = (navigator.language || 'ko').toLowerCase();
  if (nav.startsWith('en')) return 'en';
  if (nav.startsWith('zh')) return 'zh';
  if (nav.startsWith('ja')) return 'ja';
  return 'ko';
}

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: detectLocale(),
  fallbackLocale: 'ko',
  messages: { ko, en, zh, ja }
});

export function setLocale(code) {
  if (!SUPPORTED_LOCALES.some(l => l.code === code)) return;
  i18n.global.locale.value = code;
  localStorage.setItem('velcrocat_locale', code);
  document.documentElement.setAttribute('lang', code);
}

export default i18n;
