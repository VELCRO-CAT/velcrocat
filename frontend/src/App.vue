<template>
  <v-app style="background:var(--c-cream)" :class="{ 'about-active': isBrandPage }">
    <!-- 관리자 버튼 (우측 상단 고정) -->
    <router-link v-if="authStore.isAdmin && !isAdminPage" to="/admin" class="admin-fab hvr-grow" @click="ensureAdminFlag">
      <v-icon size="16">mdi-shield-crown</v-icon>
      관리자
    </router-link>

    <!-- 공지 바 (헤더 위, non-sticky) -->
    <AnnouncementBar v-if="!isBrandPage && !isAdminPage" />

    <!-- 헤더 (Brand/관리자 페이지에서는 숨김) -->
    <header v-if="!isBrandPage && !isAdminPage" class="mk-header">
      <div class="mk-header-inner">
        <!-- 좌: 햄버거(모바일) + 네비(PC) -->
        <div class="mk-left">
          <button class="mk-hamburger" @click="menuOpen = true" aria-label="메뉴">
            <span></span><span></span><span></span>
          </button>
          <nav class="mk-nav">
            <router-link to="/products" class="mk-nav-link">SHOP</router-link>
            <div class="mk-cat nav-category" @mouseenter="catOpen = true" @mouseleave="catOpen = false; activeGender = null">
              <span class="mk-nav-link" style="cursor:pointer">CATEGORY</span>
              <transition name="fade">
                <div v-if="catOpen" class="cat-dropdown">
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
            <router-link to="/brand" class="mk-nav-link">BRAND</router-link>
            <router-link to="/contact" class="mk-nav-link">CONTACT</router-link>
          </nav>
        </div>

        <!-- 중앙: 로고 (VELCROCAT 위, SEOUL 아래 스택형) -->
        <router-link to="/" class="mk-logo">
          <img src="./image/osakamarketLOGO2.png" alt="VELCROCAT" class="mk-logo-cat" />
          <span class="mk-logo-stack">
            <span class="mk-logo-word">VELCROCAT</span>
            <span class="mk-logo-sub">SEOUL</span>
          </span>
        </router-link>

        <!-- 우: 아이콘 (영문 라벨 함께 노출 — 데스크탑) -->
        <div class="mk-right">
          <button class="mk-icon mk-icon-labeled" @click="searchOpen = true" aria-label="검색">
            <v-icon size="20" color="#1A1714">mdi-magnify</v-icon>
            <span class="mk-icon-label">SEARCH</span>
          </button>
          <router-link v-if="authStore.isLoggedIn" to="/mypage" class="mk-icon mk-icon-labeled" aria-label="마이페이지">
            <v-icon size="20" color="#1A1714">mdi-account-outline</v-icon>
            <span class="mk-icon-label">ACCOUNT</span>
          </router-link>
          <router-link v-else to="/login" class="mk-icon mk-icon-labeled" aria-label="로그인">
            <v-icon size="20" color="#1A1714">mdi-account-outline</v-icon>
            <span class="mk-icon-label">SIGN IN</span>
          </router-link>

          <!-- 찜 -->
          <div class="mk-wish" @mouseenter="wishOpen = true" @mouseleave="wishOpen = false">
            <button class="mk-icon mk-icon-labeled" aria-label="찜 목록">
              <v-badge :content="wishlistStore.count" :model-value="wishlistStore.count > 0" color="black">
                <v-icon size="20" color="#1A1714">mdi-heart-outline</v-icon>
              </v-badge>
              <span class="mk-icon-label">WISHLIST</span>
            </button>
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

          <!-- 카트 (클릭 시 우측 드로우어) -->
          <button class="mk-icon mk-icon-labeled" @click="bagOpen = true" aria-label="장바구니">
            <v-badge :content="cartStore.itemCount" :model-value="cartStore.itemCount > 0" color="black">
              <v-icon size="20" color="#1A1714">mdi-bag-personal-outline</v-icon>
            </v-badge>
            <span class="mk-icon-label">CART</span>
          </button>
        </div>
      </div>
    </header>

    <!-- 검색 오버레이 -->
    <transition name="fade">
      <div v-if="searchOpen" class="mk-search" @click.self="searchOpen = false">
        <div class="mk-search-inner">
          <v-icon size="22" color="#111">mdi-magnify</v-icon>
          <input
            ref="searchInput"
            v-model="searchQuery"
            type="text"
            class="mk-search-input"
            placeholder="상품 검색"
            @keyup.enter="doSearch"
          />
          <button class="mk-search-close" @click="searchOpen = false" aria-label="닫기">
            <v-icon size="22" color="#111">mdi-close</v-icon>
          </button>
        </div>
      </div>
    </transition>

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
          <router-link to="/brand" class="drawer-link" @click="menuOpen = false">BRAND</router-link>
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
    <v-main style="background:var(--c-cream); padding-top:0 !important">
      <router-view />
    </v-main>

    <!-- 우하단 맨 위로 (관리자/브랜드 페이지 제외) -->
    <ScrollTopButton v-if="!isBrandPage && !isAdminPage" />

    <!-- Bag Drawer (헤더 카트 아이콘 클릭 시 우측 슬라이드) -->
    <BagDrawer :open="bagOpen" @close="bagOpen = false" />

    <!-- 푸터 -->
    <!-- Trust/USP 스트립 (푸터 바로 위) -->
    <TrustStrip v-if="!isBrandPage && !isAdminPage" />

    <!-- Newsletter 구독 -->
    <NewsletterBlock v-if="!isBrandPage && !isAdminPage" />

    <footer v-if="!isBrandPage && !isAdminPage" class="site-footer">
      <div class="footer-inner">
        <!-- 상단: 4컬럼 -->
        <div class="footer-cols">
          <!-- 고객센터 -->
          <div class="footer-col">
            <h4>고객센터</h4>
            <p class="footer-phone">070-4571-4499</p>
            <p class="footer-info">운영시간 : 오전10시 ~ 오후5시</p>
            <p class="footer-info">점심시간 : 오전11시 ~ 오후12시</p>
            <p class="footer-info">주말, 공휴일 휴무</p>
          </div>
          <!-- 회사정보 -->
          <div class="footer-col">
            <h4>회사정보</h4>
            <p class="footer-info">상호 : 벨크로캣(velcrocat)</p>
            <p class="footer-info">공동 대표 : 김충성, 장윤호</p>
            <p class="footer-info">사업자등록번호 : 180-02-03888</p>
            <p class="footer-info">업태 : 도소매 / 종목 : 전자상거래 소매업</p>
            <p class="footer-info">주소 : 경기도 안양시 동안구 관악대로360번길 22, 301호 (운산빌딩)</p>
            <p class="footer-info">E-MAIL : velcrocat@velcrocat.com</p>
          </div>
          <!-- 교환/반품 -->
          <div class="footer-col">
            <h4>교환 / 반품</h4>
            <p class="footer-info">교환/반품 주소 :</p>
            <p class="footer-info">경기도 안양시 동안구 관악대로360번길 22, 301호 (운산빌딩)</p>
            <p class="footer-info" style="margin-top:12px">상품 수령 후 7일 이내 교환/반품 가능</p>
          </div>
          <!-- 상점 메뉴 -->
          <div class="footer-col">
            <h4>상점 메뉴</h4>
            <router-link to="/" class="footer-menu-link">메인페이지</router-link>
            <router-link to="/brand" class="footer-menu-link">회사소개</router-link>
            <router-link to="/products" class="footer-menu-link">전체상품</router-link>
            <router-link to="/contact" class="footer-menu-link">고객문의</router-link>
          </div>
        </div>
        <!-- 하단 -->
        <div class="footer-bottom">
          <div class="footer-bottom-brand">
            <img src="./image/osakamarketLOGO2.png" alt="Velcro Cat" class="footer-logo" />
            <span class="footer-brand-stack">
              <span class="footer-brand-name">VELCROCAT</span>
              <span class="footer-brand-sub">SEOUL · EST 2026</span>
            </span>
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
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useCartStore } from './stores/cart';
import { useAuthStore } from './stores/auth';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';
import AdminNotification from './components/AdminNotification.vue';
import ScrollTopButton from './components/ScrollTopButton.vue';
import AnnouncementBar from './components/AnnouncementBar.vue';
import BagDrawer from './components/BagDrawer.vue';
import TrustStrip from './components/TrustStrip.vue';
import NewsletterBlock from './components/NewsletterBlock.vue';
import { useWishlistStore } from './stores/wishlist';

const route = useRoute();
const isBrandPage = computed(() => route.path === '/brand' || route.path === '/about');
const isAdminPage = computed(() => route.path.startsWith('/admin'));

const cartStore = useCartStore();
const authStore = useAuthStore();
const wishlistStore = useWishlistStore();
const wishOpen = ref(false);
const router = useRouter();
const menuOpen = ref(false);

// Bag drawer (카트 아이콘 클릭 시 우측 슬라이드)
const bagOpen = ref(false);

// 검색 오버레이
const searchOpen = ref(false);
const searchQuery = ref('');
const searchInput = ref(null);
watch(searchOpen, (v) => { if (v) nextTick(() => searchInput.value?.focus()); });
function doSearch() {
  const q = searchQuery.value.trim();
  searchOpen.value = false;
  router.push(q ? `/products?search=${encodeURIComponent(q)}` : '/products');
  searchQuery.value = '';
}

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
/* ── 메종키츠네풍 헤더 ── */
.mk-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--c-cream);
  border-bottom: 1px solid var(--c-line);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}
.mk-header-inner {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 16px;
  height: 72px;
  padding: 0 28px;
  max-width: 1600px;
  margin: 0 auto;
}
.mk-left { display: flex; align-items: center; min-width: 0; }
.mk-nav { display: flex; align-items: center; gap: 22px; }
.mk-nav-link {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: var(--ls-nav);
  color: var(--c-ink);
  text-decoration: none;
  text-transform: uppercase;
  padding: 6px 0;
  transition: opacity 0.2s;
  white-space: nowrap;
}
.mk-nav-link:hover { opacity: 0.5; }
.mk-nav-link.router-link-active { text-decoration: underline; text-underline-offset: 5px; }
.mk-cat { display: inline-flex; align-items: center; }

/* 중앙 로고 (가로: [캣 마크] + [텍스트 스택]) */
.mk-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-decoration: none;
  color: var(--c-ink);
}
.mk-logo-cat { height: 30px; width: auto; object-fit: contain; }
.mk-logo-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1;
}
.mk-logo-word {
  font-family: var(--ff-sans);
  font-size: 19px;
  font-weight: 800;
  letter-spacing: 0.18em;
  color: var(--c-ink);
  white-space: nowrap;
  line-height: 1;
}
.mk-logo-sub {
  margin-top: 4px;
  font-family: var(--ff-label);
  font-size: 8.5px;
  font-weight: 500;
  letter-spacing: 0.32em;
  color: var(--c-ink-soft);
  text-transform: uppercase;
  line-height: 1;
}

/* 우측 아이콘 (영문 라벨 함께) */
.mk-right { display: flex; align-items: center; justify-content: flex-end; gap: 14px; }
.mk-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--c-ink);
  text-decoration: none;
  transition: opacity 0.2s;
}
.mk-icon:hover { opacity: 0.5; }
.mk-icon-labeled {
  width: auto;
  height: auto;
  min-width: 44px;
  flex-direction: column;
  gap: 4px;
  padding: 4px 6px;
}
.mk-icon-label {
  font-family: var(--ff-label);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.22em;
  color: var(--c-ink);
  text-transform: uppercase;
  line-height: 1;
}
.mk-icon-labeled:hover .mk-icon-label { opacity: 0.55; }
.mk-wish { position: relative; display: flex; }

/* 햄버거 (모바일) */
.mk-hamburger {
  display: none;
  flex-direction: column;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px 4px;
}
.mk-hamburger span { display: block; height: 1.5px; width: 22px; background: var(--c-ink); }

/* 검색 오버레이 */
.mk-search {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(246,241,231,0.98);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 18vh;
}
.mk-search-inner {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 90%;
  max-width: 640px;
  border-bottom: 2px solid var(--c-ink);
  padding-bottom: 14px;
}
.mk-search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 22px;
  color: var(--c-ink);
  font-family: inherit;
}
.mk-search-close { background: none; border: none; cursor: pointer; display: flex; }

/* 반응형 헤더 */
@media (max-width: 900px) {
  .mk-header-inner { height: 60px; padding: 0 12px; gap: 8px; }
  .mk-nav { display: none; }
  .mk-hamburger { display: flex; }
  .mk-logo-cat { height: 22px; }
  .mk-logo-word { font-size: 15px; letter-spacing: 0.14em; }
  .mk-logo-sub { font-size: 7px; letter-spacing: 0.28em; margin-top: 2px; }
  .mk-icon { width: 34px; height: 34px; }
  .mk-icon-labeled { min-width: 34px; padding: 2px 4px; }
  .mk-icon-label { display: none; }  /* 모바일은 아이콘만 */
  .mk-right { gap: 4px; }
}
@media (max-width: 420px) {
  .mk-logo-cat { height: 20px; }
  .mk-logo-word { font-size: 13px; }
  .mk-logo-sub { font-size: 6.5px; }
}

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
  color: var(--c-ink);
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
  color: var(--c-ink);
  margin-top: 0;
}
.logo-sub {
  font-family: 'Arial', 'Helvetica Neue', sans-serif;
  font-size: 18px;
  font-weight: 400;
  letter-spacing: 14px;
  color: var(--c-ink);
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
  color: var(--c-ink);
  text-decoration: none;
  transition: opacity 0.2s;
}
.nav-link:hover { opacity: 0.45; }
.nav-link.router-link-active {
  text-decoration: underline;
  text-underline-offset: 4px;
}
.nav-link.hvr-underline-from-center::before {
  background: var(--c-ink) !important;
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
  color: var(--c-ink);
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
  background: var(--c-cream-soft);
  border: 1.5px solid var(--c-ink);
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
  color: var(--c-ink);
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
  color: var(--c-ink);
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
  color: var(--c-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}
.wish-item-price {
  font-size: 12px;
  font-weight: 700;
  color: var(--c-ink);
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
  color: var(--c-ink);
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
  background: var(--c-cream-soft);
  border: 1px solid var(--c-line);
  box-shadow: 0 8px 32px rgba(26,23,20,0.1);
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
  background: var(--c-ink);
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
  color: var(--c-ink);
  padding-left: 30px;
}
.cat-sub-all {
  font-weight: 700;
  border-top: 1px solid #eee;
  margin-top: 4px;
  padding-top: 12px;
  color: var(--c-ink);
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
  background: var(--c-ink);
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
  background: var(--c-cream-soft);
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
  color: var(--c-ink);
  text-decoration: none;
  transition: background 0.15s;
}
.drawer-link:hover { background: var(--c-cream-deep); }
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
.drawer-cat-gender:hover { background: var(--c-cream-deep); }
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
.drawer-cat-item:hover { background: #f5f5f5; color: var(--c-ink); }
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
  background: var(--c-ink);
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
  background: var(--c-cream-deep);
  padding: 48px 24px 24px;
  border-top: 1px solid var(--c-line);
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
  color: var(--c-ink);
  margin-bottom: 14px;
  letter-spacing: 0.5px;
}
.footer-phone {
  font-size: 22px;
  font-weight: 900;
  color: var(--c-ink);
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
.footer-menu-link:hover { color: var(--c-ink); }
.footer-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 20px;
}
.footer-bottom-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}
.footer-logo {
  height: 28px;
  width: auto;
  object-fit: contain;
}
.footer-brand-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1;
}
.footer-brand-name {
  font-family: var(--ff-sans);
  font-size: 13px;
  font-weight: 800;
  color: var(--c-ink);
  letter-spacing: 0.18em;
  line-height: 1;
}
.footer-brand-sub {
  margin-top: 3px;
  font-family: var(--ff-label);
  font-size: 8px;
  font-weight: 500;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--c-ink-soft);
  line-height: 1;
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
.footer-social a:hover { color: var(--c-ink); }
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
  background: var(--c-ink) !important;
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
