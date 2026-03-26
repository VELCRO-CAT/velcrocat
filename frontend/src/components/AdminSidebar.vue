<template>
  <nav class="admin-nav">
    <div class="admin-nav-inner">
      <!-- 좌측: 로고 -->
      <router-link to="/admin" class="admin-nav-logo">
        ADMIN
      </router-link>

      <!-- 중앙: 메뉴 (PC) -->
      <div class="admin-nav-menus" v-if="!isMobile">
        <router-link to="/admin" class="admin-nav-item" exact-active-class="active">
          <v-icon size="16">mdi-view-dashboard</v-icon>
          대시보드
        </router-link>
        <router-link to="/admin/products" class="admin-nav-item" active-class="active">
          <v-icon size="16">mdi-hanger</v-icon>
          상품 관리
        </router-link>
        <router-link to="/admin/orders" class="admin-nav-item" active-class="active">
          <v-icon size="16">mdi-receipt</v-icon>
          주문 관리
        </router-link>
        <router-link to="/admin/users" class="admin-nav-item" active-class="active">
          <v-icon size="16">mdi-account-group</v-icon>
          회원 관리
        </router-link>
        <router-link to="/admin/inquiries" class="admin-nav-item" active-class="active">
          <v-icon size="16">mdi-email-outline</v-icon>
          문의 관리
        </router-link>
        <router-link to="/admin/naver" class="admin-nav-item" active-class="active">
          <v-icon size="16">mdi-store-outline</v-icon>
          스마트스토어
        </router-link>
      </div>

      <!-- 우측: 스토어 이동 -->
      <div class="admin-nav-right">
        <router-link to="/" class="admin-nav-back">
          <v-icon size="16">mdi-arrow-left</v-icon>
          <span v-if="!isMobile">스토어</span>
        </router-link>
        <!-- 모바일 햄버거 -->
        <button v-if="isMobile" class="admin-hamburger" @click="mobileOpen = !mobileOpen">
          <v-icon size="22">{{ mobileOpen ? 'mdi-close' : 'mdi-menu' }}</v-icon>
        </button>
      </div>
    </div>

    <!-- 모바일 드롭다운 메뉴 -->
    <transition name="slide-down">
      <div v-if="isMobile && mobileOpen" class="admin-mobile-menu">
        <router-link to="/admin" class="admin-mobile-item" exact-active-class="active" @click="mobileOpen = false">
          <v-icon size="18">mdi-view-dashboard</v-icon>
          대시보드
        </router-link>
        <router-link to="/admin/products" class="admin-mobile-item" active-class="active" @click="mobileOpen = false">
          <v-icon size="18">mdi-hanger</v-icon>
          상품 관리
        </router-link>
        <router-link to="/admin/orders" class="admin-mobile-item" active-class="active" @click="mobileOpen = false">
          <v-icon size="18">mdi-receipt</v-icon>
          주문 관리
        </router-link>
        <router-link to="/admin/users" class="admin-mobile-item" active-class="active" @click="mobileOpen = false">
          <v-icon size="18">mdi-account-group</v-icon>
          회원 관리
        </router-link>
        <router-link to="/admin/inquiries" class="admin-mobile-item" active-class="active" @click="mobileOpen = false">
          <v-icon size="18">mdi-email-outline</v-icon>
          문의 관리
        </router-link>
        <router-link to="/admin/naver" class="admin-mobile-item" active-class="active" @click="mobileOpen = false">
          <v-icon size="18">mdi-store-outline</v-icon>
          스마트스토어
        </router-link>
      </div>
    </transition>
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const mobileOpen = ref(false);
const isMobile = ref(false);

function checkMobile() {
  isMobile.value = window.innerWidth <= 900;
  if (!isMobile.value) mobileOpen.value = false;
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
.admin-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
}
.admin-nav-inner {
  max-width: 1400px;
  margin: 0 auto;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

/* 로고 */
.admin-nav-logo {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 4px;
  color: #111;
  text-decoration: none;
  flex-shrink: 0;
}

/* 메뉴 */
.admin-nav-menus {
  display: flex;
  align-items: center;
  gap: 4px;
}
.admin-nav-item {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  color: #777;
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.15s;
  white-space: nowrap;
}
.admin-nav-item:hover {
  color: #111;
  background: #f5f5f5;
}
.admin-nav-item.active {
  color: #111;
  background: #f0f0f0;
}

/* 우측 */
.admin-nav-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.admin-nav-back {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #999;
  text-decoration: none;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.15s;
}
.admin-nav-back:hover {
  color: #111;
  background: #f5f5f5;
}

/* 모바일 햄버거 */
.admin-hamburger {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #333;
  display: flex;
  align-items: center;
}

/* 모바일 드롭다운 */
.admin-mobile-menu {
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  padding: 8px 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.admin-mobile-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #777;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.15s;
}
.admin-mobile-item:hover,
.admin-mobile-item.active {
  color: #111;
  background: #f5f5f5;
}

/* 애니메이션 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>

<style>
/* 관리자 페이지: 네비바 높이만큼 상단 여백 + 사이드바 margin 제거 */
.admin-page .v-main__wrap,
.admin-page {
  padding-top: 52px !important;
}
.v-navigation-drawer--permanent + .v-main {
  margin-left: 0 !important;
}
/* v-main의 기본 padding 제거 */
.admin-page.v-main {
  --v-layout-left: 0px !important;
}
</style>
