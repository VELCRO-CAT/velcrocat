<template>
  <div class="order-card-skeleton">
    <div class="row">
      <SkeletonBox width="120px" height="13px" />
      <SkeletonBox width="70px" height="13px" />
    </div>
    <div class="item-row">
      <SkeletonBox width="56px" height="56px" radius="4px" />
      <div class="item-text">
        <SkeletonBox width="70%" height="13px" />
        <SkeletonBox width="40%" height="12px" />
      </div>
    </div>
    <SkeletonBox width="100%" height="38px" radius="4px" />
  </div>
</template>

<script setup>
import SkeletonBox from './SkeletonBox.vue';
</script>

<style scoped>
.order-card-skeleton {
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.row { display: flex; justify-content: space-between; }
.item-row { display: flex; gap: 12px; align-items: center; }
.item-text { flex: 1; display: flex; flex-direction: column; gap: 8px; }
</style>
