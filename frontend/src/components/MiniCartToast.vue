<template>
  <transition name="mct-slide">
    <div v-if="visible" class="mct" :style="topOffset">
      <div class="mct-inner">
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/>
        </svg>
        <span class="mct-text">장바구니에 담겼습니다</span>
        <router-link to="/cart" class="mct-link" @click="hide">
          VIEW BAG →
        </router-link>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed } from 'vue';

const visible = ref(false);
let timer = null;

// 헤더 높이만큼 내려서 표시
const topOffset = computed(() => ({ top: '72px' }));

function show() {
  visible.value = true;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => { visible.value = false; }, 3500);
}
function hide() { visible.value = false; }

defineExpose({ show, hide });
</script>

<style scoped>
.mct {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  z-index: 220;
  background: var(--c-cream-soft);
  border: 1px solid var(--c-line);
  border-top: 0;
  box-shadow: 0 8px 24px rgba(26,23,20,0.15);
  padding: 14px 22px;
}
.mct-inner {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  font-family: var(--ff-sans);
  color: var(--c-ink);
}
.mct-text {
  font-size: 13px;
  font-weight: 500;
}
.mct-link {
  font-family: var(--ff-label);
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--c-ink);
  text-decoration: none;
  border-bottom: 1px solid var(--c-ink);
  padding-bottom: 2px;
}
.mct-link:hover { opacity: 0.6; }

.mct-slide-enter-from, .mct-slide-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-12px);
}
.mct-slide-enter-active, .mct-slide-leave-active {
  transition: opacity 0.2s, transform 0.28s ease;
}

@media (max-width: 599px) {
  .mct { padding: 12px 16px; left: 16px; right: 16px; transform: none; max-width: none; }
  .mct-slide-enter-from, .mct-slide-leave-to {
    transform: translateY(-12px);
  }
}
</style>
