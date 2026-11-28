<template>
  <div class="product-item-skeleton">
    <SkeletonBox aspect-ratio="1/1" radius="0" />
    <div class="skeleton-info">
      <SkeletonBox width="35%" height="10px" />
      <SkeletonBox width="85%" height="13px" />
      <SkeletonBox width="55%" height="13px" />
      <SkeletonBox width="30%" height="13px" />
    </div>
  </div>
</template>

<script setup>
import SkeletonBox from './SkeletonBox.vue';
</script>

<style scoped>
.product-item-skeleton {
  border-right: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
}
.skeleton-info {
  padding: 14px 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
