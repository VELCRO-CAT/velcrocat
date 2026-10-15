<template>
  <v-container class="py-16 lookup-wrap">
    <div class="text-center mb-10">
      <h1 class="text-h5 font-weight-bold" style="letter-spacing:2px">{{ t('orderLookup.title') }}</h1>
      <p class="text-caption text-grey mt-1" style="letter-spacing:4px">ORDER LOOKUP</p>
    </div>

    <!-- 조회 폼 -->
    <div v-if="!order" class="lookup-card">
      <p class="lookup-desc">{{ t('orderLookup.desc') }}</p>
      <v-form @submit.prevent="lookup">
        <label class="field-label">{{ t('orderLookup.orderNoLabel') }}</label>
        <v-text-field v-model="orderNo" variant="outlined" density="comfortable" hide-details class="mb-3" />

        <label class="field-label">{{ t('orderLookup.passwordLabel') }}</label>
        <v-text-field v-model="password" type="password" variant="outlined" density="comfortable" hide-details class="mb-4" />

        <v-alert v-if="errorMsg" type="error" variant="tonal" density="compact" class="mb-4">{{ errorMsg }}</v-alert>
        <v-btn type="submit" variant="outlined" color="#111" size="large" block :loading="loading">{{ t('orderLookup.submitBtn') }}</v-btn>
      </v-form>
    </div>

    <!-- 조회 결과 -->
    <div v-else class="lookup-card">
      <button class="back-link" @click="reset">
        <v-icon size="16">mdi-arrow-left</v-icon>
        {{ t('orderLookup.backBtn') }}
      </button>

      <div class="order-header">
        <div>
          <span class="order-no">{{ order.order_no }}</span>
          <span class="order-date">{{ formatDate(order.created_at) }}</span>
        </div>
        <span class="order-status-chip">{{ statusLabel(order.status) }}</span>
      </div>

      <p class="order-section-label">{{ t('mypage.sectionItems') }}</p>
      <div class="order-items">
        <div v-for="(item, i) in order.items" :key="i" class="order-item">
          <img :src="item.image" :alt="item.name" class="order-item-img" />
          <div class="order-item-info">
            <p class="order-item-name">{{ item.name }}</p>
            <p class="order-item-detail">
              {{ item.size ? `${t('detail.sizeLabel')}: ${item.size}` : '' }}
              {{ item.quantity ? `/ ${t('mypage.quantityLabel')}: ${item.quantity}` : '' }}
            </p>
            <p class="order-item-price">₩{{ Number(item.price).toLocaleString() }}</p>
          </div>
        </div>
      </div>

      <p class="order-section-label">{{ t('mypage.sectionPayment') }}</p>
      <div class="order-payment">
        <div class="order-payment-row order-payment-total">
          <span>{{ t('mypage.orderTotalLabel') }}</span>
          <span>₩{{ Number(order.total).toLocaleString() }}</span>
        </div>
      </div>

      <template v-if="order.shippingAddress?.address">
        <p class="order-section-label">{{ t('mypage.sectionShipping') }}</p>
        <div class="order-shipping">
          <v-icon size="14" color="#999" class="mr-1">mdi-map-marker-outline</v-icon>
          <span class="order-shipping-text">
            {{ order.shippingAddress.name }}
            <span v-if="order.shippingAddress.phone">· {{ order.shippingAddress.phone }}</span>
            · {{ order.shippingAddress.address }} {{ order.shippingAddress.addressDetail }}
          </span>
        </div>
      </template>

      <div class="order-footer">
        <router-link to="/contact" class="order-action-btn">{{ t('mypage.contactBtn') }}</router-link>
      </div>
    </div>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';

const { t } = useI18n();

const orderNo = ref('');
const password = ref('');
const loading = ref(false);
const errorMsg = ref('');
const order = ref(null);

async function lookup() {
  errorMsg.value = '';
  if (!orderNo.value.trim() || !password.value) {
    errorMsg.value = t('orderLookup.errorEmpty');
    return;
  }
  loading.value = true;
  try {
    const { data } = await axios.post('/api/orders/guest-lookup', {
      orderNo: orderNo.value.trim(),
      password: password.value
    });
    order.value = data;
  } catch (e) {
    errorMsg.value = e.response?.data?.error || t('orderLookup.errorFailed');
  } finally {
    loading.value = false;
  }
}

function reset() {
  order.value = null;
  password.value = '';
  errorMsg.value = '';
}

function formatDate(d) {
  if (!d) return '';
  const date = new Date(d);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

function statusLabel(s) {
  const map = {
    paid: t('mypage.statusPaid'),
    confirmed: t('mypage.statusConfirmed'),
    processing: t('mypage.statusProcessing'),
    shipped: t('mypage.statusShipped'),
    delivered: t('mypage.statusDelivered'),
    cancelled: t('mypage.statusCancelled')
  };
  return map[s] || s;
}
</script>

<style scoped>
.lookup-wrap { max-width: 520px; margin: 0 auto; }
.lookup-card { background: #fff; }
.lookup-desc { font-size: 13px; color: #888; margin: 0 0 20px; line-height: 1.6; }

.back-link {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  font-size: 12.5px;
  font-weight: 600;
  color: #888;
  cursor: pointer;
  padding: 0;
  margin-bottom: 20px;
}
.back-link:hover { color: #111; }

.field-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #555;
  margin-bottom: 6px;
  letter-spacing: -0.2px;
}
:deep(.v-field) { border-radius: 4px !important; font-size: 14px; }
:deep(.v-field__outline__start),
:deep(.v-field__outline__end) { border-color: #e0e0e0 !important; }
:deep(.v-field__outline__notch) { display: none !important; }
:deep(.v-field__outline__start) { border-right: 0 !important; }
:deep(.v-field__outline__end) { border-left: 0 !important; }
:deep(.v-field--variant-outlined .v-field__outline) { --v-field-border-width: 1px; }
:deep(.v-field--variant-outlined .v-field__outline__start),
:deep(.v-field--variant-outlined .v-field__outline__end) {
  border-top: 1px solid #e0e0e0 !important;
  border-bottom: 1px solid #e0e0e0 !important;
}
:deep(.v-field--focused .v-field__outline__start),
:deep(.v-field--focused .v-field__outline__end) {
  border-color: #111 !important;
  border-top-color: #111 !important;
  border-bottom-color: #111 !important;
  border-width: 1.5px !important;
}

.order-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #111; }
.order-no { font-weight: 600; font-size: 14px; letter-spacing: 0.5px; }
.order-date { color: #999; font-size: 13px; margin-left: 12px; }
.order-status-chip { font-size: 11px; font-weight: 700; color: #111; border: 1px solid #111; padding: 4px 9px; border-radius: 2px; }

.order-section-label {
  font-size: 11px;
  font-weight: 700;
  color: #999;
  letter-spacing: 0.04em;
  margin: 20px 0 10px;
  padding-top: 16px;
  border-top: 1px dashed #eee;
}
.order-section-label:first-of-type { margin-top: 0; padding-top: 0; border-top: none; }

.order-items { display: flex; flex-direction: column; gap: 12px; }
.order-item { display: flex; gap: 12px; align-items: center; }
.order-item-img { width: 60px; height: 60px; object-fit: cover; border: 1px solid #eee; }
.order-item-info { flex: 1; }
.order-item-name { font-size: 14px; font-weight: 500; margin: 0; }
.order-item-detail { font-size: 12px; color: #999; margin: 2px 0; }
.order-item-price { font-size: 13px; font-weight: 600; margin: 0; }

.order-payment { display: flex; flex-direction: column; gap: 6px; }
.order-payment-row { display: flex; justify-content: space-between; font-size: 13px; color: #666; }
.order-payment-total { font-size: 14px; font-weight: 700; color: #111; }

.order-shipping { display: flex; align-items: flex-start; gap: 4px; }
.order-shipping-text { font-size: 12px; color: #888; line-height: 1.5; }

.order-footer { display: flex; justify-content: flex-end; margin-top: 20px; padding-top: 14px; border-top: 1px solid #eee; }
.order-action-btn {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
  padding: 7px 12px;
  border: 1px solid #111;
  color: #111;
  text-decoration: none;
}
.order-action-btn:hover { background: #111; color: #fff; }
</style>
