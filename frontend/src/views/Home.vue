<template>
  <div class="home">
    <!-- 슬림 에디토리얼 히어로 -->
    <section class="hero">
      <p class="hero-label">VELCROCAT — SEOUL</p>
      <h1 class="hero-title">2026 컬렉션</h1>
      <router-link to="/products" class="hero-cta">SHOP ALL</router-link>
    </section>

    <!-- 상품 그리드 (옷 먼저) -->
    <section class="grid-section">
      <div class="section-head">
        <h2 class="section-title">NEW IN</h2>
        <router-link to="/products" class="section-more">전체 보기</router-link>
      </div>

      <div v-if="loading" class="state">
        <v-progress-circular indeterminate color="#111" size="32" />
      </div>

      <div v-else-if="!sortedProducts.length" class="state state-empty">
        <v-icon size="40" color="#ccc">mdi-hanger</v-icon>
        <p>상품을 불러오지 못했습니다</p>
      </div>

      <div v-else class="pgrid">
        <ProductCard
          v-for="p in sortedProducts"
          :key="p.id"
          :product="p"
          @added="onAdded"
          @wished="onWished"
        />
      </div>
    </section>

    <v-snackbar v-model="snackbar" color="#111" timeout="2000" location="bottom right">
      <v-icon start color="white">mdi-check-circle</v-icon>
      <span style="color:#fff">{{ snackMsg }}</span>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import ProductCard from '../components/ProductCard.vue';
import { useWishlistStore } from '../stores/wishlist';

const wishlistStore = useWishlistStore();

const products = ref([]);
const loading = ref(true);
const snackbar = ref(false);
const snackMsg = ref('');

// 찜한 상품을 앞으로
const sortedProducts = computed(() => {
  const wished = products.value.filter(p => wishlistStore.isWished(p.id));
  const rest = products.value.filter(p => !wishlistStore.isWished(p.id));
  return [...wished, ...rest];
});

onMounted(async () => {
  try {
    const res = await axios.get('/api/products');
    products.value = res.data.products || [];
  } catch (e) {
    console.error('상품 목록을 불러오지 못했습니다', e);
    products.value = [];
  } finally {
    loading.value = false;
  }
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
.home { background: var(--c-bg); }

/* 히어로 */
.hero {
  text-align: center;
  padding: 72px 24px 56px;
  border-bottom: 1px solid var(--c-line);
}
.hero-label {
  font-size: 11px;
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
  color: var(--c-muted);
  margin-bottom: 14px;
}
.hero-title {
  font-size: 34px;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--c-ink);
  margin-bottom: 24px;
}
.hero-cta {
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: var(--ls-label);
  text-decoration: none;
  color: var(--c-ink);
  border-bottom: 1px solid var(--c-ink);
  padding-bottom: 3px;
  transition: opacity 0.2s;
}
.hero-cta:hover { opacity: 0.55; }

/* 섹션 */
.grid-section {
  max-width: 1600px;
  margin: 0 auto;
  padding: 40px 24px 80px;
}
.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 28px;
}
.section-title {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
  color: var(--c-ink);
}
.section-more {
  font-size: 11px;
  letter-spacing: 0.04em;
  color: var(--c-muted);
  text-decoration: none;
}
.section-more:hover { color: var(--c-ink); }

/* 상품 그리드 */
.pgrid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  column-gap: 16px;
  row-gap: 48px;
}
@media (max-width: 1024px) {
  .pgrid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 599px) {
  .pgrid { grid-template-columns: repeat(2, 1fr); column-gap: 10px; row-gap: 32px; }
  .hero { padding: 48px 20px 40px; }
  .hero-title { font-size: 26px; }
  .grid-section { padding: 28px 16px 56px; }
}

/* 상태 */
.state {
  text-align: center;
  padding: 100px 24px;
  color: var(--c-muted);
}
.state-empty p { margin-top: 14px; font-size: 14px; }
</style>
