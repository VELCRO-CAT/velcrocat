<template>
  <div class="home">
    <!-- 상품 그리드 (MRU 스타일 — PC 3열, 모바일 2열) -->
    <div v-if="loading" class="loading-wrap">
      <v-progress-circular indeterminate color="#111" size="36" />
    </div>

    <div v-else class="product-grid-wrap"><div class="product-grid">
      <router-link
        v-for="(product, idx) in products"
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
          <span v-if="product.stock === 0" class="sold-out-badge">SOLD OUT</span>
          <button v-else class="product-cart-btn hvr-grow" @click.prevent="addToCart(product)" aria-label="장바구니 담기">
            <v-icon size="18">mdi-cart-plus</v-icon>
          </button>
        </div>
        <div class="product-info">
          <p class="product-name">{{ product.name }}</p>
          <p class="product-price">₩{{ Number(product.price).toLocaleString() }}</p>
        </div>
      </router-link>
    </div></div>

    <v-snackbar v-model="snackbar" color="#222" timeout="2000" location="bottom right">
      <v-icon start color="white">mdi-check-circle</v-icon>
      <span style="color:#fff">장바구니에 담았습니다</span>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue';
import axios from 'axios';
import { useCartStore } from '../stores/cart';

const cartStore = useCartStore();
const products = ref([]);
const loading = ref(true);
const snackbar = ref(false);
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
  }, 1200);
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

function initReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.home .reveal').forEach(el => observer.observe(el));
}

onMounted(async () => {
  try {
    const res = await axios.get('/api/products');
    products.value = res.data.products;
  } finally {
    loading.value = false;
    nextTick(() => initReveal());
  }
});

function addToCart(product) {
  cartStore.addItem(product);
  snackbar.value = true;
}
</script>

<style scoped>
.home { background: #fff; }

.loading-wrap {
  text-align: center;
  padding: 80px 24px;
}

/* MRU 스타일 상품 그리드 */
.product-grid-wrap {
  max-width: 1200px;
  margin: 0 auto;
}
.product-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-top: 1px solid #e8e8e8;
  border-left: 1px solid #e8e8e8;
}

/* 모바일: 2열 */
@media (max-width: 599px) {
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

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
  border-right: 1px solid #e8e8e8;
  border-bottom: 1px solid #e8e8e8;
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
  aspect-ratio: 3 / 4;
}
.product-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 0.5s ease;
  display: block;
}
.product-item:hover .product-img {
  transform: scale(1.05);
}

.product-cart-btn {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.25s;
  color: #111;
}
.product-item:hover .product-cart-btn {
  opacity: 1;
}
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

.product-info {
  padding: 12px 14px 16px;
}
.product-name {
  font-size: 12px;
  font-weight: 500;
  color: #111;
  margin-bottom: 6px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.5;
  min-height: 36px;
}
.product-price {
  font-size: 13px;
  font-weight: 700;
  color: #111;
}
</style>
