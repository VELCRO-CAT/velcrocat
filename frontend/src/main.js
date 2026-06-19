import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';

import './assets/style.css'; /* 공통 디자인 토큰 (간격 스케일 · 컨테이너 폭) */
import './assets/hover-light.css'; /* 필요한 6개 애니메이션만 (95KB → 3KB) */
import App from './App.vue';
import router from './router';

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#1A1714',
          secondary: '#4A433C',
          accent: '#6E1F2E',
          background: '#F6F1E7',
          surface: '#FBF8F1'
        }
      }
    }
  }
});

const pinia = createPinia();
const app = createApp(App);
app.use(pinia);
app.use(router);
app.use(vuetify);

import { useAuthStore } from './stores/auth';
useAuthStore(pinia).initAuth();

// 장바구니를 localStorage에서 복원 (새로고침 시 유지)
import { useCartStore } from './stores/cart';
useCartStore(pinia).loadCart();

// 사이트 설정(히어로/룩북/모자이크 텍스트·이미지) 로드 — 실패해도 DEFAULTS로 fallback
import { useSettingsStore } from './stores/settings';
useSettingsStore(pinia).load();

// 관리자 페이지 접근: 브라우저 콘솔에서 velcrocat() 입력
window.velcrocat = function () {
  sessionStorage.setItem('__osaka_admin_access', '1');
  router.push('/admin-login');
};

app.mount('#app');
