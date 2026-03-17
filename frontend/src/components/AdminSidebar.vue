<template>
  <!-- 모바일 상단 바 -->
  <div class="admin-topbar" v-if="isMobile">
    <button class="admin-hamburger" @click="drawer = true">
      <v-icon color="white">mdi-menu</v-icon>
    </button>
    <span class="admin-topbar-title">ADMIN</span>
    <router-link to="/" class="admin-topbar-back">
      <v-icon size="20" color="white">mdi-store-outline</v-icon>
    </router-link>
  </div>

  <!-- 사이드바 (PC: 항상 표시, 모바일: 드로어) -->
  <v-navigation-drawer
    v-model="drawer"
    :permanent="!isMobile"
    :temporary="isMobile"
    color="grey-darken-4"
    width="220"
  >
    <div class="pa-5 pb-3">
      <p class="text-white font-weight-bold" style="font-size:14px;letter-spacing:3px">ADMIN</p>
      <p class="text-grey text-caption">오사카마켓</p>
    </div>
    <v-divider color="grey-darken-2" />
    <v-list density="compact" nav class="mt-2">
      <v-list-item to="/admin" title="대시보드" prepend-icon="mdi-view-dashboard" rounded="lg" base-color="white" @click="closeMobile" />
      <v-list-item to="/admin/products" title="상품 관리" prepend-icon="mdi-hanger" rounded="lg" base-color="white" @click="closeMobile" />
      <v-list-item to="/admin/orders" title="주문 관리" prepend-icon="mdi-receipt" rounded="lg" base-color="white" @click="closeMobile" />
      <v-list-item to="/admin/users" title="회원 관리" prepend-icon="mdi-account-group" rounded="lg" base-color="white" @click="closeMobile" />
      <v-list-item to="/admin/inquiries" title="문의 관리" prepend-icon="mdi-email-outline" rounded="lg" base-color="white" @click="closeMobile" />
      <v-list-item to="/admin/naver" title="네이버 스마트스토어" prepend-icon="mdi-store-outline" rounded="lg" base-color="white" @click="closeMobile" />
    </v-list>
    <template #append>
      <v-divider color="grey-darken-2" />
      <v-list-item to="/" prepend-icon="mdi-arrow-left" title="스토어로 돌아가기" base-color="grey" density="compact" class="ma-2" />
    </template>
  </v-navigation-drawer>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const drawer = ref(false);
const isMobile = ref(false);

function checkMobile() {
  isMobile.value = window.innerWidth <= 768;
  if (!isMobile.value) drawer.value = true;
}

function closeMobile() {
  if (isMobile.value) drawer.value = false;
}

onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
});
onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
});
</script>

<style scoped>
.admin-topbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 52px;
  background: #333;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  z-index: 99;
}
.admin-hamburger {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
}
.admin-topbar-title {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 3px;
  color: #fff;
}
.admin-topbar-back {
  padding: 4px;
}
</style>

<style>
/* 모바일에서 관리자 페이지 상단 여백 */
@media (max-width: 768px) {
  .admin-page {
    padding-top: 52px !important;
  }
}
</style>
