<template>
  <v-container style="max-width:520px" class="py-16 text-center">
    <!-- 체크아웃과 이어지는 3단계 표시 -->
    <div class="oc-steps">
      <div class="oc-step done">
        <span class="oc-step-num"><v-icon size="14">mdi-check</v-icon></span>
        <span>장바구니</span>
      </div>
      <div class="oc-step-divider done"></div>
      <div class="oc-step done">
        <span class="oc-step-num"><v-icon size="14">mdi-check</v-icon></span>
        <span>주문/결제</span>
      </div>
      <div class="oc-step-divider" :class="{ done: phase === 'paid' }"></div>
      <div class="oc-step" :class="{ active: phase !== 'paid', done: phase === 'paid' }">
        <span class="oc-step-num">
          <v-icon v-if="phase === 'paid'" size="14">mdi-check</v-icon>
          <template v-else>3</template>
        </span>
        <span>완료</span>
      </div>
    </div>

    <!-- 확인 중 -->
    <div v-if="phase === 'checking'" class="py-8">
      <v-progress-circular indeterminate color="#111" size="48" class="mb-5" />
      <h1 class="text-h6 font-weight-bold mb-2">결제 확인 중입니다</h1>
      <p class="text-body-2 text-grey-darken-1">잠시만 기다려 주세요. 결제 결과를 확인하고 있어요.</p>
    </div>

    <!-- 결제 완료 -->
    <div v-else-if="phase === 'paid'" class="py-8">
      <v-icon size="72" color="green-darken-2" class="mb-4">mdi-check-circle</v-icon>
      <h1 class="text-h5 font-weight-bold mb-2">결제가 완료되었습니다</h1>
      <p class="text-caption text-grey mb-4" style="letter-spacing:4px">ORDER COMPLETE</p>
      <p class="text-body-1 text-grey-darken-1 mb-2">주문해 주셔서 감사합니다.</p>
      <p v-if="order" class="text-body-2 text-grey mb-8">
        주문번호 {{ order.orderNo }} · ₩{{ Number(order.total).toLocaleString() }}
      </p>
      <div class="d-flex flex-column flex-sm-row justify-center ga-3 mt-4">
        <v-btn color="#111" size="large" to="/mypage">주문 내역 확인</v-btn>
        <v-btn variant="outlined" color="#111" size="large" to="/products">쇼핑 계속하기</v-btn>
      </div>
    </div>

    <!-- 결제 미완료 -->
    <div v-else-if="phase === 'failed'" class="py-8">
      <v-icon size="72" color="grey-darken-1" class="mb-4">mdi-close-circle-outline</v-icon>
      <h1 class="text-h5 font-weight-bold mb-2">결제가 완료되지 않았습니다</h1>
      <p class="text-body-1 text-grey-darken-1 mb-8">
        결제가 정상적으로 처리되지 않아 주문이 접수되지 않았습니다.<br>
        장바구니는 그대로 남아있으니 다시 시도해 주세요.
      </p>
      <div class="d-flex flex-column flex-sm-row justify-center ga-3 mt-4">
        <v-btn color="#111" size="large" to="/checkout">다시 결제하기</v-btn>
        <v-btn variant="outlined" color="#111" size="large" to="/cart">장바구니로 이동</v-btn>
      </div>
    </div>

    <!-- 확인 지연 (결제는 됐을 수 있으나 아직 확정 안 됨 — 절대 주문을 지우지 않는다) -->
    <div v-else class="py-8">
      <v-icon size="72" color="orange-darken-2" class="mb-4">mdi-clock-alert-outline</v-icon>
      <h1 class="text-h5 font-weight-bold mb-2">결제 확인이 지연되고 있습니다</h1>
      <p class="text-body-1 text-grey-darken-1 mb-8">
        결제는 진행되었을 수 있으나 시스템에서 아직 확정되지 않았습니다.<br>
        <strong>다시 결제하지 마시고</strong>, 잠시 후 마이페이지에서 확인해 주시거나<br>
        고객센터로 주문번호({{ route.query.orderNo }})를 문의해 주세요.
      </p>
      <div class="d-flex flex-column flex-sm-row justify-center ga-3 mt-4">
        <v-btn color="#111" size="large" to="/mypage">마이페이지 확인</v-btn>
        <v-btn variant="outlined" color="#111" size="large" to="/contact">고객센터 문의</v-btn>
      </div>
    </div>
  </v-container>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import { useCartStore } from '../stores/cart';

const route = useRoute();
const cartStore = useCartStore();

const phase = ref('checking'); // 'checking' | 'paid' | 'failed' | 'delayed'
const order = ref(null);

let pollTimer = null;
let attempts = 0;
// PG(MPC) notify 웹훅은 결제 후 보통 15~18초 뒤에 도착한다(실측 확인됨).
// 예전 18초(12회×1.5초) 기준으로는 이 시간에 딱 걸려 "결제 확인 지연" 오탐이 잦았으므로
// 60초(40회×1.5초)로 넉넉히 늘려 정상적인 지연은 이 화면 안에서 자연스럽게 확인되게 한다.
const MAX_ATTEMPTS = 40;
const POLL_INTERVAL_MS = 1500;

async function checkStatus() {
  const orderNo = route.query.orderNo;
  if (!orderNo) {
    phase.value = 'failed';
    return;
  }

  attempts++;
  try {
    const { data } = await axios.get(`/api/payment/mainpay/status/${encodeURIComponent(orderNo)}`);
    if (data.status === 'paid') {
      order.value = data;
      phase.value = 'paid';
      cartStore.clearCart(); // 실제 결제 확인 후에만 장바구니를 비운다
      return;
    }
    if (data.status === 'cancelled') {
      phase.value = 'failed';
      return;
    }
    // 아직 pending → 계속 확인
  } catch (e) {
    // 404(not_found) = 애초에 결제창을 열지 못해 주문이 생성/정리된 경우 등. 실제 결제 이후엔 거의 발생하지 않음.
    if (e.response?.status === 404) {
      phase.value = 'failed';
      return;
    }
  }

  if (attempts >= MAX_ATTEMPTS) {
    // ⚠️ 결제가 실제로는 완료됐는데 notify(웹훅)가 늦게 도착하는 경우가 있을 수 있으므로
    // 여기서 절대로 주문을 삭제하지 않는다(예전엔 abandon 호출로 삭제했으나 실결제 주문을
    // 지워버리는 사고가 발생해 제거함). pending 상태 그대로 두고 안내만 한다.
    phase.value = 'delayed';
    return;
  }

  pollTimer = setTimeout(checkStatus, POLL_INTERVAL_MS);
}

onMounted(checkStatus);
onBeforeUnmount(() => { if (pollTimer) clearTimeout(pollTimer); });
</script>

<style scoped>
.oc-steps {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-bottom: 40px;
}
.oc-step {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #bbb;
  font-weight: 600;
}
.oc-step-num {
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
.oc-step.done .oc-step-num,
.oc-step.active .oc-step-num { background: #111; color: #fff; }
.oc-step.done,
.oc-step.active { color: #111; }
.oc-step-divider {
  width: 40px;
  height: 1px;
  background: #ddd;
}
.oc-step-divider.done { background: #111; }

@media (max-width: 600px) {
  .oc-steps { gap: 6px; }
  .oc-step-divider { width: 24px; }
  .oc-step span:not(.oc-step-num) { font-size: 11px; }
}
</style>
