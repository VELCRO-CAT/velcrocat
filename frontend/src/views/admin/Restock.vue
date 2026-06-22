<template>
  <AdminSidebar />

  <v-main class="bg-grey-lighten-4 admin-page">
    <v-container class="admin-container" style="max-width:1100px">
      <div class="page-header">
        <div>
          <h1 class="page-title">재입고 알림 관리</h1>
          <p class="page-sub">고객이 품절 상품에 등록한 알림 신청 — 재입고 시 이메일로 안내해 주세요.</p>
        </div>
        <div class="header-stats" v-if="rows.length">
          <span class="stat-pill">미통보 {{ pendingCount }}건</span>
          <span class="stat-pill stat-done">통보완료 {{ doneCount }}건</span>
        </div>
      </div>

      <!-- 사용법 안내 -->
      <div class="usage-card">
        <h3 class="usage-title">사용 흐름</h3>
        <ol class="usage-list">
          <li>고객이 품절 상품에서 <strong>"재입고 알림 받기"</strong>를 누르고 이메일을 등록</li>
          <li>여기 목록에 신청이 쌓임 (상품·컬러·사이즈·이메일·신청일 표시)</li>
          <li>재입고 시 관리자가 해당 이메일로 <strong>직접 메일</strong> 발송 (자동 발송 미연동)</li>
          <li>발송 후 우측 <strong>"통보 완료"</strong> 버튼 클릭 → 상태 변경</li>
          <li>처리 끝났거나 무효 신청은 <strong>휴지통 아이콘</strong>으로 삭제</li>
        </ol>
      </div>

      <v-progress-circular v-if="loading" indeterminate color="grey-darken-3" class="d-block mx-auto my-12" />

      <div v-else-if="!rows.length" class="empty">
        <v-icon size="48" color="grey-lighten-1">mdi-bell-off-outline</v-icon>
        <p>재입고 알림 신청이 없습니다</p>
      </div>

      <!-- 상품 단위 그룹 -->
      <div v-else class="group-list">
        <div v-for="group in groupedRows" :key="group.productId" class="group-card">
          <div class="group-head">
            <img v-if="group.image" :src="group.image" :alt="group.name" class="group-img" />
            <div class="group-info">
              <p class="group-name">{{ group.name || '(상품 정보 없음)' }}</p>
              <p class="group-meta">
                <span class="group-stock" :class="{ 'group-stock-in': group.stock > 0 }">
                  {{ group.stock > 0 ? '재고 ' + group.stock + '개' : '품절' }}
                </span>
                · 신청 {{ group.items.length }}건 ({{ group.pending }}건 미통보)
              </p>
            </div>
            <button
              v-if="group.pending > 0"
              class="btn btn-mark-all"
              @click="markAllProduct(group.productId)"
            >전체 통보 완료 처리</button>
          </div>

          <table class="rn-table">
            <thead>
              <tr>
                <th>이메일</th>
                <th>옵션</th>
                <th>신청일</th>
                <th>상태</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in group.items" :key="r.id" :class="{ notified: r.notified }">
                <td class="cell-email">
                  <a :href="'mailto:' + r.email + '?subject=' + mailtoSubject(group, r) + '&body=' + mailtoBody(group, r)" :title="'이 이메일로 발송'">{{ r.email }}</a>
                </td>
                <td class="cell-opt">
                  <span v-if="r.color || r.size">
                    {{ r.color || '-' }} / {{ r.size || '-' }}
                  </span>
                  <span v-else class="cell-na">옵션 없음</span>
                </td>
                <td class="cell-date">{{ formatDate(r.created_at) }}</td>
                <td>
                  <span v-if="r.notified" class="status-done">✓ 통보완료</span>
                  <span v-else class="status-pending">대기</span>
                </td>
                <td class="cell-actions">
                  <button v-if="!r.notified" class="btn btn-mark" @click="markNotified(r.id)" title="통보 완료로 표시">
                    <v-icon size="14">mdi-check</v-icon>
                  </button>
                  <button class="btn btn-del" @click="del(r.id)" title="삭제">
                    <v-icon size="14">mdi-trash-can-outline</v-icon>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </v-container>
  </v-main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import AdminSidebar from '../../components/AdminSidebar.vue';

const rows = ref([]);
const loading = ref(true);

const authHeader = () => {
  const t = localStorage.getItem('token');
  return t ? { Authorization: `Bearer ${t}` } : {};
};

async function fetchRows() {
  loading.value = true;
  try {
    const res = await axios.get('/api/notify/restock', { headers: authHeader() });
    rows.value = res.data || [];
  } catch (e) {
    console.error('재입고 알림 목록 조회 실패', e);
    rows.value = [];
  } finally {
    loading.value = false;
  }
}

const pendingCount = computed(() => rows.value.filter(r => !r.notified).length);
const doneCount    = computed(() => rows.value.filter(r => r.notified).length);

// 상품 단위 그룹핑 — 미통보 우선
const groupedRows = computed(() => {
  const map = new Map();
  for (const r of rows.value) {
    const pid = r.product_id;
    if (!map.has(pid)) {
      map.set(pid, {
        productId: pid,
        name: r.product_name,
        image: r.product_image,
        stock: r.product_stock,
        items: [],
        pending: 0
      });
    }
    const g = map.get(pid);
    g.items.push(r);
    if (!r.notified) g.pending++;
  }
  // 미통보 많은 그룹 우선
  return Array.from(map.values()).sort((a, b) => b.pending - a.pending);
});

async function markNotified(id) {
  try {
    await axios.put(`/api/notify/restock/${id}/notify`, {}, { headers: authHeader() });
    const r = rows.value.find(x => x.id === id);
    if (r) r.notified = true;
  } catch (e) {
    alert('처리 실패: ' + (e.response?.data?.error || e.message));
  }
}

async function markAllProduct(productId) {
  if (!confirm('이 상품의 모든 미통보 신청을 통보완료로 표시할까요?')) return;
  try {
    await axios.put(`/api/notify/restock/product/${productId}/notify-all`, {}, { headers: authHeader() });
    rows.value.forEach(r => {
      if (r.product_id === productId && !r.notified) r.notified = true;
    });
  } catch (e) {
    alert('처리 실패: ' + (e.response?.data?.error || e.message));
  }
}

async function del(id) {
  if (!confirm('이 알림 신청을 삭제할까요?')) return;
  try {
    await axios.delete(`/api/notify/restock/${id}`, { headers: authHeader() });
    rows.value = rows.value.filter(r => r.id !== id);
  } catch (e) {
    alert('삭제 실패: ' + (e.response?.data?.error || e.message));
  }
}

function formatDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  const pad = (n) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

function mailtoSubject(group, r) {
  return encodeURIComponent(`[VELCROCAT] 재입고 알림 — ${group.name}`);
}
function mailtoBody(group, r) {
  const opt = (r.color || r.size) ? `\n옵션: ${r.color || '-'} / ${r.size || '-'}` : '';
  const body = `안녕하세요, VELCROCAT 입니다.\n\n관심 등록해 주신 아래 상품이 재입고되었습니다.\n\n상품: ${group.name}${opt}\n\n아래 링크에서 바로 확인하실 수 있습니다.\nhttps://www.vcat.kr/products/${group.productId}\n\n늘 VELCROCAT을 사랑해 주셔서 감사합니다.\n— VELCROCAT SEOUL`;
  return encodeURIComponent(body);
}

onMounted(fetchRows);
</script>

<style scoped>
.page-header {
  display: flex; align-items: flex-end; justify-content: space-between;
  margin-bottom: 24px; gap: 16px;
}
.page-title {
  font-family: var(--ff-serif);
  font-style: italic; font-weight: 500;
  font-size: 32px; line-height: 1.1; color: var(--c-ink); margin: 0;
}
.page-sub { font-size: 12px; color: var(--c-muted); margin: 6px 0 0; }

.header-stats { display: flex; gap: 8px; flex-shrink: 0; }
.stat-pill {
  display: inline-flex; align-items: center;
  font-size: 11px; font-weight: 600;
  background: rgba(192,57,43,0.08);
  color: var(--c-accent);
  border: 1px solid rgba(192,57,43,0.25);
  padding: 5px 12px;
  border-radius: 999px;
  letter-spacing: 0.02em;
}
.stat-pill.stat-done {
  background: rgba(47,107,71,0.08);
  color: #2F6B47;
  border-color: rgba(47,107,71,0.25);
}

.usage-card {
  background: #fff;
  border: 1px solid #eee;
  padding: 20px 24px;
  margin-bottom: 20px;
}
.usage-title {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #555;
  margin: 0 0 12px;
}
.usage-list {
  margin: 0; padding: 0 0 0 18px;
  font-size: 13px; line-height: 1.9;
  color: #444;
}
.usage-list strong { color: #111; font-weight: 600; }

.empty {
  text-align: center; padding: 80px 20px;
  color: #999;
}
.empty p { margin-top: 14px; font-size: 14px; }

.group-list { display: flex; flex-direction: column; gap: 20px; }
.group-card {
  background: #fff;
  border: 1px solid #eee;
  overflow: hidden;
}
.group-head {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: #fafafa;
  border-bottom: 1px solid #eee;
}
.group-img {
  width: 56px; height: 56px;
  object-fit: cover;
  background: #f5f5f5;
  flex-shrink: 0;
}
.group-info { flex: 1; min-width: 0; }
.group-name {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #111;
}
.group-meta {
  margin: 4px 0 0;
  font-size: 12px;
  color: #888;
}
.group-stock {
  color: var(--c-accent);
  font-weight: 600;
}
.group-stock-in { color: #2F6B47; }

.rn-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.rn-table thead th {
  text-align: left;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #888;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
}
.rn-table tbody tr { border-bottom: 1px solid #f3f3f3; }
.rn-table tbody tr:last-child { border-bottom: none; }
.rn-table tbody tr.notified { background: #fafafa; opacity: 0.7; }
.rn-table td { padding: 12px 16px; color: #333; }
.cell-email a { color: #111; text-decoration: none; border-bottom: 1px dotted #ccc; }
.cell-email a:hover { border-bottom-color: #111; }
.cell-opt { color: #555; font-size: 12px; }
.cell-na { color: #bbb; font-style: italic; }
.cell-date { color: #888; font-size: 12px; font-variant-numeric: tabular-nums; }
.status-pending {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  background: rgba(192,57,43,0.08);
  color: var(--c-accent);
  padding: 4px 10px;
  border-radius: 999px;
}
.status-done {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  background: rgba(47,107,71,0.08);
  color: #2F6B47;
  padding: 4px 10px;
  border-radius: 999px;
}
.cell-actions { white-space: nowrap; }
.btn {
  background: none;
  border: 1px solid #ddd;
  cursor: pointer;
  width: 28px; height: 28px;
  display: inline-flex; align-items: center; justify-content: center;
  margin-right: 4px;
  color: #555;
  transition: all 0.15s;
  padding: 0;
}
.btn:hover { color: #111; border-color: #111; }
.btn-mark:hover { color: #2F6B47; border-color: #2F6B47; }
.btn-del:hover { color: var(--c-accent); border-color: var(--c-accent); }
.btn-mark-all {
  flex-shrink: 0;
  width: auto;
  height: 32px;
  padding: 0 12px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  background: #111;
  color: #fff;
  border-color: #111;
}
.btn-mark-all:hover { background: #000; color: #fff; }

@media (max-width: 768px) {
  .group-head { flex-wrap: wrap; }
  .btn-mark-all { width: 100%; margin-top: 8px; }
  .rn-table thead { display: none; }
  .rn-table tr { display: grid; grid-template-columns: 1fr auto; gap: 4px 12px; padding: 12px 16px; }
  .rn-table td { padding: 2px 0; border: 0; }
  .cell-actions { grid-column: 2; grid-row: 1 / span 4; align-self: start; }
}
</style>
