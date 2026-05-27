<template>
  <div class="checkout-page">
    <v-container style="max-width:1180px" class="py-10">
      <!-- 상단 헤더 -->
      <div class="checkout-header">
        <h1 class="checkout-title">결제</h1>
        <p class="checkout-subtitle">CHECKOUT</p>
        <div class="checkout-steps">
          <div class="step done">
            <span class="step-num">1</span>
            <span>장바구니</span>
          </div>
          <div class="step-divider"></div>
          <div class="step active">
            <span class="step-num">2</span>
            <span>주문/결제</span>
          </div>
          <div class="step-divider"></div>
          <div class="step">
            <span class="step-num">3</span>
            <span>완료</span>
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
              <h2 class="section-heading">배송지 정보</h2>
            </div>

            <v-row dense>
              <v-col cols="12" sm="6">
                <label class="field-label">받는 사람 <span class="required">*</span></label>
                <v-text-field
                  v-model="form.name"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  placeholder="이름을 입력하세요"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <label class="field-label">전화번호 <span class="required">*</span></label>
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

              <v-col cols="12" sm="4" class="mt-3">
                <label class="field-label">우편번호</label>
                <v-text-field
                  v-model="form.zip"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  placeholder="우편번호"
                  readonly
                  @click="searchAddress"
                  style="cursor:pointer"
                />
              </v-col>
              <v-col cols="12" sm="8" class="mt-3 d-flex align-end">
                <button class="addr-search-btn" @click="searchAddress">
                  <v-icon size="18">mdi-magnify</v-icon>
                  주소 검색
                </button>
              </v-col>

              <v-col cols="12" class="mt-3">
                <label class="field-label">주소</label>
                <v-text-field
                  v-model="form.address"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  readonly
                  placeholder="주소 검색 버튼을 클릭하세요"
                />
              </v-col>
              <v-col cols="12" class="mt-3">
                <label class="field-label">상세주소</label>
                <v-text-field
                  v-model="form.addressDetail"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  placeholder="동/호수, 건물명 등"
                />
              </v-col>

              <v-col cols="12" class="mt-3">
                <label class="field-label">배송 메모 <span class="optional">(선택)</span></label>
                <v-select
                  v-model="form.memo"
                  :items="memoOptions"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  placeholder="배송 메모를 선택하세요"
                />
              </v-col>
            </v-row>
          </div>

          <!-- 결제 수단 -->
          <div class="section-card mt-4">
            <div class="section-head">
              <v-icon size="20" color="#111">mdi-credit-card-outline</v-icon>
              <h2 class="section-heading">결제 수단</h2>
            </div>

            <div class="pay-methods">
              <button
                v-for="method in payMethods"
                :key="method.key"
                class="pay-method-btn"
                :class="{ active: selectedMethod === method.key }"
                @click="selectedMethod = method.key"
              >
                <div class="pay-method-inner">
                  <img v-if="method.icon" :src="method.icon" :alt="method.label" class="pay-icon" />
                  <v-icon v-else size="26" class="pay-method-icon">{{ method.mdi }}</v-icon>
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
              <h2 class="summary-title">주문 내역</h2>
              <span class="summary-count">{{ cartStore.items.length }}개 상품</span>
            </div>

            <div class="summary-items">
              <div v-for="item in cartStore.items" :key="item.id + (item.size || '')" class="summary-item">
                <div class="summary-img-wrap">
                  <img :src="item.image" :alt="item.name" class="summary-img" />
                  <span class="summary-qty">{{ item.quantity || item.qty }}</span>
                </div>
                <div class="summary-info">
                  <p class="summary-name">{{ item.name }}</p>
                  <p v-if="item.size" class="summary-size">사이즈: {{ item.size }}</p>
                </div>
                <p class="summary-price">₩{{ (item.price * (item.quantity || item.qty || 1)).toLocaleString() }}</p>
              </div>
            </div>

            <div class="summary-divider"></div>

            <div class="summary-row">
              <span>상품금액</span>
              <span>₩{{ cartStore.total.toLocaleString() }}</span>
            </div>
            <div class="summary-row">
              <span>배송비</span>
              <span class="summary-free">무료</span>
            </div>

            <div class="summary-divider"></div>

            <div class="summary-total">
              <span>총 결제금액</span>
              <span class="total-amount">₩{{ cartStore.total.toLocaleString() }}</span>
            </div>

            <button
              class="checkout-btn"
              :disabled="cartStore.items.length === 0 || loading"
              @click="processPayment"
            >
              <span v-if="loading" class="loading-spinner"></span>
              <template v-else>
                <span>{{ cartStore.total.toLocaleString() }}원 결제하기</span>
                <v-icon size="18" class="ml-1">mdi-arrow-right</v-icon>
              </template>
            </button>

            <div class="summary-secure">
              <v-icon size="14" color="#888">mdi-lock</v-icon>
              <span>안전한 SSL 암호화 결제</span>
            </div>
          </div>
        </v-col>
      </v-row>

      <!-- 주소 검색 팝업 -->
      <div v-if="showPostcode" class="postcode-overlay" @click.self="showPostcode = false">
        <div class="postcode-modal">
          <div class="postcode-header">
            <span>주소 검색</span>
            <button class="postcode-close" @click="showPostcode = false">✕</button>
          </div>
          <div id="daum-postcode-layer"></div>
        </div>
      </div>
    </v-container>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useCartStore } from '../stores/cart';
import { useAuthStore } from '../stores/auth';

const cartStore = useCartStore();
const authStore = useAuthStore();
const router = useRouter();
const error = ref('');
const loading = ref(false);

const form = ref({
  name: authStore.user?.name || '',
  phone: '',
  zip: '',
  address: '',
  addressDetail: '',
  memo: ''
});
const showPostcode = ref(false);
const selectedMethod = ref('card');

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
const payMethods = [
  { key: 'card',      label: '신용/체크카드', mdi: 'mdi-credit-card-outline' },
  { key: 'kakaopay',  label: '카카오페이',    icon: 'https://developers.kakao.com/static/images/pc/product/icon/kakao_pay.png' },
  { key: 'naverpay',  label: '네이버페이',    icon: 'https://pay.naver.com/img/etc/naver_pay_logo.png' },
  { key: 'tosspay',   label: '토스페이',      icon: 'https://static.toss.im/icons/png/4x/icon-toss-logo.png' },
];

// 배송 메모 옵션
const memoOptions = [
  '문 앞에 놓아주세요',
  '경비실에 맡겨주세요',
  '택배함에 넣어주세요',
  '배송 전 연락 부탁드립니다',
  '부재시 문 앞에 놓아주세요'
];

const payDesc = computed(() => {
  switch (selectedMethod.value) {
    case 'card': return '카드사 결제창이 열리며, 카드 정보를 안전하게 입력할 수 있습니다.';
    case 'kakaopay': return '카카오페이 앱에서 간편하게 결제할 수 있습니다.';
    case 'naverpay': return '네이버페이로 빠르고 편리하게 결제할 수 있습니다.';
    case 'tosspay': return '토스 앱에서 간편하게 결제할 수 있습니다.';
    default: return '';
  }
});

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

  if (!form.value.name) { error.value = '이름을 입력해주세요'; return; }
  if (!form.value.phone || form.value.phone.replace(/\D/g, '').length < 10) { error.value = '올바른 전화번호를 입력해주세요'; return; }
  if (!form.value.address) { error.value = '주소를 검색해주세요'; return; }
  if (cartStore.items.length === 0) { error.value = '장바구니가 비어있습니다'; return; }

  loading.value = true;

  try {
    const { data } = await axios.post('/api/payment/mainpay/ready', {
      items: cartStore.items.map(i => ({
        id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity || i.qty,
        size: i.size,
        image: i.image
      })),
      amount: cartStore.total,
      shippingAddress: form.value,
      paymethod: 'CARD'
    });

    if (!data?.nextPcUrl) {
      error.value = '결제창을 호출할 수 없습니다';
      loading.value = false;
      return;
    }

    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile && data.nextMobileUrl) {
      cartStore.clearCart();
      window.location.href = data.nextMobileUrl;
      return;
    }

    const popup = window.open(data.nextPcUrl, 'mainpay_popup',
      'width=600,height=750,scrollbars=yes,resizable=yes');

    if (!popup) {
      error.value = '팝업이 차단되었습니다. 팝업 차단을 해제하고 다시 시도해주세요';
      loading.value = false;
      return;
    }

    cartStore.clearCart();

    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        loading.value = false;
      }
    }, 500);
  } catch (e) {
    error.value = e.response?.data?.error || '결제 처리에 실패했습니다';
    loading.value = false;
  }
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

:deep(.v-field) {
  border-radius: 8px !important;
  font-size: 14px;
}
:deep(.v-field__outline__start),
:deep(.v-field__outline__end),
:deep(.v-field__outline__notch::before),
:deep(.v-field__outline__notch::after) {
  border-color: #e0e0e0 !important;
}
:deep(.v-field--focused .v-field__outline__start),
:deep(.v-field--focused .v-field__outline__end),
:deep(.v-field--focused .v-field__outline__notch::before),
:deep(.v-field--focused .v-field__outline__notch::after) {
  border-color: #111 !important;
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
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}
@media (max-width: 600px) {
  .pay-methods { grid-template-columns: repeat(2, 1fr); }
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
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pay-icon {
  height: 24px;
  width: auto;
  object-fit: contain;
}
.pay-method-icon { color: #777; }
.pay-method-btn.active .pay-method-icon { color: #111; }
.pay-method-label {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  letter-spacing: -0.2px;
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
