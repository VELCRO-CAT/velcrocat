<template>
  <div class="skeleton-box" :style="style"></div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  width: { type: String, default: '100%' },
  height: { type: String, default: '14px' },
  radius: { type: String, default: '3px' },
  aspectRatio: { type: String, default: '' }
});

const style = computed(() => ({
  width: props.width,
  height: props.aspectRatio ? undefined : props.height,
  aspectRatio: props.aspectRatio || undefined,
  borderRadius: props.radius
}));
</script>

<style scoped>
.skeleton-box {
  background: linear-gradient(90deg, #e7eaf1 25%, #d2d9e8 37%, #e7eaf1 63%);
  background-size: 400% 100%;
  animation: skeleton-shimmer 1.4s ease-in-out infinite;
}
@keyframes skeleton-shimmer {
  0% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@media (prefers-reduced-motion: reduce) {
  .skeleton-box {
    animation: none;
    background: #e3e7ee;
  }
}
</style>
