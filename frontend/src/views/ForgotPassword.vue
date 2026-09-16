<template>
  <v-container class="py-16 d-flex justify-center">
    <v-card width="440" variant="outlined" class="pa-8 forgot-card">
      <div class="text-center mb-8 reveal">
        <h1 class="text-h5 font-weight-bold" style="letter-spacing:2px">{{ t('auth.forgotTitle') }}</h1>
        <p class="text-caption text-grey mt-1" style="letter-spacing:4px">RESET PASSWORD</p>
      </div>

      <!-- Step 1: 이메일 입력 -->
      <v-form v-if="step === 1" @submit.prevent="sendCode" class="reveal">
        <p class="text-body-2 text-grey-darken-1 mb-4">{{ t('auth.step1Desc') }}</p>
        <v-text-field
          v-model="email"
          :label="t('auth.emailLabel')"
          type="email"
          variant="outlined"
          density="comfortable"
          class="mb-4"
          required
        />
        <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-4">{{ error }}</v-alert>
        <v-btn type="submit" color="#111" block size="large" :loading="loading">{{ t('auth.sendCodeFullBtn') }}</v-btn>
      </v-form>

      <!-- Step 2: 인증코드 입력 -->
      <v-form v-if="step === 2" @submit.prevent="verifyCode" class="reveal visible">
        <p class="text-body-2 text-grey-darken-1 mb-4" v-html="t('auth.step2Desc', { email })"></p>
        <v-text-field
          v-model="code"
          :label="t('auth.codeLabel')"
          variant="outlined"
          density="comfortable"
          class="mb-1"
          maxlength="6"
          required
        />
        <p class="text-caption text-grey mb-4">{{ timerText }}</p>
        <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-4">{{ error }}</v-alert>
        <v-btn type="submit" color="#111" block size="large" :loading="loading">{{ t('auth.confirmBtn') }}</v-btn>
        <v-btn variant="text" block class="mt-2" @click="resendCode" :disabled="resendCooldown > 0">
          {{ resendCooldown > 0 ? t('auth.resendWithCooldown', { count: resendCooldown }) : t('auth.resendCodeBtn') }}
        </v-btn>
      </v-form>

      <!-- Step 3: 새 비밀번호 입력 -->
      <v-form v-if="step === 3" @submit.prevent="resetPassword" class="reveal visible">
        <p class="text-body-2 text-grey-darken-1 mb-4">{{ t('auth.step3Desc') }}</p>
        <v-text-field
          v-model="newPassword"
          :label="t('auth.newPasswordLabel')"
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
          :label="t('auth.newPasswordConfirmLabel')"
          :type="showPw ? 'text' : 'password'"
          variant="outlined"
          density="comfortable"
          class="mb-4"
          required
        />
        <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-4">{{ error }}</v-alert>
        <v-btn type="submit" color="#111" block size="large" :loading="loading">{{ t('auth.changePasswordBtn') }}</v-btn>
      </v-form>

      <!-- Step 4: 완료 -->
      <div v-if="step === 4" class="text-center reveal visible">
        <v-icon size="64" color="success" class="mb-4">mdi-check-circle-outline</v-icon>
        <h2 class="text-h6 mb-2">{{ t('auth.step4Title') }}</h2>
        <p class="text-body-2 text-grey-darken-1 mb-6">{{ t('auth.step4Desc') }}</p>
        <v-btn color="#111" block size="large" @click="$router.push('/login')">{{ t('auth.goToLoginBtn') }}</v-btn>
      </div>

      <p v-if="step < 4" class="text-center text-body-2 mt-4 reveal" :class="{ visible: step > 1 }">
        <router-link to="/login" style="color:#111;font-weight:600">{{ t('auth.backToLogin') }}</router-link>
      </p>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';

const { t } = useI18n();

onMounted(() => {
  document.querySelectorAll('.forgot-card .reveal').forEach((el, i) => {
    setTimeout(() => el.classList.add('visible'), 150 * (i + 1));
  });
});

const step = ref(1);
const email = ref('');
const code = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const showPw = ref(false);
const error = ref('');
const loading = ref(false);
const resetToken = ref('');

// 타이머
const timerText = ref('');
const resendCooldown = ref(0);
let timerInterval = null;
let cooldownInterval = null;

function startTimer(seconds) {
  let remaining = seconds;
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    remaining--;
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    timerText.value = t('auth.timeRemaining', { time: `${m}:${String(s).padStart(2, '0')}` });
    if (remaining <= 0) {
      clearInterval(timerInterval);
      timerText.value = t('auth.codeExpired');
    }
  }, 1000);
}

function startCooldown() {
  resendCooldown.value = 60;
  clearInterval(cooldownInterval);
  cooldownInterval = setInterval(() => {
    resendCooldown.value--;
    if (resendCooldown.value <= 0) clearInterval(cooldownInterval);
  }, 1000);
}

onUnmounted(() => {
  clearInterval(timerInterval);
  clearInterval(cooldownInterval);
});

async function sendCode() {
  error.value = '';
  loading.value = true;
  try {
    await axios.post('/api/users/forgot-password', { email: email.value });
    step.value = 2;
    startTimer(15 * 60);
    startCooldown();
  } catch (e) {
    error.value = e.response?.data?.error || t('auth.requestFailed');
  } finally {
    loading.value = false;
  }
}

async function resendCode() {
  error.value = '';
  try {
    await axios.post('/api/users/forgot-password', { email: email.value });
    startTimer(15 * 60);
    startCooldown();
  } catch (e) {
    error.value = e.response?.data?.error || t('auth.resendFailed');
  }
}

async function verifyCode() {
  error.value = '';
  loading.value = true;
  try {
    const res = await axios.post('/api/users/verify-reset-code', {
      email: email.value,
      code: code.value
    });
    resetToken.value = res.data.resetToken;
    step.value = 3;
  } catch (e) {
    error.value = e.response?.data?.error || t('auth.verifyFailed');
  } finally {
    loading.value = false;
  }
}

async function resetPassword() {
  error.value = '';
  if (newPassword.value !== confirmPassword.value) {
    error.value = t('auth.passwordMismatch');
    return;
  }
  if (newPassword.value.length < 6) {
    error.value = t('auth.passwordTooShort');
    return;
  }
  loading.value = true;
  try {
    await axios.post('/api/users/reset-password', {
      resetToken: resetToken.value,
      password: newPassword.value
    });
    step.value = 4;
  } catch (e) {
    error.value = e.response?.data?.error || t('auth.passwordChangeFailed');
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
