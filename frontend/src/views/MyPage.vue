<template>
  <v-container class="py-16 mypage-wrap">
    <div class="text-center mb-10 reveal">
      <h1 class="text-h5 font-weight-bold" style="letter-spacing:2px">{{ t('mypage.title') }}</h1>
      <p class="text-caption text-grey mt-1" style="letter-spacing:4px">MY PAGE</p>
    </div>

    <div class="mypage-layout reveal">
      <!-- 사이드바 (데스크톱) -->
      <aside class="mypage-sidebar">
        <template v-for="group in sidebarGroups" :key="group.label">
          <p class="mypage-sidebar-group">{{ group.label }}</p>
          <button
            v-for="item in group.items"
            :key="item.key"
            class="mypage-sidebar-link"
            :class="{ active: activeSection === item.key, danger: item.danger }"
            @click="item.action ? logout() : (activeSection = item.key)"
          >{{ item.label }}</button>
        </template>
      </aside>

      <!-- 사이드바 (모바일: 세로 리스트, u-ur 마이쇼핑 메뉴 참고) -->
      <div class="mypage-mobile-nav">
        <template v-for="group in sidebarGroups" :key="group.label">
          <p class="mypage-mobile-group">{{ group.label }}</p>
          <button
            v-for="item in group.items"
            :key="item.key"
            class="mypage-mobile-link"
            :class="{ active: activeSection === item.key, danger: item.danger }"
            @click="selectMobileSection(item)"
          >
            <span>{{ item.label }}</span>
            <v-icon size="18" color="#bbb">mdi-chevron-right</v-icon>
          </button>
        </template>
      </div>

      <!-- 콘텐츠 -->
      <div class="mypage-content">
        <!-- 주문 내역 -->
        <section v-show="activeSection === 'orders'">
          <div v-if="profile.name" class="mypage-stats">
            <div class="mypage-stat">
              <v-icon size="18" color="#999">mdi-receipt-text-outline</v-icon>
              <span class="n">{{ orderStats.total }}</span>
              <span class="l">{{ t('mypage.statTotalOrders') }}</span>
            </div>
            <div class="mypage-stat">
              <v-icon size="18" color="#999">mdi-progress-clock</v-icon>
              <span class="n">{{ orderStats.inProgress }}</span>
              <span class="l">{{ t('mypage.statInProgress') }}</span>
            </div>
            <div class="mypage-stat">
              <v-icon size="18" color="#999">mdi-wallet-outline</v-icon>
              <span class="n">₩{{ orderStats.spent.toLocaleString() }}</span>
              <span class="l">{{ t('mypage.statSpent') }}</span>
            </div>
          </div>

          <h2 class="mypage-section-title">{{ t('mypage.funnelTitle') }}</h2>
          <div class="order-funnel">
            <template v-for="(f, i) in orderFunnel" :key="f.key">
              <div class="order-funnel-step">
                <span class="n">{{ f.count }}</span>
                <span class="l">{{ f.label }}</span>
              </div>
              <v-icon v-if="i < orderFunnel.length - 1" size="16" color="#ccc">mdi-chevron-right</v-icon>
            </template>
          </div>

          <h2 class="mypage-section-title">{{ t('mypage.tabOrders') }}</h2>
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

                <p class="order-section-label">{{ t('mypage.sectionItems') }}</p>
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

                <p class="order-section-label">{{ t('mypage.sectionPayment') }}</p>
                <div class="order-payment">
                  <div class="order-payment-row">
                    <span>{{ t('mypage.paymentMethodLabel') }}</span>
                    <span>{{ paymentMethodLabel(order.payment_method) }}</span>
                  </div>
                  <div class="order-payment-row">
                    <span>{{ t('mypage.itemsSubtotalLabel') }}</span>
                    <span>₩{{ itemsSubtotal(order).toLocaleString() }}</span>
                  </div>
                  <div class="order-payment-row order-payment-total">
                    <span>{{ t('mypage.orderTotalLabel') }}</span>
                    <span>₩{{ Number(order.total).toLocaleString() }}</span>
                  </div>
                </div>

                <!-- 주문한 배송지 -->
                <template v-if="order.shippingAddress?.address">
                  <p class="order-section-label">{{ t('mypage.sectionShipping') }}</p>
                  <div class="order-shipping">
                    <v-icon size="14" color="#999" class="mr-1">mdi-map-marker-outline</v-icon>
                    <span class="order-shipping-text">
                      {{ order.shippingAddress.name }}
                      <span v-if="order.shippingAddress.phone">· {{ order.shippingAddress.phone }}</span>
                      · {{ order.shippingAddress.address }} {{ order.shippingAddress.addressDetail }}
                      <span v-if="order.shippingAddress.memo"><br>{{ t('mypage.shippingMemoLabel') }}: {{ order.shippingAddress.memo }}</span>
                    </span>
                  </div>
                </template>

                <div class="order-footer">
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

          <div v-if="ordersTotalPages > 1" class="pagination">
            <button class="page-nav-btn" :disabled="ordersPage === 1" @click="goToOrdersPage(ordersPage - 1)">
              <v-icon size="16">mdi-chevron-left</v-icon>
            </button>
            <template v-for="(p, i) in ordersPageNumbers" :key="i">
              <span v-if="p === '...'" class="page-ellipsis">…</span>
              <button v-else class="page-num-btn" :class="{ active: p === ordersPage }" @click="goToOrdersPage(p)">{{ p }}</button>
            </template>
            <button class="page-nav-btn" :disabled="ordersPage === ordersTotalPages" @click="goToOrdersPage(ordersPage + 1)">
              <v-icon size="16">mdi-chevron-right</v-icon>
            </button>
          </div>
        </section>

        <!-- 배송지 관리 -->
        <section v-show="activeSection === 'address'">
          <div class="addr-section-head">
            <div>
              <h2 class="mypage-section-title mb-0">배송지 관리</h2>
              <p class="text-body-2 text-grey mt-2">기본 배송지는 결제 시 자동으로 채워집니다. 여러 곳을 등록해두고 필요할 때 기본으로 바꿔 쓸 수 있어요.</p>
            </div>
            <v-btn v-if="!addrFormOpen" variant="outlined" color="#111" @click="openAddAddressForm">+ 새 배송지</v-btn>
          </div>

          <!-- 배송지 목록 -->
          <div v-if="!addrFormOpen">
            <div v-if="addressesLoading" class="text-center py-8">
              <v-progress-circular indeterminate color="#111" />
            </div>
            <div v-else-if="addresses.length === 0" class="text-center py-8 text-grey">
              등록된 배송지가 없습니다
            </div>
            <div v-else class="addr-list">
              <div v-for="a in addresses" :key="a.id" class="addr-card" :class="{ 'is-default': a.is_default }">
                <div class="addr-card-head">
                  <span v-if="a.is_default" class="addr-default-badge">기본 배송지</span>
                  <span class="addr-recipient">{{ a.recipient }}</span>
                  <span v-if="a.phone" class="addr-phone">· {{ a.phone }}</span>
                </div>
                <p class="addr-line">({{ a.zip }}) {{ a.address }} {{ a.address_detail }}</p>
                <p v-if="a.memo" class="addr-memo">{{ a.memo }}</p>
                <div class="addr-actions">
                  <button v-if="!a.is_default" class="addr-action-btn" @click="setDefaultAddress(a)">기본으로 설정</button>
                  <button class="addr-action-btn" @click="openEditAddressForm(a)">수정</button>
                  <button class="addr-action-btn addr-action-danger" @click="deleteAddressCard(a)">삭제</button>
                </div>
              </div>
            </div>
          </div>

          <!-- 배송지 추가/수정 폼 -->
          <v-form v-else @submit.prevent="saveAddress">
            <label class="field-label">받는 사람</label>
            <v-text-field v-model="addr.recipient" variant="outlined" density="comfortable" hide-details class="mb-3" />

            <label class="field-label">전화번호</label>
            <v-text-field
              v-model="addr.phone"
              placeholder="010-0000-0000"
              maxlength="13"
              variant="outlined"
              density="comfortable"
              hide-details
              class="mb-3"
              @input="addr.phone = formatPhone(addr.phone)"
            />

            <label class="field-label">우편번호</label>
            <div class="d-flex ga-2 mb-3">
              <v-text-field
                v-model="addr.zip"
                variant="outlined"
                density="comfortable"
                readonly
                hide-details
                @click="searchAddress"
                style="cursor:pointer"
              />
              <v-btn variant="outlined" color="#111" size="large" height="56" @click="searchAddress">주소 검색</v-btn>
            </div>

            <label class="field-label">주소</label>
            <v-text-field
              v-model="addr.address"
              variant="outlined"
              density="comfortable"
              hide-details
              readonly
              placeholder="주소 검색 버튼을 클릭하세요"
              class="mb-3"
            />

            <label class="field-label">상세주소</label>
            <v-text-field
              v-model="addr.addressDetail"
              variant="outlined"
              density="comfortable"
              hide-details
              placeholder="동/호수, 건물명 등"
              class="mb-3"
            />

            <label class="field-label">배송 메모 (선택)</label>
            <v-select v-model="addr.memo" :items="memoOptions" variant="outlined" density="comfortable" hide-details class="mb-2" />

            <v-checkbox
              v-if="editingAddrId === null && addresses.length > 0"
              v-model="addr.isDefault"
              label="기본 배송지로 설정"
              density="compact"
              hide-details
              class="mb-4"
            />
            <v-alert v-if="addrMsg" :type="addrMsgType" variant="tonal" density="compact" class="mb-4">{{ addrMsg }}</v-alert>
            <div class="d-flex ga-2">
              <v-btn type="submit" variant="outlined" color="#111" size="large" :loading="addrLoading">저장</v-btn>
              <v-btn variant="outlined" color="#111" size="large" @click="closeAddrForm">취소</v-btn>
            </div>
          </v-form>
        </section>

        <!-- 내 정보 수정 -->
        <section v-show="activeSection === 'profile'">
          <h2 class="mypage-section-title">{{ t('mypage.profileTitle') }}</h2>
          <v-form @submit.prevent="updateProfile">
            <label class="field-label">{{ t('auth.nameLabel') }}</label>
            <v-text-field v-model="profile.name" variant="outlined" density="comfortable" hide-details class="mb-3" />

            <label class="field-label">{{ t('auth.emailLabel') }}</label>
            <v-text-field v-model="profile.email" type="email" variant="outlined" density="comfortable" hide-details class="mb-4" />

            <v-alert v-if="profileMsg" :type="profileMsgType" variant="tonal" density="compact" class="mb-4">{{ profileMsg }}</v-alert>
            <v-btn type="submit" variant="outlined" color="#111" size="large" :loading="profileLoading">{{ t('common.save') }}</v-btn>
          </v-form>
        </section>

        <!-- 비밀번호 변경 -->
        <section v-show="activeSection === 'password'">
          <h2 class="mypage-section-title">{{ t('mypage.passwordTitle') }}</h2>
          <v-form @submit.prevent="changePassword">
            <label class="field-label">{{ t('mypage.currentPasswordLabel') }}</label>
            <v-text-field
              v-model="pw.current"
              :type="showPw ? 'text' : 'password'"
              :append-inner-icon="showPw ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showPw = !showPw"
              variant="outlined"
              density="comfortable"
              hide-details
              class="mb-3"
            />
            <label class="field-label">{{ t('auth.newPasswordLabel') }}</label>
            <v-text-field v-model="pw.new" :type="showPw ? 'text' : 'password'" variant="outlined" density="comfortable" hide-details class="mb-3" />

            <label class="field-label">{{ t('auth.newPasswordConfirmLabel') }}</label>
            <v-text-field v-model="pw.confirm" :type="showPw ? 'text' : 'password'" variant="outlined" density="comfortable" hide-details class="mb-4" />

            <v-alert v-if="pwMsg" :type="pwMsgType" variant="tonal" density="compact" class="mb-4">{{ pwMsg }}</v-alert>
            <v-btn type="submit" variant="outlined" color="#111" size="large" :loading="pwLoading">{{ t('mypage.changeBtn') }}</v-btn>
          </v-form>
        </section>

        <!-- 회원 탈퇴 -->
        <section v-show="activeSection === 'withdraw'">
          <h2 class="mypage-section-title" style="color:#d32f2f">{{ t('mypage.withdrawTitle') }}</h2>
          <p class="text-body-2 text-grey-darken-1 mb-6" v-html="t('mypage.withdrawWarning')"></p>
          <v-form @submit.prevent="withdraw">
            <p class="text-body-2 text-grey-darken-1 mb-2" v-html="t('mypage.withdrawTypeConfirmLabel', { phrase: WITHDRAW_CONFIRM_PHRASE })"></p>
            <v-text-field
              v-model="withdrawConfirmText"
              :placeholder="WITHDRAW_CONFIRM_PHRASE"
              variant="outlined"
              density="comfortable"
              hide-details
              class="mb-4"
            />
            <v-alert v-if="withdrawMsg" type="error" variant="tonal" density="compact" class="mb-4">{{ withdrawMsg }}</v-alert>
            <v-btn
              type="submit"
              color="error"
              size="large"
              :loading="withdrawLoading"
              :disabled="!withdrawConfirmValid"
            >{{ t('mypage.withdrawBtn') }}</v-btn>
          </v-form>
        </section>
      </div>
    </div>

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
import { ref, reactive, onMounted, nextTick, computed } from 'vue';
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

// u-ur의 My Account 좌측 사이드바를 참고한 섹션 전환 — 페이지 이동 없이
// 같은 /mypage 안에서 클릭한 섹션만 보여줌(v-show)
const activeSection = ref('orders');
const sidebarGroups = computed(() => [
  {
    label: t('mypage.groupShopping'),
    items: [
      { key: 'orders', label: t('mypage.tabOrders') },
      { key: 'address', label: '배송지 관리' }
    ]
  },
  {
    label: t('mypage.groupAccount'),
    items: [
      { key: 'profile', label: t('mypage.tabProfile') },
      { key: 'password', label: t('mypage.tabPasswordChange') },
      { key: 'logout', label: t('nav.signOut'), action: true },
      { key: 'withdraw', label: t('mypage.tabWithdraw'), danger: true }
    ]
  }
]);
function selectMobileSection(item) {
  if (item.action) { logout(); return; }
  activeSection.value = item.key;
  if (window.innerWidth <= 768) {
    nextTick(() => {
      document.querySelector('.mypage-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
}

function logout() {
  authStore.logout();
  router.push('/products');
}

// 내 정보
const profile = reactive({ name: '', email: '', createdAt: '' });
const profileMsg = ref('');
const profileMsgType = ref('success');
const profileLoading = ref(false);

// 배송지 관리 (여러 개 저장 가능, 기본 배송지는 1곳)
const addresses = ref([]);
const addressesLoading = ref(false);
const addrFormOpen = ref(false);
const editingAddrId = ref(null);
const addr = reactive({ recipient: '', phone: '', zip: '', address: '', addressDetail: '', memo: '문 앞에 놓아주세요', isDefault: false });
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

// 주문내역 페이지네이션 (10건씩)
const ORDERS_PAGE_SIZE = 10;
const ordersPage = ref(1);
const ordersTotalPages = computed(() => Math.max(1, Math.ceil(orders.value.length / ORDERS_PAGE_SIZE)));
const pagedOrdersList = computed(() => {
  const start = (ordersPage.value - 1) * ORDERS_PAGE_SIZE;
  return orders.value.slice(start, start + ORDERS_PAGE_SIZE);
});
const ordersPageNumbers = computed(() => {
  const total = ordersTotalPages.value;
  const cur = ordersPage.value;
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
function goToOrdersPage(p) {
  if (p < 1 || p > ordersTotalPages.value) return;
  ordersPage.value = p;
}

const IN_PROGRESS_STATUSES = ['paid', 'confirmed', 'processing', 'shipped'];
const orderStats = computed(() => {
  const list = orders.value;
  return {
    total: list.length,
    inProgress: list.filter(o => IN_PROGRESS_STATUSES.includes(o.status)).length,
    spent: list.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + Number(o.total || 0), 0)
  };
});

// u-ur의 "나의 주문처리 현황" 단계별 건수 집계를 참고 — 우리 주문 상태에 맞춰 4단계로 재구성
const orderFunnel = computed(() => {
  const list = orders.value.filter(o => o.status !== 'cancelled');
  const count = pred => list.filter(pred).length;
  return [
    { key: 'paid', label: t('mypage.statusPaid'), count: count(o => o.status === 'paid') },
    { key: 'preparing', label: t('mypage.statusProcessing'), count: count(o => o.status === 'confirmed' || o.status === 'processing') },
    { key: 'shipped', label: t('mypage.statusShipped'), count: count(o => o.status === 'shipped') },
    { key: 'delivered', label: t('mypage.statusDelivered'), count: count(o => o.status === 'delivered') }
  ];
});

const groupedOrders = computed(() => {
  const tag = LOCALE_TAGS[locale.value] || 'ko-KR';
  const formatter = new Intl.DateTimeFormat(tag, { year: 'numeric', month: 'long' });
  const groups = [];
  const byKey = new Map();
  for (const order of pagedOrdersList.value) {
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

// 탈퇴 — "탈퇴합니다" 문구를 정확히 입력해야만 버튼이 활성화됨
const WITHDRAW_CONFIRM_PHRASE = '탈퇴합니다';
const withdrawConfirmText = ref('');
const withdrawConfirmValid = computed(() => withdrawConfirmText.value.trim() === WITHDRAW_CONFIRM_PHRASE);
const withdrawMsg = ref('');
const withdrawLoading = ref(false);

function showReveal() {
  nextTick(() => {
    document.querySelectorAll('.mypage-wrap .reveal').forEach((el, i) => {
      setTimeout(() => el.classList.add('visible'), 100 * (i + 1));
    });
  });
}

onMounted(async () => {
  showReveal();

  // 내 정보
  try {
    const res = await axios.get('/api/users/me');
    profile.name = res.data.name;
    profile.email = res.data.email;
    profile.createdAt = res.data.created_at || '';
  } catch {}

  // 배송지 목록
  loadAddresses();

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

async function loadAddresses() {
  addressesLoading.value = true;
  try {
    const res = await axios.get('/api/addresses');
    addresses.value = res.data;
  } catch {}
  addressesLoading.value = false;
}

function resetAddrForm() {
  addr.recipient = profile.name || '';
  addr.phone = '';
  addr.zip = '';
  addr.address = '';
  addr.addressDetail = '';
  addr.memo = '문 앞에 놓아주세요';
  addr.isDefault = false;
}

function openAddAddressForm() {
  editingAddrId.value = null;
  resetAddrForm();
  addrMsg.value = '';
  addrFormOpen.value = true;
}

function openEditAddressForm(a) {
  editingAddrId.value = a.id;
  addr.recipient = a.recipient || '';
  addr.phone = a.phone || '';
  addr.zip = a.zip || '';
  addr.address = a.address || '';
  addr.addressDetail = a.address_detail || '';
  addr.memo = a.memo || '문 앞에 놓아주세요';
  addr.isDefault = !!a.is_default;
  addrMsg.value = '';
  addrFormOpen.value = true;
}

function closeAddrForm() {
  addrFormOpen.value = false;
  addrMsg.value = '';
}

async function saveAddress() {
  addrMsg.value = '';
  addrLoading.value = true;
  try {
    const payload = {
      recipient: addr.recipient,
      phone: addr.phone,
      zip: addr.zip,
      address: addr.address,
      addressDetail: addr.addressDetail,
      memo: addr.memo,
      isDefault: addr.isDefault
    };
    if (editingAddrId.value) {
      await axios.put(`/api/addresses/${editingAddrId.value}`, payload);
    } else {
      await axios.post('/api/addresses', payload);
    }
    await loadAddresses();
    addrFormOpen.value = false;
  } catch (e) {
    addrMsgType.value = 'error';
    addrMsg.value = e.response?.data?.error || '저장에 실패했습니다';
  } finally {
    addrLoading.value = false;
  }
}

async function setDefaultAddress(a) {
  try {
    await axios.patch(`/api/addresses/${a.id}/default`);
    await loadAddresses();
  } catch {}
}

async function deleteAddressCard(a) {
  if (!confirm('이 배송지를 삭제하시겠습니까?')) return;
  try {
    await axios.delete(`/api/addresses/${a.id}`);
    await loadAddresses();
  } catch {}
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
  if (!withdrawConfirmValid.value) { withdrawMsg.value = t('mypage.withdrawTypeConfirmError', { phrase: WITHDRAW_CONFIRM_PHRASE }); return; }
  withdrawLoading.value = true;
  try {
    await axios.delete('/api/users/me');
    authStore.logout();
    router.push('/products');
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

function paymentMethodLabel(m) {
  const map = {
    card: t('checkout.paymentCard'),
    kakaopay: 'Kakao Pay',
    naverpay: 'Naver Pay',
    tosspay: 'Toss Pay'
  };
  return map[m] || m || '-';
}

function itemsSubtotal(order) {
  return (order.items || []).reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
}
</script>

<style scoped>
.reveal { opacity: 0; transform: translateY(30px); transition: opacity 0.5s ease, transform 0.5s ease; }
.reveal.visible { opacity: 1; transform: translateY(0); }

.mypage-wrap { max-width: 960px; margin: 0 auto; }

/* 전체 레이아웃: 좌측 사이드바 + 우측 콘텐츠 (u-ur My Account 참고, 카드/박스 없이 플랫하게) */
.mypage-layout {
  display: flex;
  align-items: flex-start;
  gap: 56px;
}

/* 사이드바 (데스크톱) */
.mypage-sidebar {
  width: 180px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}
.mypage-sidebar-group {
  font-size: 11px;
  font-weight: 700;
  color: #aaa;
  letter-spacing: 0.06em;
  margin: 28px 0 10px;
}
.mypage-sidebar-group:first-child { margin-top: 0; }
.mypage-sidebar-link {
  text-align: left;
  background: none;
  border: none;
  padding: 7px 0;
  font-size: 13.5px;
  color: #666;
  cursor: pointer;
  transition: color 0.15s;
}
.mypage-sidebar-link:hover { color: #111; }
.mypage-sidebar-link.active { color: #111; font-weight: 700; }
.mypage-sidebar-link.danger { color: #b0433a; }
.mypage-sidebar-link.danger:hover,
.mypage-sidebar-link.danger.active { color: #d32f2f; }

/* 사이드바 (모바일: 세로 리스트, u-ur 마이쇼핑 메뉴 참고) */
.mypage-mobile-nav {
  display: none;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  margin-bottom: 8px;
}
.mypage-mobile-group {
  margin: 0;
  padding: 10px 14px;
  background: #f7f7f5;
  font-size: 12px;
  font-weight: 700;
  color: #777;
  letter-spacing: 0.3px;
}
.mypage-mobile-link {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  background: none;
  border: none;
  border-bottom: 1px solid #eee;
  padding: 15px 14px;
  font-size: 14px;
  color: #333;
  text-align: left;
  cursor: pointer;
}
.mypage-mobile-link.active { color: #111; font-weight: 700; }
.mypage-mobile-link.danger { color: #b0433a; }

.mypage-content { flex: 1; min-width: 0; }

.mypage-section-title {
  font-size: 15px;
  font-weight: 700;
  padding-bottom: 12px;
  margin: 32px 0 20px;
  border-bottom: 1px solid #111;
}
.mypage-section-title:first-child { margin-top: 0; }

/* 요약 통계 (u-ur 총적립금/쿠폰/총주문 행 참고) */
.mypage-stats {
  display: flex;
  border-top: 1px solid #111;
  border-bottom: 1px solid #eee;
  margin-bottom: 24px;
}
.mypage-stat {
  flex: 1;
  text-align: center;
  padding: 18px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  border-left: 1px solid #eee;
}
.mypage-stat:first-child { border-left: none; }
.mypage-stat .n { font-size: 16px; font-weight: 700; letter-spacing: -0.02em; }
.mypage-stat .l { font-size: 11px; color: #999; }

/* 주문처리 현황 (u-ur 입금전/배송준비중/배송중/배송완료 참고) */
.order-funnel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0 24px;
}
.order-funnel-step { text-align: center; flex: 1; }
.order-funnel-step .n { display: block; font-size: 20px; font-weight: 700; color: #ccc; }
.order-funnel-step .n:not(:empty) { color: #111; }
.order-funnel-step .l { display: block; font-size: 11.5px; color: #888; margin-top: 4px; }

/* 주문 내역 */
.order-month-head {
  font-size: 12px;
  font-weight: 700;
  color: #999;
  letter-spacing: 0.04em;
  margin: 24px 0 12px;
}
.order-month-head:first-child { margin-top: 0; }

.orders-list { display: flex; flex-direction: column; gap: 0; }
.order-card { border-top: 1px solid #eee; padding: 20px 0; }
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

/* 주문 상세를 주문상품/결제정보/배송지정보 소단락으로 구분 */
.order-section-label {
  font-size: 11px;
  font-weight: 700;
  color: #999;
  letter-spacing: 0.04em;
  margin: 16px 0 10px;
  padding-top: 14px;
  border-top: 1px dashed #eee;
}
.order-section-label:first-of-type { margin-top: 0; padding-top: 0; border-top: none; }

.order-items { display: flex; flex-direction: column; gap: 12px; }
.order-item { display: flex; gap: 12px; align-items: center; }
.order-item-img { width: 60px; height: 60px; object-fit: cover; border: 1px solid #eee; }
.order-item-info { flex: 1; }
.order-item-name { font-size: 14px; font-weight: 500; margin: 0; }
.order-item-detail { font-size: 12px; color: #999; margin: 2px 0; }
.order-item-price { font-size: 13px; font-weight: 600; margin: 0; }

.order-payment { display: flex; flex-direction: column; gap: 6px; }
.order-payment-row { display: flex; justify-content: space-between; font-size: 13px; color: #666; }
.order-payment-total { margin-top: 4px; padding-top: 8px; border-top: 1px solid #eee; font-size: 14px; font-weight: 700; color: #111; }

.order-shipping { display: flex; align-items: flex-start; gap: 4px; }
.order-shipping-text { font-size: 12px; color: #888; line-height: 1.5; }

.order-footer {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #eee;
}
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

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  margin-top: 28px;
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

/* 배송지 관리 */
.addr-section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.addr-list { display: flex; flex-direction: column; gap: 0; }
.addr-card { border-top: 1px solid #eee; padding: 18px 0; }
.addr-card:first-child { border-top: none; }
.addr-card.is-default .addr-card-head { color: #111; }
.addr-card-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}
.addr-default-badge {
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  background: #111;
  padding: 3px 8px;
  border-radius: 2px;
}
.addr-recipient { font-size: 14px; font-weight: 600; }
.addr-phone { font-size: 13px; color: #999; }
.addr-line { font-size: 13px; color: #333; margin: 0; line-height: 1.6; }
.addr-memo { font-size: 12px; color: #999; margin: 4px 0 0; }
.addr-actions {
  display: flex;
  gap: 8px;
  margin-top: 14px;
}
.addr-action-btn {
  font-size: 12px;
  font-weight: 600;
  color: #555;
  background: none;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 6px 12px;
  cursor: pointer;
  transition: all 0.15s;
}
.addr-action-btn:hover { border-color: #111; color: #111; }
.addr-action-danger { color: #c62828; }
.addr-action-danger:hover { border-color: #c62828; color: #c62828; }

/* 필드 라벨 — 플로팅 라벨 대신 입력란 위에 고정 라벨 (로그인/체크아웃과 동일한 패턴) */
.field-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #555;
  margin-bottom: 6px;
  letter-spacing: -0.2px;
}
:deep(.v-field) {
  border-radius: 4px !important;
  font-size: 14px;
}
:deep(.v-field__outline__start),
:deep(.v-field__outline__end) {
  border-color: #e0e0e0 !important;
}
:deep(.v-field__outline__notch) {
  display: none !important;
}
:deep(.v-field__outline__start) { border-right: 0 !important; }
:deep(.v-field__outline__end) { border-left: 0 !important; }
:deep(.v-field--variant-outlined .v-field__outline) {
  --v-field-border-width: 1px;
}
:deep(.v-field--variant-outlined .v-field__outline__start),
:deep(.v-field--variant-outlined .v-field__outline__end) {
  border-top: 1px solid #e0e0e0 !important;
  border-bottom: 1px solid #e0e0e0 !important;
}
:deep(.v-field--focused .v-field__outline__start),
:deep(.v-field--focused .v-field__outline__end) {
  border-color: #111 !important;
  border-top-color: #111 !important;
  border-bottom-color: #111 !important;
  border-width: 1.5px !important;
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

/* 모바일: 사이드바 대신 세로 리스트 메뉴, 여백 축소 */
@media (max-width: 768px) {
  .mypage-wrap.py-16 { padding-top: 28px !important; padding-bottom: 32px !important; }
  .mypage-wrap .mb-10 { margin-bottom: 20px !important; }
  .mypage-layout { flex-direction: column; gap: 0; }
  .mypage-sidebar { display: none; }
  .mypage-mobile-nav { display: block; }
  .mypage-stat .v-icon {
    width: 30px;
    height: 30px;
    border: 1px solid #ddd;
    border-radius: 50%;
    margin-bottom: 2px;
  }
  .mypage-stat .n { white-space: nowrap; }
  .mypage-content { scroll-margin-top: 58px; }
}
</style>
