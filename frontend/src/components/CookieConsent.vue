<template>
  <Teleport to="body">
    <div v-if="visible" class="cookie-banner" role="dialog" aria-label="쿠키 동의">
      <p class="cookie-text">
        {{ t('cookieBanner.text') }}
        <router-link to="/cookies" class="cookie-link">{{ t('cookieBanner.learnMore') }}</router-link>
      </p>
      <div class="cookie-btns">
        <button class="cookie-btn cookie-btn-reject" @click="decide(false)">{{ t('cookieBanner.reject') }}</button>
        <button class="cookie-btn cookie-btn-accept" @click="decide(true)">{{ t('cookieBanner.accept') }}</button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const visible = ref(false);
const STORAGE_KEY = 'osaka_cookie_consent';

function loadAdSense() {
  if (document.getElementById('adsbygoogle-script')) return;
  const script = document.createElement('script');
  script.id = 'adsbygoogle-script';
  script.async = true;
  script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7409831926643950';
  script.crossOrigin = 'anonymous';
  document.head.appendChild(script);
}

function decide(accepted) {
  localStorage.setItem(STORAGE_KEY, accepted ? 'accepted' : 'rejected');
  visible.value = false;
  if (accepted) loadAdSense();
}

onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'accepted') {
    loadAdSense();
  } else if (saved !== 'rejected') {
    visible.value = true;
  }
});
</script>

<style scoped>
.cookie-banner {
  position: fixed;
  left: 16px;
  right: 16px;
  bottom: 16px;
  z-index: 3000;
  max-width: 640px;
  margin: 0 auto;
  background: #111;
  color: #fff;
  padding: 18px 20px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
}
.cookie-text {
  font-size: 12px;
  line-height: 1.6;
  color: #e5e5e5;
  margin: 0;
  flex: 1;
  min-width: 200px;
}
.cookie-link {
  color: #fff;
  text-decoration: underline;
  font-weight: 600;
}
.cookie-btns {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
.cookie-btn {
  font-size: 12px;
  font-weight: 700;
  padding: 10px 18px;
  cursor: pointer;
  border: 1px solid #fff;
  background: transparent;
  color: #fff;
  transition: background 0.2s, color 0.2s;
}
.cookie-btn-accept {
  background: #fff;
  color: #111;
}
.cookie-btn-reject:hover {
  background: rgba(255, 255, 255, 0.1);
}
.cookie-btn-accept:hover {
  background: #e5e5e5;
}

@media (max-width: 600px) {
  .cookie-banner {
    flex-direction: column;
    align-items: stretch;
  }
  .cookie-btns {
    justify-content: stretch;
  }
  .cookie-btn {
    flex: 1;
  }
}
</style>
