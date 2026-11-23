<template>
  <AdminSidebar />

  <v-main class="bg-grey-lighten-4 admin-page">
    <v-container class="admin-container" style="max-width:1000px">
      <h1 class="page-title">주문 관리</h1>
      <p class="page-sub mb-5">
        총 {{ orders.length }}건의 주문 · 결제완료 {{ orderCounts.paid }}건 · 입금대기 {{ orderCounts.pending }}건<span v-if="searchQuery"> · 검색결과 {{ filteredOrders.length }}건</span><span v-if="totalPages > 1"> · {{ currentPage }}/{{ totalPages }}페이지</span>
      </p>

      <v-text-field
        v-model="searchQuery"
        placeholder="주문번호 또는 고객명으로 검색"
        variant="outlined"
        density="compact"
        clearable
        hide-details
        prepend-inner-icon="mdi-magnify"
        class="mb-4"
      />

      <v-progress-circular v-if="loading" indeterminate color="grey-darken-3" class="d-block mx-auto my-12" />

      <div v-else-if="!orders.length" class="text-center py-12 text-grey">
        <v-icon size="48">mdi-receipt</v-icon>
        <p class="mt-3">아직 주문이 없습니다</p>
      </div>

      <div v-else class="order-list">
        <div v-for="order in pagedOrders" :key="order.id" class="order-card">
          <div class="order-top">
            <div>
              <span class="order-no">{{ order.order_no }}</span>
              <span class="order-date">{{ formatDate(order.created_at) }}</span>
            </div>
            <span class="status-badge" :class="`status-${order.status}`">{{ statusLabel(order.status) }}</span>
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
            <div v-if="order.coupon_code" class="order-info-row">
              <span class="order-label">적용 쿠폰</span>
              <span class="order-value">{{ order.coupon_code }} (-₩{{ Number(order.discount_amount || 0).toLocaleString() }})</span>
            </div>
            <div v-if="order.payment_method === 'bank_transfer'" class="order-info-row">
              <span class="order-label">입금자명</span>
              <span class="order-value">
                {{ order.depositor_name || '-' }}
                <v-chip v-if="order.deposit_notified_at" color="blue" size="x-small" variant="tonal" class="ml-2">고객 입금완료 알림</v-chip>
              </span>
            </div>

            <button class="order-detail-toggle" @click="toggleExpand(order.id)">
              <span>주문 상품 {{ order.items?.length || 0 }}건 {{ isExpanded(order.id) ? '접기' : '상세보기' }}</span>
              <v-icon size="16">{{ isExpanded(order.id) ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
            </button>

            <div v-if="isExpanded(order.id)" class="order-detail">
              <div v-for="(item, i) in order.items" :key="i" class="order-item-row">
                <img v-if="item.image" :src="item.image" :alt="item.name" class="order-item-thumb" />
                <div v-else class="order-item-thumb order-item-thumb-empty">
                  <v-icon size="18" color="#ccc">mdi-image-off-outline</v-icon>
                </div>
                <div class="order-item-meta">
                  <p class="order-item-name">{{ item.name }}</p>
                  <p class="order-item-opts">
                    <span v-if="item.color">색상: {{ item.color }}</span>
                    <span v-if="item.color && item.size"> · </span>
                    <span v-if="item.size">사이즈: {{ item.size }}</span>
                    <span v-if="item.quantity"> · 수량: {{ item.quantity }}</span>
                  </p>
                </div>
                <div class="order-item-price">₩{{ Number(item.price).toLocaleString() }}</div>
              </div>

              <div v-if="order.shippingAddress?.address" class="order-shipping-detail">
                <v-icon size="14" color="#999" class="mr-1">mdi-map-marker-outline</v-icon>
                <span>
                  {{ order.shippingAddress.name }}
                  <span v-if="order.shippingAddress.phone">· {{ order.shippingAddress.phone }}</span>
                  <br>
                  ({{ order.shippingAddress.zip }}) {{ order.shippingAddress.address }} {{ order.shippingAddress.addressDetail }}
                  <span v-if="order.shippingAddress.memo"> — {{ order.shippingAddress.memo }}</span>
                </span>
              </div>
            </div>
          </div>
          <div class="order-bottom">
            <div class="order-bottom-left">
              <span class="order-label">배송 상태</span>

              <button
                v-if="order.status === 'pending'"
                class="deposit-confirm-btn"
                @click="confirmDeposit(order)"
              >입금확인</button>

              <div v-else-if="order.status === 'paid'" class="shipping-status-group">
                <button
                  v-for="s in SHIPPING_STEPS"
                  :key="s.value"
                  class="shipping-status-btn"
                  :class="{ active: order.shipping_status === s.value }"
                  @click="updateShippingStatus(order, s.value)"
                >{{ s.title }}</button>
              </div>

              <span v-else class="order-cancelled-note">취소된 주문입니다</span>
            </div>

            <div class="order-bottom-right">
              <template v-if="isEditing(order.id)">
                <button v-if="order.status !== 'cancelled'" class="cancel-order-btn" @click="cancelOrder(order)">주문 취소</button>
                <button class="edit-toggle-btn" @click="toggleEdit(order.id)">닫기</button>
              </template>
              <button v-else class="edit-toggle-btn" @click="toggleEdit(order.id)">수정</button>
              <button class="delete-btn" @click="deleteOrder(order)">
                <v-icon size="16">mdi-delete-outline</v-icon>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="totalPages > 1" class="pagination">
        <button class="page-nav-btn" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">
          <v-icon size="16">mdi-chevron-left</v-icon>
        </button>
        <template v-for="(p, i) in pageNumbers" :key="i">
          <span v-if="p === '...'" class="page-ellipsis">…</span>
          <button v-else class="page-num-btn" :class="{ active: p === currentPage }" @click="goToPage(p)">{{ p }}</button>
        </template>
        <button class="page-nav-btn" :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">
          <v-icon size="16">mdi-chevron-right</v-icon>
        </button>
      </div>
    </v-container>
  </v-main>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import AdminSidebar from '../../components/AdminSidebar.vue';

const route = useRoute();
const orders = ref([]);
const loading = ref(true);
const expandedIds = ref(new Set());
const searchQuery = ref('');

const filteredOrders = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return orders.value;
  return orders.value.filter(o =>
    o.order_no?.toLowerCase().includes(q) || o.user_name?.toLowerCase().includes(q)
  );
});

const PAGE_SIZE = 10;
const currentPage = ref(1);
const totalPages = computed(() => Math.max(1, Math.ceil(filteredOrders.value.length / PAGE_SIZE)));
const pagedOrders = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE;
  return filteredOrders.value.slice(start, start + PAGE_SIZE);
});
watch(searchQuery, () => { currentPage.value = 1; });
const pageNumbers = computed(() => {
  const total = totalPages.value;
  const cur = currentPage.value;
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const keep = new Set([1, 2, total - 1, total, cur - 1, cur, cur + 1]);
  const sorted = [...keep].filter(p => p >= 1 && p <= total).sort((a, b) => a - b);
  const result = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push('...');
    result.push(p);
    prev = p;
  }
  return result;
});
watch(() => orders.value.length, () => {
  if (currentPage.value > totalPages.value) currentPage.value = totalPages.value;
});
function goToPage(p) {
  if (p < 1 || p > totalPages.value) return;
  currentPage.value = p;
}

function toggleExpand(id) {
  const next = new Set(expandedIds.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  expandedIds.value = next;
}
function isExpanded(id) {
  return expandedIds.value.has(id);
}

const SHIPPING_STEPS = [
  { title: '배송준비중', value: 'preparing' },
  { title: '배송중', value: 'shipping' },
  { title: '배송완료', value: 'delivered' }
];

const editingIds = ref(new Set());
function toggleEdit(id) {
  const next = new Set(editingIds.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  editingIds.value = next;
}
function isEditing(id) {
  return editingIds.value.has(id);
}

const orderCounts = computed(() => ({
  paid: orders.value.filter(o => o.status === 'paid').length,
  pending: orders.value.filter(o => o.status === 'pending').length
}));

onMounted(async () => {
  const res = await axios.get('/api/admin/orders');
  orders.value = res.data;

  // 알림 토스트에서 특정 주문번호를 들고 들어온 경우 — 검색창에 채워 바로 찾아 펼쳐 보여준다.
  const targetOrderNo = route.query.orderNo;
  if (targetOrderNo) {
    searchQuery.value = String(targetOrderNo);
    const match = orders.value.find(o => o.order_no === targetOrderNo);
    if (match) expandedIds.value = new Set([match.id]);
  }
  loading.value = false;
});

async function confirmDeposit(order) {
  if (!confirm(`주문 ${order.order_no}의 입금을 확인하셨나요? 결제완료로 전환되며 재고가 차감됩니다.`)) return;
  const { data } = await axios.patch(`/api/admin/orders/${order.id}/status`, { status: 'paid' });
  order.status = data.status;
  order.shipping_status = data.shipping_status;
}

async function cancelOrder(order) {
  if (!confirm(`주문 ${order.order_no}을(를) 취소하시겠습니까?`)) return;
  const { data } = await axios.patch(`/api/admin/orders/${order.id}/status`, { status: 'cancelled' });
  order.status = data.status;
  toggleEdit(order.id);
}

async function updateShippingStatus(order, shipping_status) {
  await axios.patch(`/api/admin/orders/${order.id}/shipping-status`, { shipping_status });
  order.shipping_status = shipping_status;
}

async function deleteOrder(order) {
  if (!confirm(`주문 ${order.order_no}을(를) 삭제하시겠습니까?`)) return;
  await axios.delete(`/api/admin/orders/${order.id}`);
  orders.value = orders.value.filter(o => o.id !== order.id);
}

function statusLabel(s) {
  return { pending:'입금대기', paid:'결제완료', cancelled:'취소됨' }[s] || s;
}
function methodLabel(m) {
  return { card:'카드결제', kakaopay:'카카오페이', naverpay:'네이버페이', tosspay:'토스페이', mpc:'카드결제', bank_transfer:'무통장입금' }[m] || m || '-';
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

.order-detail-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-top: 8px;
  padding: 8px 0 0;
  border-top: 1px dashed #eee;
  background: none;
  border-left: none;
  border-right: none;
  border-bottom: none;
  font-size: 12px;
  font-weight: 600;
  color: #666;
  cursor: pointer;
}
.order-detail-toggle:hover { color: #111; }

.order-detail {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.order-item-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.order-item-thumb {
  width: 46px;
  height: 46px;
  object-fit: cover;
  border: 1px solid #eee;
  border-radius: 4px;
  flex-shrink: 0;
}
.order-item-thumb-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
}
.order-item-meta { flex: 1; min-width: 0; }
.order-item-name {
  font-size: 12.5px;
  font-weight: 600;
  color: #222;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.order-item-opts {
  font-size: 11px;
  color: #999;
  margin: 2px 0 0;
}
.order-item-price {
  font-size: 12px;
  font-weight: 700;
  color: #333;
  white-space: nowrap;
}
.order-shipping-detail {
  display: flex;
  align-items: flex-start;
  gap: 2px;
  margin-top: 2px;
  padding-top: 10px;
  border-top: 1px dashed #eee;
  font-size: 11.5px;
  color: #777;
  line-height: 1.6;
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
.order-bottom-right {
  display: flex;
  align-items: center;
  gap: 8px;
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

/* 상태 배지 */
.status-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 2px;
  letter-spacing: 0.02em;
}
.status-badge.status-paid { background: #111; color: #fff; }
.status-badge.status-pending { background: #16233f; color: #fff; }
.status-badge.status-cancelled { background: #fce4ec; color: #c62828; }

/* 배송 상태 3단 버튼 */
.shipping-status-group { display: flex; gap: 6px; }
.shipping-status-btn {
  border: 1px solid #ddd;
  background: #fff;
  color: #777;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
}
.shipping-status-btn:hover { border-color: #111; color: #111; }
.shipping-status-btn.active { background: #111; border-color: #111; color: #fff; }

/* 입금확인 버튼 */
.deposit-confirm-btn {
  border: 1px solid #111;
  background: #fff;
  color: #111;
  font-size: 12px;
  font-weight: 700;
  padding: 7px 14px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
}
.deposit-confirm-btn:hover { background: #111; color: #fff; }

.order-cancelled-note { font-size: 12.5px; color: #c62828; font-weight: 600; }

/* 수정/취소 버튼 */
.edit-toggle-btn,
.cancel-order-btn {
  border: 1px solid #ddd;
  background: #fff;
  color: #666;
  font-size: 11.5px;
  font-weight: 600;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
}
.edit-toggle-btn:hover { border-color: #111; color: #111; }
.cancel-order-btn { border-color: #f0b4b4; color: #c62828; }
.cancel-order-btn:hover { background: #c62828; border-color: #c62828; color: #fff; }

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  margin-top: 24px;
}
.page-nav-btn,
.page-num-btn {
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  color: #555;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.page-nav-btn:hover:not(:disabled),
.page-num-btn:hover { border-color: #111; color: #111; }
.page-nav-btn:disabled { opacity: 0.35; cursor: default; }
.page-num-btn.active { background: #111; border-color: #111; color: #fff; }
.page-ellipsis { color: #bbb; font-size: 12px; padding: 0 2px; }

@media (max-width: 768px) {
  .admin-page { padding-top: 52px !important; }
  .admin-container { padding: 16px !important; }
  .page-title { font-size: 17px; }
}
</style>
