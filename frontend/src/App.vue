<template>
  <v-app style="background:#fff" :class="{ 'about-active': isAboutPage }">
    <!-- 로고 영역 (Brand 페이지에서는 숨김) -->
    <div v-if="!isAboutPage" class="logo-section">
      <router-link to="/" class="logo-link hvr-bob">
        <img src="./image/osakamarketLOGO5.png" alt="Velcro Cat" class="logo-img" />
      </router-link>
    </div>

    <!-- 관리자 버튼 (우측 상단 고정) -->
    <router-link v-if="authStore.isAdmin" to="/admin" class="admin-fab hvr-grow">
      <v-icon size="16">mdi-shield-crown</v-icon>
      관리자
    </router-link>

    <!-- 네비게이션 바 (Brand 페이지에서는 숨김) -->
    <nav v-if="!isAboutPage" class="sticky-nav">
      <div class="nav-inner">
        <!-- 모바일 햄버거 버튼 (좌측) -->
        <button class="hamburger" @click="menuOpen = true" aria-label="메뉴">
          <span></span>
          <span></span>
          <span></span>
        </button>

        <!-- PC 네비 -->
        <div class="nav-desktop">
          <router-link to="/" class="nav-link hvr-underline-from-center">HOME</router-link>
          <router-link to="/products" class="nav-link hvr-underline-from-center">SHOP</router-link>
          <!-- CATEGORY 드롭다운 -->
          <div class="nav-category" @mouseenter="catOpen = true" @mouseleave="catOpen = false; activeGender = null">
            <span class="nav-link hvr-underline-from-center" style="cursor:pointer">CATEGORY</span>
            <transition name="fade">
              <div v-if="catOpen" class="cat-dropdown">
                <!-- 왼쪽: MEN / WOMEN 세로 배치 -->
                <div class="cat-gender-list">
                  <div
                    v-for="g in genders"
                    :key="g.key"
                    class="cat-gender"
                    :class="{ active: activeGender === g.key }"
                    @mouseenter="activeGender = g.key"
                  >
                    <span>{{ g.label }}</span>
                    <span class="cat-gender-arrow">▸</span>
                  </div>
                </div>
                <!-- 오른쪽: 서브카테고리 (hover 시에만) -->
                <transition name="cat-slide">
                  <div v-if="activeGender" class="cat-sub">
                    <router-link
                      v-for="cat in filteredCategories"
                      :key="cat.slug"
                      :to="`/products?gender=${activeGender}&category=${cat.slug}`"
                      class="cat-sub-link"
                      @click="catOpen = false"
                    >{{ cat.name }}</router-link>
                    <router-link
                      :to="`/products?gender=${activeGender}`"
                      class="cat-sub-link cat-sub-all"
                      @click="catOpen = false"
                    >전체보기</router-link>
                  </div>
                </transition>
              </div>
            </transition>
          </div>
          <router-link to="/contact" class="nav-link hvr-underline-from-center">CONTACT</router-link>
          <router-link to="/about" class="nav-link hvr-underline-from-center">BRAND</router-link>
          <template v-if="authStore.isLoggedIn">
            <a class="nav-link hvr-underline-from-center" @click="logout" style="cursor:pointer">SIGN OUT</a>
          </template>
          <template v-else>
            <router-link to="/login" class="nav-link hvr-underline-from-center">SIGN IN</router-link>
            <router-link to="/register" class="nav-link hvr-underline-from-center">SIGN UP</router-link>
          </template>
        </div>

        <!-- 카트 (항상 표시) -->
        <router-link to="/cart" class="nav-cart hvr-buzz-out">
          <v-badge :content="cartStore.itemCount" :model-value="cartStore.itemCount > 0" color="black">
            <v-icon size="20" color="#111">mdi-cart-outline</v-icon>
          </v-badge>
        </router-link>
      </div>
    </nav>

    <!-- 모바일 사이드 드로어 오버레이 -->
    <transition name="fade">
      <div v-if="menuOpen" class="drawer-overlay" @click="menuOpen = false" />
    </transition>

    <!-- 모바일 사이드 드로어 -->
    <transition name="slide">
      <div v-if="menuOpen" class="drawer">
        <div class="drawer-header">
          <img src="./image/osakamarketLOGO5.png" alt="오사카마켓" class="drawer-logo" />
          <button class="drawer-close" @click="menuOpen = false">✕</button>
        </div>
        <nav class="drawer-nav">
          <router-link to="/" class="drawer-link" @click="menuOpen = false">HOME</router-link>
          <router-link to="/products" class="drawer-link" @click="menuOpen = false">SHOP</router-link>
          <!-- 모바일 카테고리 -->
          <button class="drawer-link drawer-cat-toggle" @click="drawerCatOpen = !drawerCatOpen">
            CATEGORY
            <span class="drawer-arrow" :class="{ open: drawerCatOpen }">▸</span>
          </button>
          <div v-if="drawerCatOpen" class="drawer-cat-section">
            <div v-for="g in genders" :key="g.key" class="drawer-cat-group">
              <button class="drawer-cat-gender" @click="drawerGender = drawerGender === g.key ? null : g.key">
                {{ g.label }}
                <span class="drawer-arrow" :class="{ open: drawerGender === g.key }">▸</span>
              </button>
              <div v-if="drawerGender === g.key" class="drawer-cat-list">
                <router-link
                  v-for="cat in categories.filter(c => c.gender === g.key)"
                  :key="cat.slug"
                  :to="`/products?gender=${g.key}&category=${cat.slug}`"
                  class="drawer-cat-item"
                  @click="menuOpen = false"
                >{{ cat.name }}</router-link>
                <router-link
                  :to="`/products?gender=${g.key}`"
                  class="drawer-cat-item"
                  @click="menuOpen = false"
                  style="font-weight:600"
                >전체보기</router-link>
              </div>
            </div>
          </div>
          <router-link to="/contact" class="drawer-link" @click="menuOpen = false">CONTACT</router-link>
          <router-link to="/about" class="drawer-link" @click="menuOpen = false">BRAND</router-link>
          <div class="drawer-divider" />
          <template v-if="authStore.isLoggedIn">
            <a class="drawer-link" @click="logout" style="cursor:pointer">SIGN OUT</a>
          </template>
          <template v-else>
            <router-link to="/login" class="drawer-link" @click="menuOpen = false">SIGN IN</router-link>
            <router-link to="/register" class="drawer-link" @click="menuOpen = false">SIGN UP</router-link>
          </template>
        </nav>
      </div>
    </transition>

    <!-- 메인 콘텐츠 -->
    <v-main class="mobile-body-offset" style="background:#fff; padding-top:0 !important">
      <router-view />
    </v-main>

    <!-- 푸터 -->
    <footer v-if="!isAboutPage" class="site-footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <img src="./image/osakamarketLOGO5.png" alt="Velcro Cat" class="footer-logo" />
          <span class="footer-brand-name">VELCRO CAT</span>
        </div>
        <div class="footer-nav">
          <router-link to="/">HOME</router-link>
          <router-link to="/products">SHOP</router-link>
          <router-link to="/contact">CONTACT</router-link>
          <router-link to="/about">BRAND</router-link>
        </div>
        <div class="footer-sub">
          <a href="#">회사 소개</a>
          <span class="footer-divider">|</span>
          <a href="#">개인정보처리방침</a>
          <span class="footer-divider">|</span>
          <a href="#">이용약관</a>
          <span class="footer-divider">|</span>
          <router-link to="/contact">고객센터</router-link>
          <span class="footer-divider">|</span>
          <a href="https://www.instagram.com/" target="_blank">Instagram</a>
        </div>
        <p class="footer-copy">© 2026 Velcro Cat / 오사카마켓. All rights reserved.</p>
      </div>
    </footer>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useCartStore } from './stores/cart';
import { useAuthStore } from './stores/auth';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const isAboutPage = computed(() => route.path === '/about');

const cartStore = useCartStore();
const authStore = useAuthStore();
const router = useRouter();
const menuOpen = ref(false);

// 카테고리 드롭다운
const catOpen = ref(false);
const activeGender = ref(null);
const categories = ref([]);
const genders = [
  { key: 'men', label: 'MEN' },
  { key: 'women', label: 'WOMEN' }
];
const filteredCategories = computed(() =>
  categories.value.filter(c => c.gender === activeGender.value)
);

// 모바일 드로어 카테고리
const drawerCatOpen = ref(false);
const drawerGender = ref(null);

onMounted(async () => {
  try {
    const res = await axios.get('/api/categories');
    categories.value = res.data;
  } catch { /* ignore */ }
});

function logout() {
  authStore.logout();
  menuOpen.value = false;
  router.push('/');
}
</script>

<style scoped>
/* 로고 섹션 */
.logo-section {
  background: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px 0 16px;
  border-bottom: 1px solid #e0e0e0;
}
.logo-link {
  display: block;
  text-decoration: none;
  text-align: center;
}
.logo-img {
  height: 300px;
  width: auto;
  object-fit: contain;
  display: block;
  margin: 0 auto;
}

/* 고정 네비게이션 바 */
.sticky-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
}
.nav-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 0 40px;
}
.nav-link {
  display: inline-block;
  padding: 9px 16px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2px;
  color: #111;
  text-decoration: none;
  transition: opacity 0.2s;
}
.nav-link:hover { opacity: 0.45; }
.nav-link.router-link-active {
  text-decoration: underline;
  text-underline-offset: 4px;
}
.nav-link.hvr-underline-from-center::before {
  background: #111 !important;
}
/* PC 네비 */
.nav-desktop {
  display: flex;
  align-items: center;
}

.nav-cart {
  position: absolute;
  right: 16px;
  display: flex;
  align-items: center;
  color: #111;
  text-decoration: none;
  padding: 9px 0;
}
.nav-cart:hover { opacity: 0.5; }

/* CATEGORY 드롭다운 */
.nav-category {
  position: relative;
  display: inline-flex;
  align-items: center;
}
.cat-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  display: flex;
  flex-direction: row;
  background: #fff;
  border: 1px solid #e0e0e0;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  z-index: 150;
}
/* 왼쪽 성별 목록 (세로, 고정 너비) */
.cat-gender-list {
  display: flex;
  flex-direction: column;
  border-right: 1px solid #eee;
  width: 130px;
  flex-shrink: 0;
}
.cat-gender {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  cursor: pointer;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2px;
  color: #555;
  transition: background 0.15s, color 0.15s;
}
.cat-gender:hover,
.cat-gender.active {
  background: #111;
  color: #fff;
}
.cat-gender-arrow {
  font-size: 10px;
  margin-left: 10px;
  opacity: 0.5;
}
.cat-gender:hover .cat-gender-arrow,
.cat-gender.active .cat-gender-arrow {
  opacity: 1;
}
/* 오른쪽 서브카테고리 (고정 위치) */
.cat-sub {
  display: flex;
  flex-direction: column;
  width: 160px;
  flex-shrink: 0;
  max-height: 420px;
  overflow-y: auto;
  padding: 6px 0;
}
.cat-sub-link {
  display: block;
  padding: 10px 24px;
  font-size: 12px;
  color: #444;
  text-decoration: none;
  white-space: nowrap;
  transition: background 0.12s, color 0.12s, padding-left 0.15s;
  letter-spacing: 0.5px;
}
.cat-sub-link:hover {
  background: #f5f5f5;
  color: #111;
  padding-left: 30px;
}
.cat-sub-all {
  font-weight: 700;
  border-top: 1px solid #eee;
  margin-top: 4px;
  padding-top: 12px;
  color: #111;
}
/* 서브카테고리 슬라이드 트랜지션 */
.cat-slide-enter-active { transition: opacity 0.2s, transform 0.2s; }
.cat-slide-leave-active { transition: opacity 0.15s; }
.cat-slide-enter-from { opacity: 0; transform: translateX(-8px); }
.cat-slide-leave-to { opacity: 0; }

/* 햄버거 버튼 */
.hamburger {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  position: absolute;
  left: 12px;
}
.hamburger span {
  display: block;
  width: 22px;
  height: 2px;
  background: #111;
}

/* 드로어 오버레이 */
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 200;
}

/* 사이드 드로어 */
.drawer {
  position: fixed;
  top: 0;
  left: 0;
  width: 75vw;
  max-width: 300px;
  height: 100vh;
  background: #fff;
  z-index: 201;
  display: flex;
  flex-direction: column;
  box-shadow: 4px 0 24px rgba(0,0,0,0.15);
}
.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 16px 16px;
  border-bottom: 1px solid #e8e8e8;
}
.drawer-logo {
  height: 60px;
  width: auto;
  object-fit: contain;
}
.drawer-close {
  background: none;
  border: none;
  font-size: 18px;
  color: #555;
  cursor: pointer;
  padding: 4px 8px;
}
.drawer-nav {
  display: flex;
  flex-direction: column;
  padding: 8px 0;
}
.drawer-link {
  display: block;
  padding: 16px 24px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2.5px;
  color: #111;
  text-decoration: none;
  transition: background 0.15s;
}
.drawer-link:hover { background: #f5f5f5; }
/* 모바일 카테고리 토글 */
.drawer-cat-toggle {
  background: none;
  border: none;
  text-align: left;
  width: 100%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.drawer-arrow {
  font-size: 10px;
  transition: transform 0.2s;
  color: #999;
}
.drawer-arrow.open { transform: rotate(90deg); }
.drawer-cat-section {
  padding-left: 12px;
}
.drawer-cat-group { margin-bottom: 2px; }
.drawer-cat-gender {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 24px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2px;
  color: #333;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
}
.drawer-cat-gender:hover { background: #f5f5f5; }
.drawer-cat-list {
  padding-left: 16px;
}
.drawer-cat-item {
  display: block;
  padding: 10px 24px;
  font-size: 11px;
  color: #555;
  text-decoration: none;
  letter-spacing: 0.5px;
}
.drawer-cat-item:hover { background: #f5f5f5; color: #111; }
.drawer-link.router-link-active { border-left: 3px solid #111; padding-left: 21px; }
.drawer-divider {
  height: 1px;
  background: #e8e8e8;
  margin: 8px 24px;
}

/* 트랜지션 애니메이션 */
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-enter-active, .slide-leave-active { transition: transform 0.3s ease; }
.slide-enter-from, .slide-leave-to { transform: translateX(-100%); }

/* 모바일 반응형 */
@media (max-width: 640px) {
  /* 로고 크기 줄이기 + 네비바 높이만큼 아래로 */
  .logo-section {
    padding-top: 64px;
  }
  .logo-img {
    height: 160px;
  }

  /* 네비바 최상단 고정 */
  .sticky-nav {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
  }

  .nav-desktop { display: none; }
  .hamburger { display: flex; }
  .nav-inner { justify-content: center; min-height: 48px; }

  /* 네비바 높이만큼 콘텐츠 밀어내기 */
  .mobile-body-offset {
    padding-top: 48px;
  }
}

/* 관리자 버튼 */
.admin-fab {
  position: fixed;
  top: 16px;
  right: 20px;
  z-index: 999;
  background: #111;
  color: #fff;
  text-decoration: none;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  padding: 8px 14px;
  display: flex;
  align-items: center;
  gap: 5px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.18);
}

/* 푸터 */
.site-footer {
  background: #111;
  padding: 48px 24px 32px;
  border-top: 1px solid #222;
}
.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.footer-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}
.footer-logo {
  height: 28px;
  width: auto;
  object-fit: contain;
}
.footer-brand-name {
  font-size: 13px;
  font-weight: 800;
  color: #fff;
  letter-spacing: 3px;
}
.footer-nav {
  display: flex;
  gap: 24px;
  justify-content: center;
}
.footer-nav a {
  font-size: 11px;
  color: #666;
  text-decoration: none;
  letter-spacing: 1px;
  transition: color 0.2s;
}
.footer-nav a:hover { color: #fff; }
.footer-sub {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
  align-items: center;
}
.footer-sub a {
  font-size: 10px;
  color: #555;
  text-decoration: none;
  transition: color 0.2s;
}
.footer-sub a:hover { color: #fff; }
.footer-divider {
  color: #333;
  font-size: 10px;
}
.footer-copy {
  color: #444;
  font-size: 11px;
  margin: 0;
  letter-spacing: 0.5px;
}
</style>

<style>
.nav-link.hvr-underline-from-center::before {
  background: #111 !important;
}
/* Brand 페이지: 외부 스크롤 숨김 (이중 스크롤 방지) */
.about-active .v-application__wrap {
  overflow: hidden;
  height: 100vh;
}
@media (max-width: 640px) {
  .v-main.mobile-body-offset {
    padding-top: 48px !important;
  }
}
</style>
