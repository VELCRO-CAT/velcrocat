<template>
  <div class="pcard-wrap">
    <router-link :to="`/products/${product.id}`" class="pcard" @mouseleave="onMouseLeave">
      <div class="pcard-img">
        <img
          v-for="(img, i) in images"
          :key="i"
          :src="img"
          :alt="product.name"
          class="pcard-photo"
          :class="{ active: idx === i, broken: brokenSet.has(i) }"
          loading="lazy"
          @error="onImgError(i)"
        />

        <!-- 이미지가 모두 깨졌거나 아예 없을 때 -->
        <div v-if="noVisibleImage" class="pcard-photo-empty">
          <svg viewBox="0 0 48 48" width="32" height="32" aria-hidden="true">
            <rect x="6" y="9" width="36" height="30" fill="none" stroke="currentColor" stroke-width="1.2" />
            <path d="M6 33l10-10 8 8 6-6 12 12" fill="none" stroke="currentColor" stroke-width="1.2" />
            <circle cx="34" cy="18" r="2.5" fill="none" stroke="currentColor" stroke-width="1.2" />
          </svg>
          <span>이미지 준비 중</span>
        </div>

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

        <!-- 컬러 스와치 행 (재고 있고 컬러 등록된 경우만, 호버 시 페이드인) -->
        <div
          v-if="product.stock > 0 && colors.length"
          class="pcard-swatches"
          @click.prevent
        >
          <button
            v-for="c in colors.slice(0, 5)"
            :key="c.name"
            type="button"
            class="pcard-swatch"
            :class="{ active: qsColor === c.name }"
            :style="{ background: c.hex, borderColor: c.border ? '#bbb' : 'transparent' }"
            :title="c.name"
            @click.prevent.stop="openQuickShop(c.name)"
          />
          <span v-if="colors.length > 5" class="pcard-swatch-more">+{{ colors.length - 5 }}</span>
        </div>

        <!-- 품절 상품: 재입고 알림 버튼 -->
        <button
          v-else-if="product.stock === 0"
          type="button"
          class="pcard-notify"
          @click.prevent.stop="notifyOpen = true"
        >재입고 알림 받기 · NOTIFY ME</button>

        <!-- 인-카드 퀵쇼핑 드로우어 -->
        <transition name="qs-rise">
          <QuickShop
            v-if="quickShop"
            :product="product"
            :initial-color="qsColor"
            @close="quickShop = false"
            @added="handleAdded"
            @buy="handleBuy"
          />
        </transition>
      </div>

      <div class="pcard-info">
        <p v-if="showSeller && product.seller" class="pcard-seller">{{ product.seller }}</p>
        <p class="pcard-name">{{ product.name }}</p>
        <p v-if="showDesc && product.description" class="pcard-desc">{{ product.description }}</p>
        <p class="pcard-price">₩{{ Number(product.price).toLocaleString() }}</p>
      </div>
    </router-link>

    <!-- 재입고 알림 모달 (포털 위치는 카드 영역 밖이라 router-link 외부) -->
    <NotifyMeModal :open="notifyOpen" :product="product" @close="notifyOpen = false" />

    <!-- 인라인 토스트 ref — 페이지에서 mounted 후 호출 -->
    <MiniCartToast ref="toastRef" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '../stores/cart';
import { useWishlistStore } from '../stores/wishlist';
import { parseColors } from '../utils/colorPalette';
import QuickShop from './QuickShop.vue';
import NotifyMeModal from './NotifyMeModal.vue';
import MiniCartToast from './MiniCartToast.vue';

const props = defineProps({
  product: { type: Object, required: true },
  showSeller: { type: Boolean, default: false },
  showDesc: { type: Boolean, default: false }
});
const emit = defineEmits(['added', 'wished']);

const router = useRouter();
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

const colors = computed(() => parseColors(props.product.colors));

// 깨진 이미지 추적 — @error 시 인덱스를 set에 넣어 .broken 클래스로 숨김
const brokenSet = reactive(new Set());
function onImgError(i) { brokenSet.add(i); }
const noVisibleImage = computed(() =>
  images.value.length === 0 || brokenSet.size >= images.value.length
);

// 이미지 자동 슬라이드
const idx = ref(0);
let timer = null;
onMounted(() => {
  if (images.value.length < 2) return;
  const startDelay = Math.random() * 1500;
  setTimeout(() => {
    timer = setInterval(() => {
      idx.value = (idx.value + 1) % images.value.length;
    }, 2200);
  }, startDelay);
});
onUnmounted(() => { if (timer) clearInterval(timer); });

const wished = computed(() => wishlistStore.isWished(props.product.id));

// ── 퀵쇼핑 / 재입고 알림 / 토스트 상태 ──
const quickShop = ref(false);
const qsColor = ref('');
const notifyOpen = ref(false);
const toastRef = ref(null);

function openQuickShop(colorName) {
  qsColor.value = colorName;
  quickShop.value = true;
}

function onMouseLeave() {
  // 드로우어가 열려있으면 닫지 않고, 닫혀있을 때만 첫 이미지로 돌아가지 않도록 유지.
  // (자동 슬라이드는 그대로 진행)
}

function handleAdded(payload) {
  // QuickShop이 ADD TO BAG 누른 결과 — color/size/qty 페이로드를 카트에 반영
  const opts = { color: payload.color, size: payload.size };
  const n = Math.max(1, Number(payload.qty || 1));
  for (let i = 0; i < n; i++) cartStore.addItem(props.product, opts);
  toastRef.value?.show();
  emit('added', props.product);
}

function handleBuy(payload) {
  const opts = { color: payload.color, size: payload.size };
  const n = Math.max(1, Number(payload.qty || 1));
  for (let i = 0; i < n; i++) cartStore.addItem(props.product, opts);
  router.push('/checkout');
}

function toggleWish() {
  wishlistStore.toggle(props.product);
  emit('wished', props.product);
}
</script>

<style scoped>
.pcard-wrap { position: relative; }
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
  background: var(--c-paper);
  overflow: hidden;
  border-bottom: 1px solid var(--c-line);
}
.pcard-photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 4%;                            /* 7% → 4% */
  box-sizing: border-box;
  opacity: 0;
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.pcard-photo.active { opacity: 1; }
.pcard:hover .pcard-photo.active { transform: scale(1.03); }
.pcard-photo.broken { display: none; }

/* 깨진/없는 이미지 폴백 */
.pcard-photo-empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--c-muted);
  background: var(--c-paper);
  font-family: var(--ff-label);
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

/* 배지 */
.pcard-soldout,
.pcard-low {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 3;
  font-family: var(--ff-label);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
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
  background: rgba(246,241,231,0.7);
  backdrop-filter: blur(2px);
  color: var(--c-ink);
  pointer-events: none;
}
.pcard-low {
  background: var(--c-cream-soft);
  color: var(--c-accent);
  border: 1px solid var(--c-accent);
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
.pcard-wish.active { opacity: 1; color: var(--c-accent); }
.pcard-wish:hover { color: var(--c-accent); }

/* 컬러 스와치 행 (호버 시 페이드인) */
.pcard-swatches {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 12px;
  z-index: 3;
  display: flex;
  gap: 6px;
  align-items: center;
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 0.25s, transform 0.25s;
}
.pcard:hover .pcard-swatches { opacity: 1; transform: translateY(0); }
.pcard-swatch {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid transparent;
  outline: 1.5px solid transparent;
  outline-offset: 2px;
  cursor: pointer;
  transition: outline-color 0.12s, transform 0.15s;
  padding: 0;
}
.pcard-swatch:hover { transform: scale(1.15); outline-color: var(--c-ink); }
.pcard-swatch.active { outline-color: var(--c-ink); }
.pcard-swatch-more {
  font-family: var(--ff-label);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: var(--ls-label);
  color: var(--c-ink-soft);
  margin-left: 2px;
  text-transform: uppercase;
}

/* 재입고 알림 받기 (품절 시) */
.pcard-notify {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 3;
  background: rgba(26,23,20,0.92);
  color: var(--c-cream);
  border: 0;
  cursor: pointer;
  font-family: var(--ff-label);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
  padding: 12px 0;
}
.pcard-notify:hover { background: var(--c-ink); }

/* 정보 */
.pcard-info {
  padding: 14px 2px 4px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.pcard-seller {
  font-family: var(--ff-label);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--c-muted);
}
.pcard-name {
  font-family: var(--ff-sans);
  font-size: 13px;
  font-weight: 500;
  color: var(--c-ink);
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
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
  font-family: var(--ff-label);
  font-variant-numeric: tabular-nums;
  font-size: 13px;
  font-weight: 600;
  color: var(--c-ink);
  margin-top: 2px;
  letter-spacing: 0.02em;
}

/* QuickShop 드로우어 슬라이드업 */
.qs-rise-enter-from, .qs-rise-leave-to { transform: translateY(100%); }
.qs-rise-enter-active, .qs-rise-leave-active { transition: transform 0.28s ease; }

/* 터치 기기 — 스와치 행 항상 표시, 찜 항상 표시 */
@media (hover: none) {
  .pcard-swatches { opacity: 1; transform: none; }
  .pcard-swatch { width: 22px; height: 22px; }
  .pcard-wish { opacity: 1; }
}
</style>
