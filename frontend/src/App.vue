<template>
  <v-app style="background:#fff" :class="{ 'about-active': isAboutPage }">
    <!-- 로고 영역 (Brand 페이지에서는 숨김) -->
    <div v-if="!isAboutPage && !isAdminPage" class="logo-section">
      <router-link to="/" class="logo-link hvr-bob">
        <img src="./image/osakamarketLOGO2.png" alt="Velcro Cat" class="logo-cat" />
        <div class="logo-text">VELCROCAT</div>
        <div class="logo-sub">SEOUL</div>
      </router-link>
    </div>

    <!-- 관리자 버튼 (우측 상단 고정) -->
    <router-link v-if="authStore.isAdmin && !isAdminPage" to="/admin" class="admin-fab hvr-grow" @click="ensureAdminFlag">
      <v-icon size="16">mdi-shield-crown</v-icon>
      관리자
    </router-link>

    <!-- 네비게이션 바 (Brand 페이지에서는 숨김) -->
    <nav v-if="!isAboutPage && !isAdminPage" class="sticky-nav">
      <div class="nav-inner">
        <!-- 모바일 햄버거 버튼 (좌측) -->
        <button class="hamburger" @click="menuOpen = true" aria-label="메뉴">
          <span></span>
          <span></span>
          <span></span>
        </button>

        <!-- PC 네비 -->
        <div class="nav-desktop">
          <router-link to="/home" class="nav-link hvr-underline-from-center">HOME</router-link>
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
          <router-link to="/" class="nav-link hvr-underline-from-center">BRAND</router-link>
          <template v-if="authStore.isLoggedIn">
            <router-link to="/mypage" class="nav-link hvr-underline-from-center">MY PAGE</router-link>
            <a class="nav-link hvr-underline-from-center" @click="logout" style="cursor:pointer">SIGN OUT</a>
          </template>
          <template v-else>
            <router-link to="/login" class="nav-link hvr-underline-from-center">SIGN IN</router-link>
            <router-link to="/register" class="nav-link hvr-underline-from-center">SIGN UP</router-link>
          </template>
        </div>

        <!-- 찜 목록 -->
        <div class="nav-wish" @mouseenter="wishOpen = true" @mouseleave="wishOpen = false">
          <button class="nav-wish-btn">
            <v-badge :content="wishlistStore.count" :model-value="wishlistStore.count > 0" color="black">
              <v-icon size="20" color="#111">mdi-star-outline</v-icon>
            </v-badge>
          </button>
          <!-- 찜 드롭다운 -->
          <div v-if="wishOpen" class="wish-dropdown">
            <div class="wish-header">
              <span>찜 목록</span>
              <span class="wish-count">{{ wishlistStore.count }}개</span>
            </div>
            <div v-if="wishlistStore.items.length === 0" class="wish-empty">
              찜한 상품이 없습니다
            </div>
            <div v-else class="wish-list">
              <div v-for="item in wishlistStore.items" :key="item.id" class="wish-item">
                <router-link :to="`/products/${item.id}`" class="wish-item-link" @click="wishOpen = false">
                  <img :src="item.image" :alt="item.name" class="wish-item-img" />
                  <div class="wish-item-info">
                    <p class="wish-item-name">{{ item.name }}</p>
                    <p class="wish-item-price">₩{{ Number(item.price).toLocaleString() }}</p>
                  </div>
                </router-link>
                <button class="wish-item-remove" @click="wishlistStore.remove(item.id)">
                  <v-icon size="14" color="#999">mdi-close</v-icon>
                </button>
              </div>
            </div>
          </div>
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
          <router-link to="/home" class="drawer-link" @click="menuOpen = false">HOME</router-link>
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
          <router-link to="/" class="drawer-link" @click="menuOpen = false">BRAND</router-link>
          <div class="drawer-divider" />
          <template v-if="authStore.isLoggedIn">
            <router-link to="/mypage" class="drawer-link" @click="menuOpen = false">MY PAGE</router-link>
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
    <footer v-if="!isAboutPage && !isAdminPage" class="site-footer">
      <div class="footer-inner">
        <!-- 상단: 4컬럼 -->
        <div class="footer-cols">
          <!-- 고객센터 -->
          <div class="footer-col">
            <h4>고객센터</h4>
            <p class="footer-phone">010-6433-2889</p>
            <p class="footer-info">운영시간 : 오전10시 ~ 오후5시</p>
            <p class="footer-info">점심시간 : 오전11시 ~ 오후12시</p>
            <p class="footer-info">주말, 공휴일 휴무</p>
          </div>
          <!-- 회사정보 -->
          <div class="footer-col">
            <h4>회사정보</h4>
            <p class="footer-info">상호 : 벨크로캣(velcrocat)</p>
            <p class="footer-info">대표 : 김충성</p>
            <p class="footer-info">사업자등록번호 : 180-02-03888</p>
            <p class="footer-info">업태 : 도소매 / 종목 : 전자상거래 소매업</p>
            <p class="footer-info">주소 : 경기도 안양시 동안구 동편로183번길 86, 201호(관양동)</p>
            <p class="footer-info">E-MAIL : velcrocat@velcrocat.com</p>
          </div>
          <!-- 교환/반품 -->
          <div class="footer-col">
            <h4>교환 / 반품</h4>
            <p class="footer-info">교환/반품 주소 :</p>
            <p class="footer-info">경기도 안양시 동안구 동편로183번길 86, 201호</p>
            <p class="footer-info" style="margin-top:12px">상품 수령 후 7일 이내 교환/반품 가능</p>
          </div>
          <!-- 상점 메뉴 -->
          <div class="footer-col">
            <h4>상점 메뉴</h4>
            <router-link to="/home" class="footer-menu-link">메인페이지</router-link>
            <router-link to="/" class="footer-menu-link">회사소개</router-link>
            <router-link to="/products" class="footer-menu-link">전체상품</router-link>
            <router-link to="/contact" class="footer-menu-link">고객문의</router-link>
          </div>
        </div>
        <!-- 하단 -->
        <div class="footer-bottom">
          <div class="footer-bottom-brand">
            <img src="./image/osakamarketLOGO2.png" alt="Velcro Cat" class="footer-logo" />
            <span class="footer-brand-name">VELCRO CAT</span>
          </div>
          <p class="footer-copy">© 2026 벨크로캣(velcrocat). All rights reserved.</p>
          <div class="footer-social">
            <a href="https://smartstore.naver.com/vcat" target="_blank" title="Naver SmartStore">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16.273 12.845 7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z"/></svg>
            </a>
            <a href="https://www.instagram.com/" target="_blank" title="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>

    <!-- 관리자 알림 (관리자 로그인 시에만) -->
    <AdminNotification v-if="authStore.isAdmin && isAdminPage" />
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useCartStore } from './stores/cart';
import { useAuthStore } from './stores/auth';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';
import AdminNotification from './components/AdminNotification.vue';
import { useWishlistStore } from './stores/wishlist';

const route = useRoute();
const isAboutPage = computed(() => route.path === '/' || route.path === '/about');
const isAdminPage = computed(() => route.path.startsWith('/admin'));

const cartStore = useCartStore();
const authStore = useAuthStore();
const wishlistStore = useWishlistStore();
const wishOpen = ref(false);
const router = useRouter();
const menuOpen = ref(false);

// 카테고리 드롭다운
const catOpen = ref(false);
const activeGender = ref(null);
const categories = ref([]);
const genders = [
  { key: 'men', label: 'MEN' },
  { key: 'women', label: 'WOMEN' },
  { key: 'unisex', label: 'UNISEX' }
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

function ensureAdminFlag() {
  sessionStorage.setItem('__osaka_admin', '1');
}

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
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: #111;
}
.logo-cat {
  height: 100px;
  width: auto;
  object-fit: contain;
  display: block;
  margin-bottom: -10px;
}
.logo-text {
  font-family: 'Arial Black', 'Helvetica Neue', sans-serif;
  font-size: 56px;
  font-weight: 900;
  letter-spacing: 8px;
  line-height: 1;
  color: #111;
  margin-top: 0;
}
.logo-sub {
  font-family: 'Arial', 'Helvetica Neue', sans-serif;
  font-size: 18px;
  font-weight: 400;
  letter-spacing: 14px;
  color: #111;
  margin-top: -4px;
  padding-left: 14px;
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

/* 찜 + 카트 우측 정렬 */
.nav-wish {
  position: absolute;
  right: 52px;
  display: flex;
  align-items: center;
  padding: 9px 0;
}
.nav-wish-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #111;
  display: flex;
  align-items: center;
  transition: opacity 0.2s;
}
.nav-wish-btn:hover { opacity: 0.5; }

/* 찜 드롭다운 */
.wish-dropdown {
  position: absolute;
  top: 100%;
  right: -10px;
  width: 320px;
  background: #fff;
  border: 1.5px solid #111;
  z-index: 150;
  max-height: 420px;
  display: flex;
  flex-direction: column;
}
.wish-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #e8e8e8;
  font-size: 13px;
  font-weight: 800;
  color: #111;
}
.wish-count {
  font-size: 11px;
  font-weight: 600;
  color: #999;
}
.wish-empty {
  padding: 40px 16px;
  text-align: center;
  font-size: 12px;
  color: #999;
}
.wish-list {
  overflow-y: auto;
  max-height: 340px;
}
.wish-item {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.15s;
}
.wish-item:hover { background: #fafafa; }
.wish-item:last-child { border-bottom: none; }
.wish-item-link {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  padding: 12px 16px;
  text-decoration: none;
  color: #111;
  min-width: 0;
}
.wish-item-img {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border: 1px solid #e8e8e8;
  flex-shrink: 0;
}
.wish-item-info {
  flex: 1;
  min-width: 0;
}
.wish-item-name {
  font-size: 12px;
  font-weight: 600;
  color: #111;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}
.wish-item-price {
  font-size: 12px;
  font-weight: 700;
  color: #111;
}
.wish-item-remove {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px 12px;
  flex-shrink: 0;
  transition: opacity 0.15s;
}
.wish-item-remove:hover { opacity: 0.5; }

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
  .logo-cat {
    height: 50px;
    margin-bottom: 6px;
  }
  .logo-text {
    font-size: 42px;
    letter-spacing: 6px;
  }
  .logo-sub {
    font-size: 14px;
    letter-spacing: 12px;
    padding-left: 12px;
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
  top: 60px;
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
  background: #fff;
  padding: 48px 24px 24px;
  border-top: 1px solid #ddd;
}
.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
}
.footer-cols {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 32px;
  padding-bottom: 36px;
  border-bottom: 1px solid #e0e0e0;
}
.footer-col h4 {
  font-size: 14px;
  font-weight: 800;
  color: #111;
  margin-bottom: 14px;
  letter-spacing: 0.5px;
}
.footer-phone {
  font-size: 22px;
  font-weight: 900;
  color: #111;
  margin-bottom: 8px;
  letter-spacing: -0.5px;
}
.footer-info {
  font-size: 12px;
  color: #666;
  line-height: 1.8;
  margin: 0;
}
.footer-menu-link {
  display: block;
  font-size: 12px;
  color: #555;
  text-decoration: none;
  line-height: 2.2;
  transition: color 0.15s;
}
.footer-menu-link:hover { color: #111; }
.footer-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 20px;
}
.footer-bottom-brand {
  display: flex;
  align-items: center;
  gap: 6px;
}
.footer-logo {
  height: 28px;
  width: auto;
  object-fit: contain;
}
.footer-brand-name {
  font-size: 13px;
  font-weight: 800;
  color: #111;
  letter-spacing: 3px;
  line-height: 28px;
}
.footer-copy {
  color: #999;
  font-size: 11px;
  margin: 0;
}
.footer-social {
  display: flex;
  align-items: center;
  gap: 16px;
}
.footer-social a {
  color: #999;
  transition: color 0.2s;
}
.footer-social a:hover { color: #111; }
@media (max-width: 768px) {
  .footer-cols {
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
  .footer-bottom {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }
}
@media (max-width: 480px) {
  .footer-cols {
    grid-template-columns: 1fr;
    gap: 28px;
  }
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
