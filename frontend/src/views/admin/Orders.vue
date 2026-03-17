<template>
  <AdminSidebar />

  <v-main class="bg-grey-lighten-4 admin-page">
    <v-container class="admin-container" style="max-width:1000px">
      <h1 class="page-title">주문 관리</h1>
      <p class="page-sub mb-5">총 {{ orders.length }}건의 주문</p>

      <v-progress-circular v-if="loading" indeterminate color="grey-darken-3" class="d-block mx-auto my-12" />

      <div v-else-if="!orders.length" class="text-center py-12 text-grey">
        <v-icon size="48">mdi-receipt</v-icon>
        <p class="mt-3">아직 주문이 없습니다</p>
      </div>

      <div v-else class="order-list">
        <div v-for="order in orders" :key="order.id" class="order-card">
          <div class="order-top">
            <div>
              <span class="order-no">{{ order.order_no }}</span>
              <span class="order-date">{{ formatDate(order.created_at) }}</span>
            </div>
            <v-chip :color="statusColor(order.status)" size="x-small" variant="tonal">
              {{ statusLabel(order.status) }}
            </v-chip>
          </div>
          <div class="order-body">
            <div class="order-info-row">
              <span class="order-label">고객명</span>
              <span class="order-value">{{ order.user_name }}</span>
            </div>
            <div class="order-info-row">
              <span class="order-label">결제금액</span>
              <span class="order-value order-price">₩{{ Number(order.total).toLocaleString() }}</span>
            </div>
            <div class="order-info-row">
              <span class="order-label">결제수단</span>
              <span class="order-value">{{ methodLabel(order.payment_method) }}</span>
            </div>
          </div>
          <div class="order-bottom">
            <div class="order-bottom-left">
              <span class="order-label">상태 변경</span>
              <select class="order-status-select" :value="order.status" @change="updateStatus(order, $event.target.value)">
                <option v-for="s in statusItems" :key="s.value" :value="s.value">{{ s.title }}</option>
              </select>
            </div>
            <button class="delete-btn" @click="deleteOrder(order)">
              <v-icon size="16">mdi-delete-outline</v-icon>
            </button>
          </div>
        </div>
      </div>
    </v-container>
  </v-main>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import AdminSidebar from '../../components/AdminSidebar.vue';

const orders = ref([]);
const loading = ref(true);
const statusItems = [
  { title: '대기중', value: 'pending' },
  { title: '결제완료', value: 'paid' },
  { title: '확인됨', value: 'confirmed' },
  { title: '처리중', value: 'processing' },
  { title: '발송완료', value: 'shipped' },
  { title: '배달완료', value: 'delivered' },
  { title: '취소됨', value: 'cancelled' }
];

onMounted(async () => {
  const res = await axios.get('/api/admin/orders');
  orders.value = res.data;
  loading.value = false;
});

async function updateStatus(order, status) {
  await axios.patch(`/api/admin/orders/${order.id}/status`, { status });
  order.status = status;
}

async function deleteOrder(order) {
  if (!confirm(`주문 ${order.order_no}을(를) 삭제하시겠습니까?`)) return;
  await axios.delete(`/api/admin/orders/${order.id}`);
  orders.value = orders.value.filter(o => o.id !== order.id);
}

function statusLabel(s) {
  return { pending:'대기중', paid:'결제완료', confirmed:'확인됨', processing:'처리중', shipped:'발송완료', delivered:'배달완료', cancelled:'취소됨' }[s] || s;
}
function statusColor(s) {
  return { pending:'grey', paid:'blue', confirmed:'blue', processing:'orange', shipped:'green', delivered:'grey-darken-1', cancelled:'red' }[s] || 'grey';
}
function methodLabel(m) {
  return { card:'카드결제', kakaopay:'카카오페이', naverpay:'네이버페이', tosspay:'토스페이' }[m] || m || '-';
}
function formatDate(dt) {
  if (!dt) return '-';
  return new Date(dt).toLocaleString('ko-KR', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' });
}
</script>

<style scoped>
.page-title { font-size: 20px; font-weight: 800; color: #111; }
.page-sub { font-size: 12px; color: #999; margin-top: 2px; }

.order-list { display: flex; flex-direction: column; gap: 10px; }

.order-card {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
}
.order-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}
.order-no {
  font-size: 12px;
  font-weight: 700;
  color: #111;
  margin-right: 8px;
}
.order-date {
  font-size: 11px;
  color: #999;
}
.order-body {
  padding: 12px 16px;
}
.order-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
}
.order-label {
  font-size: 12px;
  color: #888;
}
.order-value {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}
.order-price {
  font-weight: 800;
  color: #111;
}
.order-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
}
.order-bottom-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.delete-btn {
  background: none;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 6px 8px;
  cursor: pointer;
  color: #999;
  transition: all 0.15s;
}
.delete-btn:hover {
  color: #e53e3e;
  border-color: #e53e3e;
}
.order-status-select {
  border: 1px solid #ddd;
  padding: 6px 10px;
  font-size: 12px;
  border-radius: 4px;
  background: #fff;
  color: #333;
  cursor: pointer;
  outline: none;
}
.order-status-select:focus { border-color: #111; }

@media (max-width: 768px) {
  .admin-page { padding-top: 52px !important; }
  .admin-container { padding: 16px !important; }
  .page-title { font-size: 17px; }
}
</style>
