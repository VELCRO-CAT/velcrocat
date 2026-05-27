<template>
  <v-container style="max-width:1100px" class="py-8">
    <h1 class="text-h5 font-weight-bold mb-6">
      결제 <span class="text-caption text-grey ml-2" style="letter-spacing:3px">CHECKOUT</span>
    </h1>

    <v-row>
      <!-- 왼쪽: 입력 폼 -->
      <v-col cols="12" md="8">
        <!-- 배송지 -->
        <v-card variant="outlined" class="mb-4 pa-5">
          <h2 class="section-heading">배송지 정보</h2>
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field v-model="form.name" label="이름 *" variant="outlined" density="compact" :placeholder="authStore.user?.name" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model="form.phone" label="전화번호 *" variant="outlined" density="compact" placeholder="010-0000-0000" />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field
                v-model="form.zip"
                label="우편번호"
                variant="outlined"
                density="compact"
                placeholder="클릭하여 검색"
                readonly
                @click="searchAddress"
                append-inner-icon="mdi-magnify"
                style="cursor:pointer"
              />
            </v-col>
            <v-col cols="12" sm="8">
              <v-btn variant="outlined" color="#111" @click="searchAddress" block style="height:40px">
                <v-icon start>mdi-map-marker</v-icon>
                주소 검색
              </v-btn>
            </v-col>
            <v-col cols="12">
              <v-text-field v-model="form.address" label="주소" variant="outlined" density="compact" readonly placeholder="주소 검색을 해주세요" />
            </v-col>
            <v-col cols="12">
              <v-text-field v-model="form.addressDetail" label="상세주소" variant="outlined" density="compact" placeholder="동/호수 입력" />
            </v-col>
          </v-row>
        </v-card>

        <!-- 결제 수단 선택 -->
        <v-card variant="outlined" class="pa-5">
          <h2 class="section-heading">결제 수단</h2>

          <div class="pay-methods">
            <button
              v-for="method in payMethods"
              :key="method.key"
              class="pay-method-btn"
              :class="{ active: selectedMethod === method.key }"
              @click="selectedMethod = method.key"
            >
              <img v-if="method.icon" :src="method.icon" :alt="method.label" class="pay-icon" />
              <v-icon v-else size="24" class="pay-method-icon">{{ method.mdi }}</v-icon>
              <span class="pay-method-label">{{ method.label }}</span>
            </button>
          </div>

          <div class="pay-info">
            <div v-if="selectedMethod === 'card'" class="pay-desc">
              <v-icon size="18" color="#555">mdi-information-outline</v-icon>
              카드사 결제창이 열리며, 카드 정보를 안전하게 입력할 수 있습니다.
            </div>
            <div v-else-if="selectedMethod === 'kakaopay'" class="pay-desc">
              <v-icon size="18" color="#555">mdi-information-outline</v-icon>
              카카오페이 앱에서 간편하게 결제할 수 있습니다.
            </div>
            <div v-else-if="selectedMethod === 'naverpay'" class="pay-desc">
              <v-icon size="18" color="#555">mdi-information-outline</v-icon>
              네이버페이로 빠르고 편리하게 결제할 수 있습니다.
            </div>
            <div v-else-if="selectedMethod === 'tosspay'" class="pay-desc">
              <v-icon size="18" color="#555">mdi-information-outline</v-icon>
              토스 앱에서 간편하게 결제할 수 있습니다.
            </div>
          </div>

          <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-4">{{ error }}</v-alert>
        </v-card>
      </v-col>

      <!-- 오른쪽: 주문 요약 -->
      <v-col cols="12" md="4">
        <v-card variant="outlined" class="pa-4" style="position:sticky;top:80px">
          <h2 class="text-subtitle-1 font-weight-bold mb-4">주문 내역</h2>
          <div v-for="item in cartStore.items" :key="item.id" class="d-flex align-center gap-3 mb-3">
            <v-img :src="item.image" width="52" height="52" rounded style="flex-shrink:0;background:#f5f5f5" />
            <div class="flex-grow-1">
              <p class="text-caption font-weight-medium">{{ item.name }}</p>
              <p class="text-caption text-grey">× {{ item.qty }}</p>
            </div>
            <p class="text-caption font-weight-bold">₩{{ (item.price * item.qty).toLocaleString() }}</p>
          </div>
          <v-divider class="my-3" />
          <div class="d-flex justify-space-between text-body-2 mb-1">
            <span>소계</span><span>₩{{ cartStore.total.toLocaleString() }}</span>
          </div>
          <div class="d-flex justify-space-between text-body-2 mb-3">
            <span>배송비</span><span class="text-green">무료</span>
          </div>
          <div class="d-flex justify-space-between font-weight-bold text-h6 mb-4">
            <span>합계</span>
            <span style="color:#111">₩{{ cartStore.total.toLocaleString() }}</span>
          </div>
          <button
            class="checkout-btn"
            :disabled="cartStore.items.length === 0 || loading"
            @click="processPayment"
          >
            <span v-if="loading" class="loading-spinner"></span>
            <template v-else>
              <img v-if="selectedMethod === 'kakaopay'" src="https://developers.kakao.com/static/images/pc/product/icon/kakao_pay.png" style="height:18px;margin-right:6px" />
              ₩{{ cartStore.total.toLocaleString() }} 결제하기
            </template>
          </button>
        </v-card>
      </v-col>
    </v-row>

    <!-- 주소 검색 중앙 팝업 -->
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
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useCartStore } from '../stores/cart';
import { useAuthStore } from '../stores/auth';

const cartStore = useCartStore();
const authStore = useAuthStore();
const router = useRouter();
const error = ref('');
const loading = ref(false);

const form = ref({ name: authStore.user?.name || '', phone: '', zip: '', address: '', addressDetail: '' });
const showPostcode = ref(false);
const selectedMethod = ref('card');

// 결제 수단 목록
const payMethods = [
  { key: 'card',      label: '카드결제',   mdi: 'mdi-credit-card-outline' },
  { key: 'kakaopay',  label: '카카오페이', icon: 'https://developers.kakao.com/static/images/pc/product/icon/kakao_pay.png' },
  { key: 'naverpay',  label: '네이버페이', icon: 'https://pay.naver.com/img/etc/naver_pay_logo.png' },
  { key: 'tosspay',   label: '토스페이',   icon: 'https://static.toss.im/icons/png/4x/icon-toss-logo.png' },
];

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

// MainPay (메인페이) 결제 처리
async function processPayment() {
  error.value = '';

  // 유효성 검사
  if (!form.value.name) { error.value = '이름을 입력해주세요'; return; }
  if (!form.value.phone) { error.value = '전화번호를 입력해주세요'; return; }
  if (!form.value.address) { error.value = '주소를 검색해주세요'; return; }
  if (cartStore.items.length === 0) { error.value = '장바구니가 비어있습니다'; return; }

  loading.value = true;

  try {
    // 1. 결제 준비 (서버 → MainPay PG)
    const { data } = await axios.post('/api/payment/mainpay/ready', {
      items: cartStore.items.map(i => ({
        id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
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

    // 2. 결제창 호출
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile && data.nextMobileUrl) {
      // 모바일: 현재 창에서 리다이렉트
      cartStore.clearCart();
      window.location.href = data.nextMobileUrl;
      return;
    }

    // PC: 팝업
    const popup = window.open(data.nextPcUrl, 'mainpay_popup',
      'width=600,height=750,scrollbars=yes,resizable=yes');

    if (!popup) {
      error.value = '팝업이 차단되었습니다. 팝업 차단을 해제하고 다시 시도해주세요';
      loading.value = false;
      return;
    }

    cartStore.clearCart();

    // 팝업 닫힘 감지 (결제 완료/취소 시 부모창은 approval HTML로 리다이렉트 됨)
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
.section-heading {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 20px;
  padding-left: 12px;
  border-left: 4px solid #111;
}

/* 결제 수단 버튼 */
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
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px 8px;
  border: 2px solid #e0e0e0;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 8px;
}
.pay-method-btn:hover {
  border-color: #999;
}
.pay-method-btn.active {
  border-color: #111;
  background: #fafafa;
}
.pay-icon {
  height: 24px;
  width: auto;
  object-fit: contain;
}
.pay-method-icon {
  color: #555;
}
.pay-method-btn.active .pay-method-icon {
  color: #111;
}
.pay-method-label {
  font-size: 12px;
  font-weight: 600;
  color: #555;
  letter-spacing: 0.3px;
}
.pay-method-btn.active .pay-method-label {
  color: #111;
}

.pay-info {
  min-height: 32px;
}
.pay-desc {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #777;
  padding: 10px 14px;
  background: #f8f8f8;
  border-radius: 6px;
}

/* 결제 버튼 */
.checkout-btn {
  width: 100%;
  height: 52px;
  background: #111;
  color: #fff;
  border: none;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 1px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.checkout-btn:hover { background: #333; }
.checkout-btn:disabled {
  background: #ccc;
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
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 주소 팝업 */
.postcode-overlay {
  position: fixed;
  inset: 0;
  z-index: 999;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}
.postcode-modal {
  background: #fff;
  width: 500px;
  max-width: 92vw;
  border-radius: 8px;
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
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.15s;
}
.postcode-close:hover {
  background: rgba(255,255,255,0.2);
}
#daum-postcode-layer {
  width: 100% !important;
  height: 470px !important;
}
</style>
