<template>
  <router-link :to="`/products/${product.id}`" class="pcard">
    <div class="pcard-img">
      <img
        v-for="(img, i) in images"
        :key="i"
        :src="img"
        :alt="product.name"
        class="pcard-photo"
        :class="{ active: idx === i }"
        loading="lazy"
      />

      <span v-if="product.stock === 0" class="pcard-soldout">SOLD OUT</span>
      <span v-else-if="product.stock <= 5" class="pcard-low">LEFT {{ product.stock }}</span>

      <button
        class="pcard-wish"
        :class="{ active: wished }"
        @click.prevent="toggleWish"
        :aria-label="wished ? '찜 해제' : '찜하기'"
      >
        <v-icon size="18">{{ wished ? 'mdi-heart' : 'mdi-heart-outline' }}</v-icon>
      </button>

      <button
        v-if="product.stock !== 0"
        class="pcard-add"
        @click.prevent="addToCart"
        aria-label="장바구니 담기"
      >ADD TO CART</button>
    </div>

    <div class="pcard-info">
      <p v-if="showSeller && product.seller" class="pcard-seller">{{ product.seller }}</p>
      <p class="pcard-name">{{ product.name }}</p>
      <p v-if="showDesc && product.description" class="pcard-desc">{{ product.description }}</p>
      <p class="pcard-price">₩{{ Number(product.price).toLocaleString() }}</p>
    </div>
  </router-link>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useCartStore } from '../stores/cart';
import { useWishlistStore } from '../stores/wishlist';

const props = defineProps({
  product: { type: Object, required: true },
  showSeller: { type: Boolean, default: false },
  showDesc: { type: Boolean, default: false }
});
const emit = defineEmits(['added', 'wished']);

const cartStore = useCartStore();
const wishlistStore = useWishlistStore();

// 상품 이미지 배열 (images JSON 우선, 없으면 단일 image)
const images = computed(() => {
  const p = props.product;
  if (p.images) {
    try { const arr = JSON.parse(p.images); if (arr.length) return arr; } catch { /* ignore */ }
  }
  return p.image ? [p.image] : [];
});

// 이미지 자동 슬라이드 (hover 없이 — 기존 동작 유지). 카드마다 자체 타이머.
const idx = ref(0);
let timer = null;
onMounted(() => {
  if (images.value.length < 2) return;
  const startDelay = Math.random() * 1500; // 동시에 안 넘어가게 시작 오프셋
  setTimeout(() => {
    timer = setInterval(() => {
      idx.value = (idx.value + 1) % images.value.length;
    }, 2200);
  }, startDelay);
});
onUnmounted(() => { if (timer) clearInterval(timer); });

const wished = computed(() => wishlistStore.isWished(props.product.id));

function addToCart() {
  cartStore.addItem(props.product);
  emit('added', props.product);
}
function toggleWish() {
  wishlistStore.toggle(props.product);
  emit('wished', props.product);
}
</script>

<style scoped>
.pcard {
  display: block;
  text-decoration: none;
  color: var(--c-ink);
  position: relative;
}

/* 이미지 영역 — 세로형 에디토리얼 */
.pcard-img {
  position: relative;
  aspect-ratio: 4 / 5;
  background: #fff;
  overflow: hidden;
}
.pcard-photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;   /* 옷 전체(소매 포함)가 잘리지 않게 */
  padding: 7%;
  box-sizing: border-box;
  opacity: 0;
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.pcard-photo.active { opacity: 1; }
.pcard:hover .pcard-photo.active { transform: scale(1.03); }

/* 배지 */
.pcard-soldout,
.pcard-low {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 3;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: var(--ls-label);
  padding: 4px 8px;
}
.pcard-soldout {
  inset: 0;
  top: auto;
  left: auto;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(2px);
  color: var(--c-ink);
  pointer-events: none;
}
.pcard-low {
  background: #fff;
  color: #c0392b;
  border: 1px solid #c0392b;
}

/* 찜(하트) */
.pcard-wish {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 4;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--c-ink-soft);
  opacity: 0;
  transition: opacity 0.2s, color 0.15s;
}
.pcard:hover .pcard-wish { opacity: 1; }
.pcard-wish.active { opacity: 1; color: #c0392b; }
.pcard-wish:hover { color: #c0392b; }

/* 장바구니 담기 — 하단 슬라이드 바 (메종키츠네 퀵애드 느낌) */
.pcard-add {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 3;
  border: none;
  cursor: pointer;
  background: var(--c-ink);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: var(--ls-label);
  padding: 12px 0;
  transform: translateY(100%);
  transition: transform 0.25s ease;
  font-family: inherit;
}
.pcard:hover .pcard-add { transform: translateY(0); }
.pcard-add:hover { background: #000; }

/* 정보 */
.pcard-info {
  padding: 12px 2px 4px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.pcard-seller {
  font-size: 10px;
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
  color: var(--c-muted);
}
.pcard-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--c-ink);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.pcard-desc {
  font-size: 11px;
  color: var(--c-muted);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.pcard-price {
  font-size: 13px;
  font-weight: 700;
  color: var(--c-ink);
  margin-top: 1px;
}

/* 터치 기기: hover가 없으니 담기 버튼·찜 항상 노출 */
@media (hover: none) {
  .pcard-add { transform: translateY(0); }
  .pcard-wish { opacity: 1; }
}
</style>
