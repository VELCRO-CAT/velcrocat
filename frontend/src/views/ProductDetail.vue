<template>
  <div class="detail-page">
    <div class="detail-wrap">
      <v-btn variant="text" to="/products" prepend-icon="mdi-arrow-left" class="mb-6" style="color:#555">상품 목록으로</v-btn>

      <v-progress-circular v-if="loading" indeterminate color="#111" class="d-block mx-auto my-12" />

      <div v-else-if="product" class="product-main">
        <!-- 이미지 -->
        <div class="product-img-area">
          <img :src="product.image" :alt="product.name" class="product-img" />
        </div>

        <!-- 상품 정보 -->
        <div class="product-info">
          <p class="product-seller">{{ product.seller }}</p>
          <h1 class="product-name">{{ product.name }}</h1>

          <div class="product-price">₩{{ Number(product.price).toLocaleString() }}</div>

          <div class="divider" />

          <p class="product-desc">{{ product.description }}</p>

          <p v-if="product.stock > 0" class="product-stock">
            <v-icon size="15" color="#2a9d5c">mdi-check-circle</v-icon>
            재고 있음 ({{ product.stock }}개)
          </p>
          <p v-else class="product-stock sold-out">
            <v-icon size="15" color="#e53e3e">mdi-close-circle</v-icon>
            재고 없음
          </p>

          <!-- 수량 (재고 있을 때만) -->
          <template v-if="product.stock > 0">
            <div class="qty-row">
              <button class="qty-btn" @click="qty = Math.max(1, qty - 1)">−</button>
              <span class="qty-num">{{ qty }}</span>
              <button class="qty-btn" @click="qty = Math.min(product.stock, qty + 1)">+</button>
            </div>

            <!-- 총 금액 -->
            <div class="total-row">
              <span class="total-label">총 상품금액(수량)</span>
              <span class="total-price">
                ₩{{ (product.price * qty).toLocaleString() }}
                <span class="total-qty">({{ qty }}개)</span>
              </span>
            </div>

            <!-- 찜 + 장바구니 + 바로 구매 -->
            <div class="action-row">
              <button class="wish-btn" :class="{ active: wishlistStore.isWished(product.id) }" @click="toggleWish">
                <v-icon size="20">{{ wishlistStore.isWished(product.id) ? 'mdi-heart' : 'mdi-heart-outline' }}</v-icon>
              </button>
              <button class="cart-btn hvr-sweep-to-right" @click="addToCart">
                <v-icon size="18" class="mr-1">mdi-cart-plus</v-icon>
                장바구니
              </button>
              <button class="buy-btn" @click="buyNow">
                바로 구매하기
              </button>
            </div>
          </template>
          <template v-else>
            <div class="action-row">
              <button class="wish-btn" :class="{ active: wishlistStore.isWished(product.id) }" @click="toggleWish">
                <v-icon size="20">{{ wishlistStore.isWished(product.id) ? 'mdi-heart' : 'mdi-heart-outline' }}</v-icon>
              </button>
              <button class="cart-btn cart-btn-disabled" disabled style="flex:1">
                <v-icon size="18" class="mr-1">mdi-cart-off</v-icon>
                품절된 상품입니다
              </button>
            </div>
          </template>
        </div>
      </div>

      <div v-else class="text-center py-12 text-grey">상품을 찾을 수 없습니다</div>
    </div>

    <!-- 최근 본 상품 -->
    <section v-if="recentProducts.length > 1" class="related-section">
      <div class="related-inner">
        <h2 class="section-title">최근 확인한 상품</h2>
        <div class="related-grid">
          <router-link
            v-for="p in recentProducts.filter(p => p.id !== product?.id).slice(0, 6)"
            :key="p.id"
            :to="`/products/${p.id}`"
            class="related-item"
          >
            <div class="related-img-wrap">
              <img :src="p.image" :alt="p.name" class="related-img" />
            </div>
            <p class="related-name">{{ p.name }}</p>
            <p class="related-price">₩{{ Number(p.price).toLocaleString() }}</p>
          </router-link>
        </div>
      </div>
    </section>

    <!-- 같은 카테고리 상품 -->
    <section v-if="similarProducts.length" class="related-section">
      <div class="related-inner">
        <h2 class="section-title">같은 카테고리의 상품</h2>
        <div class="related-grid">
          <router-link
            v-for="p in similarProducts"
            :key="p.id"
            :to="`/products/${p.id}`"
            class="related-item"
          >
            <div class="related-img-wrap">
              <img :src="p.image" :alt="p.name" class="related-img" />
            </div>
            <p class="related-name">{{ p.name }}</p>
            <p class="related-price">₩{{ Number(p.price).toLocaleString() }}</p>
          </router-link>
        </div>
      </div>
    </section>

    <v-snackbar v-model="snackbar" color="#222" timeout="2000" location="bottom right">
      <v-icon start color="white">mdi-check-circle</v-icon>
      <span style="color:#fff">{{ snackMsg }}</span>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { useCartStore } from '../stores/cart';
import { useWishlistStore } from '../stores/wishlist';

const route = useRoute();
const router = useRouter();
const cartStore = useCartStore();
const wishlistStore = useWishlistStore();
const product = ref(null);
const loading = ref(true);
const qty = ref(1);
const snackbar = ref(false);
const snackMsg = ref('');
const similarProducts = ref([]);
const recentProducts = ref([]);

function saveRecent(p) {
  const key = 'osaka_recent';
  let list = [];
  try { list = JSON.parse(localStorage.getItem(key) || '[]'); } catch {}
  list = list.filter(item => item.id !== p.id);
  list.unshift({ id: p.id, name: p.name, price: p.price, image: p.image, category: p.category });
  if (list.length > 10) list = list.slice(0, 10);
  localStorage.setItem(key, JSON.stringify(list));
  recentProducts.value = list;
}

function loadRecent() {
  try { recentProducts.value = JSON.parse(localStorage.getItem('osaka_recent') || '[]'); } catch {}
}

async function loadProduct(id) {
  loading.value = true;
  qty.value = 1;
  try {
    const res = await axios.get(`/api/products/${id}`);
    product.value = res.data;
    saveRecent(res.data);

    // 같은 카테고리 상품 (자신 제외, 최대 6개)
    const catRes = await axios.get(`/api/products?category=${res.data.category}`);
    similarProducts.value = catRes.data.products.filter(p => p.id !== res.data.id).slice(0, 6);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadRecent();
  loadProduct(route.params.id);
});

watch(() => route.params.id, (id) => {
  if (id) loadProduct(id);
});

function addToCart() {
  for (let i = 0; i < qty.value; i++) cartStore.addItem(product.value);
  snackMsg.value = '장바구니에 담았습니다';
  snackbar.value = true;
}

function toggleWish() {
  wishlistStore.toggle(product.value);
  snackMsg.value = wishlistStore.isWished(product.value.id) ? '찜 목록에 추가했습니다' : '찜 목록에서 제거했습니다';
  snackbar.value = true;
}

function buyNow() {
  for (let i = 0; i < qty.value; i++) cartStore.addItem(product.value);
  router.push('/checkout');
}
</script>

<style scoped>
.detail-page { background: #fff; min-height: 80vh; }

.detail-wrap {
  max-width: 1100px;
  margin: 0 auto;
  padding: 40px 24px 60px;
}

.product-main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 56px;
  align-items: start;
}
@media (max-width: 768px) {
  .product-main { grid-template-columns: 1fr; gap: 28px; }
}

.product-img-area {
  background: #f5f5f5;
  aspect-ratio: 1/1;
  overflow: hidden;
}
.product-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.product-seller {
  font-size: 11px;
  color: #999;
  letter-spacing: 1px;
  margin-bottom: 8px;
}
.product-name {
  font-size: 22px;
  font-weight: 800;
  color: #111;
  letter-spacing: -0.5px;
  margin-bottom: 16px;
  line-height: 1.3;
}
.product-price {
  font-size: 26px;
  font-weight: 900;
  color: #111;
  margin-bottom: 20px;
}
.divider {
  border-top: 1px solid #e8e8e8;
  margin-bottom: 20px;
}
.product-desc {
  font-size: 13px;
  color: #555;
  line-height: 1.9;
  margin-bottom: 16px;
}
.product-stock {
  font-size: 12px;
  color: #2a9d5c;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 24px;
}

.qty-row {
  display: flex;
  align-items: center;
  gap: 0;
  border: 1px solid #ddd;
  width: fit-content;
  margin-bottom: 20px;
}
.qty-btn {
  width: 40px;
  height: 40px;
  background: #fff;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #111;
  transition: background 0.15s;
}
.qty-btn:hover { background: #f5f5f5; }
.qty-num {
  width: 48px;
  text-align: center;
  font-size: 15px;
  font-weight: 700;
  color: #111;
  border-left: 1px solid #ddd;
  border-right: 1px solid #ddd;
  line-height: 40px;
}

/* 총 금액 */
.total-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-top: 1px solid #e8e8e8;
  border-bottom: 1px solid #e8e8e8;
  margin-bottom: 16px;
}
.total-label {
  font-size: 13px;
  color: #555;
  font-weight: 500;
}
.total-price {
  font-size: 22px;
  font-weight: 900;
  color: #111;
}
.total-qty {
  font-size: 12px;
  font-weight: 500;
  color: #999;
  margin-left: 4px;
}

/* 버튼 그룹 */
.action-row {
  display: flex;
  gap: 8px;
}
.wish-btn {
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  border: 1px solid #ddd;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #999;
  transition: all 0.2s;
}
.wish-btn:hover {
  border-color: #111;
  color: #111;
}
.wish-btn.active {
  color: #e53e3e;
  border-color: #e53e3e;
}

.cart-btn {
  flex: 1;
  background: #fff;
  color: #111;
  border: 1px solid #111;
  padding: 0 16px;
  height: 52px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, color 0.2s;
}
.cart-btn:hover {
  background: #111;
  color: #fff;
}

.buy-btn {
  flex: 1.2;
  background: #111;
  color: #fff;
  border: none;
  padding: 0 16px;
  height: 52px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
  cursor: pointer;
  transition: background 0.2s;
}
.buy-btn:hover {
  background: #333;
}

.cart-btn-disabled {
  background: #ccc;
  border-color: #ccc;
  color: #fff;
  cursor: not-allowed;
}
.cart-btn-disabled:hover {
  background: #ccc;
  color: #fff;
}
.sold-out {
  color: #e53e3e;
}

/* 관련 상품 섹션 */
.related-section {
  border-top: 1px solid #e8e8e8;
  padding: 48px 0;
}
.related-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;
}
.section-title {
  font-size: 15px;
  font-weight: 800;
  color: #111;
  letter-spacing: -0.3px;
  margin-bottom: 24px;
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0;
  border-top: 1px solid #e8e8e8;
  border-left: 1px solid #e8e8e8;
}
@media (max-width: 900px) { .related-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 480px) { .related-grid { grid-template-columns: repeat(2, 1fr); } }

.related-item {
  text-decoration: none;
  color: #111;
  border-right: 1px solid #e8e8e8;
  border-bottom: 1px solid #e8e8e8;
  display: block;
  position: relative;
  z-index: 0;
  transition: box-shadow 0.25s ease;
}
.related-item:hover {
  box-shadow: 0 6px 24px rgba(0,0,0,0.12);
  z-index: 2;
}
.related-item:hover .related-img { transform: scale(1.04); }

.related-img-wrap {
  aspect-ratio: 1/1;
  overflow: hidden;
  background: #f5f5f5;
}
.related-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.35s;
}
.related-name {
  font-size: 11px;
  font-weight: 500;
  color: #111;
  padding: 8px 10px 2px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.related-price {
  font-size: 12px;
  font-weight: 700;
  color: #111;
  padding: 0 10px 10px;
}
</style>
