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
            <option :value="null">ALL</option>
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
          <v-icon size="15" color="#999">mdi-magnify</v-icon>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="SEARCH"
            class="search-input"
            @input="fetchProducts"
          />
        </div>
      </div>
      <p class="result-count">{{ total }} ITEMS</p>
    </div>

    <!-- 로딩 -->
    <div v-if="loading" class="state">
      <v-progress-circular indeterminate color="#111" size="32" />
    </div>

    <!-- 상품 그리드 -->
    <div v-else-if="sortedProducts.length" class="pgrid">
      <ProductCard
        v-for="p in sortedProducts"
        :key="p.id"
        :product="p"
        :show-seller="true"
        @added="onAdded"
        @wished="onWished"
      />
    </div>

    <!-- 결과 없음 -->
    <div v-else class="state state-empty">
      <v-icon size="44" color="#ccc">mdi-hanger</v-icon>
      <p>상품을 찾을 수 없습니다</p>
    </div>

    <v-snackbar v-model="snackbar" color="#111" timeout="2000" location="bottom right">
      <v-icon start color="white">mdi-check-circle</v-icon>
      <span style="color:#fff">{{ snackMsg }}</span>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import ProductCard from '../components/ProductCard.vue';
import { useWishlistStore } from '../stores/wishlist';

const route = useRoute();
const wishlistStore = useWishlistStore();

const products = ref([]);
const total = ref(0);
const loading = ref(true);
const snackbar = ref(false);
const snackMsg = ref('');

const selectedCategory = ref(route.query.category || null);
const selectedGender = ref(route.query.gender || null);
const sortBy = ref(null);
const searchQuery = ref('');
const allCategories = ref([]);

// 찜한 상품을 앞으로
const sortedProducts = computed(() => {
  const wished = products.value.filter(p => wishlistStore.isWished(p.id));
  const rest = products.value.filter(p => !wishlistStore.isWished(p.id));
  return [...wished, ...rest];
});

// 현재 성별에 맞는 카테고리만
const categoryItems = computed(() => {
  let cats = allCategories.value;
  if (selectedGender.value) cats = cats.filter(c => c.gender === selectedGender.value);
  return cats.map(c => ({ title: c.name, value: c.slug }));
});

const pageTitle = computed(() => {
  if (selectedGender.value === 'men') return 'MEN';
  if (selectedGender.value === 'women') return 'WOMEN';
  return 'ALL';
});

async function fetchProducts() {
  loading.value = true;
  const params = {};
  if (selectedCategory.value) params.category = selectedCategory.value;
  if (selectedGender.value) params.gender = selectedGender.value;
  if (sortBy.value) params.sort = sortBy.value;
  if (searchQuery.value) params.search = searchQuery.value;
  try {
    const res = await axios.get('/api/products', { params });
    products.value = res.data.products || [];
    total.value = res.data.total || 0;
  } catch (e) {
    console.error('상품을 불러오지 못했습니다', e);
    products.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

// URL 쿼리 변경 시 자동 반영
watch(() => route.query, (q) => {
  selectedGender.value = q.gender || null;
  selectedCategory.value = q.category || null;
  fetchProducts();
});

onMounted(async () => {
  try {
    const catRes = await axios.get('/api/categories');
    allCategories.value = catRes.data || [];
  } catch (e) {
    console.error('카테고리를 불러오지 못했습니다', e);
    allCategories.value = [];
  }
  await fetchProducts();
});

function onAdded() {
  snackMsg.value = '장바구니에 담았습니다';
  snackbar.value = true;
}
function onWished(product) {
  snackMsg.value = wishlistStore.isWished(product.id) ? '찜 목록에 추가했습니다' : '찜 목록에서 제거했습니다';
  snackbar.value = true;
}
</script>

<style scoped>
.products-page { background: var(--c-bg); min-height: 80vh; }

/* 페이지 헤더 */
.page-header {
  text-align: center;
  padding: 56px 24px 36px;
  border-bottom: 1px solid var(--c-line);
}
.page-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: var(--ls-label);
  color: var(--c-muted);
  margin-bottom: 10px;
}
.page-title {
  font-size: 26px;
  font-weight: 800;
  color: var(--c-ink);
  letter-spacing: -0.01em;
}

/* 필터 바 */
.filter-bar {
  max-width: 1600px;
  margin: 0 auto;
  padding: 18px 24px;
  border-bottom: 1px solid var(--c-line);
}
.filter-inner {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.filter-group { display: flex; gap: 8px; flex-wrap: wrap; }
.filter-select {
  border: 1px solid var(--c-line);
  padding: 8px 12px;
  font-size: 11px;
  letter-spacing: 0.04em;
  color: var(--c-ink-soft);
  background: var(--c-cream-soft);
  cursor: pointer;
  outline: none;
  font-family: inherit;
}
.filter-select:focus { border-color: var(--c-ink); }
.search-wrap {
  display: flex;
  align-items: center;
  border: 1px solid var(--c-line);
  padding: 0 10px;
  gap: 6px;
  flex: 1;
  max-width: 260px;
}
.search-input {
  border: none;
  outline: none;
  font-size: 11px;
  letter-spacing: var(--ls-label);
  color: var(--c-ink);
  padding: 9px 0;
  width: 100%;
  background: transparent;
  font-family: inherit;
}
.result-count {
  font-size: 11px;
  letter-spacing: var(--ls-label);
  color: var(--c-muted);
  margin-top: 12px;
}

/* 상품 그리드 */
.pgrid {
  max-width: 1600px;
  margin: 0 auto;
  padding: 40px 24px 80px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  column-gap: 16px;
  row-gap: 48px;
}
@media (max-width: 1024px) { .pgrid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 599px) {
  .pgrid { grid-template-columns: repeat(2, 1fr); column-gap: 10px; row-gap: 32px; padding: 28px 16px 56px; }
  .page-title { font-size: 22px; }
}

/* 상태 */
.state {
  text-align: center;
  padding: 100px 24px;
  color: var(--c-muted);
}
.state-empty p { margin-top: 14px; font-size: 14px; }
</style>
