<template>
  <v-container class="py-16 d-flex justify-center">
    <div class="login-card">
      <div class="mb-8 reveal reveal-1">
        <h1 class="text-h5 font-weight-bold" style="letter-spacing:1px">{{ t('auth.loginTitle') }}</h1>
      </div>

      <v-form @submit.prevent="handleLogin" class="reveal reveal-2">
        <label class="field-label">{{ t('auth.emailLabel') }}</label>
        <v-text-field
          v-model="email"
          type="email"
          variant="outlined"
          density="comfortable"
          hide-details
          class="mb-3"
          required
        />
        <label class="field-label">{{ t('auth.passwordLabel') }}</label>
        <v-text-field
          v-model="password"
          :type="showPw ? 'text' : 'password'"
          :append-inner-icon="showPw ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="showPw = !showPw"
          variant="outlined"
          density="comfortable"
          hide-details
          class="mb-4"
          required
        />

        <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-4">{{ error }}</v-alert>

        <div class="login-btn-row">
          <v-btn type="submit" color="#111" block size="large" :loading="loading">{{ t('auth.loginBtn') }}</v-btn>
          <v-btn to="/register" variant="outlined" color="#111" block size="large">{{ t('auth.registerLink') }}</v-btn>
        </div>
      </v-form>

      <div class="text-center mt-4 reveal reveal-3">
        <router-link to="/forgot-password" class="login-util-link">{{ t('auth.forgotPasswordLink') }}</router-link>
      </div>

      <!-- 소셜 로그인 -->
      <div class="reveal reveal-4 mt-6">
        <div class="social-divider">
          <span>{{ t('auth.or') }}</span>
        </div>
        <div class="mt-4">
          <NaverLoginButton />
          <KakaoLoginButton />
        </div>
      </div>
    </div>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../stores/auth';
import axios from 'axios';
import NaverLoginButton from '../components/NaverLoginButton.vue';
import KakaoLoginButton from '../components/KakaoLoginButton.vue';

const { t } = useI18n();

onMounted(() => {
  document.querySelectorAll('.login-card .reveal').forEach((el, i) => {
    setTimeout(() => el.classList.add('visible'), 150 * (i + 1));
  });
});

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const email = ref('');
const password = ref('');
const showPw = ref(false);
const error = ref('');
const loading = ref(false);

async function handleLogin() {
  error.value = '';
  loading.value = true;
  try {
    await authStore.login(email.value, password.value);
    router.push(route.query.redirect || '/products');
  } catch (e) {
    error.value = e.response?.data?.error || t('auth.loginFailed');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.reveal {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
.social-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #999;
  font-size: 13px;
}
.social-divider::before,
.social-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #ddd;
}

.login-card { width: 440px; max-width: 100%; }

/* 필드 라벨 — 플로팅 라벨 대신 입력란 위에 고정 라벨 */
.field-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #555;
  margin-bottom: 6px;
  letter-spacing: -0.2px;
}
:deep(.v-field) {
  border-radius: 4px !important;
  font-size: 14px;
}
:deep(.v-field__outline__start),
:deep(.v-field__outline__end) {
  border-color: #e0e0e0 !important;
}
/* notch(라벨 자리) 완전 숨김 - 라벨을 위에 별도로 두기 때문 */
:deep(.v-field__outline__notch) {
  display: none !important;
}
:deep(.v-field__outline__start) {
  border-right: 0 !important;
}
:deep(.v-field__outline__end) {
  border-left: 0 !important;
}
:deep(.v-field--variant-outlined .v-field__outline) {
  --v-field-border-width: 1px;
}
:deep(.v-field--variant-outlined .v-field__outline__start),
:deep(.v-field--variant-outlined .v-field__outline__end) {
  border-top: 1px solid #e0e0e0 !important;
  border-bottom: 1px solid #e0e0e0 !important;
}
:deep(.v-field--focused .v-field__outline__start),
:deep(.v-field--focused .v-field__outline__end) {
  border-color: #111 !important;
  border-top-color: #111 !important;
  border-bottom-color: #111 !important;
  border-width: 1.5px !important;
}

/* 로그인 / 회원가입 버튼을 각각 전체 너비로 위아래 배치 */
.login-btn-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.login-util-link {
  font-size: 13px;
  color: #888;
  font-weight: 500;
  text-decoration: none;
}
.login-util-link:hover { color: #111; }

/* 모바일: 데스크톱 기준 py-16(위아래 64px)이 과도하게 커 보이던 것 축소 */
@media (max-width: 640px) {
  .v-container.py-16 { padding-top: 32px !important; padding-bottom: 32px !important; }
}
</style>
