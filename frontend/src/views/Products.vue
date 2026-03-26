<template>
  <div class="products-page">

    <!-- 페이지 헤더 -->
    <div class="page-header">
      <span class="page-label">SHOP</span>
      <h1 class="page-title">{{ pageTitle }}</h1>
    </div>

    <!-- 필터 바 -->
    <div class="filter-bar">
      <div class="filter-inner">
        <div class="filter-group">
          <select v-model="selectedGender" class="filter-select" @change="selectedCategory = null; fetchProducts()">
            <option :value="null">전체 성별</option>
            <option value="men">MEN</option>
            <option value="women">WOMEN</option>
          </select>
          <select v-model="selectedCategory" class="filter-select" @change="fetchProducts">
            <option :value="null">전체 카테고리</option>
            <option v-for="cat in categoryItems" :key="cat.value" :value="cat.value">
              {{ cat.title }}
            </option>
          </select>
          <select v-model="sortBy" class="filter-select" @change="fetchProducts">
            <option :value="null">기본순</option>
            <option value="price_asc">가격 낮은순</option>
            <option value="price_desc">가격 높은순</option>
            <option value="rating">평점 높은순</option>
          </select>
        </div>
        <div class="search-wrap">
          <v-icon size="16" color="#999">mdi-magnify</v-icon>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="상품 검색"
            class="search-input"
            @input="fetchProducts"
          />
        </div>
      </div>
      <p class="result-count">총 {{ total }}개의 상품</p>
    </div>

    <!-- 로딩 -->
    <div v-if="loading" class="loading-wrap">
      <v-progress-circular indeterminate color="#111" size="36" />
    </div>

    <!-- 상품 그리드 -->
    <div v-else-if="products.length" class="product-grid-wrap">
      <div class="product-grid">
        <router-link
          v-for="(product, idx) in sortedProducts"
          :key="product.id"
          :to="`/products/${product.id}`"
          class="product-item reveal"
          :style="{ transitionDelay: (idx % 6) * 0.08 + 's' }"
        >
          <div class="product-img-wrap" @mouseenter="startSlide(product)" @mouseleave="stopSlide(product)">
            <img
              v-for="(img, si) in getImages(product)"
              :key="si"
              :src="img"
              :alt="product.name"
              class="product-img"
              :class="{ active: (slideIndex[product.id] || 0) === si }"
            />
            <button class="product-wish-btn" :class="{ active: wishlistStore.isWished(product.id) }" @click.prevent="toggleWish(product)">
              <v-icon size="18">{{ wishlistStore.isWished(product.id) ? 'mdi-star' : 'mdi-star-outline' }}</v-icon>
            </button>
            <span v-if="product.stock === 0" class="sold-out-badge">SOLD OUT</span>
            <button v-else class="product-cart-btn hvr-grow" @click.prevent="addToCart(product)">
              <v-icon size="18">mdi-cart-plus</v-icon>
            </button>
          </div>
          <div class="product-info">
            <p class="product-seller">{{ product.seller }}</p>
            <p class="product-name">{{ product.name }}</p>
            <p class="product-desc">{{ product.description }}</p>
            <div class="product-bottom">
              <span class="product-price">₩{{ Number(product.price).toLocaleString() }}</span>
              <span class="product-rating">
                <v-icon size="12" color="#f59e0b">mdi-star</v-icon>
                {{ product.rating }}
              </span>
            </div>
          </div>
        </router-link>
      </div>
    </div>

    <!-- 결과 없음 -->
    <div v-else class="empty-wrap">
      <v-icon size="48" color="#ccc">mdi-package-variant</v-icon>
      <p>상품을 찾을 수 없습니다</p>
    </div>

    <!-- 스낵바 -->
    <v-snackbar v-model="snackbar" color="#222" timeout="2000" location="bottom right">
      <v-icon start color="white">mdi-check-circle</v-icon>
      <span style="color:#fff">{{ snackMsg }}</span>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import { useCartStore } from '../stores/cart';
import { useWishlistStore } from '../stores/wishlist';

const route = useRoute();
const cartStore = useCartStore();
const wishlistStore = useWishlistStore();
const products = ref([]);
const total = ref(0);
const loading = ref(true);
const snackbar = ref(false);
const snackMsg = ref('');

const sortedProducts = computed(() => {
  const wished = products.value.filter(p => wishlistStore.isWished(p.id));
  const rest = products.value.filter(p => !wishlistStore.isWished(p.id));
  return [...wished, ...rest];
});

const slideIndex = reactive({});
const slideTimers = {};

function getImages(product) {
  if (product.images) {
    try {
      const arr = JSON.parse(product.images);
      if (arr.length) return arr;
    } catch { /* ignore */ }
  }
  return product.image ? [product.image] : [];
}

function startSlide(product) {
  const imgs = getImages(product);
  if (imgs.length < 2) return;
  slideTimers[product.id] = setInterval(() => {
    const current = slideIndex[product.id] || 0;
    slideIndex[product.id] = (current + 1) % imgs.length;
  }, 1700);
}

function stopSlide(product) {
  if (slideTimers[product.id]) {
    clearInterval(slideTimers[product.id]);
    delete slideTimers[product.id];
  }
  slideIndex[product.id] = 0;
}

onUnmounted(() => {
  Object.values(slideTimers).forEach(t => clearInterval(t));
});
const selectedCategory = ref(route.query.category || null);
const selectedGender = ref(route.query.gender || null);
const sortBy = ref(null);
const searchQuery = ref('');
const allCategories = ref([]);

// 현재 성별에 맞는 카테고리만 표시
const categoryItems = computed(() => {
  let cats = allCategories.value;
  if (selectedGender.value) {
    cats = cats.filter(c => c.gender === selectedGender.value);
  }
  return cats.map(c => ({ title: c.name, value: c.slug }));
});

// 페이지 타이틀
const pageTitle = computed(() => {
  if (selectedGender.value === 'men') return 'MEN';
  if (selectedGender.value === 'women') return 'WOMEN';
  return '전체 상품';
});

async function fetchProducts() {
  loading.value = true;
  const params = {};
  if (selectedCategory.value) params.category = selectedCategory.value;
  if (selectedGender.value) params.gender = selectedGender.value;
  if (sortBy.value) params.sort = sortBy.value;
  if (searchQuery.value) params.search = searchQuery.value;
  const res = await axios.get('/api/products', { params });
  products.value = res.data.products;
  total.value = res.data.total;
  loading.value = false;
  nextTick(() => initReveal());
}

function initReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.products-page .reveal').forEach(el => {
    el.classList.remove('visible');
    observer.observe(el);
  });
}

// URL 쿼리 파라미터 변경 시 자동 반영
watch(() => route.query, (q) => {
  selectedGender.value = q.gender || null;
  selectedCategory.value = q.category || null;
  fetchProducts();
});

onMounted(async () => {
  const catRes = await axios.get('/api/categories');
  allCategories.value = catRes.data;
  await fetchProducts();
});

function addToCart(product) {
  cartStore.addItem(product);
  snackMsg.value = '장바구니에 담았습니다';
  snackbar.value = true;
}

function toggleWish(product) {
  wishlistStore.toggle(product);
  snackMsg.value = wishlistStore.isWished(product.id) ? '찜 목록에 추가했습니다' : '찜 목록에서 제거했습니다';
  snackbar.value = true;
}
</script>

<style scoped>
.products-page { background: #fff; min-height: 80vh; }

/* 페이지 헤더 */
.page-header {
  text-align: center;
  padding: 56px 24px 40px;
  border-bottom: 1px solid #e0e0e0;
}
.page-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 4px;
  color: #999;
  display: block;
  margin-bottom: 8px;
}
.page-title {
  font-size: 24px;
  font-weight: 800;
  color: #111;
  letter-spacing: -0.5px;
}

/* 필터 바 */
.filter-bar {
  border-bottom: 1px solid #e0e0e0;
  padding: 16px 24px;
  max-width: 1200px;
  margin: 0 auto;
}
.filter-inner {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.filter-group { display: flex; gap: 8px; }
.filter-select {
  border: 1px solid #ddd;
  padding: 8px 12px;
  font-size: 12px;
  color: #333;
  background: #fff;
  cursor: pointer;
  outline: none;
  letter-spacing: 0.5px;
}
.filter-select:focus { border-color: #111; }
.search-wrap {
  display: flex;
  align-items: center;
  border: 1px solid #ddd;
  padding: 0 10px;
  gap: 6px;
  flex: 1;
  max-width: 280px;
}
.search-input {
  border: none;
  outline: none;
  font-size: 12px;
  color: #333;
  padding: 8px 0;
  width: 100%;
  background: transparent;
}
.result-count {
  font-size: 11px;
  color: #999;
  margin-top: 10px;
  letter-spacing: 0.5px;
}

/* 로딩 / 빈 상태 */
.loading-wrap, .empty-wrap {
  text-align: center;
  padding: 80px 24px;
  color: #999;
}
.empty-wrap p { margin-top: 16px; font-size: 14px; }

/* 상품 그리드 */
.product-grid-wrap { max-width: 1200px; margin: 0 auto; padding: 0; }
.product-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-top: 1px solid #e0e0e0;
  border-left: 1px solid #e0e0e0;
}
@media (max-width: 599px) { .product-grid { grid-template-columns: repeat(2, 1fr); } }

/* 스크롤 등장 애니메이션 */
.reveal {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.6s ease, transform 0.6s ease, box-shadow 0.25s ease;
}
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}

.product-item {
  text-decoration: none;
  color: #111;
  display: block;
  border-right: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
  position: relative;
  z-index: 0;
}
.product-item:hover {
  box-shadow: 0 8px 32px rgba(0,0,0,0.13);
  z-index: 2;
}
.product-img-wrap {
  position: relative;
  overflow: hidden;
  background: #fff;
  aspect-ratio: 3/4;
}
.product-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 0.4s;
}
.product-item:hover .product-img { transform: scale(1.04); }
/* 찜 버튼 (별) */
.product-wish-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 4;
  color: #999;
  opacity: 0;
  transition: opacity 0.2s, color 0.15s;
}
.product-item:hover .product-wish-btn { opacity: 1; }
.product-wish-btn.active {
  opacity: 1;
  color: #f59e0b;
}
.product-wish-btn:hover {
  color: #f59e0b;
}
.product-cart-btn {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(255,255,255,0.92);
  border: none;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
  color: #111;
}
.product-item:hover .product-cart-btn { opacity: 1; }
.sold-out-badge {
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,0.75);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 4px;
  color: #111;
  z-index: 3;
  pointer-events: none;
}
/* 이미지 슬라이드 (페이드 전환) */
.product-img {
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0;
  transition: opacity 0.6s ease;
}
.product-img.active {
  opacity: 1;
}
.product-img:first-child {
  position: relative;
}

.product-info { padding: 14px 14px 16px; }
.product-seller { font-size: 10px; color: #999; margin-bottom: 4px; letter-spacing: 0.5px; }
.product-name {
  font-size: 13px;
  font-weight: 600;
  color: #111;
  margin-bottom: 6px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  min-height: 36px;
}
.product-desc {
  font-size: 11px;
  color: #888;
  margin-bottom: 10px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.product-bottom { display: flex; align-items: center; justify-content: space-between; }
.product-price { font-size: 13px; font-weight: 700; color: #111; }
.product-rating { font-size: 11px; color: #999; display: flex; align-items: center; gap: 2px; }
</style>
