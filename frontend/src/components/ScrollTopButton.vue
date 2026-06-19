<template>
  <transition name="st-fade">
    <button v-if="visible" class="scroll-top" @click="toTop" aria-label="맨 위로">
      <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
        <path d="M12 5l-7 7 1.4 1.4L11 8.8V20h2V8.8l4.6 4.6L19 12z" fill="currentColor"/>
      </svg>
      <span class="scroll-top-label">TOP</span>
    </button>
  </transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const visible = ref(false);

function onScroll() {
  visible.value = window.scrollY > 800;
}

function toTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

onMounted(() => {
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
});
onUnmounted(() => {
  window.removeEventListener('scroll', onScroll);
});
</script>

<style scoped>
.scroll-top {
  position: fixed;
  bottom: 28px;
  right: 28px;
  z-index: 90;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--c-ink);
  color: var(--c-cream);
  border: 0;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  font-family: var(--ff-label);
  font-size: 7.5px;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  transition: transform 0.25s, background 0.2s;
  box-shadow: 0 6px 22px rgba(26,23,20,0.18);
}
.scroll-top:hover {
  transform: translateY(-3px);
  background: #000;
}
.scroll-top-label { line-height: 1; }

.st-fade-enter-from, .st-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
.st-fade-enter-active, .st-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

@media (max-width: 599px) {
  .scroll-top { bottom: 18px; right: 18px; width: 42px; height: 42px; }
}
</style>
