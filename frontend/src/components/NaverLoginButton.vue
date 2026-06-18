<template>
  <button
    type="button"
    class="naver-login-btn"
    :disabled="loading"
    @click="onClick"
    aria-label="네이버 아이디로 로그인"
  >
    <span class="naver-logo-box">
      <svg viewBox="0 0 16 16" class="naver-n" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path fill="#fff" d="M0 0v16h6.667v-8.36L11.333 16H16V0H9.333v8.36L4.667 0H0z"/>
      </svg>
    </span>
    <span class="naver-text">{{ loading ? '연결 중...' : '네이버 아이디로 로그인' }}</span>
  </button>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';

const loading = ref(false);

async function onClick() {
  loading.value = true;
  try {
    const res = await axios.get('/api/auth/naver');
    if (!res.data?.url) throw new Error('No auth URL');
    window.location.href = res.data.url;
  } catch {
    loading.value = false;
    alert('네이버 로그인 연결에 실패했습니다');
  }
}
</script>

<style scoped>
/* 네이버 로그인 BI 가이드 준수
   - 배경 #03C75A, 흰 N 로고 + "네이버 아이디로 로그인" 텍스트
   - 좌측 50px 로고 영역, 우측 텍스트 가운데 정렬 */
.naver-login-btn {
  display: flex;
  align-items: center;
  width: 100%;
  height: 50px;
  background: #03C75A;
  border: 0;
  border-radius: 6px;
  cursor: pointer;
  padding: 0;
  overflow: hidden;
  transition: background 0.15s;
  font-family: inherit;
}
.naver-login-btn:hover:not(:disabled) { background: #02b350; }
.naver-login-btn:active:not(:disabled) { background: #029a45; }
.naver-login-btn:disabled { opacity: 0.7; cursor: default; }

.naver-logo-box {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.naver-n {
  width: 18px;
  height: 18px;
}

.naver-text {
  flex: 1;
  text-align: center;
  padding-right: 50px;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.3px;
  line-height: 1;
}
</style>
