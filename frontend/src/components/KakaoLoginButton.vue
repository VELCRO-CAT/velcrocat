<template>
  <button
    type="button"
    class="kakao-login-btn"
    :disabled="loading"
    @click="onClick"
    :aria-label="t('kakao.loginBtn')"
  >
    <span class="kakao-logo-box">
      <svg viewBox="0 0 24 24" class="kakao-bubble" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path fill="#191919" d="M12 3C6.477 3 2 6.463 2 10.74c0 2.76 1.86 5.183 4.66 6.56-.205.735-.744 2.67-.852 3.084-.133.513.188.506.395.368.163-.108 2.59-1.72 3.64-2.42.69.098 1.4.15 2.157.15 5.523 0 10-3.464 10-7.742C22 6.463 17.523 3 12 3Z"/>
      </svg>
    </span>
    <span class="kakao-text">{{ loading ? t('kakao.loading') : t('kakao.loginBtn') }}</span>
  </button>
</template>

<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';

const { t } = useI18n();
const loading = ref(false);

async function onClick() {
  loading.value = true;
  try {
    const res = await axios.get('/api/auth/kakao');
    window.location.href = res.data.url;
  } catch {
    loading.value = false;
    alert(t('kakao.connectError'));
  }
}
</script>

<style scoped>
/* 카카오 로그인 BI 가이드 준수
   - 배경 #FEE500, 검정 말풍선 로고 + "카카오 로그인" 텍스트
   - 좌측 50px 로고 영역, 우측 텍스트 가운데 정렬 (네이버 버튼과 동일한 레이아웃) */
.kakao-login-btn {
  display: flex;
  align-items: center;
  width: 100%;
  height: 50px;
  background: #FEE500;
  border: 0;
  border-radius: 6px;
  cursor: pointer;
  padding: 0;
  overflow: hidden;
  transition: background 0.15s;
  font-family: inherit;
  margin-top: 10px;
}
.kakao-login-btn:hover:not(:disabled) { background: #fada0a; }
.kakao-login-btn:active:not(:disabled) { background: #f5d000; }
.kakao-login-btn:disabled { opacity: 0.7; cursor: default; }

.kakao-logo-box {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.kakao-bubble {
  width: 20px;
  height: 20px;
}

.kakao-text {
  flex: 1;
  text-align: center;
  padding-right: 50px;
  color: #191919;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.3px;
  line-height: 1;
}
</style>
