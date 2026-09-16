<template>
  <v-container class="py-16 mypage-wrap">
    <div class="text-center mb-10 reveal">
      <h1 class="text-h5 font-weight-bold" style="letter-spacing:2px">마이페이지</h1>
      <p class="text-caption text-grey mt-1" style="letter-spacing:4px">MY PAGE</p>
    </div>

    <!-- 탭 -->
    <div class="mypage-tabs reveal">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="mypage-tab"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >{{ tab.label }}</button>
    </div>

    <!-- 주문 내역 -->
    <v-card v-if="activeTab === 'orders'" variant="outlined" class="pa-8 mypage-card reveal">
      <h2 class="text-h6 font-weight-bold mb-6">주문 내역</h2>
      <div v-if="ordersLoading" class="text-center py-8">
        <v-progress-circular indeterminate color="#111" />
      </div>
      <div v-else-if="orders.length === 0" class="text-center py-8 text-grey">
        주문 내역이 없습니다
      </div>
      <div v-else class="orders-list">
        <div v-for="order in orders" :key="order.order_no" class="order-card">
          <div class="order-header">
            <div>
              <span class="order-no">{{ order.order_no }}</span>
              <span class="order-date">{{ formatDate(order.created_at) }}</span>
            </div>
            <span class="order-status" :class="'status-' + order.status">{{ statusLabel(order.status) }}</span>
          </div>
          <div class="order-items">
            <div v-for="(item, i) in order.items" :key="i" class="order-item">
              <img :src="item.image" :alt="item.name" class="order-item-img" />
              <div class="order-item-info">
                <p class="order-item-name">{{ item.name }}</p>
                <p class="order-item-detail">
                  {{ item.size ? `사이즈: ${item.size}` : '' }}
                  {{ item.quantity ? `/ 수량: ${item.quantity}` : '' }}
                </p>
                <p class="order-item-price">₩{{ Number(item.price).toLocaleString() }}</p>
              </div>
            </div>
          </div>

          <!-- 주문한 배송지 -->
          <div v-if="order.shippingAddress?.address" class="order-shipping">
            <v-icon size="14" color="#999" class="mr-1">mdi-map-marker-outline</v-icon>
            <span class="order-shipping-text">
              {{ order.shippingAddress.name }}
              <span v-if="order.shippingAddress.phone">· {{ order.shippingAddress.phone }}</span>
              · {{ order.shippingAddress.address }} {{ order.shippingAddress.addressDetail }}
            </span>
          </div>

          <div class="order-total">
            합계: <strong>₩{{ Number(order.total).toLocaleString() }}</strong>
          </div>
        </div>
      </div>
    </v-card>

    <!-- 배송지 관리 -->
    <v-card v-if="activeTab === 'address'" variant="outlined" class="pa-8 mypage-card reveal">
      <h2 class="text-h6 font-weight-bold mb-2">기본 배송지</h2>
      <p class="text-body-2 text-grey mb-6">저장해두면 결제 시 자동으로 채워집니다.</p>
      <v-form @submit.prevent="saveAddress">
        <v-text-field
          v-model="addr.recipient"
          label="받는 사람"
          variant="outlined"
          density="comfortable"
          class="mb-3"
        />
        <v-text-field
          v-model="addr.phone"
          label="전화번호"
          placeholder="010-0000-0000"
          maxlength="13"
          variant="outlined"
          density="comfortable"
          class="mb-3"
          @input="addr.phone = formatPhone(addr.phone)"
        />
        <div class="d-flex ga-2 mb-3">
          <v-text-field
            v-model="addr.zip"
            label="우편번호"
            variant="outlined"
            density="comfortable"
            readonly
            hide-details
            @click="searchAddress"
            style="cursor:pointer"
          />
          <v-btn color="#111" size="large" height="56" @click="searchAddress">주소 검색</v-btn>
        </div>
        <v-text-field
          v-model="addr.address"
          label="주소"
          variant="outlined"
          density="comfortable"
          readonly
          placeholder="주소 검색 버튼을 클릭하세요"
          class="mb-3"
        />
        <v-text-field
          v-model="addr.addressDetail"
          label="상세주소"
          variant="outlined"
          density="comfortable"
          placeholder="동/호수, 건물명 등"
          class="mb-3"
        />
        <v-select
          v-model="addr.memo"
          :items="memoOptions"
          label="배송 메모 (선택)"
          variant="outlined"
          density="comfortable"
          class="mb-4"
        />
        <v-alert v-if="addrMsg" :type="addrMsgType" variant="tonal" density="compact" class="mb-4">{{ addrMsg }}</v-alert>
        <v-btn type="submit" color="#111" size="large" :loading="addrLoading">기본 배송지로 저장</v-btn>
      </v-form>
    </v-card>

    <!-- 내 정보 수정 -->
    <v-card v-if="activeTab === 'profile'" variant="outlined" class="pa-8 mypage-card reveal">
      <h2 class="text-h6 font-weight-bold mb-6">내 정보 수정</h2>
      <v-form @submit.prevent="updateProfile">
        <v-text-field
          v-model="profile.name"
          label="이름"
          variant="outlined"
          density="comfortable"
          class="mb-3"
        />
        <v-text-field
          v-model="profile.email"
          label="이메일"
          type="email"
          variant="outlined"
          density="comfortable"
          class="mb-4"
        />
        <v-alert v-if="profileMsg" :type="profileMsgType" variant="tonal" density="compact" class="mb-4">{{ profileMsg }}</v-alert>
        <v-btn type="submit" color="#111" size="large" :loading="profileLoading">저장</v-btn>
      </v-form>
    </v-card>

    <!-- 비밀번호 변경 -->
    <v-card v-if="activeTab === 'password'" variant="outlined" class="pa-8 mypage-card reveal">
      <h2 class="text-h6 font-weight-bold mb-6">비밀번호 변경</h2>
      <v-form @submit.prevent="changePassword">
        <v-text-field
          v-model="pw.current"
          label="현재 비밀번호"
          :type="showPw ? 'text' : 'password'"
          :append-inner-icon="showPw ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="showPw = !showPw"
          variant="outlined"
          density="comfortable"
          class="mb-3"
        />
        <v-text-field
          v-model="pw.new"
          label="새 비밀번호 (6자 이상)"
          :type="showPw ? 'text' : 'password'"
          variant="outlined"
          density="comfortable"
          class="mb-3"
        />
        <v-text-field
          v-model="pw.confirm"
          label="새 비밀번호 확인"
          :type="showPw ? 'text' : 'password'"
          variant="outlined"
          density="comfortable"
          class="mb-4"
        />
        <v-alert v-if="pwMsg" :type="pwMsgType" variant="tonal" density="compact" class="mb-4">{{ pwMsg }}</v-alert>
        <v-btn type="submit" color="#111" size="large" :loading="pwLoading">변경</v-btn>
      </v-form>
    </v-card>

    <!-- 회원 탈퇴 -->
    <v-card v-if="activeTab === 'withdraw'" variant="outlined" class="pa-8 mypage-card reveal">
      <h2 class="text-h6 font-weight-bold mb-4" style="color:#d32f2f">회원 탈퇴</h2>
      <p class="text-body-2 text-grey-darken-1 mb-6">
        탈퇴 시 모든 정보가 삭제되며 복구할 수 없습니다.<br>
        탈퇴를 원하시면 비밀번호를 입력해주세요.
      </p>
      <v-form @submit.prevent="withdraw">
        <v-text-field
          v-model="withdrawPw"
          label="비밀번호 확인"
          type="password"
          variant="outlined"
          density="comfortable"
          class="mb-4"
        />
        <v-alert v-if="withdrawMsg" type="error" variant="tonal" density="compact" class="mb-4">{{ withdrawMsg }}</v-alert>
        <v-btn type="submit" color="error" size="large" :loading="withdrawLoading">회원 탈퇴</v-btn>
      </v-form>
    </v-card>

    <!-- 주소 검색 팝업 -->
    <div v-if="showPostcode" class="postcode-overlay" @click.self="showPostcode = false">
      <div class="postcode-modal">
        <div class="postcode-header">
          <span>주소 검색</span>
          <button class="postcode-close" @click="showPostcode = false">✕</button>
        </div>
        <div id="mypage-daum-postcode-layer"></div>
      </div>
    </div>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import axios from 'axios';

const authStore = useAuthStore();
const router = useRouter();

const tabs = [
  { key: 'orders', label: '주문 내역' },
  { key: 'address', label: '배송지 관리' },
  { key: 'profile', label: '내 정보' },
  { key: 'password', label: '비밀번호 변경' },
  { key: 'withdraw', label: '회원 탈퇴' }
];
const activeTab = ref('orders');

// 내 정보
const profile = reactive({ name: '', email: '' });
const profileMsg = ref('');
const profileMsgType = ref('success');
const profileLoading = ref(false);

// 기본 배송지
const addr = reactive({ recipient: '', phone: '', zip: '', address: '', addressDetail: '', memo: '' });
const addrMsg = ref('');
const addrMsgType = ref('success');
const addrLoading = ref(false);
const showPostcode = ref(false);
const memoOptions = [
  '문 앞에 놓아주세요',
  '경비실에 맡겨주세요',
  '택배함에 넣어주세요',
  '배송 전 연락 부탁드립니다',
  '부재시 문 앞에 놓아주세요'
];

// 비밀번호
const pw = reactive({ current: '', new: '', confirm: '' });
const pwMsg = ref('');
const pwMsgType = ref('success');
const pwLoading = ref(false);
const showPw = ref(false);

// 주문
const orders = ref([]);
const ordersLoading = ref(false);

// 탈퇴
const withdrawPw = ref('');
const withdrawMsg = ref('');
const withdrawLoading = ref(false);

function showReveal() {
  nextTick(() => {
    document.querySelectorAll('.mypage-wrap .reveal').forEach((el, i) => {
      setTimeout(() => el.classList.add('visible'), 100 * (i + 1));
    });
  });
}

watch(activeTab, () => showReveal());

onMounted(async () => {
  showReveal();

  // 내 정보 + 기본 배송지 로드
  try {
    const res = await axios.get('/api/users/me');
    profile.name = res.data.name;
    profile.email = res.data.email;

    addr.recipient = res.data.default_recipient || res.data.name || '';
    addr.phone = res.data.default_phone || '';
    addr.zip = res.data.default_zip || '';
    addr.address = res.data.default_address || '';
    addr.addressDetail = res.data.default_address_detail || '';
    addr.memo = res.data.default_memo || '';
  } catch {}

  // 주문 로드
  ordersLoading.value = true;
  try {
    const res = await axios.get('/api/orders/my');
    orders.value = res.data;
  } catch {}
  ordersLoading.value = false;
});

async function updateProfile() {
  profileMsg.value = '';
  profileLoading.value = true;
  try {
    const res = await axios.put('/api/users/me', { name: profile.name, email: profile.email });
    // 로컬 스토리지 업데이트
    authStore.user = res.data.user;
    authStore.token = res.data.token;
    localStorage.setItem('user', JSON.stringify(res.data.user));
    localStorage.setItem('token', res.data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
    profileMsgType.value = 'success';
    profileMsg.value = '정보가 수정되었습니다';
  } catch (e) {
    profileMsgType.value = 'error';
    profileMsg.value = e.response?.data?.error || '수정에 실패했습니다';
  } finally {
    profileLoading.value = false;
  }
}

// 전화번호 자동 포맷팅 (체크아웃과 동일한 형식)
function formatPhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function searchAddress() {
  showPostcode.value = true;
  nextTick(() => {
    setTimeout(() => {
      new window.daum.Postcode({
        oncomplete(data) {
          addr.zip = data.zonecode;
          addr.address = data.roadAddress || data.jibunAddress;
          showPostcode.value = false;
        }
      }).embed(document.getElementById('mypage-daum-postcode-layer'));
    }, 100);
  });
}

async function saveAddress() {
  addrMsg.value = '';
  addrLoading.value = true;
  try {
    await axios.put('/api/users/me/address', { ...addr });
    addrMsgType.value = 'success';
    addrMsg.value = '기본 배송지가 저장되었습니다';
  } catch (e) {
    addrMsgType.value = 'error';
    addrMsg.value = e.response?.data?.error || '저장에 실패했습니다';
  } finally {
    addrLoading.value = false;
  }
}

async function changePassword() {
  pwMsg.value = '';
  if (pw.new !== pw.confirm) { pwMsgType.value = 'error'; pwMsg.value = '새 비밀번호가 일치하지 않습니다'; return; }
  if (pw.new.length < 6) { pwMsgType.value = 'error'; pwMsg.value = '새 비밀번호는 6자 이상이어야 합니다'; return; }
  pwLoading.value = true;
  try {
    await axios.put('/api/users/me/password', { currentPassword: pw.current, newPassword: pw.new });
    pwMsgType.value = 'success';
    pwMsg.value = '비밀번호가 변경되었습니다';
    pw.current = ''; pw.new = ''; pw.confirm = '';
  } catch (e) {
    pwMsgType.value = 'error';
    pwMsg.value = e.response?.data?.error || '변경에 실패했습니다';
  } finally {
    pwLoading.value = false;
  }
}

async function withdraw() {
  withdrawMsg.value = '';
  if (!withdrawPw.value) { withdrawMsg.value = '비밀번호를 입력해주세요'; return; }
  if (!confirm('정말로 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
  withdrawLoading.value = true;
  try {
    await axios.delete('/api/users/me', { data: { password: withdrawPw.value } });
    authStore.logout();
    router.push('/');
  } catch (e) {
    withdrawMsg.value = e.response?.data?.error || '탈퇴에 실패했습니다';
  } finally {
    withdrawLoading.value = false;
  }
}

function formatDate(d) {
  if (!d) return '';
  const date = new Date(d);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

function statusLabel(s) {
  const map = { paid: '결제완료', preparing: '준비중', shipped: '배송중', delivered: '배송완료', cancelled: '취소됨' };
  return map[s] || s;
}
</script>

<style scoped>
.reveal { opacity: 0; transform: translateY(30px); transition: opacity 0.5s ease, transform 0.5s ease; }
.reveal.visible { opacity: 1; transform: translateY(0); }

.mypage-wrap { max-width: 640px; margin: 0 auto; }

.mypage-tabs {
  display: flex;
  gap: 0;
  border-bottom: 2px solid #111;
  margin-bottom: 32px;
  overflow-x: auto;
}
.mypage-tab {
  flex: 1;
  padding: 12px 8px;
  background: none;
  border: none;
  font-size: 13px;
  color: #999;
  cursor: pointer;
  transition: all 0.2s;
  letter-spacing: 0.5px;
  white-space: nowrap;
}
.mypage-tab.active {
  color: #111;
  font-weight: 700;
  border-bottom: 2px solid #111;
  margin-bottom: -2px;
}
.mypage-tab:hover { color: #111; }

.mypage-card { border-radius: 0 !important; }

/* 주문 내역 */
.orders-list { display: flex; flex-direction: column; gap: 20px; }
.order-card { border: 1px solid #eee; padding: 20px; }
.order-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.order-no { font-weight: 600; font-size: 14px; letter-spacing: 0.5px; }
.order-date { color: #999; font-size: 13px; margin-left: 12px; }
.order-status { font-size: 12px; padding: 4px 10px; border-radius: 2px; font-weight: 600; }
.status-paid { background: #e3f2fd; color: #1565c0; }
.status-preparing { background: #fff3e0; color: #e65100; }
.status-shipped { background: #e8f5e9; color: #2e7d32; }
.status-delivered { background: #f5f5f5; color: #333; }
.status-cancelled { background: #fce4ec; color: #c62828; }

.order-items { display: flex; flex-direction: column; gap: 12px; }
.order-item { display: flex; gap: 12px; align-items: center; }
.order-item-img { width: 60px; height: 60px; object-fit: cover; border: 1px solid #eee; }
.order-item-info { flex: 1; }
.order-item-name { font-size: 14px; font-weight: 500; margin: 0; }
.order-item-detail { font-size: 12px; color: #999; margin: 2px 0; }
.order-item-price { font-size: 13px; font-weight: 600; margin: 0; }

.order-shipping {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed #eee;
}
.order-shipping-text { font-size: 12px; color: #888; line-height: 1.5; }

.order-total {
  text-align: right;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #eee;
  font-size: 14px;
  color: #333;
}

/* 주소 검색 팝업 (체크아웃과 동일한 스타일) */
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
</style>
