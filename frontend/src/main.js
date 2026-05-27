import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';

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
          primary: '#111111',
          secondary: '#555555',
          accent: '#111111',
          background: '#FFFFFF',
          surface: '#FFFFFF'
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

// 관리자 페이지 접근: 브라우저 콘솔에서 velcrocat() 입력
window.velcrocat = function () {
  sessionStorage.setItem('__osaka_admin_access', '1');
  router.push('/admin-login');
};

app.mount('#app');
