<template>
  <v-container class="py-16 mypage-wrap">
    <div class="text-center mb-10 reveal">
      <h1 class="text-h5 font-weight-bold" style="letter-spacing:2px">{{ t('mypage.title') }}</h1>
      <p class="text-caption text-grey mt-1" style="letter-spacing:4px">MY PAGE</p>
    </div>

    <!-- 프로필 요약 -->
    <div v-if="profile.name" class="mypage-hero reveal">
      <div class="mypage-hero-id">
        <div class="mypage-avatar">{{ avatarInitial }}</div>
        <div>
          <p class="mypage-hero-name">{{ profile.name }}</p>
          <p class="mypage-hero-sub">{{ profile.email }}<span v-if="joinedLabel"> · {{ joinedLabel }}</span></p>
        </div>
      </div>
      <div class="mypage-hero-stats">
        <div class="mypage-hero-stat">
          <span class="n">{{ orderStats.total }}</span>
          <span class="l">{{ t('mypage.statTotalOrders') }}</span>
        </div>
        <div class="mypage-hero-stat">
          <span class="n">{{ orderStats.inProgress }}</span>
          <span class="l">{{ t('mypage.statInProgress') }}</span>
        </div>
        <div class="mypage-hero-stat">
          <span class="n">₩{{ orderStats.spent.toLocaleString() }}</span>
          <span class="l">{{ t('mypage.statSpent') }}</span>
        </div>
      </div>
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
      <h2 class="text-h6 font-weight-bold mb-6">{{ t('mypage.tabOrders') }}</h2>
      <div v-if="ordersLoading" class="text-center py-8">
        <v-progress-circular indeterminate color="#111" />
      </div>
      <div v-else-if="orders.length === 0" class="text-center py-8 text-grey">
        {{ t('mypage.noOrders') }}
      </div>
      <div v-else class="orders-list">
        <template v-for="group in groupedOrders" :key="group.key">
          <p class="order-month-head">{{ group.label }}</p>
          <div
            v-for="order in group.orders"
            :key="order.order_no"
            class="order-card"
            :class="{ 'is-cancelled': order.status === 'cancelled' }"
          >
            <div class="order-header">
              <div>
                <span class="order-no">{{ order.order_no }}</span>
                <span class="order-date">{{ formatDate(order.created_at) }}</span>
              </div>
              <span v-if="order.status === 'cancelled'" class="order-cancel-flag">{{ statusLabel('cancelled') }}</span>
            </div>

            <div v-if="order.status !== 'cancelled'" class="order-stepper">
              <div class="order-stepper-track">
                <template v-for="(s, idx) in STEP_ORDER" :key="s">
                  <span class="order-stepper-node" :class="{ done: idx <= stepIndex(order.status) }"></span>
                  <span v-if="idx < STEP_ORDER.length - 1" class="order-stepper-bar" :class="{ done: idx < stepIndex(order.status) }"></span>
                </template>
              </div>
              <div class="order-stepper-labels">
                <span v-for="s in STEP_ORDER" :key="s" :class="{ on: s === order.status }">{{ statusLabel(s) }}</span>
              </div>
            </div>

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

            <!-- 주문한 배송지 -->
            <div v-if="order.shippingAddress?.address" class="order-shipping">
              <v-icon size="14" color="#999" class="mr-1">mdi-map-marker-outline</v-icon>
              <span class="order-shipping-text">
                {{ order.shippingAddress.name }}
                <span v-if="order.shippingAddress.phone">· {{ order.shippingAddress.phone }}</span>
                · {{ order.shippingAddress.address }} {{ order.shippingAddress.addressDetail }}
              </span>
            </div>

            <div class="order-footer">
              <div class="order-total">
                {{ t('mypage.orderTotalLabel') }}: <strong>₩{{ Number(order.total).toLocaleString() }}</strong>
              </div>
              <div class="order-actions">
                <router-link
                  v-if="order.status === 'delivered' && order.items.length === 1"
                  :to="`/products/${order.items[0].id}`"
                  class="order-action-btn"
                >{{ t('mypage.rebuyBtn') }}</router-link>
                <router-link to="/contact" class="order-action-btn">{{ t('mypage.contactBtn') }}</router-link>
              </div>
            </div>
          </div>
        </template>
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
      <h2 class="text-h6 font-weight-bold mb-6">{{ t('mypage.profileTitle') }}</h2>
      <v-form @submit.prevent="updateProfile">
        <v-text-field
          v-model="profile.name"
          :label="t('auth.nameLabel')"
          variant="outlined"
          density="comfortable"
          class="mb-3"
        />
        <v-text-field
          v-model="profile.email"
          :label="t('auth.emailLabel')"
          type="email"
          variant="outlined"
          density="comfortable"
          class="mb-4"
        />
        <v-alert v-if="profileMsg" :type="profileMsgType" variant="tonal" density="compact" class="mb-4">{{ profileMsg }}</v-alert>
        <v-btn type="submit" color="#111" size="large" :loading="profileLoading">{{ t('common.save') }}</v-btn>
      </v-form>
    </v-card>

    <!-- 비밀번호 변경 -->
    <v-card v-if="activeTab === 'password'" variant="outlined" class="pa-8 mypage-card reveal">
      <h2 class="text-h6 font-weight-bold mb-6">{{ t('mypage.passwordTitle') }}</h2>
      <v-form @submit.prevent="changePassword">
        <v-text-field
          v-model="pw.current"
          :label="t('mypage.currentPasswordLabel')"
          :type="showPw ? 'text' : 'password'"
          :append-inner-icon="showPw ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="showPw = !showPw"
          variant="outlined"
          density="comfortable"
          class="mb-3"
        />
        <v-text-field
          v-model="pw.new"
          :label="t('auth.newPasswordLabel')"
          :type="showPw ? 'text' : 'password'"
          variant="outlined"
          density="comfortable"
          class="mb-3"
        />
        <v-text-field
          v-model="pw.confirm"
          :label="t('auth.newPasswordConfirmLabel')"
          :type="showPw ? 'text' : 'password'"
          variant="outlined"
          density="comfortable"
          class="mb-4"
        />
        <v-alert v-if="pwMsg" :type="pwMsgType" variant="tonal" density="compact" class="mb-4">{{ pwMsg }}</v-alert>
        <v-btn type="submit" color="#111" size="large" :loading="pwLoading">{{ t('mypage.changeBtn') }}</v-btn>
      </v-form>
    </v-card>

    <!-- 회원 탈퇴 -->
    <v-card v-if="activeTab === 'withdraw'" variant="outlined" class="pa-8 mypage-card reveal">
      <h2 class="text-h6 font-weight-bold mb-4" style="color:#d32f2f">{{ t('mypage.withdrawTitle') }}</h2>
      <p class="text-body-2 text-grey-darken-1 mb-6" v-html="t('mypage.withdrawWarning')"></p>
      <v-form @submit.prevent="withdraw">
        <v-text-field
          v-model="withdrawPw"
          :label="t('mypage.withdrawPasswordLabel')"
          type="password"
          variant="outlined"
          density="comfortable"
          class="mb-4"
        />
        <v-alert v-if="withdrawMsg" type="error" variant="tonal" density="compact" class="mb-4">{{ withdrawMsg }}</v-alert>
        <v-btn type="submit" color="error" size="large" :loading="withdrawLoading">{{ t('mypage.withdrawBtn') }}</v-btn>
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
import { ref, reactive, onMounted, watch, nextTick, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../stores/auth';
import axios from 'axios';

const { t, locale } = useI18n();
const authStore = useAuthStore();
const router = useRouter();

const LOCALE_TAGS = { ko: 'ko-KR', en: 'en-US', zh: 'zh-CN', ja: 'ja-JP' };
const STEP_ORDER = ['paid', 'confirmed', 'processing', 'shipped', 'delivered'];
function stepIndex(status) {
  const i = STEP_ORDER.indexOf(status);
  return i === -1 ? 0 : i;
}

// 주문내역을 기본 탭으로 노출 (배송지 관리는 아직 번역 키가 없어 한국어 고정)
const tabs = computed(() => [
  { key: 'orders', label: t('mypage.tabOrders') },
  { key: 'address', label: '배송지 관리' },
  { key: 'profile', label: t('mypage.tabProfile') },
  { key: 'password', label: t('mypage.tabPasswordChange') },
  { key: 'withdraw', label: t('mypage.tabWithdraw') }
]);
const activeTab = ref('orders');

// 내 정보
const profile = reactive({ name: '', email: '', createdAt: '' });
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

const avatarInitial = computed(() => (profile.name || '').trim().charAt(0).toUpperCase() || '?');

const joinedLabel = computed(() => {
  if (!profile.createdAt) return '';
  const tag = LOCALE_TAGS[locale.value] || 'ko-KR';
  const formatted = new Intl.DateTimeFormat(tag, { year: 'numeric', month: 'short' }).format(new Date(profile.createdAt));
  return t('mypage.joinedSince', { date: formatted });
});

const IN_PROGRESS_STATUSES = ['paid', 'confirmed', 'processing', 'shipped'];
const orderStats = computed(() => {
  const list = orders.value;
  return {
    total: list.length,
    inProgress: list.filter(o => IN_PROGRESS_STATUSES.includes(o.status)).length,
    spent: list.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + Number(o.total || 0), 0)
  };
});

const groupedOrders = computed(() => {
  const tag = LOCALE_TAGS[locale.value] || 'ko-KR';
  const formatter = new Intl.DateTimeFormat(tag, { year: 'numeric', month: 'long' });
  const groups = [];
  const byKey = new Map();
  for (const order of orders.value) {
    const d = new Date(order.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!byKey.has(key)) {
      const group = { key, label: formatter.format(d), orders: [] };
      byKey.set(key, group);
      groups.push(group);
    }
    byKey.get(key).orders.push(order);
  }
  return groups;
});

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
    profile.createdAt = res.data.created_at || '';

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
    profileMsg.value = t('mypage.profileUpdateSuccess');
  } catch (e) {
    profileMsgType.value = 'error';
    profileMsg.value = e.response?.data?.error || t('mypage.profileUpdateFailed');
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
  if (pw.new !== pw.confirm) { pwMsgType.value = 'error'; pwMsg.value = t('mypage.passwordMismatchNew'); return; }
  if (pw.new.length < 6) { pwMsgType.value = 'error'; pwMsg.value = t('mypage.passwordTooShortNew'); return; }
  pwLoading.value = true;
  try {
    await axios.put('/api/users/me/password', { currentPassword: pw.current, newPassword: pw.new });
    pwMsgType.value = 'success';
    pwMsg.value = t('mypage.passwordChangeSuccess');
    pw.current = ''; pw.new = ''; pw.confirm = '';
  } catch (e) {
    pwMsgType.value = 'error';
    pwMsg.value = e.response?.data?.error || t('mypage.passwordChangeFailedGeneric');
  } finally {
    pwLoading.value = false;
  }
}

async function withdraw() {
  withdrawMsg.value = '';
  if (!withdrawPw.value) { withdrawMsg.value = t('mypage.withdrawEnterPassword'); return; }
  if (!confirm(t('mypage.withdrawConfirm'))) return;
  withdrawLoading.value = true;
  try {
    await axios.delete('/api/users/me', { data: { password: withdrawPw.value } });
    authStore.logout();
    router.push('/');
  } catch (e) {
    withdrawMsg.value = e.response?.data?.error || t('mypage.withdrawFailed');
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
  const map = {
    paid: t('mypage.statusPaid'),
    confirmed: t('mypage.statusConfirmed'),
    processing: t('mypage.statusProcessing'),
    preparing: t('mypage.statusPreparing'),
    shipped: t('mypage.statusShipped'),
    delivered: t('mypage.statusDelivered'),
    cancelled: t('mypage.statusCancelled')
  };
  return map[s] || s;
}
</script>

<style scoped>
.reveal { opacity: 0; transform: translateY(30px); transition: opacity 0.5s ease, transform 0.5s ease; }
.reveal.visible { opacity: 1; transform: translateY(0); }

.mypage-wrap { max-width: 640px; margin: 0 auto; }

/* 프로필 요약 */
.mypage-hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 16px;
  padding-bottom: 20px;
  margin-bottom: 28px;
  border-bottom: 1px solid #eee;
}
.mypage-hero-id { display: flex; align-items: center; gap: 14px; }
.mypage-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #f5f5f5;
  border: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 15px;
  flex-shrink: 0;
}
.mypage-hero-name { font-size: 15px; font-weight: 700; margin: 0; }
.mypage-hero-sub { font-size: 12px; color: #999; margin: 3px 0 0; }
.mypage-hero-stats { display: flex; gap: 22px; }
.mypage-hero-stat { text-align: right; }
.mypage-hero-stat .n { display: block; font-size: 17px; font-weight: 700; letter-spacing: -0.02em; }
.mypage-hero-stat .l { display: block; font-size: 10px; color: #999; letter-spacing: 0.04em; margin-top: 2px; }

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
.order-month-head {
  font-size: 12px;
  font-weight: 700;
  color: #999;
  letter-spacing: 0.04em;
  margin: 28px 0 12px;
}
.order-month-head:first-child { margin-top: 0; }

.orders-list { display: flex; flex-direction: column; gap: 16px; }
.order-card { border: 1px solid #eee; padding: 20px; }
.order-card.is-cancelled { opacity: 0.6; }
.order-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
.order-no { font-weight: 600; font-size: 14px; letter-spacing: 0.5px; }
.order-date { color: #999; font-size: 13px; margin-left: 12px; }
.order-cancel-flag { font-size: 11px; font-weight: 700; color: #c62828; background: #fce4ec; padding: 4px 9px; border-radius: 2px; }

/* 주문 상태 스텝 */
.order-stepper { margin-bottom: 18px; }
.order-stepper-track { display: flex; align-items: center; }
.order-stepper-node { width: 7px; height: 7px; border-radius: 50%; background: #e0e0e0; flex-shrink: 0; }
.order-stepper-node.done { background: #111; }
.order-stepper-bar { flex: 1; height: 1px; background: #e0e0e0; margin: 0 4px; min-width: 8px; }
.order-stepper-bar.done { background: #111; }
.order-stepper-labels { display: flex; justify-content: space-between; margin-top: 6px; }
.order-stepper-labels span { font-size: 10px; color: #bbb; }
.order-stepper-labels span.on { color: #111; font-weight: 700; }

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

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #eee;
}
.order-total { font-size: 14px; color: #333; }
.order-actions { display: flex; gap: 8px; }
.order-action-btn {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
  padding: 7px 12px;
  border: 1px solid #111;
  color: #111;
  text-decoration: none;
  white-space: nowrap;
}
.order-action-btn:hover { background: #111; color: #fff; }

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
