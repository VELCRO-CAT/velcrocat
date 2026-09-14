<template>
  <v-container class="py-16 mypage-wrap">
    <div class="text-center mb-10 reveal">
      <h1 class="text-h5 font-weight-bold" style="letter-spacing:2px">{{ t('mypage.title') }}</h1>
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
                  {{ item.size ? `${t('detail.sizeLabel')}: ${item.size}` : '' }}
                  {{ item.quantity ? `/ ${t('mypage.quantityLabel')}: ${item.quantity}` : '' }}
                </p>
                <p class="order-item-price">₩{{ Number(item.price).toLocaleString() }}</p>
              </div>
            </div>
          </div>
          <div class="order-total">
            {{ t('mypage.orderTotalLabel') }}: <strong>₩{{ Number(order.total).toLocaleString() }}</strong>
          </div>
        </div>
      </div>
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
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted, watch, nextTick, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../stores/auth';
import axios from 'axios';

const { t } = useI18n();
const authStore = useAuthStore();
const router = useRouter();

const tabs = computed(() => [
  { key: 'profile', label: t('mypage.tabProfile') },
  { key: 'password', label: t('mypage.tabPasswordChange') },
  { key: 'orders', label: t('mypage.tabOrders') },
  { key: 'withdraw', label: t('mypage.tabWithdraw') }
]);
const activeTab = ref('profile');

// 내 정보
const profile = reactive({ name: '', email: '' });
const profileMsg = ref('');
const profileMsgType = ref('success');
const profileLoading = ref(false);

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

  // 내 정보 로드
  try {
    const res = await axios.get('/api/users/me');
    profile.name = res.data.name;
    profile.email = res.data.email;
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

.mypage-tabs {
  display: flex;
  gap: 0;
  border-bottom: 2px solid #111;
  margin-bottom: 32px;
}
.mypage-tab {
  flex: 1;
  padding: 12px 0;
  background: none;
  border: none;
  font-size: 14px;
  font-weight: 500;
  color: #999;
  cursor: pointer;
  transition: all 0.2s;
  letter-spacing: 1px;
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

.order-total {
  text-align: right;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #eee;
  font-size: 14px;
  color: #333;
}
</style>
