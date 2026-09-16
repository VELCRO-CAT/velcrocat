<template>
  <div ref="rootEl" class="lang-switcher">
    <button ref="btnEl" class="lang-switcher-btn" @click="toggle" :aria-label="t('common.language')">
      <v-icon size="15">mdi-web</v-icon>
      <span class="lang-switcher-current">{{ shortLabel }}</span>
    </button>
    <!-- 부모 nav가 overflow:hidden이어도 잘리지 않도록 fixed 포지션 + 직접 계산한 좌표 사용 -->
    <Teleport to="body">
      <div v-if="open" ref="dropdownEl" class="lang-switcher-dropdown" :style="dropdownStyle">
        <button
          v-for="l in SUPPORTED_LOCALES"
          :key="l.code"
          class="lang-switcher-item"
          :class="{ active: l.code === locale }"
          @click="choose(l.code)"
        >{{ l.label }}</button>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { SUPPORTED_LOCALES, setLocale } from '../i18n';

const { locale, t } = useI18n();
const open = ref(false);
const rootEl = ref(null);
const btnEl = ref(null);
const dropdownEl = ref(null);
const dropdownStyle = ref({});

const currentLabel = computed(() => {
  const found = SUPPORTED_LOCALES.find(l => l.code === locale.value);
  return found ? found.label : 'Language';
});

// 언어별로 길이가 다른 전체 이름 대신 항상 2글자인 코드를 써서
// 언어 전환 시 버튼 너비가 바뀌어 옆 요소가 밀리는 것을 방지
const shortLabel = computed(() => locale.value.toUpperCase());

function updatePosition() {
  const btn = btnEl.value?.$el || btnEl.value;
  if (!btn) return;
  const rect = btn.getBoundingClientRect();
  dropdownStyle.value = {
    position: 'fixed',
    top: `${rect.bottom + 4}px`,
    right: `${window.innerWidth - rect.right}px`
  };
}

async function toggle() {
  open.value = !open.value;
  if (open.value) {
    await nextTick();
    updatePosition();
  }
}

function choose(code) {
  setLocale(code);
  open.value = false;
}

// 바깥 클릭 시 닫기 (Teleport로 body에 렌더되므로 rootEl과 dropdownEl 둘 다 확인)
function onDocClick(e) {
  if (!open.value) return;
  const dEl = dropdownEl.value;
  if (rootEl.value?.contains(e.target)) return;
  if (dEl?.contains?.(e.target)) return;
  open.value = false;
}

onMounted(() => {
  document.addEventListener('click', onDocClick);
  window.addEventListener('resize', updatePosition);
  window.addEventListener('scroll', updatePosition, true);
});
onUnmounted(() => {
  document.removeEventListener('click', onDocClick);
  window.removeEventListener('resize', updatePosition);
  window.removeEventListener('scroll', updatePosition, true);
});
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
  padding: 9px 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #111;
  transition: opacity 0.2s;
}
.lang-switcher-btn:hover { opacity: 0.6; }
.lang-switcher-current { white-space: nowrap; }
.lang-switcher-dropdown {
  /* position/top/right는 JS에서 :style로 동적 계산 (부모 overflow:hidden 회피) */
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
