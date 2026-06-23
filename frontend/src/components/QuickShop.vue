<template>
  <div class="qs-panel" @click.stop.prevent>
    <button class="qs-close hvr-grow" @click.stop.prevent="$emit('close')" aria-label="닫기">
      <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
      </svg>
    </button>

    <p class="qs-line">
      <span class="qs-label">COLOR</span>
      <span class="qs-value">{{ selectedColor || '—' }}</span>
    </p>
    <div v-if="colors.length" class="qs-color-row">
      <button
        v-for="c in colors"
        :key="c.name"
        type="button"
        class="qs-swatch"
        :class="{ active: selectedColor === c.name }"
        :style="{ background: c.hex, borderColor: c.border ? '#bbb' : 'transparent' }"
        :title="c.name"
        @click.stop.prevent="selectedColor = c.name"
      />
    </div>

    <p class="qs-line">
      <span class="qs-label">SIZE</span>
      <span class="qs-value">{{ selectedSize || '—' }}</span>
    </p>
    <div class="qs-size-row" :class="{ shake: sizeShake }">
      <button
        v-for="s in sizes"
        :key="s"
        type="button"
        class="qs-size"
        :class="{ active: selectedSize === s }"
        @click.stop.prevent="selectedSize = s"
      >{{ s }}</button>
    </div>

    <div class="qs-row">
      <div class="qs-qty">
        <button type="button" class="qs-qty-btn" @click.stop.prevent="qty = Math.max(1, qty - 1)">−</button>
        <span class="qs-qty-num">{{ qty }}</span>
        <button type="button" class="qs-qty-btn" @click.stop.prevent="qty = Math.min(maxQty, qty + 1)">+</button>
      </div>
      <span class="qs-price">₩{{ Number(product.price * qty).toLocaleString() }}</span>
    </div>

    <div class="qs-actions">
      <button
        type="button"
        class="qs-btn qs-btn-outline hvr-sweep-to-right"
        :disabled="adding"
        @click.stop.prevent="onAdd"
      >
        <span v-if="!adding">ADD TO BAG</span>
        <span v-else class="qs-spinner" />
      </button>
      <button
        type="button"
        class="qs-btn qs-btn-fill hvr-icon-forward"
        @click.stop.prevent="onBuy"
      >BUY NOW →</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { parseColors, parseSizes } from '../utils/colorPalette';

const props = defineProps({
  product: { type: Object, required: true },
  initialColor: { type: String, default: '' }
});
const emit = defineEmits(['close', 'added', 'buy']);

const selectedColor = ref(props.initialColor || '');
const selectedSize = ref('');
const qty = ref(1);
const sizeShake = ref(false);
const adding = ref(false);

const colors = computed(() => parseColors(props.product.colors));
const sizes  = computed(() => parseSizes(props.product.sizes));
const maxQty = computed(() => Math.max(1, Number(props.product.stock || 99)));

watch(() => props.initialColor, (v) => {
  if (v && !selectedColor.value) selectedColor.value = v;
});

function triggerSizeShake() {
  sizeShake.value = true;
  setTimeout(() => { sizeShake.value = false; }, 420);
}

function validate() {
  if (colors.value.length && !selectedColor.value) return false;
  if (sizes.value.length && !selectedSize.value) {
    triggerSizeShake();
    return false;
  }
  return true;
}

function onAdd() {
  if (adding.value) return;
  if (!validate()) return;
  adding.value = true;
  emit('added', {
    color: selectedColor.value || null,
    size: selectedSize.value || null,
    qty: qty.value
  });
  setTimeout(() => { adding.value = false; emit('close'); }, 700);
}

function onBuy() {
  if (!validate()) return;
  emit('buy', {
    color: selectedColor.value || null,
    size: selectedSize.value || null,
    qty: qty.value
  });
}
</script>

<style scoped>
.qs-panel {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  z-index: 5;
  background: var(--c-cream-soft);
  border-top: 1px solid var(--c-line);
  padding: 16px 16px 14px;
  font-family: var(--ff-sans);
  color: var(--c-ink);
  box-shadow: 0 -6px 24px rgba(26,23,20,0.10);
}
.qs-close {
  position: absolute;
  top: 8px; right: 8px;
  width: 26px; height: 26px;
  background: none; border: 0; cursor: pointer;
  color: var(--c-ink-soft);
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 50%;
  transition: background 0.15s;
}
.qs-close:hover { background: var(--c-cream-deep); color: var(--c-ink); }

.qs-line {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin: 0 0 6px;
}
.qs-label {
  font-family: var(--ff-label);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--c-ink-soft);
}
.qs-value {
  font-size: 11px;
  font-weight: 500;
  color: var(--c-ink);
  letter-spacing: 0.02em;
}

.qs-color-row { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 10px; }
.qs-swatch {
  width: 18px; height: 18px;
  border-radius: 50%;
  border: 1px solid transparent;
  outline: 1.5px solid transparent;
  outline-offset: 2px;
  cursor: pointer;
  transition: outline-color 0.12s;
  padding: 0;
}
.qs-swatch.active,
.qs-swatch:hover { outline-color: var(--c-ink); }

.qs-size-row {
  display: flex; flex-wrap: wrap; gap: 6px;
  margin: 0 0 10px;
}
.qs-size {
  min-width: 36px;
  padding: 6px 10px;
  background: var(--c-cream-soft);
  border: 1px solid var(--c-line);
  color: var(--c-ink-soft);
  font-family: var(--ff-label);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.15s;
}
.qs-size:hover { border-color: var(--c-ink-soft); color: var(--c-ink); }
.qs-size.active {
  background: var(--c-ink);
  color: var(--c-cream);
  border-color: var(--c-ink);
}
.qs-size-row.shake {
  animation: qs-shake 0.42s ease;
}
@keyframes qs-shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-4px); }
  40%, 80% { transform: translateX(4px); }
}

.qs-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 4px 0 10px;
}
.qs-qty { display: inline-flex; align-items: center; border: 1px solid var(--c-line); }
.qs-qty-btn {
  width: 26px; height: 26px;
  background: none; border: 0; cursor: pointer;
  color: var(--c-ink-soft);
  font-size: 14px;
  display: inline-flex; align-items: center; justify-content: center;
}
.qs-qty-btn:hover { color: var(--c-ink); }
.qs-qty-num {
  min-width: 28px; text-align: center;
  font-family: var(--ff-label);
  font-variant-numeric: tabular-nums;
  font-size: 12px;
  font-weight: 600;
  color: var(--c-ink);
}
.qs-price {
  font-family: var(--ff-label);
  font-variant-numeric: tabular-nums;
  font-size: 14px;
  font-weight: 600;
  color: var(--c-ink);
  letter-spacing: 0.02em;
}

.qs-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.qs-btn {
  height: 36px;
  cursor: pointer;
  font-family: var(--ff-label);
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  transition: background 0.2s, color 0.2s;
  display: inline-flex; align-items: center; justify-content: center;
}
.qs-btn-outline {
  background: transparent;
  color: var(--c-ink);
  border: 1px solid var(--c-ink);
}
.qs-btn-outline:hover { background: var(--c-ink); color: var(--c-cream); }
.qs-btn-fill {
  background: var(--c-ink);
  color: var(--c-cream);
  border: 1px solid var(--c-ink);
}
.qs-btn-fill:hover { background: #000; }
.qs-btn:disabled { opacity: 0.6; cursor: default; }

.qs-spinner {
  width: 14px; height: 14px;
  border: 1.5px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: qs-spin 0.7s linear infinite;
}
@keyframes qs-spin { to { transform: rotate(360deg); } }
</style>
