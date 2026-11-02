<template>
  <div class="notfound-page">
    <p class="notfound-code">404</p>
    <h1 class="notfound-title">{{ t('notFound.title') }}</h1>
    <p class="notfound-desc">{{ t('notFound.desc') }}</p>
    <router-link to="/products" class="notfound-btn">{{ t('notFound.backBtn') }}</router-link>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<style scoped>
.notfound-page {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 80px 24px;
}
.notfound-code {
  font-size: 72px;
  font-weight: 900;
  color: #111;
  letter-spacing: -2px;
  margin: 0;
}
.notfound-title {
  font-size: 18px;
  font-weight: 800;
  color: #111;
  margin: 16px 0 8px;
}
.notfound-desc {
  font-size: 13px;
  color: #777;
  margin-bottom: 32px;
}
.notfound-btn {
  display: inline-block;
  padding: 14px 32px;
  border: 1.5px solid #111;
  color: #111;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-decoration: none;
  transition: background 0.2s, color 0.2s;
}
.notfound-btn:hover {
  background: #111;
  color: #fff;
}
</style>
