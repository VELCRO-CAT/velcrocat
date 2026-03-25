<template>
  <AdminSidebar />

  <v-main class="bg-grey-lighten-4 admin-page">
    <v-container class="admin-container" style="max-width:900px">
      <h1 class="page-title">네이버 스마트스토어</h1>
      <p class="page-sub mb-5">네이버 스마트스토어 연동 및 상품 내보내기</p>

      <!-- 스토어 URL 설정 -->
      <v-card variant="outlined" class="mb-4">
        <v-card-title class="text-body-1 font-weight-bold pa-4 pb-3">
          <v-icon size="20" class="mr-2">mdi-store-outline</v-icon>
          스마트스토어 정보
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <v-row dense>
            <v-col cols="12" sm="8">
              <v-text-field
                v-model="storeUrl"
                label="스마트스토어 URL"
                variant="outlined"
                density="compact"
                placeholder="https://smartstore.naver.com/yourstore"
                prepend-inner-icon="mdi-link"
                hint="네이버 스마트스토어 주소를 입력하세요"
                persistent-hint
              />
            </v-col>
            <v-col cols="12" sm="4" class="d-flex align-start">
              <v-btn color="grey-darken-4" @click="saveStoreUrl" :disabled="!storeUrl">저장</v-btn>
              <v-btn
                v-if="storeUrl"
                variant="outlined"
                class="ml-2"
                :href="storeUrl"
                target="_blank"
              >
                <v-icon size="16" class="mr-1">mdi-open-in-new</v-icon>스토어 열기
              </v-btn>
            </v-col>
          </v-row>
          <v-alert v-if="savedMsg" type="success" variant="tonal" density="compact" class="mt-3">{{ savedMsg }}</v-alert>
        </v-card-text>
      </v-card>

      <!-- API 연동 설정 -->
      <v-card variant="outlined" class="mb-4">
        <v-card-title class="text-body-1 font-weight-bold pa-4 pb-3">
          <v-icon size="20" class="mr-2">mdi-api</v-icon>
          커머스 API 연동
          <v-chip v-if="apiConnected" size="x-small" color="green" variant="tonal" class="ml-2">연결됨</v-chip>
          <v-chip v-else size="x-small" color="grey" variant="tonal" class="ml-2">미연결</v-chip>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <p class="text-caption text-grey mb-3">
            네이버 커머스 API를 연동하면 상품/재고/주문을 자동 동기화할 수 있습니다.<br />
            <a href="https://developers.naver.com/docs/serviceapi/commerce/overview/overview.md" target="_blank" class="text-blue">API 문서 보기</a>에서 애플리케이션을 등록하고 Client ID / Secret을 발급받으세요.
          </p>
          <v-text-field
            v-model="apiConfig.clientId"
            label="Client ID (애플리케이션 ID)"
            variant="outlined"
            density="compact"
            class="mb-3"
            prepend-inner-icon="mdi-key-outline"
          />
          <v-text-field
            v-model="apiConfig.clientSecret"
            label="Client Secret (애플리케이션 시크릿)"
            variant="outlined"
            density="compact"
            class="mb-3"
            prepend-inner-icon="mdi-lock-outline"
            :type="showSecret ? 'text' : 'password'"
            :append-inner-icon="showSecret ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="showSecret = !showSecret"
          />
          <div class="d-flex gap-2">
            <v-btn color="grey-darken-4" @click="saveApiConfig" :loading="apiSaving">
              <v-icon size="16" class="mr-1">mdi-content-save</v-icon>API 설정 저장
            </v-btn>
            <v-btn variant="outlined" @click="testApi" :loading="apiTesting" :disabled="!apiConfig.clientId || !apiConfig.clientSecret">
              <v-icon size="16" class="mr-1">mdi-connection</v-icon>연결 테스트
            </v-btn>
          </div>
          <v-alert v-if="apiMsg" :type="apiMsgType" variant="tonal" density="compact" class="mt-3">{{ apiMsg }}</v-alert>
        </v-card-text>
      </v-card>

      <!-- 상품 동기화 -->
      <v-card variant="outlined" class="mb-4">
        <v-card-title class="text-body-1 font-weight-bold pa-4 pb-3">
          <v-icon size="20" class="mr-2">mdi-sync</v-icon>
          상품 동기화
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <p class="text-body-2 text-grey mb-3">
            오사카마켓 상품을 네이버 스마트스토어에 자동 등록합니다. API 연동이 완료된 상태에서만 사용 가능합니다.
          </p>
          <div class="d-flex align-center gap-3">
            <v-btn color="grey-darken-4" prepend-icon="mdi-cloud-upload" @click="syncProducts" :loading="syncing" :disabled="!apiConnected">
              상품 동기화 시작
            </v-btn>
            <v-chip size="small" variant="tonal" color="grey">{{ products.length }}개 상품</v-chip>
          </div>
          <v-alert v-if="syncResult" :type="syncResult.fail > 0 ? 'warning' : 'success'" variant="tonal" density="compact" class="mt-3">
            동기화 완료: 성공 {{ syncResult.success }}개 / 실패 {{ syncResult.fail }}개
            <div v-if="syncResult.errors && syncResult.errors.length > 0" class="mt-2">
              <p v-for="(e, i) in syncResult.errors.slice(0, 5)" :key="i" class="text-caption">
                - {{ e.product }}: {{ e.error }}
              </p>
            </div>
          </v-alert>
        </v-card-text>
      </v-card>

      <!-- CSV 내보내기 -->
      <v-card variant="outlined" class="mb-4">
        <v-card-title class="text-body-1 font-weight-bold pa-4 pb-3">
          <v-icon size="20" class="mr-2">mdi-file-export-outline</v-icon>
          상품 목록 내보내기 (CSV)
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <p class="text-body-2 text-grey mb-3">
            상품 데이터를 CSV 파일로 내보내서 네이버 스마트스토어에 일괄 등록할 수 있습니다.
          </p>
          <v-btn color="grey-darken-4" prepend-icon="mdi-download" @click="exportCSV" :loading="exporting">
            CSV 다운로드
          </v-btn>
          <v-chip size="small" variant="tonal" color="grey" class="ml-3">{{ products.length }}개 상품</v-chip>
        </v-card-text>
      </v-card>

      <!-- 네이버 주문 조회 -->
      <v-card variant="outlined" class="mb-4">
        <v-card-title class="text-body-1 font-weight-bold pa-4 pb-3">
          <v-icon size="20" class="mr-2">mdi-receipt-text-outline</v-icon>
          네이버 주문 조회
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <p class="text-body-2 text-grey mb-3">
            네이버 스마트스토어에서 들어온 주문을 조회합니다.
          </p>
          <v-btn variant="outlined" prepend-icon="mdi-refresh" @click="fetchNaverOrders" :loading="loadingOrders" :disabled="!apiConnected">
            주문 불러오기
          </v-btn>
          <v-alert v-if="orderError" type="error" variant="tonal" density="compact" class="mt-3">{{ orderError }}</v-alert>
          <div v-if="naverOrders.length > 0" class="mt-4">
            <v-table density="compact">
              <thead>
                <tr>
                  <th>주문번호</th>
                  <th>상품명</th>
                  <th>수량</th>
                  <th>금액</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="o in naverOrders" :key="o.productOrderId">
                  <td class="text-caption">{{ o.productOrderId }}</td>
                  <td class="text-caption">{{ o.productName }}</td>
                  <td class="text-caption">{{ o.quantity }}</td>
                  <td class="text-caption">{{ o.totalPaymentAmount?.toLocaleString() }}원</td>
                  <td><v-chip size="x-small" :color="orderStatusColor(o.productOrderStatus)">{{ o.productOrderStatus }}</v-chip></td>
                </tr>
              </tbody>
            </v-table>
          </div>
          <p v-else-if="ordersFetched && naverOrders.length === 0" class="text-caption text-grey mt-3">조회된 주문이 없습니다.</p>
        </v-card-text>
      </v-card>

      <!-- 연동 가이드 -->
      <v-card variant="outlined">
        <v-card-title class="text-body-1 font-weight-bold pa-4 pb-3">
          <v-icon size="20" class="mr-2">mdi-information-outline</v-icon>
          네이버 스마트스토어 연동 가이드
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <v-timeline density="compact" align="start">
            <v-timeline-item dot-color="grey-darken-3" size="small">
              <div>
                <p class="text-body-2 font-weight-bold mb-1">1단계 — 스마트스토어 개설</p>
                <p class="text-caption text-grey">네이버 스마트스토어 센터에서 판매자 계정을 만들고 스토어를 개설합니다.</p>
                <v-btn size="x-small" variant="outlined" class="mt-2" href="https://sell.smartstore.naver.com" target="_blank">
                  스마트스토어 센터 이동 <v-icon size="12" class="ml-1">mdi-open-in-new</v-icon>
                </v-btn>
              </div>
            </v-timeline-item>
            <v-timeline-item dot-color="grey-darken-3" size="small">
              <div>
                <p class="text-body-2 font-weight-bold mb-1">2단계 — 상품 CSV 업로드</p>
                <p class="text-caption text-grey">위에서 다운받은 CSV 파일을 스마트스토어 센터 > 상품 > 상품 일괄등록에서 업로드합니다.</p>
              </div>
            </v-timeline-item>
            <v-timeline-item dot-color="grey-darken-3" size="small">
              <div>
                <p class="text-body-2 font-weight-bold mb-1">3단계 — API 연동</p>
                <p class="text-caption text-grey">위의 커머스 API 연동 섹션에서 Client ID / Secret을 입력하고 연결 테스트를 진행하세요.</p>
              </div>
            </v-timeline-item>
            <v-timeline-item dot-color="grey-darken-3" size="small">
              <div>
                <p class="text-body-2 font-weight-bold mb-1">4단계 — 상품 동기화</p>
                <p class="text-caption text-grey">API 연결이 완료되면 상품 동기화 버튼으로 네이버에 상품을 자동 등록할 수 있습니다.</p>
              </div>
            </v-timeline-item>
            <v-timeline-item dot-color="grey-darken-3" size="small">
              <div>
                <p class="text-body-2 font-weight-bold mb-1">5단계 — 주문 통합 관리</p>
                <p class="text-caption text-grey">네이버 스마트스토어와 오사카마켓 두 채널의 주문을 통합 관리할 수 있게 됩니다.</p>
              </div>
            </v-timeline-item>
          </v-timeline>
        </v-card-text>
      </v-card>
    </v-container>
  </v-main>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import AdminSidebar from '../../components/AdminSidebar.vue';

const storeUrl = ref(localStorage.getItem('naver_store_url') || 'https://smartstore.naver.com/vcat');
const savedMsg = ref('');
const products = ref([]);
const exporting = ref(false);

// API 연동
const apiConfig = ref({ clientId: '', clientSecret: '' });
const apiConnected = ref(false);
const apiSaving = ref(false);
const apiTesting = ref(false);
const apiMsg = ref('');
const apiMsgType = ref('success');
const showSecret = ref(false);

// 동기화
const syncing = ref(false);
const syncResult = ref(null);

// 네이버 주문
const naverOrders = ref([]);
const loadingOrders = ref(false);
const orderError = ref('');
const ordersFetched = ref(false);

onMounted(async () => {
  const [prodRes, configRes] = await Promise.all([
    axios.get('/api/admin/products'),
    axios.get('/api/naver/config').catch(() => ({ data: {} }))
  ]);
  products.value = prodRes.data;
  if (configRes.data) {
    apiConfig.value.clientId = configRes.data.clientId || '';
    apiConnected.value = configRes.data.connected || false;
    if (configRes.data.storeUrl) {
      storeUrl.value = configRes.data.storeUrl;
    }
  }
});

function saveStoreUrl() {
  localStorage.setItem('naver_store_url', storeUrl.value);
  savedMsg.value = '스토어 URL이 저장되었습니다';
  setTimeout(() => { savedMsg.value = ''; }, 3000);
}

async function saveApiConfig() {
  apiSaving.value = true;
  apiMsg.value = '';
  try {
    await axios.post('/api/naver/config', {
      clientId: apiConfig.value.clientId,
      clientSecret: apiConfig.value.clientSecret,
      storeUrl: storeUrl.value
    });
    apiMsg.value = 'API 설정이 저장되었습니다';
    apiMsgType.value = 'success';
    apiConnected.value = !!(apiConfig.value.clientId && apiConfig.value.clientSecret);
  } catch {
    apiMsg.value = '저장에 실패했습니다';
    apiMsgType.value = 'error';
  } finally {
    apiSaving.value = false;
    setTimeout(() => { apiMsg.value = ''; }, 4000);
  }
}

async function testApi() {
  apiTesting.value = true;
  apiMsg.value = '';
  try {
    const res = await axios.post('/api/naver/test');
    if (res.data.success) {
      apiMsg.value = 'API 연결 성공! 네이버 커머스 API와 정상 연결되었습니다.';
      apiMsgType.value = 'success';
      apiConnected.value = true;
    } else {
      apiMsg.value = `연결 실패: ${res.data.message}`;
      apiMsgType.value = 'error';
      apiConnected.value = false;
    }
  } catch (e) {
    apiMsg.value = `연결 실패: ${e.response?.data?.error || e.message}`;
    apiMsgType.value = 'error';
  } finally {
    apiTesting.value = false;
  }
}

async function syncProducts() {
  syncing.value = true;
  syncResult.value = null;
  try {
    const res = await axios.post('/api/naver/sync/products');
    syncResult.value = res.data;
  } catch (e) {
    syncResult.value = { success: 0, fail: products.value.length, errors: [{ product: '전체', error: e.response?.data?.error || e.message }] };
  } finally {
    syncing.value = false;
  }
}

async function fetchNaverOrders() {
  loadingOrders.value = true;
  orderError.value = '';
  naverOrders.value = [];
  try {
    const res = await axios.get('/api/naver/orders');
    const data = res.data.data?.lastChangeStatuses || [];
    naverOrders.value = data.map(o => ({
      productOrderId: o.productOrderId,
      productName: o.productName || '-',
      quantity: o.quantity || 0,
      totalPaymentAmount: o.totalPaymentAmount || 0,
      productOrderStatus: o.productOrderStatus || '-'
    }));
    ordersFetched.value = true;
  } catch (e) {
    orderError.value = e.response?.data?.error || '주문 조회에 실패했습니다';
  } finally {
    loadingOrders.value = false;
  }
}

function orderStatusColor(status) {
  const map = { PAYED: 'blue', DELIVERING: 'orange', DELIVERED: 'green', CANCELED: 'red' };
  return map[status] || 'grey';
}

function exportCSV() {
  exporting.value = true;
  const header = ['상품번호', '상품명', '카테고리', '가격', '재고', '설명', '이미지URL'];
  const rows = products.value.map(p => [
    p.id,
    `"${(p.name || '').replace(/"/g, '""')}"`,
    `"${categoryLabel(p.category)}"`,
    p.price,
    p.stock,
    `"${(p.description || '').replace(/"/g, '""')}"`,
    `"${p.image || ''}"`
  ]);
  const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `osakamarket_products_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  exporting.value = false;
}

function categoryLabel(slug) {
  return { outer: '아우터', tops: '탑스', bottoms: '바텀스', roomwear: '룸웨어' }[slug] || slug;
}
</script>

<style scoped>
.page-title { font-size: 20px; font-weight: 800; color: #111; }
.page-sub { font-size: 12px; color: #999; margin-top: 2px; }
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }

@media (max-width: 768px) {
  .admin-page { padding-top: 52px !important; }
  .admin-container { padding: 16px !important; }
  .page-title { font-size: 17px; }
}
</style>
