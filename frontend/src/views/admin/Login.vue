<template>
  <div class="admin-login-page">
    <div class="login-box">
      <div class="login-header">
        <span class="login-label">ADMIN</span>
        <h1 class="login-title">관리자 로그인</h1>
      </div>

      <form @submit.prevent="login" class="login-form">
        <div class="field">
          <label>아이디</label>
          <input v-model="username" type="text" placeholder="아이디를 입력해주세요" required autocomplete="off" />
        </div>
        <div class="field">
          <label>비밀번호</label>
          <input v-model="password" type="password" placeholder="비밀번호를 입력해주세요" required />
        </div>
        <p v-if="error" class="error-msg">{{ error }}</p>
        <button type="submit" class="login-btn" :disabled="loading">
          {{ loading ? '확인 중...' : '로그인' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';

const username = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

async function login() {
  error.value = '';
  loading.value = true;
  try {
    const res = await axios.post('/api/admin/login', {
      username: username.value,
      password: password.value
    });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    sessionStorage.setItem('__osaka_admin', '1');
    window.location.href = '/admin';
  } catch (e) {
    error.value = e.response?.data?.error || '아이디 또는 비밀번호가 올바르지 않습니다';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.admin-login-page {
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.login-box {
  background: #fff;
  width: 100%;
  max-width: 400px;
  padding: 48px 40px;
  border: 1px solid #e0e0e0;
}
.login-header {
  text-align: center;
  margin-bottom: 36px;
}
.login-label {
  display: block;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 4px;
  color: #999;
  margin-bottom: 10px;
}
.login-title {
  font-size: 20px;
  font-weight: 900;
  color: #111;
  letter-spacing: -0.5px;
}
.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.field label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 2px;
  color: #555;
}
.field input {
  border: 1px solid #ddd;
  padding: 12px 14px;
  font-size: 13px;
  color: #111;
  outline: none;
  font-family: inherit;
  transition: border-color 0.2s;
}
.field input:focus { border-color: #111; }
.error-msg {
  font-size: 12px;
  color: #c00;
  margin: 0;
  text-align: center;
}
.login-btn {
  background: #111;
  color: #fff;
  border: none;
  padding: 14px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2px;
  cursor: pointer;
  margin-top: 8px;
  transition: background 0.2s;
}
.login-btn:hover:not(:disabled) { background: #333; }
.login-btn:disabled { background: #aaa; cursor: not-allowed; }
</style>
