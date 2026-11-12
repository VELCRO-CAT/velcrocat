<template>
  <AdminSidebar />

  <v-main class="bg-grey-lighten-4 admin-page">
    <v-container class="admin-container" style="max-width:1000px">
      <h1 class="page-title">쿠폰 관리</h1>
      <p class="page-sub mb-5">총 {{ coupons.length }}개의 쿠폰</p>

      <!-- 생성 폼 -->
      <div class="coupon-form-card">
        <div class="form-grid">
          <div class="form-field">
            <label class="field-label">코드</label>
            <input v-model="form.code" class="field-input" placeholder="예: WELCOME10" />
          </div>
          <div class="form-field">
            <label class="field-label">할인 유형</label>
            <select v-model="form.discountType" class="field-input">
              <option value="PERCENT">정률(%)</option>
              <option value="FIXED">정액(원)</option>
            </select>
          </div>
          <div class="form-field">
            <label class="field-label">할인 값{{ form.discountType === 'PERCENT' ? ' (%)' : ' (원)' }}</label>
            <input v-model.number="form.discountValue" type="number" min="1" class="field-input" />
          </div>
          <div class="form-field">
            <label class="field-label">최소 주문금액</label>
            <select v-model.number="form.minOrderAmount" class="field-input">
              <option :value="50000">5만원</option>
              <option :value="100000">10만원</option>
              <option :value="150000">15만원</option>
            </select>
          </div>
          <div class="form-field">
            <label class="field-label">유효기간 (선택)</label>
            <input v-model="form.expiresAt" type="date" :min="todayKst" class="field-input" />
          </div>
          <div class="form-field">
            <label class="field-label">사용 횟수 한도</label>
            <select v-model.number="form.usageLimit" class="field-input">
              <option :value="10">10회</option>
              <option :value="20">20회</option>
            </select>
          </div>
        </div>
        <p v-if="formError" class="form-error">{{ formError }}</p>
        <button class="create-btn" :disabled="creating" @click="createCoupon">
          {{ creating ? '생성 중...' : '쿠폰 생성' }}
        </button>
      </div>

      <v-progress-circular v-if="loading" indeterminate color="grey-darken-3" class="d-block mx-auto my-12" />

      <div v-else-if="!coupons.length" class="text-center py-12 text-grey">
        <v-icon size="48">mdi-ticket-percent-outline</v-icon>
        <p class="mt-3">아직 생성된 쿠폰이 없습니다</p>
      </div>

      <div v-else class="coupon-list">
        <div v-for="c in coupons" :key="c.id" class="coupon-card">
          <div class="coupon-top">
            <span class="coupon-code">{{ c.code }}</span>
            <v-chip :color="statusColor(c)" size="x-small" variant="tonal">{{ statusLabel(c) }}</v-chip>
          </div>
          <div class="coupon-body">
            <div class="coupon-info-row">
              <span class="coupon-label">할인</span>
              <span class="coupon-value">{{ discountText(c) }}</span>
            </div>
            <div class="coupon-info-row" v-if="c.min_order_amount">
              <span class="coupon-label">최소 주문금액</span>
              <span class="coupon-value">₩{{ Number(c.min_order_amount).toLocaleString() }}</span>
            </div>
            <div class="coupon-info-row">
              <span class="coupon-label">사용 현황</span>
              <span class="coupon-value">{{ c.used_count }}{{ c.usage_limit != null ? ` / ${c.usage_limit}` : '' }}회</span>
            </div>
            <div class="coupon-info-row" v-if="c.expires_at">
              <span class="coupon-label">유효기간</span>
              <span class="coupon-value">{{ formatDate(c.expires_at) }}까지</span>
            </div>
          </div>
          <div class="coupon-bottom">
            <button class="toggle-btn" @click="toggleActive(c)">
              {{ c.is_active ? '비활성화' : '활성화' }}
            </button>
            <button class="delete-btn" @click="deleteCoupon(c)">
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

const coupons = ref([]);
const loading = ref(true);
const creating = ref(false);
const formError = ref('');

const todayKst = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());

const emptyForm = () => ({
  code: '',
  discountType: 'PERCENT',
  discountValue: null,
  minOrderAmount: 50000,
  expiresAt: '',
  usageLimit: 10
});
const form = ref(emptyForm());

onMounted(async () => {
  const res = await axios.get('/api/admin/coupons');
  coupons.value = res.data;
  loading.value = false;
});

async function createCoupon() {
  formError.value = '';
  if (!form.value.code.trim()) { formError.value = '쿠폰 코드를 입력해주세요'; return; }
  if (!form.value.discountValue || form.value.discountValue <= 0) { formError.value = '할인 값을 입력해주세요'; return; }

  creating.value = true;
  try {
    const { data } = await axios.post('/api/admin/coupons', {
      code: form.value.code,
      discountType: form.value.discountType,
      discountValue: form.value.discountValue,
      minOrderAmount: form.value.minOrderAmount,
      expiresAt: form.value.expiresAt || undefined,
      usageLimit: form.value.usageLimit
    });
    coupons.value.unshift(data);
    form.value = emptyForm();
  } catch (e) {
    formError.value = e.response?.data?.error || '쿠폰 생성에 실패했습니다';
  } finally {
    creating.value = false;
  }
}

async function toggleActive(c) {
  const { data } = await axios.patch(`/api/admin/coupons/${c.id}`, { isActive: !c.is_active });
  Object.assign(c, data);
}

async function deleteCoupon(c) {
  if (!confirm(`쿠폰 ${c.code}을(를) 삭제하시겠습니까?`)) return;
  await axios.delete(`/api/admin/coupons/${c.id}`);
  coupons.value = coupons.value.filter(x => x.id !== c.id);
}

function discountText(c) {
  const base = c.discount_type === 'FIXED' ? `₩${Number(c.discount_value).toLocaleString()} 할인` : `${c.discount_value}% 할인`;
  return c.discount_type === 'PERCENT' && c.max_discount_amount
    ? `${base} (최대 ₩${Number(c.max_discount_amount).toLocaleString()})`
    : base;
}
function isExpired(c) {
  return c.expires_at && new Date(c.expires_at).getTime() <= Date.now();
}
function statusLabel(c) {
  if (isExpired(c)) return '기간만료';
  return c.is_active ? '사용중' : '비활성';
}
function statusColor(c) {
  if (isExpired(c)) return 'grey';
  return c.is_active ? 'green' : 'red';
}
function formatDate(dt) {
  return new Date(dt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}
</script>

<style scoped>
.page-title { font-size: 20px; font-weight: 800; color: #111; }
.page-sub { font-size: 12px; color: #999; margin-top: 2px; }

/* 생성 폼 */
.coupon-form-card {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 14px;
}
.form-field { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 11.5px; font-weight: 600; color: #777; }
.field-input {
  height: 38px;
  padding: 0 10px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  background: #fff;
}
.field-input:focus { border-color: #111; }
.form-error { margin: 12px 0 0; font-size: 12px; color: #e53e3e; }
.create-btn {
  margin-top: 16px;
  height: 40px;
  padding: 0 20px;
  border: none;
  border-radius: 6px;
  background: #111;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}
.create-btn:disabled { background: #ccc; cursor: not-allowed; }

/* 목록 */
.coupon-list { display: flex; flex-direction: column; gap: 10px; }
.coupon-card {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
}
.coupon-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}
.coupon-code { font-size: 14px; font-weight: 800; color: #111; letter-spacing: 0.5px; }
.coupon-body { padding: 10px 16px; }
.coupon-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 0;
}
.coupon-label { font-size: 12px; color: #888; }
.coupon-value { font-size: 13px; font-weight: 600; color: #333; }
.coupon-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  border-top: 1px solid #f0f0f0;
}
.toggle-btn {
  height: 32px;
  padding: 0 14px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fff;
  font-size: 12px;
  font-weight: 600;
  color: #555;
  cursor: pointer;
}
.toggle-btn:hover { border-color: #111; color: #111; }
.delete-btn {
  background: none;
  border: none;
  color: #bbb;
  cursor: pointer;
  padding: 4px;
}
.delete-btn:hover { color: #e53e3e; }

@media (max-width: 768px) {
  .admin-page { padding-top: 52px !important; }
  .admin-container { padding: 16px !important; }
  .page-title { font-size: 17px; }
}
</style>
