<template>
  <v-container class="py-16 d-flex justify-center align-center" style="min-height:60vh">
    <div class="text-center">
      <v-progress-circular v-if="!error" indeterminate color="#111" size="48" class="mb-4" />
      <p v-if="!error" class="text-body-1">로그인 처리 중...</p>
      <div v-else>
        <v-icon size="48" color="error" class="mb-4">mdi-alert-circle-outline</v-icon>
        <p class="text-body-1 mb-4">{{ error }}</p>
        <v-btn color="#111" @click="$router.push('/login')">로그인으로 돌아가기</v-btn>
      </div>
    </div>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import axios from 'axios';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const error = ref('');

onMounted(async () => {
  const code = route.query.code;
  const state = route.query.state;
  const provider = route.params.provider;

  if (!code) {
    error.value = '인증 코드가 없습니다';
    return;
  }

  try {
    const res = await axios.post(`/api/auth/${provider}/callback`, { code, state });
    authStore.token = res.data.token;
    authStore.user = res.data.user;
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
    router.push('/');
  } catch (e) {
    error.value = e.response?.data?.error || '로그인에 실패했습니다';
  }
});
</script>
