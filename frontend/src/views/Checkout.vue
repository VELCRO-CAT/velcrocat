<template>
  <div class="checkout-page">
    <v-container style="max-width:1180px" class="py-10">
      <!-- 상단 헤더 -->
      <div class="checkout-header">
        <h1 class="checkout-title">{{ t('checkout.title') }}</h1>
        <p class="checkout-subtitle">CHECKOUT</p>
        <div class="checkout-steps">
          <div class="step done">
            <span class="step-num">1</span>
            <span>{{ t('checkout.step1') }}</span>
          </div>
          <div class="step-divider"></div>
          <div class="step active">
            <span class="step-num">2</span>
            <span>{{ t('checkout.step2') }}</span>
          </div>
          <div class="step-divider"></div>
          <div class="step">
            <span class="step-num">3</span>
            <span>{{ t('checkout.step3') }}</span>
          </div>
        </div>
      </div>

      <v-row>
        <!-- 왼쪽: 입력 폼 -->
        <v-col cols="12" md="8">
          <!-- 배송지 -->
          <div class="section-card">
            <div class="section-head">
              <v-icon size="20" color="#111">mdi-truck-fast-outline</v-icon>
              <h2 class="section-heading">{{ t('checkout.shippingTitle') }}</h2>
            </div>

            <!-- 저장된 배송지 선택 -->
            <div v-if="addresses.length > 0" class="saved-addr-picker">
              <p class="field-label mb-2">{{ t('checkout.savedAddressLabel') }}</p>
              <div class="saved-addr-list">
                <button
                  v-for="a in addresses"
                  :key="a.id"
                  type="button"
                  class="saved-addr-card"
                  :class="{ active: selectedAddressId === a.id }"
                  @click="selectSavedAddress(a.id)"
                >
                  <span v-if="a.is_default" class="saved-addr-badge">{{ t('checkout.savedAddressDefaultBadge') }}</span>
                  <span class="saved-addr-recipient">{{ a.recipient }}</span>
                  <span class="saved-addr-line">{{ a.address }}</span>
                </button>
                <button
                  type="button"
                  class="saved-addr-card saved-addr-card-new"
                  :class="{ active: selectedAddressId === 'new' }"
                  @click="selectSavedAddress('new')"
                >
                  <v-icon size="16">mdi-plus</v-icon>
                  {{ t('checkout.savedAddressNewBtn') }}
                </button>
              </div>
            </div>

            <v-row dense>
              <v-col cols="12" sm="6">
                <label class="field-label">{{ t('checkout.nameLabel') }} <span class="required">*</span></label>
                <v-text-field
                  v-model="form.name"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  :placeholder="t('checkout.namePlaceholder')"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <label class="field-label">{{ t('checkout.phoneLabel') }} <span class="required">*</span></label>
                <v-text-field
                  v-model="form.phone"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  placeholder="010-0000-0000"
                  maxlength="13"
                  @input="onPhoneInput"
                />
              </v-col>

              <v-col cols="12" class="mt-3">
                <label class="field-label">{{ t('checkout.emailLabel') }} <span class="required">*</span></label>
                <v-text-field
                  v-model="form.email"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  type="email"
                  :placeholder="t('checkout.emailPlaceholder')"
                />
              </v-col>

              <v-col cols="12" sm="4" class="mt-3">
                <label class="field-label">{{ t('checkout.zipLabel') }}</label>
                <v-text-field
                  v-model="form.zip"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  :placeholder="t('checkout.zipPlaceholder')"
                  readonly
                  @click="searchAddress"
                  style="cursor:pointer"
                />
              </v-col>
              <v-col cols="12" sm="8" class="mt-3 d-flex align-end">
                <button class="addr-search-btn" @click="searchAddress">
                  <v-icon size="18">mdi-magnify</v-icon>
                  {{ t('checkout.addressSearchBtn') }}
                </button>
              </v-col>

              <v-col cols="12" class="mt-3">
                <label class="field-label">{{ t('checkout.addressLabel') }} <span class="required">*</span></label>
                <v-text-field
                  v-model="form.address"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  readonly
                  :placeholder="t('checkout.addressPlaceholder')"
                />
              </v-col>
              <v-col cols="12" class="mt-3">
                <label class="field-label">{{ t('checkout.addressDetailLabel') }} <span class="required">*</span></label>
                <v-text-field
                  v-model="form.addressDetail"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  :placeholder="t('checkout.addressDetailPlaceholder')"
                />
              </v-col>

              <v-col cols="12" class="mt-3">
                <label class="field-label">{{ t('checkout.memoLabel') }} <span class="optional">{{ t('checkout.memoOptional') }}</span></label>
                <v-select
                  v-model="form.memo"
                  :items="memoOptions"
                  item-title="title"
                  item-value="value"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  :placeholder="t('checkout.memoPlaceholder')"
                />
              </v-col>

              <v-col v-if="selectedAddressId === 'new'" cols="12" class="mt-3">
                <v-checkbox
                  v-model="saveAsDefaultAddress"
                  :label="t('checkout.saveAsDefaultLabel')"
                  density="compact"
                  hide-details
                  color="#111"
                />
              </v-col>
            </v-row>
          </div>

          <!-- 결제 수단 -->
          <div class="section-card mt-4">
            <div class="section-head">
              <v-icon size="20" color="#111">mdi-credit-card-outline</v-icon>
              <h2 class="section-heading">{{ t('checkout.paymentTitle') }}</h2>
            </div>

            <div class="pay-methods">
              <button
                v-for="method in payMethods"
                :key="method.key"
                class="pay-method-btn"
                :class="{ active: selectedMethod === method.key, ['pay-' + method.key]: true }"
                @click="selectedMethod = method.key"
              >
                <div class="pay-method-inner">
                  <v-icon size="28" class="pay-method-icon">{{ method.mdi }}</v-icon>
                </div>
                <span class="pay-method-label">{{ method.label }}</span>
                <span v-if="selectedMethod === method.key" class="pay-check">
                  <v-icon size="14" color="#fff">mdi-check</v-icon>
                </span>
              </button>
            </div>

            <div class="pay-info">
              <v-icon size="16" color="#888" class="mr-1">mdi-shield-check-outline</v-icon>
              {{ payDesc }}
            </div>

            <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-3" border="start">{{ error }}</v-alert>
          </div>
        </v-col>

        <!-- 오른쪽: 주문 요약 -->
        <v-col cols="12" md="4">
          <div class="summary-card">
            <div class="summary-head">
              <h2 class="summary-title">{{ t('checkout.orderTitle') }}</h2>
              <span class="summary-count">{{ t('checkout.orderCount', { count: cartStore.items.length }) }}</span>
            </div>

            <div class="summary-items">
              <div v-for="item in cartStore.items" :key="item.id + '_' + (item.color || '') + '_' + (item.size || '')" class="summary-item">
                <div class="summary-img-wrap">
                  <img :src="item.image" :alt="lf(item, 'name')" class="summary-img" />
                  <span class="summary-qty">{{ item.quantity || item.qty }}</span>
                </div>
                <div class="summary-info">
                  <p class="summary-name">{{ lf(item, 'name') }}</p>
                  <p v-if="item.color || item.size" class="summary-size">
                    <span v-if="item.color">{{ t('detail.colorLabel') }}: {{ colorName(item.color) }}</span>
                    <span v-if="item.color && item.size"> · </span>
                    <span v-if="item.size">{{ t('detail.sizeLabel') }}: {{ item.size }}</span>
                  </p>
                </div>
                <p class="summary-price">₩{{ (item.price * (item.quantity || item.qty || 1)).toLocaleString() }}</p>
              </div>
            </div>

            <div class="summary-divider"></div>

            <div class="summary-row">
              <span>{{ t('checkout.productAmount') }}</span>
              <span>₩{{ cartStore.total.toLocaleString() }}</span>
            </div>
            <div class="summary-row">
              <span>{{ t('cart.shipping') }}</span>
              <span class="summary-free">{{ t('cart.free') }}</span>
            </div>

            <div class="summary-divider"></div>

            <div class="summary-total">
              <span>{{ t('checkout.totalPay') }}</span>
              <span class="total-amount">₩{{ cartStore.total.toLocaleString() }}</span>
            </div>

            <button
              class="checkout-btn"
              :disabled="cartStore.items.length === 0 || loading"
              @click="processPayment"
            >
              <span v-if="loading" class="loading-spinner"></span>
              <template v-else>
                <span>{{ t('checkout.payBtn', { amount: cartStore.total.toLocaleString() }) }}</span>
                <v-icon size="18" class="ml-1">mdi-arrow-right</v-icon>
              </template>
            </button>

            <div class="summary-secure">
              <v-icon size="14" color="#888">mdi-lock</v-icon>
              <span>{{ t('checkout.secureText') }}</span>
            </div>
          </div>
        </v-col>
      </v-row>

      <!-- 주소 검색 팝업 -->
      <div v-if="showPostcode" class="postcode-overlay" @click.self="showPostcode = false">
        <div class="postcode-modal">
          <div class="postcode-header">
            <span>{{ t('checkout.addressSearchBtn') }}</span>
            <button class="postcode-close" @click="showPostcode = false">✕</button>
          </div>
          <div id="daum-postcode-layer"></div>
        </div>
      </div>
    </v-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import { useCartStore } from '../stores/cart';
import { useAuthStore } from '../stores/auth';
import { useLocalized } from '../composables/useLocalized';

const { t } = useI18n();
const { lf, colorName } = useLocalized();
const cartStore = useCartStore();
const authStore = useAuthStore();
const router = useRouter();
const error = ref('');
const loading = ref(false);

const form = ref({
  name: authStore.user?.name || '',
  phone: '',
  email: authStore.user?.email || '',
  zip: '',
  address: '',
  addressDetail: '',
  memo: '문 앞에 놓아주세요'
});
const showPostcode = ref(false);
const selectedMethod = ref('card');
const addresses = ref([]);
const selectedAddressId = ref('new');
const saveAsDefaultAddress = ref(true);

// 마이페이지에 저장해 둔 배송지 목록을 불러와 선택할 수 있게 하고, 기본 배송지는 자동으로 채워준다
onMounted(async () => {
  try {
    const { data } = await axios.get('/api/addresses');
    const list = Array.isArray(data) ? data : [];
    addresses.value = list;
    const def = list.find(a => a.is_default) || list[0];
    if (def) {
      selectedAddressId.value = def.id;
      fillFormFromAddress(def);
    }
  } catch {}
});

function fillFormFromAddress(a) {
  form.value.name = a.recipient || form.value.name;
  form.value.phone = a.phone || form.value.phone;
  form.value.zip = a.zip || '';
  form.value.address = a.address || '';
  form.value.addressDetail = a.address_detail || '';
  form.value.memo = a.memo || form.value.memo;
}

// 저장된 배송지 카드를 고르면 그 주소로 채우고, "새 배송지 입력"을 고르면 직접 입력할 수 있게 비운다
function selectSavedAddress(id) {
  selectedAddressId.value = id;
  if (id === 'new') {
    form.value.phone = '';
    form.value.zip = '';
    form.value.address = '';
    form.value.addressDetail = '';
    form.value.memo = '문 앞에 놓아주세요';
    return;
  }
  const a = addresses.value.find(x => x.id === id);
  if (a) fillFormFromAddress(a);
}

// 전화번호 자동 포맷팅
function formatPhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}
function onPhoneInput() {
  form.value.phone = formatPhone(form.value.phone);
}

// 결제 수단 목록
const payMethods = computed(() => [
  { key: 'card', label: t('checkout.paymentCard'), mdi: 'mdi-credit-card-outline' }
]);

// 배송 메모 옵션 (value는 관리자 화면 호환을 위해 항상 한국어로 전송)
const memoOptions = computed(() => [
  { title: t('checkout.memo1'), value: '문 앞에 놓아주세요' },
  { title: t('checkout.memo2'), value: '경비실에 맡겨주세요' },
  { title: t('checkout.memo3'), value: '택배함에 넣어주세요' },
  { title: t('checkout.memo4'), value: '배송 전 연락 부탁드립니다' },
  { title: t('checkout.memo5'), value: '부재시 문 앞에 놓아주세요' }
]);

const payDesc = computed(() => t('checkout.paymentDesc'));

// 주소 검색
function searchAddress() {
  showPostcode.value = true;
  setTimeout(() => {
    new window.daum.Postcode({
      oncomplete(data) {
        form.value.zip = data.zonecode;
        form.value.address = data.roadAddress || data.jibunAddress;
        showPostcode.value = false;
      }
    }).embed(document.getElementById('daum-postcode-layer'));
  }, 100);
}

// MainPay 결제
async function processPayment() {
  error.value = '';

  if (!form.value.name) { error.value = t('checkout.errorName'); return; }
  if (!form.value.phone || form.value.phone.replace(/\D/g, '').length < 10) { error.value = t('checkout.errorPhone'); return; }
  if (!form.value.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) { error.value = t('checkout.errorEmail'); return; }
  if (!form.value.address) { error.value = t('checkout.errorAddress'); return; }
  if (!form.value.addressDetail?.trim()) { error.value = t('checkout.errorAddressDetail'); return; }
  if (cartStore.items.length === 0) { error.value = t('checkout.errorEmptyCart'); return; }

  // 새 배송지를 직접 입력했고 저장하기로 체크했다면, 결제 진행과 별개로 기본 배송지로 저장
  if (selectedAddressId.value === 'new' && saveAsDefaultAddress.value) {
    try {
      await axios.post('/api/addresses', {
        recipient: form.value.name,
        phone: form.value.phone,
        zip: form.value.zip,
        address: form.value.address,
        addressDetail: form.value.addressDetail,
        memo: form.value.memo,
        isDefault: true
      });
    } catch {
      // 주소 저장에 실패해도 결제 진행은 막지 않는다
    }
  }

  loading.value = true;

  try {
    const { data } = await axios.post('/api/payment/mainpay/ready', {
      items: cartStore.items.map(i => ({
        id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity || i.qty,
        color: i.color,
        size: i.size,
        image: i.image
      })),
      amount: cartStore.total,
      shippingAddress: form.value,
      paymethod: 'CARD'
    });

    if (!data?.nextPcUrl) {
      error.value = t('checkout.errorNoPayUrl');
      loading.value = false;
      // 결제창을 열지도 못했으므로 방금 생성된 pending 주문을 정리한다
      if (data?.orderNo) abandonOrder(data.orderNo);
      return;
    }

    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile && data.nextMobileUrl) {
      // 모바일은 결제사 페이지로 완전히 이동하므로 페이지 상태가 사라짐 — 부득이 여기서 비운다.
      // 실제 결제 완료 여부는 결제사가 돌아오는 /order-complete 화면에서 다시 확인한다.
      cartStore.clearCart();
      window.location.href = data.nextMobileUrl;
      return;
    }

    const popup = window.open(data.nextPcUrl, 'mainpay_popup',
      'width=600,height=750,scrollbars=yes,resizable=yes');

    if (!popup) {
      error.value = t('checkout.errorPopupBlocked');
      loading.value = false;
      // 결제창을 열지도 못했으므로 방금 생성된 pending 주문을 정리한다
      abandonOrder(data.orderNo);
      return;
    }

    // 장바구니는 여기서 비우지 않는다 — 실제 결제 완료가 확인된 뒤(/order-complete)에만 비운다.
    // 결제창이 닫히면 곧바로 완료 확인 화면으로 이동해서, 그 화면이 실제 결제 여부를 직접 확인·표시한다.
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        router.push(`/order-complete?orderNo=${encodeURIComponent(data.orderNo)}`);
      }
    }, 500);
  } catch (e) {
    error.value = e.response?.data?.error || t('checkout.errorPaymentFailed');
    loading.value = false;
  }
}

// 결제 시도가 실제로 이루어지지 않은 채 끝난 경우, 남아있는 pending 주문을 정리 (실패해도 무방)
function abandonOrder(orderNo) {
  if (!orderNo) return;
  axios.post('/api/payment/mainpay/abandon', { orderNo }).catch(() => {});
}
</script>

<style scoped>
.checkout-page {
  background: #fafafa;
  min-height: 100vh;
}

/* 상단 헤더 */
.checkout-header {
  margin-bottom: 32px;
  text-align: center;
}
.checkout-title {
  font-size: 28px;
  font-weight: 800;
  color: #111;
  letter-spacing: -0.5px;
  margin: 0;
}
.checkout-subtitle {
  font-size: 11px;
  color: #999;
  letter-spacing: 6px;
  margin: 4px 0 24px;
  font-weight: 600;
}
.checkout-steps {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
}
.step {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #bbb;
  font-weight: 600;
}
.step-num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #eee;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}
.step.done .step-num { background: #111; color: #fff; }
.step.done { color: #111; }
.step.active .step-num { background: #111; color: #fff; }
.step.active { color: #111; }
.step-divider {
  width: 40px;
  height: 1px;
  background: #ddd;
}

/* 섹션 카드 */
.section-card {
  background: #fff;
  border-radius: 12px;
  padding: 28px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.section-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}
.section-heading {
  font-size: 16px;
  font-weight: 700;
  color: #111;
  letter-spacing: -0.3px;
  margin: 0;
}

/* 필드 */
.field-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #555;
  margin-bottom: 6px;
  letter-spacing: -0.2px;
}
.required { color: #e53e3e; margin-left: 2px; }
.optional { color: #999; font-weight: 400; font-size: 11px; margin-left: 2px; }

/* 저장된 배송지 선택 */
.saved-addr-picker { margin-bottom: 20px; }
.saved-addr-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 8px;
}
.saved-addr-card {
  text-align: left;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fff;
  padding: 12px 14px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 3px;
  transition: border-color 0.15s;
}
.saved-addr-card:hover { border-color: #999; }
.saved-addr-card.active { border-color: #111; border-width: 1.5px; }
.saved-addr-badge {
  align-self: flex-start;
  font-size: 10px;
  font-weight: 700;
  color: #fff;
  background: #111;
  padding: 2px 7px;
  border-radius: 2px;
  margin-bottom: 2px;
}
.saved-addr-recipient { font-size: 13px; font-weight: 600; color: #111; }
.saved-addr-line {
  font-size: 11.5px;
  color: #888;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.saved-addr-card-new {
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #666;
  font-size: 13px;
  font-weight: 600;
  border-style: dashed;
}
.saved-addr-card-new:hover { color: #111; }

:deep(.v-field) {
  border-radius: 8px !important;
  font-size: 14px;
}
:deep(.v-field__outline__start),
:deep(.v-field__outline__end) {
  border-color: #e0e0e0 !important;
}
/* notch(라벨 자리) 완전 숨김 - 라벨을 위에 별도로 두기 때문 */
:deep(.v-field__outline__notch) {
  display: none !important;
}
:deep(.v-field__outline__start) {
  border-right: 0 !important;
}
:deep(.v-field__outline__end) {
  border-left: 0 !important;
}
:deep(.v-field--variant-outlined .v-field__outline) {
  --v-field-border-width: 1px;
}
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

/* 주소 검색 버튼 */
.addr-search-btn {
  width: 100%;
  height: 44px;
  background: #111;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: background 0.2s;
}
.addr-search-btn:hover { background: #333; }

/* 결제 수단 */
.pay-methods {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin-bottom: 16px;
}
.pay-method-btn {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 18px 8px;
  border: 1.5px solid #e8e8e8;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 10px;
}
.pay-method-btn:hover {
  border-color: #ccc;
  background: #fafafa;
}
.pay-method-btn.active {
  border-color: #111;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.pay-method-inner {
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pay-logo {
  height: 28px;
  width: auto;
  max-width: 100%;
  object-fit: contain;
}
.pay-method-icon { color: #777; }
.pay-method-btn.active .pay-method-icon { color: #111; }
.pay-method-label {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  letter-spacing: -0.2px;
  margin-top: 2px;
}
.pay-method-btn.active .pay-method-label { color: #111; }
.pay-check {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #111;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pay-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12.5px;
  color: #777;
  padding: 12px 14px;
  background: #f8f8f8;
  border-radius: 8px;
}

/* 주문 요약 */
.summary-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  position: sticky;
  top: 90px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.summary-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 18px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}
.summary-title {
  font-size: 15px;
  font-weight: 700;
  color: #111;
  margin: 0;
  letter-spacing: -0.3px;
}
.summary-count {
  font-size: 12px;
  color: #999;
  font-weight: 500;
}

.summary-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 280px;
  overflow-y: auto;
  margin: 0 -4px;
  padding: 0 4px;
}
.summary-items::-webkit-scrollbar { width: 4px; }
.summary-items::-webkit-scrollbar-thumb { background: #ddd; border-radius: 2px; }

.summary-item {
  display: flex;
  align-items: center;
  gap: 12px;
}
.summary-img-wrap {
  position: relative;
  flex-shrink: 0;
}
.summary-img {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  object-fit: cover;
  background: #f5f5f5;
  border: 1px solid #f0f0f0;
}
.summary-qty {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #111;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.summary-info { flex: 1; min-width: 0; }
.summary-name {
  font-size: 12.5px;
  font-weight: 500;
  color: #222;
  margin: 0 0 2px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: keep-all;
}
.summary-size {
  font-size: 11px;
  color: #999;
  margin: 0;
}
.summary-price {
  font-size: 12.5px;
  font-weight: 700;
  color: #111;
  margin: 0;
  white-space: nowrap;
}

.summary-divider {
  height: 1px;
  background: #f0f0f0;
  margin: 16px 0;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #555;
  margin-bottom: 8px;
}
.summary-free { color: #2a9d5c; font-weight: 600; }

.summary-total {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 18px;
}
.summary-total > span:first-child {
  font-size: 14px;
  font-weight: 600;
  color: #555;
}
.total-amount {
  font-size: 22px;
  font-weight: 800;
  color: #111;
  letter-spacing: -0.5px;
}

/* 결제 버튼 */
.checkout-btn {
  width: 100%;
  height: 54px;
  background: #111;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.2px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.checkout-btn:hover:not(:disabled) {
  background: #000;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.15);
}
.checkout-btn:disabled {
  background: #ddd;
  cursor: not-allowed;
}
.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.summary-secure {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 12px;
  font-size: 11px;
  color: #999;
  font-weight: 500;
}

/* 주소 팝업 */
.postcode-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}
.postcode-modal {
  background: #fff;
  width: 500px;
  max-width: 92vw;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.25);
}
.postcode-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #111;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
}
.postcode-close {
  background: none;
  border: none;
  font-size: 20px;
  color: #fff;
  cursor: pointer;
}

@media (max-width: 600px) {
  .section-card { padding: 20px; border-radius: 8px; }
  .summary-card { padding: 20px; border-radius: 8px; position: static; }
  .checkout-title { font-size: 24px; }
  .checkout-steps { gap: 6px; }
  .step-divider { width: 24px; }
  .step span:not(.step-num) { font-size: 11px; }
}
</style>
