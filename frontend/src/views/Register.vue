<template>
  <v-container class="py-16 d-flex justify-center">
    <v-card width="440" variant="outlined" class="pa-8 reg-card">
      <div class="text-center mb-8 reveal">
        <h1 class="text-h5 font-weight-bold" style="letter-spacing:2px">회원가입</h1>
        <p class="text-caption text-grey mt-1" style="letter-spacing:4px">REGISTER</p>
      </div>

      <v-form @submit.prevent="handleSubmit" class="reveal">
        <v-text-field v-model="name" label="이름" variant="outlined" density="comfortable" class="mb-3" required />

        <!-- 이메일 + 인증코드 발송 버튼 -->
        <div class="d-flex align-center gap-2 mb-1">
          <v-text-field
            v-model="email"
            label="이메일"
            type="email"
            variant="outlined"
            density="comfortable"
            :disabled="emailVerified"
            hide-details
            style="flex:1"
          />
          <v-btn
            v-if="!emailVerified"
            color="#111"
            variant="outlined"
            :loading="codeLoading"
            :disabled="!email || codeCooldown > 0"
            @click="sendCode"
            style="height:48px;min-width:100px;white-space:nowrap"
          >{{ codeCooldown > 0 ? `${codeCooldown}초` : (codeSent ? '재발송' : '인증코드') }}</v-btn>
          <v-chip v-else color="success" variant="flat" size="small" style="height:48px;padding:0 16px">
            <v-icon start size="16">mdi-check-circle</v-icon>인증완료
          </v-chip>
        </div>

        <!-- 인증코드 입력 -->
        <div v-if="codeSent && !emailVerified" class="mb-3">
          <div class="d-flex align-center gap-2 mt-2">
            <v-text-field
              v-model="code"
              label="인증코드 6자리"
              variant="outlined"
              density="comfortable"
              maxlength="6"
              hide-details
              style="flex:1"
            />
            <v-btn
              color="#111"
              :loading="verifyLoading"
              @click="verifyCode"
              style="height:48px;min-width:80px"
            >확인</v-btn>
          </div>
          <p class="text-caption text-grey mt-1">{{ timerText }}</p>
        </div>
        <div v-else class="mb-3"></div>

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
        <v-alert v-if="success" type="success" variant="tonal" density="compact" class="mb-4">{{ success }}</v-alert>

        <v-btn type="submit" color="#111" block size="large" :loading="loading" :disabled="!emailVerified">회원가입</v-btn>
      </v-form>

      <p class="text-center text-body-2 mt-4 reveal">
        이미 계정이 있으신가요?
        <router-link to="/login" style="color:#111;font-weight:600">로그인</router-link>
      </p>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import axios from 'axios';

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
const success = ref('');
const loading = ref(false);

// 이메일 인증
const code = ref('');
const codeSent = ref(false);
const codeLoading = ref(false);
const verifyLoading = ref(false);
const emailVerified = ref(false);
const verifyToken = ref('');
const codeCooldown = ref(0);
const timerText = ref('');
let timerInterval = null;
let cooldownInterval = null;

function startTimer(seconds) {
  let remaining = seconds;
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    remaining--;
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    timerText.value = `남은 시간: ${m}:${String(s).padStart(2, '0')}`;
    if (remaining <= 0) {
      clearInterval(timerInterval);
      timerText.value = '인증코드가 만료되었습니다';
    }
  }, 1000);
}

function startCooldown() {
  codeCooldown.value = 60;
  clearInterval(cooldownInterval);
  cooldownInterval = setInterval(() => {
    codeCooldown.value--;
    if (codeCooldown.value <= 0) clearInterval(cooldownInterval);
  }, 1000);
}

onUnmounted(() => {
  clearInterval(timerInterval);
  clearInterval(cooldownInterval);
});

async function sendCode() {
  error.value = '';
  success.value = '';
  codeLoading.value = true;
  try {
    await axios.post('/api/users/register/send-code', { email: email.value });
    codeSent.value = true;
    success.value = '인증코드가 발송되었습니다';
    startTimer(15 * 60);
    startCooldown();
  } catch (e) {
    error.value = e.response?.data?.error || '인증코드 발송에 실패했습니다';
  } finally {
    codeLoading.value = false;
  }
}

async function verifyCode() {
  error.value = '';
  success.value = '';
  verifyLoading.value = true;
  try {
    const res = await axios.post('/api/users/register/verify-code', {
      email: email.value,
      code: code.value
    });
    emailVerified.value = true;
    verifyToken.value = res.data.verifyToken;
    success.value = '이메일 인증이 완료되었습니다';
    clearInterval(timerInterval);
    timerText.value = '';
  } catch (e) {
    error.value = e.response?.data?.error || '인증에 실패했습니다';
  } finally {
    verifyLoading.value = false;
  }
}

async function handleSubmit() {
  error.value = '';
  success.value = '';
  if (!emailVerified.value) { error.value = '이메일 인증을 완료해주세요'; return; }
  if (password.value !== confirmPassword.value) { error.value = '비밀번호가 일치하지 않습니다'; return; }
  loading.value = true;
  try {
    const res = await axios.post('/api/users/register', {
      name: name.value,
      email: email.value,
      password: password.value,
      verifyToken: verifyToken.value
    });
    authStore.token = res.data.token;
    authStore.user = res.data.user;
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
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
.gap-2 { gap: 8px; }
</style>
