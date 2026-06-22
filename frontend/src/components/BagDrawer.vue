<template>
  <teleport to="body">
    <transition name="bag-fade">
      <div v-if="open" class="bag-overlay" @click="$emit('close')"></div>
    </transition>
    <transition name="bag-slide">
      <aside v-if="open" class="bag-drawer" role="dialog" aria-label="장바구니">
        <header class="bag-head">
          <h2 class="bag-title">
            SHOPPING BAG
            <span class="bag-count" v-if="cartStore.items.length">({{ cartStore.itemCount }})</span>
          </h2>
          <button class="bag-close" @click="$emit('close')" aria-label="닫기">
            <svg viewBox="0 0 24 24" width="14" height="14"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/></svg>
          </button>
        </header>

        <div v-if="!cartStore.items.length" class="bag-empty">
          <p class="bag-empty-title">Your bag is empty.</p>
          <p class="bag-empty-sub">담긴 상품이 없습니다</p>
          <router-link to="/products" class="bag-btn bag-btn-ghost" @click="$emit('close')">
            CONTINUE SHOPPING
          </router-link>
        </div>

        <div v-else class="bag-body">
          <ul class="bag-list">
            <li v-for="item in previewItems" :key="vk(item)" class="bag-row">
              <img :src="item.image" :alt="item.name" class="bag-thumb" />
              <div class="bag-row-info">
                <p class="bag-row-name">{{ item.name }}</p>
                <p class="bag-row-meta">
                  <span v-if="item.color">{{ item.color }}</span>
                  <span v-if="item.color && item.size"> · </span>
                  <span v-if="item.size">{{ item.size }}</span>
                  <span v-if="item.color || item.size"> · </span>
                  <span>QTY {{ item.qty }}</span>
                </p>
                <p class="bag-row-price">₩{{ Number(item.price * item.qty).toLocaleString() }}</p>
              </div>
              <button
                class="bag-row-x"
                @click="cartStore.removeItem(vk(item))"
                aria-label="제거"
              >
                <svg viewBox="0 0 24 24" width="12" height="12"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/></svg>
              </button>
            </li>
          </ul>
          <p v-if="cartStore.items.length > previewLimit" class="bag-more">
            + {{ cartStore.items.length - previewLimit }}개 더 보기
          </p>
        </div>

        <footer v-if="cartStore.items.length" class="bag-foot">
          <div class="bag-sub">
            <span>SUBTOTAL</span>
            <span class="bag-sub-amount">₩{{ Number(cartStore.total).toLocaleString() }}</span>
          </div>
          <p class="bag-ship">배송비는 결제 단계에서 계산됩니다</p>
          <router-link to="/cart" class="bag-btn bag-btn-ghost" @click="$emit('close')">
            VIEW BAG
          </router-link>
          <router-link to="/checkout" class="bag-btn bag-btn-solid" @click="$emit('close')">
            CHECKOUT
          </router-link>
        </footer>
      </aside>
    </transition>
  </teleport>
</template>

<script setup>
import { computed, watch } from 'vue';
import { useCartStore, variantKey } from '../stores/cart';

const props = defineProps({
  open: { type: Boolean, default: false }
});
defineEmits(['close']);

const cartStore = useCartStore();
const vk = variantKey;

const previewLimit = 4;
const previewItems = computed(() => cartStore.items.slice(-previewLimit).reverse());

// 드로우어 열림 시 본문 스크롤 잠금
watch(() => props.open, (v) => {
  try {
    document.documentElement.style.overflow = v ? 'hidden' : '';
  } catch { /* ignore */ }
});
</script>

<style scoped>
.bag-overlay {
  position: fixed;
  inset: 0;
  background: rgba(26,23,20,0.45);
  z-index: 300;
}
.bag-drawer {
  position: fixed;
  top: 0;
  right: 0;
  width: 380px;
  max-width: 92vw;
  height: 100vh;
  background: var(--c-paper);
  z-index: 301;
  display: flex;
  flex-direction: column;
  box-shadow: -12px 0 32px rgba(26,23,20,0.12);
  font-family: var(--ff-sans);
}

.bag-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px 24px 18px;
  border-bottom: 1px solid var(--c-line);
}
.bag-title {
  margin: 0;
  font-family: var(--ff-label);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--c-ink);
}
.bag-count {
  margin-left: 4px;
  font-weight: 500;
  color: var(--c-ink-soft);
}
.bag-close {
  background: none;
  border: 0;
  cursor: pointer;
  color: var(--c-ink);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  opacity: 0.6;
}
.bag-close:hover { opacity: 1; }

.bag-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 20px 24px;
  gap: 6px;
}
.bag-empty-title {
  font-family: var(--ff-serif);
  font-style: italic;
  font-size: 24px;
  color: var(--c-ink);
  margin: 0;
}
.bag-empty-sub {
  font-size: 12px;
  color: var(--c-ink-soft);
  margin: 0 0 20px;
}

.bag-body {
  flex: 1;
  overflow-y: auto;
  padding: 6px 24px;
}
.bag-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.bag-row {
  display: grid;
  grid-template-columns: 72px 1fr 22px;
  gap: 14px;
  padding: 16px 0;
  border-bottom: 1px solid var(--c-line);
  align-items: start;
}
.bag-row:last-child { border-bottom: none; }
.bag-thumb {
  width: 72px;
  height: 90px;
  object-fit: cover;
  background: var(--c-paper);
}
.bag-row-info {
  min-width: 0;
}
.bag-row-name {
  margin: 0 0 4px;
  font-size: 13px;
  font-weight: 500;
  color: var(--c-ink);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.bag-row-meta {
  margin: 0 0 8px;
  font-family: var(--ff-label);
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--c-ink-soft);
}
.bag-row-price {
  margin: 0;
  font-family: var(--ff-label);
  font-variant-numeric: tabular-nums;
  font-size: 12px;
  font-weight: 700;
  color: var(--c-ink);
  letter-spacing: 0.02em;
}
.bag-row-x {
  background: none;
  border: 0;
  cursor: pointer;
  color: var(--c-ink-soft);
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}
.bag-row-x:hover { color: var(--c-ink); }

.bag-more {
  text-align: center;
  font-family: var(--ff-label);
  font-size: 10.5px;
  letter-spacing: 0.18em;
  color: var(--c-ink-soft);
  margin: 12px 0 4px;
  text-transform: uppercase;
}

.bag-foot {
  border-top: 1px solid var(--c-line);
  padding: 20px 24px 24px;
}
.bag-sub {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-family: var(--ff-label);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--c-ink);
  margin-bottom: 4px;
}
.bag-sub-amount {
  font-variant-numeric: tabular-nums;
  font-size: 16px;
}
.bag-ship {
  font-size: 11px;
  color: var(--c-ink-soft);
  margin: 0 0 16px;
  letter-spacing: 0.02em;
}
.bag-btn {
  display: block;
  text-align: center;
  padding: 14px;
  margin-top: 10px;
  font-family: var(--ff-label);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  text-decoration: none;
  transition: background 0.2s, color 0.2s;
}
.bag-btn-ghost {
  border: 1px solid var(--c-ink);
  color: var(--c-ink);
  background: transparent;
}
.bag-btn-ghost:hover { background: var(--c-ink); color: var(--c-cream); }
.bag-btn-solid {
  border: 1px solid var(--c-ink);
  color: var(--c-cream);
  background: var(--c-ink);
}
.bag-btn-solid:hover { background: #000; }

/* 슬라이드 트랜지션 */
.bag-slide-enter-from, .bag-slide-leave-to { transform: translateX(100%); }
.bag-slide-enter-active, .bag-slide-leave-active { transition: transform 0.32s cubic-bezier(0.22,0.61,0.36,1); }

.bag-fade-enter-from, .bag-fade-leave-to { opacity: 0; }
.bag-fade-enter-active, .bag-fade-leave-active { transition: opacity 0.25s ease; }

@media (max-width: 600px) {
  .bag-drawer { width: 92vw; }
  .bag-thumb { width: 64px; height: 80px; }
  .bag-row { grid-template-columns: 64px 1fr 22px; gap: 12px; }
}
</style>
