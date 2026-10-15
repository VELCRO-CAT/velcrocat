<template>
  <v-container style="max-width:1100px" class="py-8">
    <h1 class="text-h5 font-weight-bold mb-6">{{ t('cart.title') }}</h1>

    <div v-if="cartStore.items.length === 0" class="text-center py-16">
      <v-icon size="64" color="#ccc">mdi-cart-outline</v-icon>
      <p class="text-h6 text-grey mt-4 mb-6">{{ t('cart.empty') }}</p>
      <v-btn variant="outlined" color="#111" size="large" to="/products">{{ t('cart.browseProducts') }}</v-btn>
    </div>

    <v-row v-else>
      <!-- 장바구니 아이템 -->
      <v-col cols="12" md="8">
        <div class="cart-bulk-row">
          <label class="cart-check">
            <input type="checkbox" :checked="allSelected" @change="toggleSelectAll" />
            <span>{{ t('cart.selectAll') }} ({{ selected.length }}/{{ cartStore.items.length }})</span>
          </label>
          <button class="cart-bulk-delete" :disabled="selected.length === 0" @click="deleteSelected">
            {{ t('cart.deleteSelected') }}
          </button>
        </div>

        <div class="cart-list">
          <div v-for="item in cartStore.items" :key="vk(item)" class="cart-row">
            <label class="cart-check cart-row-check">
              <input type="checkbox" :value="vk(item)" v-model="selected" />
            </label>
            <div class="cart-item-row">
              <v-img :src="item.image" width="80" height="80" class="cart-item-img" style="background:#f5f5f5" />
              <div class="cart-item-info">
                <p class="text-caption text-grey mb-1">{{ item.seller }}</p>
                <p class="font-weight-medium">{{ lf(item, 'name') }}</p>
                <p v-if="item.color || item.size" class="text-caption text-grey">
                  <span v-if="item.color">{{ t('detail.colorLabel') }}: {{ colorName(item.color) }}</span>
                  <span v-if="item.color && item.size"> / </span>
                  <span v-if="item.size">{{ t('detail.sizeLabel') }}: {{ item.size }}</span>
                </p>
                <p class="text-body-2 font-weight-bold mt-1">₩{{ Number(item.price).toLocaleString() }}</p>
              </div>
              <div class="cart-item-actions">
                <div class="cart-qty-stepper">
                  <button class="cart-qty-btn" @click="cartStore.updateQty(vk(item), item.qty - 1)">
                    <v-icon size="16">mdi-minus</v-icon>
                  </button>
                  <span class="cart-qty-num">{{ item.qty }}</span>
                  <button class="cart-qty-btn" @click="cartStore.updateQty(vk(item), item.qty + 1)">
                    <v-icon size="16">mdi-plus</v-icon>
                  </button>
                </div>
                <div class="text-right cart-item-total">
                  <p class="font-weight-bold">₩{{ (item.price * item.qty).toLocaleString() }}</p>
                  <button class="cart-item-remove" @click="cartStore.removeItem(vk(item))">
                    <v-icon size="16">mdi-close</v-icon>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button class="cart-clear-link" @click="cartStore.clearCart()">{{ t('cart.clearCart') }}</button>
      </v-col>

      <!-- 주문 요약 -->
      <v-col cols="12" md="4">
        <div class="cart-summary">
          <h2 class="cart-summary-title">{{ t('cart.summaryTitle') }}</h2>
          <div class="cart-summary-row">
            <span>{{ t('cart.itemCount') }}</span><span>{{ t('detail.qtyUnit', { count: cartStore.itemCount }) }}</span>
          </div>
          <div class="cart-summary-row">
            <span>{{ t('cart.subtotal') }}</span><span>₩{{ cartStore.total.toLocaleString() }}</span>
          </div>
          <div class="cart-summary-row">
            <span>{{ t('cart.shipping') }}</span><span class="cart-summary-free">{{ t('cart.free') }}</span>
          </div>
          <div class="cart-summary-divider"></div>
          <div class="cart-summary-total">
            <span>{{ t('cart.total') }}</span>
            <span>₩{{ cartStore.total.toLocaleString() }}</span>
          </div>
          <button class="cart-checkout-btn" @click="checkout">{{ t('cart.checkoutBtn') }}</button>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useCartStore, variantKey } from '../stores/cart';
import { useRouter } from 'vue-router';
import { useLocalized } from '../composables/useLocalized';

const { t } = useI18n();
const { lf, colorName } = useLocalized();
const cartStore = useCartStore();
const vk = variantKey;
const router = useRouter();

const selected = ref([]);
const allSelected = computed(() => cartStore.items.length > 0 && selected.value.length === cartStore.items.length);

function toggleSelectAll() {
  selected.value = allSelected.value ? [] : cartStore.items.map(vk);
}

function deleteSelected() {
  selected.value.forEach(key => cartStore.removeItem(key));
  selected.value = [];
}

function checkout() {
  router.push('/checkout');
}
</script>

<style scoped>
/* 전체선택 / 선택삭제 */
.cart-bulk-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 14px;
  border-bottom: 1px solid #111;
  margin-bottom: 4px;
}
.cart-check {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #333;
  cursor: pointer;
}
.cart-check input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #111;
  cursor: pointer;
}
.cart-bulk-delete {
  background: none;
  border: none;
  font-size: 12.5px;
  color: #888;
  cursor: pointer;
}
.cart-bulk-delete:hover:not(:disabled) { color: #111; }
.cart-bulk-delete:disabled { opacity: 0.4; cursor: default; }

/* 아이템 목록 — 카드 박스 대신 구분선으로 플랫하게 */
.cart-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 20px 0;
  border-bottom: 1px solid #eee;
}
.cart-row-check { margin-top: 30px; }

.cart-item-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
}
.cart-item-img {
  flex: 0 0 80px !important;
  width: 80px !important;
  max-width: 80px !important;
}
.cart-item-info { flex: 1 1 auto; min-width: 0; }
.cart-item-info p { overflow-wrap: break-word; }
.cart-item-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}
.cart-item-total { min-width: 72px; }

.cart-qty-stepper {
  display: flex;
  align-items: center;
  border: 1px solid #ddd;
}
.cart-qty-btn {
  width: 28px;
  height: 28px;
  background: #fff;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #333;
}
.cart-qty-btn:hover { background: #f5f5f5; }
.cart-qty-num {
  width: 32px;
  text-align: center;
  font-size: 13px;
  font-weight: 700;
  border-left: 1px solid #ddd;
  border-right: 1px solid #ddd;
  line-height: 28px;
}
.cart-item-remove {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 2px;
  margin-top: 4px;
}
.cart-item-remove:hover { color: #111; }

.cart-clear-link {
  background: none;
  border: none;
  font-size: 12.5px;
  color: #999;
  cursor: pointer;
  padding: 16px 0 0;
}
.cart-clear-link:hover { color: #111; }

/* 주문 요약 */
.cart-summary {
  background: #fafafa;
  border: 1px solid #eee;
  padding: 24px;
  position: sticky;
  top: 90px;
}
.cart-summary-title {
  font-size: 15px;
  font-weight: 700;
  color: #111;
  margin: 0 0 18px;
}
.cart-summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #555;
  margin-bottom: 10px;
}
.cart-summary-free { color: #2a9d5c; font-weight: 600; }
.cart-summary-divider { height: 1px; background: #ddd; margin: 12px 0 16px; }
.cart-summary-total {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-weight: 700;
  font-size: 18px;
  color: #111;
  margin-bottom: 20px;
}
.cart-checkout-btn {
  width: 100%;
  height: 52px;
  background: #fff;
  color: #111;
  border: 1px solid #111;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.3px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.cart-checkout-btn:hover { background: #111; color: #fff; }

/* 좁은 화면에서는 이미지/이름 아래로 수량·가격을 한 줄 전체로 내려서 잘림 방지 */
@media (max-width: 600px) {
  .cart-row { gap: 8px; }
  .cart-row-check { margin-top: 0; }
  .cart-item-row { flex-wrap: wrap; }
  .cart-item-actions {
    flex-basis: 100%;
    justify-content: space-between;
    margin-top: 12px;
  }
  .cart-summary { position: static; }
}
</style>
