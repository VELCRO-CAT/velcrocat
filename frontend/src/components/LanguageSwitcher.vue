<template>
  <div class="lang-switcher" @mouseenter="open = true" @mouseleave="open = false">
    <button class="lang-switcher-btn" @click="open = !open" :aria-label="t('common.language')">
      <v-icon size="16">mdi-web</v-icon>
      <span class="lang-switcher-current">{{ currentLabel }}</span>
      <v-icon size="14">mdi-chevron-down</v-icon>
    </button>
    <div v-if="open" class="lang-switcher-dropdown">
      <button
        v-for="l in SUPPORTED_LOCALES"
        :key="l.code"
        class="lang-switcher-item"
        :class="{ active: l.code === locale }"
        @click="choose(l.code)"
      >{{ l.label }}</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { SUPPORTED_LOCALES, setLocale } from '../i18n';

const { locale, t } = useI18n();
const open = ref(false);

const currentLabel = computed(() => {
  const found = SUPPORTED_LOCALES.find(l => l.code === locale.value);
  return found ? found.label : 'Language';
});

function choose(code) {
  setLocale(code);
  open.value = false;
}
</script>

<style scoped>
.lang-switcher {
  position: relative;
  display: inline-flex;
  align-items: center;
}
.lang-switcher-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 9px 10px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #111;
  transition: opacity 0.2s;
}
.lang-switcher-btn:hover { opacity: 0.6; }
.lang-switcher-current { white-space: nowrap; }
.lang-switcher-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: #fff;
  border: 1px solid #e0e0e0;
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
  z-index: 200;
  min-width: 120px;
  display: flex;
  flex-direction: column;
}
.lang-switcher-item {
  padding: 10px 16px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #444;
  background: none;
  border: none;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
}
.lang-switcher-item:hover { background: #f5f5f5; color: #111; }
.lang-switcher-item.active { color: #111; font-weight: 800; background: #f5f5f5; }
</style>
