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
                <v-btn
                  size="x-small"
                  variant="outlined"
                  class="mt-2"
                  href="https://sell.smartstore.naver.com"
                  target="_blank"
                >
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
                <p class="text-body-2 font-weight-bold mb-1">3단계 — API 연동 (고급)</p>
                <p class="text-caption text-grey">네이버 커머스 API를 이용하면 주문, 상품, 재고를 자동으로 동기화할 수 있습니다.</p>
                <v-btn
                  size="x-small"
                  variant="outlined"
                  class="mt-2"
                  href="https://developers.naver.com/docs/serviceapi/commerce/overview/overview.md"
                  target="_blank"
                >
                  API 문서 보기 <v-icon size="12" class="ml-1">mdi-open-in-new</v-icon>
                </v-btn>
              </div>
            </v-timeline-item>
            <v-timeline-item dot-color="grey-darken-3" size="small">
              <div>
                <p class="text-body-2 font-weight-bold mb-1">4단계 — 주문 통합 관리</p>
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

const storeUrl = ref(localStorage.getItem('naver_store_url') || '');
const savedMsg = ref('');
const products = ref([]);
const exporting = ref(false);

onMounted(async () => {
  const res = await axios.get('/api/admin/products');
  products.value = res.data;
});

function saveStoreUrl() {
  localStorage.setItem('naver_store_url', storeUrl.value);
  savedMsg.value = '스토어 URL이 저장되었습니다';
  setTimeout(() => { savedMsg.value = ''; }, 3000);
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

@media (max-width: 768px) {
  .admin-page { padding-top: 52px !important; }
  .admin-container { padding: 16px !important; }
  .page-title { font-size: 17px; }
}
</style>
