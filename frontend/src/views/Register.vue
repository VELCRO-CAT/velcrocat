<template>
  <v-container class="py-16 d-flex justify-center">
    <v-card width="440" variant="outlined" class="pa-8 reg-card">
      <div class="text-center mb-8 reveal">
        <h1 class="text-h5 font-weight-bold" style="letter-spacing:2px">{{ t('auth.registerTitle') }}</h1>
        <p class="text-caption text-grey mt-1" style="letter-spacing:4px">REGISTER</p>
      </div>

      <v-form @submit.prevent="handleSubmit" class="reveal">
        <v-text-field v-model="name" :label="t('auth.nameLabel')" variant="outlined" density="comfortable" class="mb-3" required />

        <!-- 이메일 + 인증코드 발송 버튼 -->
        <div class="d-flex align-center gap-2 mb-1">
          <v-text-field
            v-model="email"
            :label="t('auth.emailLabel')"
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
          >{{ codeCooldown > 0 ? t('auth.secondsUnit', { count: codeCooldown }) : (codeSent ? t('auth.resendBtn') : t('auth.sendCodeBtn')) }}</v-btn>
          <v-chip v-else color="success" variant="flat" size="small" style="height:48px;padding:0 16px">
            <v-icon start size="16">mdi-check-circle</v-icon>{{ t('auth.codeVerifiedChip') }}
          </v-chip>
        </div>

        <!-- 인증코드 입력 -->
        <div v-if="codeSent && !emailVerified" class="mb-3">
          <div class="d-flex align-center gap-2 mt-2">
            <v-text-field
              v-model="code"
              :label="t('auth.codeLabel')"
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
            >{{ t('auth.confirmBtn') }}</v-btn>
          </div>
          <p class="text-caption text-grey mt-1">{{ timerText }}</p>
        </div>
        <div v-else class="mb-3"></div>

        <v-text-field
          v-model="password"
          :label="t('auth.passwordHintLabel')"
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
          :label="t('auth.confirmPasswordLabel')"
          :type="showPw ? 'text' : 'password'"
          variant="outlined"
          density="comfortable"
          class="mb-4"
          required
        />

        <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-4">{{ error }}</v-alert>
        <v-alert v-if="success" type="success" variant="tonal" density="compact" class="mb-4">{{ success }}</v-alert>

        <v-btn type="submit" color="#111" block size="large" :loading="loading" :disabled="!emailVerified">{{ t('auth.registerBtn') }}</v-btn>
      </v-form>

      <!-- 소셜 회원가입 (네이버) -->
      <div class="reveal mt-6">
        <div class="social-divider">
          <span>{{ t('auth.or') }}</span>
        </div>
        <div class="mt-4">
          <NaverLoginButton />
        </div>
        <p class="text-caption text-grey text-center mt-2">
          {{ t('auth.naverRegisterHint') }}
        </p>
      </div>

      <p class="text-center text-body-2 mt-4 reveal">
        {{ t('auth.alreadyHaveAccount') }}
        <router-link to="/login" style="color:#111;font-weight:600">{{ t('auth.loginLink') }}</router-link>
      </p>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../stores/auth';
import axios from 'axios';
import NaverLoginButton from '../components/NaverLoginButton.vue';

const { t } = useI18n();

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
    timerText.value = t('auth.timeRemaining', { time: `${m}:${String(s).padStart(2, '0')}` });
    if (remaining <= 0) {
      clearInterval(timerInterval);
      timerText.value = t('auth.codeExpired');
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
    success.value = t('auth.codeSentSuccess');
    startTimer(15 * 60);
    startCooldown();
  } catch (e) {
    error.value = e.response?.data?.error || t('auth.codeSendFailed');
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
    success.value = t('auth.emailVerifiedSuccess');
    clearInterval(timerInterval);
    timerText.value = '';
  } catch (e) {
    error.value = e.response?.data?.error || t('auth.verifyFailed');
  } finally {
    verifyLoading.value = false;
  }
}

async function handleSubmit() {
  error.value = '';
  success.value = '';
  if (!emailVerified.value) { error.value = t('auth.pleaseVerifyEmail'); return; }
  if (password.value !== confirmPassword.value) { error.value = t('auth.passwordMismatch'); return; }
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
    error.value = e.response?.data?.error || t('auth.registerFailed');
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
</style>
