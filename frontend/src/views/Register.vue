<template>
  <v-container class="py-16 d-flex justify-center">
    <v-card width="440" variant="outlined" class="pa-8 reg-card">
      <div class="text-center mb-8 reveal">
        <h1 class="text-h5 font-weight-bold" style="letter-spacing:2px">회원가입</h1>
        <p class="text-caption text-grey mt-1" style="letter-spacing:4px">REGISTER</p>
      </div>

      <v-form @submit.prevent="handleRegister" class="reveal">
        <v-text-field v-model="name" label="이름" variant="outlined" density="comfortable" class="mb-3" required />
        <v-text-field v-model="email" label="이메일" type="email" variant="outlined" density="comfortable" class="mb-3" required />
        <v-text-field
          v-model="password"
          label="비밀번호 (6자 이상)"
          :type="showPw ? 'text' : 'password'"
          :append-inner-icon="showPw ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="showPw = !showPw"
          variant="outlined"
          density="comfortable"
          class="mb-3"
          required
        />
        <v-text-field
          v-model="confirmPassword"
          label="비밀번호 확인"
          :type="showPw ? 'text' : 'password'"
          variant="outlined"
          density="comfortable"
          class="mb-4"
          required
        />

        <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-4">{{ error }}</v-alert>

        <v-btn type="submit" color="#111" block size="large" :loading="loading">회원가입</v-btn>
      </v-form>

      <p class="text-center text-body-2 mt-4 reveal">
        이미 계정이 있으신가요?
        <router-link to="/login" style="color:#111;font-weight:600">로그인</router-link>
      </p>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

onMounted(() => {
  document.querySelectorAll('.reg-card .reveal').forEach((el, i) => {
    setTimeout(() => el.classList.add('visible'), 150 * (i + 1));
  });
});

const authStore = useAuthStore();
const router = useRouter();
const name = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const showPw = ref(false);
const error = ref('');
const loading = ref(false);

async function handleRegister() {
  error.value = '';
  if (password.value !== confirmPassword.value) { error.value = '비밀번호가 일치하지 않습니다'; return; }
  loading.value = true;
  try {
    await authStore.register(name.value, email.value, password.value);
    router.push('/');
  } catch (e) {
    error.value = e.response?.data?.error || '회원가입에 실패했습니다';
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
</style>
