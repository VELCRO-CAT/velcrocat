<template>
  <v-container class="py-16 d-flex justify-center">
    <v-card width="440" variant="outlined" class="pa-8 login-card">
      <div class="text-center mb-8 reveal reveal-1">
        <h1 class="text-h5 font-weight-bold" style="letter-spacing:2px">로그인</h1>
        <p class="text-caption text-grey mt-1" style="letter-spacing:4px">LOGIN</p>
      </div>

      <v-form @submit.prevent="handleLogin" class="reveal reveal-2">
        <v-text-field
          v-model="email"
          label="이메일"
          type="email"
          variant="outlined"
          density="comfortable"
          class="mb-3"
          required
        />
        <v-text-field
          v-model="password"
          label="비밀번호"
          :type="showPw ? 'text' : 'password'"
          :append-inner-icon="showPw ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="showPw = !showPw"
          variant="outlined"
          density="comfortable"
          class="mb-4"
          required
        />

        <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-4">{{ error }}</v-alert>

        <v-btn type="submit" color="#111" block size="large" :loading="loading">로그인</v-btn>
      </v-form>

      <!-- 소셜 로그인 -->
      <div class="reveal reveal-3 mt-6">
        <div class="social-divider">
          <span>또는</span>
        </div>
        <v-btn
          block
          size="large"
          class="mt-4 naver-btn"
          @click="naverLogin"
          :loading="naverLoading"
        >
          <img src="https://static.nid.naver.com/oauth/small_g_in.PNG" alt="네이버" style="height:20px;margin-right:8px" />
          네이버로 로그인
        </v-btn>
      </div>

      <div class="text-center mt-4 reveal reveal-4">
        <p class="text-body-2 mb-1">
          <router-link to="/forgot-password" style="color:#888;font-weight:500;text-decoration:none">비밀번호를 잊으셨나요?</router-link>
        </p>
        <p class="text-body-2">
          계정이 없으신가요?
          <router-link to="/register" style="color:#111;font-weight:600">회원가입</router-link>
        </p>
      </div>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import axios from 'axios';

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
const naverLoading = ref(false);

async function naverLogin() {
  naverLoading.value = true;
  try {
    const res = await axios.get('/api/auth/naver');
    window.location.href = res.data.url;
  } catch {
    error.value = '네이버 로그인 연결에 실패했습니다';
    naverLoading.value = false;
  }
}

async function handleLogin() {
  error.value = '';
  loading.value = true;
  try {
    await authStore.login(email.value, password.value);
    router.push(route.query.redirect || '/');
  } catch (e) {
    error.value = e.response?.data?.error || '로그인에 실패했습니다';
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
.naver-btn {
  background: #03C75A !important;
  color: white !important;
  font-weight: 600;
  letter-spacing: 0.5px;
}
</style>
