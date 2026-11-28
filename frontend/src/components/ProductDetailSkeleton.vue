<template>
  <div class="detail-skeleton">
    <SkeletonBox aspect-ratio="1/1" radius="0" />
    <div class="detail-skeleton-info">
      <SkeletonBox width="30%" height="10px" />
      <SkeletonBox width="70%" height="22px" />
      <SkeletonBox width="25%" height="20px" />
      <SkeletonBox width="100%" height="1px" radius="0" />
      <SkeletonBox width="90%" height="13px" />
      <SkeletonBox width="60%" height="13px" />
      <SkeletonBox width="40%" height="44px" radius="4px" />
    </div>
  </div>
</template>

<script setup>
import SkeletonBox from './SkeletonBox.vue';
</script>

<style scoped>
.detail-skeleton {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 56px;
  align-items: start;
}
@media (max-width: 768px) {
  .detail-skeleton { grid-template-columns: 1fr; gap: 28px; }
}
.detail-skeleton-info {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-top: 4px;
}
</style>
