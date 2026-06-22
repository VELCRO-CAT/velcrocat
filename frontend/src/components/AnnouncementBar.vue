<template>
  <transition name="ann-fade">
    <div v-if="visible" class="ann-bar">
      <div class="ann-bar-inner">
        <router-link v-if="link" :to="link" class="ann-bar-text">{{ text }}</router-link>
        <span v-else class="ann-bar-text">{{ text }}</span>
      </div>
      <button class="ann-bar-close" @click="dismiss" aria-label="닫기">
        <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
        </svg>
      </button>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useSettingsStore } from '../stores/settings';

const settings = useSettingsStore();

// settings.values를 직접 참조해 reactivity 받기
const text = computed(() => settings.get('announcement_text') || '');
const link = computed(() => settings.get('announcement_link') || '');
const enabled = computed(() => {
  const v = settings.get('announcement_enabled');
  return v === 'true' || v === true;
});

const DISMISSED_KEY = 'velcrocat_ann_dismissed_v';
const dismissedText = ref('');

onMounted(() => {
  try { dismissedText.value = localStorage.getItem(DISMISSED_KEY) || ''; }
  catch { dismissedText.value = ''; }
});

// admin이 텍스트를 변경하면 dismissed 비교가 안 맞아 다시 노출됨 (의도된 동작)
const visible = computed(() => enabled.value && !!text.value && dismissedText.value !== text.value);

function dismiss() {
  try { localStorage.setItem(DISMISSED_KEY, text.value); } catch { /* ignore */ }
  dismissedText.value = text.value;
}

// text가 외부에서 갱신될 때(예: 어드민 미리보기) 자동으로 다시 visible 평가됨
watch(text, () => { /* computed 평가만 트리거되면 충분 */ });
</script>

<style scoped>
.ann-bar {
  position: relative;
  background: var(--c-ink);
  color: var(--c-cream);
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99;
}
.ann-bar-inner {
  max-width: 1600px;
  width: 100%;
  padding: 0 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ann-bar-text {
  font-family: var(--ff-label);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--c-cream);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  line-height: 1;
}
a.ann-bar-text:hover { opacity: 0.7; }
.ann-bar-close {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 22px;
  height: 22px;
  background: none;
  border: 0;
  color: var(--c-cream);
  cursor: pointer;
  opacity: 0.6;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.ann-bar-close:hover { opacity: 1; }

.ann-fade-enter-from, .ann-fade-leave-to { opacity: 0; max-height: 0; }
.ann-fade-enter-active, .ann-fade-leave-active { transition: opacity 0.25s, max-height 0.25s; max-height: 30px; }

@media (max-width: 600px) {
  .ann-bar { height: 28px; }
  .ann-bar-inner { padding: 0 36px; }
  .ann-bar-text { font-size: 9.5px; letter-spacing: 0.22em; }
  .ann-bar-close { right: 10px; }
}
@media (max-width: 360px) {
  .ann-bar-close { display: none; }  /* 초소형 단말은 닫기 숨김 */
  .ann-bar-inner { padding: 0 14px; }
}
</style>
