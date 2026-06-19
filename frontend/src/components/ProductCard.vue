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

        <!-- 이미지 2장 이상일 때만 좌/우 네비 화살표 -->
        <template v-if="images.length > 1 && !noVisibleImage">
          <button
            type="button"
            class="pcard-arrow pcard-arrow-left"
            @click.prevent.stop="prevImage"
            aria-label="이전 이미지"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
              <path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button
            type="button"
            class="pcard-arrow pcard-arrow-right"
            @click.prevent.stop="nextImage"
            aria-label="다음 이미지"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
              <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <!-- 인덱스 닷 (현재 위치 표시) -->
          <div class="pcard-dots" @click.prevent.stop>
            <button
              v-for="(_, i) in images"
              :key="i"
              type="button"
              class="pcard-dot"
              :class="{ active: idx === i }"
              @click.prevent.stop="idx = i"
              :aria-label="`이미지 ${i + 1}`"
            />
          </div>
        </template>

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
import { ref, reactive, computed } from 'vue';
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

// 이미지 인덱스 (좌/우 화살표로 수동 네비게이션)
const idx = ref(0);
function prevImage() {
  if (!images.value.length) return;
  idx.value = (idx.value - 1 + images.value.length) % images.value.length;
}
function nextImage() {
  if (!images.value.length) return;
  idx.value = (idx.value + 1) % images.value.length;
}

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
  background: rgba(255,255,255,0.78);
  backdrop-filter: blur(2px);
  color: var(--c-ink);
  pointer-events: none;
}
.pcard-low {
  background: var(--c-cream-soft);
  color: var(--c-accent);
  border: 1px solid var(--c-accent);
}

/* 좌/우 네비 화살표 (호버 시 페이드인) */
.pcard-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 30px;
  height: 30px;
  background: rgba(255, 255, 255, 0.78);   /* 순백 78% */
  border: 1px solid var(--c-line);
  cursor: pointer;
  color: var(--c-ink);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 4;
  opacity: 0;
  transition: opacity 0.2s ease, background 0.15s;
  padding: 0;
  border-radius: 0;
}
.pcard:hover .pcard-arrow { opacity: 1; }
.pcard-arrow:hover {
  background: var(--c-ink);
  color: var(--c-cream);
  border-color: var(--c-ink);
}
.pcard-arrow-left  { left: 8px; }
.pcard-arrow-right { right: 8px; }

/* 인덱스 닷 (이미지 영역 상단 중앙) */
.pcard-dots {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 5px;
  z-index: 3;
  pointer-events: none;
}
.pcard-dot {
  width: 16px;
  height: 2px;
  background: rgba(26, 23, 20, 0.25);
  border: 0;
  cursor: pointer;
  padding: 0;
  pointer-events: auto;
  transition: background 0.18s ease;
}
.pcard-dot.active { background: var(--c-ink); }
.pcard-dot:hover { background: var(--c-ink-soft); }

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

/* 컬러 스와치 행 (호버 시 각 swatch가 차례로 자연스럽게 올라옴) */
.pcard-swatches {
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 14px;
  z-index: 3;
  display: flex;
  gap: 8px;
  align-items: center;
  pointer-events: none;          /* 컨테이너 자체는 클릭 통과 */
}
.pcard-swatch {
  width: 18px;
  height: 18px;
  border-radius: 0;              /* 각진 정사각형 */
  border: 1px solid transparent;
  outline: 1.5px solid transparent;
  outline-offset: 2px;
  cursor: pointer;
  padding: 0;
  pointer-events: auto;
  opacity: 0;
  transform: translateY(14px);
  /* 부드러운 ease-out (cubic-bezier로 자연스러운 감속) */
  transition:
    opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.45s cubic-bezier(0.16, 1, 0.3, 1),
    outline-color 0.15s ease;
}
.pcard:hover .pcard-swatch {
  opacity: 1;
  transform: translateY(0);
}
/* 60ms 간격 staggered 라이즈 (왼쪽부터 차례로) */
.pcard:hover .pcard-swatch:nth-child(1) { transition-delay: 0ms;    }
.pcard:hover .pcard-swatch:nth-child(2) { transition-delay: 60ms;   }
.pcard:hover .pcard-swatch:nth-child(3) { transition-delay: 120ms;  }
.pcard:hover .pcard-swatch:nth-child(4) { transition-delay: 180ms;  }
.pcard:hover .pcard-swatch:nth-child(5) { transition-delay: 240ms;  }
/* 호버 해제 시 딜레이 없이 즉시 페이드아웃 */
.pcard:not(:hover) .pcard-swatch { transition-delay: 0ms; }

.pcard-swatch.active,
.pcard-swatch:hover { outline-color: var(--c-ink); }

.pcard-swatch-more {
  font-family: var(--ff-label);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: var(--ls-label);
  color: var(--c-ink-soft);
  margin-left: 4px;
  text-transform: uppercase;
  pointer-events: none;
  opacity: 0;
  transform: translateY(14px);
  transition:
    opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1) 300ms,
    transform 0.45s cubic-bezier(0.16, 1, 0.3, 1) 300ms;
}
.pcard:hover .pcard-swatch-more {
  opacity: 1;
  transform: translateY(0);
}
.pcard:not(:hover) .pcard-swatch-more { transition-delay: 0ms; }

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

/* 터치 기기 — 스와치/화살표/찜 항상 표시 */
@media (hover: none) {
  .pcard-swatch {
    opacity: 1;
    transform: none;
    transition: outline-color 0.15s ease;
    width: 22px;
    height: 22px;
  }
  .pcard-swatch-more { opacity: 1; transform: none; transition: none; }
  .pcard-wish { opacity: 1; }
  .pcard-arrow {
    opacity: 1;
    background: rgba(255, 255, 255, 0.9);
  }
}
</style>
