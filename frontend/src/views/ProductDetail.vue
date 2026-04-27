<template>
  <div class="detail-page">
    <div class="detail-wrap">
      <v-btn variant="text" to="/products" prepend-icon="mdi-arrow-left" class="mb-6" style="color:#555">상품 목록으로</v-btn>

      <v-progress-circular v-if="loading" indeterminate color="#111" class="d-block mx-auto my-12" />

      <div v-else-if="product" class="product-main">
        <!-- 이미지 캐러셀 -->
        <div class="product-img-area">
          <img :src="allImages[currentImgIndex]" :alt="product.name" class="product-img" />
          <template v-if="allImages.length > 1">
            <button class="img-arrow img-arrow-left" @click="prevImage">‹</button>
            <button class="img-arrow img-arrow-right" @click="nextImage">›</button>
            <div class="img-dots">
              <span v-for="(img, i) in allImages" :key="i" class="img-dot" :class="{ active: currentImgIndex === i }" @click="currentImgIndex = i"></span>
            </div>
          </template>
        </div>

        <!-- 상품 정보 -->
        <div class="product-info">
          <p class="product-seller">{{ product.seller }}</p>
          <h1 class="product-name">{{ product.name }}</h1>

          <div class="product-price">₩{{ Number(product.price).toLocaleString() }}</div>

          <div class="divider" />

          <p class="product-desc">{{ product.description }}</p>

          <p v-if="product.stock > 0" class="product-stock">
            <v-icon size="15" color="#2a9d5c">mdi-check-circle</v-icon>
            재고 있음 ({{ product.stock }}개)
          </p>
          <p v-else class="product-stock sold-out">
            <v-icon size="15" color="#e53e3e">mdi-close-circle</v-icon>
            재고 없음
          </p>

          <!-- 수량 (재고 있을 때만) -->
          <template v-if="product.stock > 0">
            <div class="qty-row">
              <button class="qty-btn" @click="qty = Math.max(1, qty - 1)">−</button>
              <span class="qty-num">{{ qty }}</span>
              <button class="qty-btn" @click="qty = Math.min(product.stock, qty + 1)">+</button>
            </div>

            <!-- 총 금액 -->
            <div class="total-row">
              <span class="total-label">총 상품금액(수량)</span>
              <span class="total-price">
                ₩{{ (product.price * qty).toLocaleString() }}
                <span class="total-qty">({{ qty }}개)</span>
              </span>
            </div>

            <!-- 찜 + 장바구니 + 바로 구매 -->
            <div class="action-row">
              <button class="wish-btn" :class="{ active: wishlistStore.isWished(product.id) }" @click="toggleWish">
                <v-icon size="20">{{ wishlistStore.isWished(product.id) ? 'mdi-heart' : 'mdi-heart-outline' }}</v-icon>
              </button>
              <button class="cart-btn hvr-sweep-to-right" @click="addToCart">
                <v-icon size="18" class="mr-1">mdi-cart-plus</v-icon>
                장바구니
              </button>
              <button class="buy-btn" @click="buyNow">
                바로 구매하기
              </button>
            </div>
          </template>
          <template v-else>
            <div class="action-row">
              <button class="wish-btn" :class="{ active: wishlistStore.isWished(product.id) }" @click="toggleWish">
                <v-icon size="20">{{ wishlistStore.isWished(product.id) ? 'mdi-heart' : 'mdi-heart-outline' }}</v-icon>
              </button>
              <button class="cart-btn cart-btn-disabled" disabled style="flex:1">
                <v-icon size="18" class="mr-1">mdi-cart-off</v-icon>
                품절된 상품입니다
              </button>
            </div>
          </template>
        </div>
      </div>

      <div v-else class="text-center py-12 text-grey">상품을 찾을 수 없습니다</div>
    </div>

    <!-- 상세 설명 섹션 -->
    <section v-if="product" class="detail-section">
      <div class="detail-inner">
        <!-- 탭 메뉴 -->
        <div class="detail-tabs">
          <button class="detail-tab" :class="{ active: activeTab === 'info' }" @click="activeTab = 'info'">상품 상세정보</button>
          <button class="detail-tab" :class="{ active: activeTab === 'guide' }" @click="activeTab = 'guide'">배송/교환/반품</button>
        </div>

        <!-- 접히는 래퍼 -->
        <div class="detail-collapse" :class="{ expanded: detailExpanded }">
          <!-- 상세정보 탭 -->
          <div v-if="activeTab === 'info'" class="detail-content">
            <!-- 브랜드 헤더 -->
            <div class="brand-header">
              <img src="../image/osakamarketLOGO2.png" alt="Velcro Cat" class="brand-header-logo" />
              <div>
                <p class="brand-header-name">VELCRO CAT</p>
                <p class="brand-header-sub">Comfortable & Minimal</p>
              </div>
            </div>

            <!-- 상품 설명 -->
            <div class="info-block">
              <h3 class="info-title">{{ product.name }}</h3>
              <p class="info-desc">{{ product.description }}</p>
            </div>

            <!-- 블로그식 상세 콘텐츠 -->
            <div v-if="detailBlocks.length > 0" class="info-blocks">
              <template v-for="(block, i) in detailBlocks" :key="i">
                <p v-if="block.type === 'text'" class="info-block-text">{{ block.content }}</p>
                <div v-else-if="block.type === 'image'" class="info-block-img">
                  <img :src="block.content" :alt="product.name" />
                </div>
              </template>
            </div>
            <!-- 이전 방식 호환 (detail_images) -->
            <div v-else-if="productImages.length > 0" class="info-images">
              <img v-for="(img, i) in productImages" :key="i" :src="img" :alt="product.name" class="info-image" />
            </div>

            <!-- 소재/관리 가이드 -->
            <div class="care-guide">
              <h4 class="care-title">CARE GUIDE</h4>
              <div class="care-items">
                <div class="care-item">
                  <v-icon size="20" color="#555">mdi-washing-machine</v-icon>
                  <span>찬물 손세탁 권장</span>
                </div>
                <div class="care-item">
                  <v-icon size="20" color="#555">mdi-iron</v-icon>
                  <span>낮은 온도 다림질</span>
                </div>
                <div class="care-item">
                  <v-icon size="20" color="#555">mdi-tumble-dryer-off</v-icon>
                  <span>건조기 사용 불가</span>
                </div>
                <div class="care-item">
                  <v-icon size="20" color="#555">mdi-hanger</v-icon>
                  <span>그늘에서 평평하게 건조</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 배송/교환/반품 탭 -->
          <div v-if="activeTab === 'guide'" class="detail-content">
            <!-- 반품/교환 안내 박스 -->
            <div class="return-notice">
              <h4 class="return-notice-title">벨크로캣 반품/교환 안내</h4>
              <p class="return-notice-desc">반품 시 먼저 판매자와 연락하셔서 반품사유, 택배사, 배송비, 반품지 주소 등을 협의하신 후 반품상품을 발송해 주시기 바랍니다.</p>
            </div>

            <div class="guide-section">
              <h4>배송 안내</h4>
              <table class="guide-table"><tbody>
                <tr>
                  <th>판매자 지정택배사</th>
                  <td>한진택배</td>
                </tr>
                <tr>
                  <th>반품배송비</th>
                  <td>편도 5,000원 (최초 배송비 무료인 경우 10,000원 부과)</td>
                </tr>
                <tr>
                  <th>교환배송비</th>
                  <td>10,000원</td>
                </tr>
                <tr>
                  <th>보내실 곳</th>
                  <td>경기도 안양시 동안구 동편로183번길 86 201호 (우 : 13930)</td>
                </tr>
              </tbody></table>
            </div>

            <div class="guide-section">
              <h4>반품/교환 사유에 따른 요청 가능 기간</h4>
              <ul>
                <li>구매자 단순 변심은 상품 수령 후 <strong>7일 이내</strong> (구매자 반품배송비 부담)</li>
                <li>표시/광고와 상이, 계약 내용과 다르게 이행된 경우 상품 수령 후 <strong>3개월 이내</strong>, 또는 표시/광고와 다른 사실을 안 날로부터 <strong>30일 이내</strong> (판매자 반품배송비 부담)</li>
              </ul>
            </div>

            <div class="guide-section">
              <h4>반품/교환 불가능 사유</h4>
              <ul>
                <li>반품요청기간이 지난 경우</li>
                <li>구매자의 책임 있는 사유로 상품 등이 멸실 또는 훼손된 경우 (단, 상품의 내용을 확인하기 위하여 포장 등을 훼손한 경우는 제외)</li>
                <li>구매자의 책임있는 사유로 포장이 훼손되어 상품가치가 현저히 상실된 경우 (예: 식품, 화장품, 향수류, 음반 등)</li>
                <li>구매자의 사용 또는 일부 소비에 의하여 상품의 가치가 현저히 감소한 경우 (라벨이 , 떨어진 의류 또는 태그가 , 떨어진 명품 등의 상품인 경우)</li>
                <li>시간의 경과에 의하여 재판매가 곤란할 정도로 상품 등의 가치가 현저히 감소한 경우</li>
                <li>고객의 요청사항에 맞춰 제작에 들어가는 맞춤제작상품의 경우 (판매자에게 회복불가능한 손해가 예상되고, 그러한 예정으로 청약철회권 행사가 불가하다는 사실을 서면 동의 받은 경우)</li>
                <li>복제가 가능한 상품 등의 포장을 훼손한 경우 (CD/DVD/GAME/도서의 경우 포장 개봉 시)</li>
              </ul>
            </div>

            <div class="guide-section">
              <h4>판매자 정보</h4>
              <table class="guide-table"><tbody>
                <tr>
                  <th>상호명</th>
                  <td>김충성, 장윤호 (공동)</td>
                </tr>
                <tr>
                  <th>대표자</th>
                  <td>김충성, 장윤호</td>
                </tr>
              </tbody></table>
            </div>

            <div class="guide-section guide-notice">
              <h4>주의사항</h4>
              <ul class="notice-list">
                <li>전자상거래 등에서의 소비자보호에 관한 법률에 의한 반품규정이 판매자가 지정한 반품 조건보다 우선합니다.</li>
                <li>전자상거래 등에서의 소비자보호에 관한 법률로 미성년자 물품을 구매하는 경우, 법정대리인이 동의하지 않으면 미성년자 본인 또는 법정대리인이 구매를 취소할 수 있습니다.</li>
                <li>전기용품 및 생활용품 안전관리법에 의하여 다른 법률에서 안전관리대상 공산품인 전자제품, 생활용품, 어린이제품은 구매하실 경우에는 해당 제품이 안전인증, 안전확인, 공급자적합성확인, 안전기준준수 적용 제품인지 확인하시기 바랍니다.</li>
              </ul>
            </div>
          </div>

          <!-- 그라데이션 오버레이 (접혀있을 때만) -->
          <div v-if="!detailExpanded" class="detail-fade-overlay"></div>
        </div>

        <!-- 더보기 / 접기 버튼 -->
        <button class="detail-toggle-btn" @click="detailExpanded = !detailExpanded">
          <span>{{ detailExpanded ? '상세정보 접기' : '상품 상세정보 더보기' }}</span>
          <v-icon size="18">{{ detailExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
        </button>
      </div>
    </section>

    <!-- 최근 본 상품 -->
    <section v-if="recentProducts.length > 1" class="related-section">
      <div class="related-inner">
        <h2 class="section-title">최근 확인한 상품</h2>
        <div class="related-grid">
          <router-link
            v-for="p in recentProducts.filter(p => p.id !== product?.id).slice(0, 6)"
            :key="p.id"
            :to="`/products/${p.id}`"
            class="related-item"
          >
            <div class="related-img-wrap">
              <img :src="p.image" :alt="p.name" class="related-img" />
            </div>
            <p class="related-name">{{ p.name }}</p>
            <p class="related-price">₩{{ Number(p.price).toLocaleString() }}</p>
          </router-link>
        </div>
      </div>
    </section>

    <!-- 같은 카테고리 상품 -->
    <section v-if="similarProducts.length" class="related-section">
      <div class="related-inner">
        <h2 class="section-title">같은 카테고리의 상품</h2>
        <div class="related-grid">
          <router-link
            v-for="p in similarProducts"
            :key="p.id"
            :to="`/products/${p.id}`"
            class="related-item"
          >
            <div class="related-img-wrap">
              <img :src="p.image" :alt="p.name" class="related-img" />
            </div>
            <p class="related-name">{{ p.name }}</p>
            <p class="related-price">₩{{ Number(p.price).toLocaleString() }}</p>
          </router-link>
        </div>
      </div>
    </section>

    <v-snackbar v-model="snackbar" color="#222" timeout="2000" location="bottom right">
      <v-icon start color="white">mdi-check-circle</v-icon>
      <span style="color:#fff">{{ snackMsg }}</span>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { useCartStore } from '../stores/cart';
import { useWishlistStore } from '../stores/wishlist';

const route = useRoute();
const router = useRouter();
const cartStore = useCartStore();
const wishlistStore = useWishlistStore();
const product = ref(null);
const loading = ref(true);
const qty = ref(1);
const snackbar = ref(false);
const snackMsg = ref('');
const activeTab = ref('info');
const similarProducts = ref([]);
const productImages = ref([]);
const detailBlocks = ref([]);
const recentProducts = ref([]);
const detailExpanded = ref(false);
const currentImgIndex = ref(0);

const allImages = computed(() => {
  if (product.value?.images) {
    try {
      const arr = JSON.parse(product.value.images);
      if (arr.length) return arr;
    } catch { /* ignore */ }
  }
  return product.value?.image ? [product.value.image] : [];
});

function prevImage() {
  currentImgIndex.value = (currentImgIndex.value - 1 + allImages.value.length) % allImages.value.length;
}
function nextImage() {
  currentImgIndex.value = (currentImgIndex.value + 1) % allImages.value.length;
}

function saveRecent(p) {
  const key = 'osaka_recent';
  let ids = [];
  try { ids = JSON.parse(localStorage.getItem(key) || '[]'); } catch {}
  ids = ids.filter(id => id !== p.id);
  ids.unshift(p.id);
  if (ids.length > 10) ids = ids.slice(0, 10);
  localStorage.setItem(key, JSON.stringify(ids));
  loadRecent();
}

async function loadRecent() {
  try {
    const ids = JSON.parse(localStorage.getItem('osaka_recent') || '[]');
    if (ids.length === 0) { recentProducts.value = []; return; }
    // 서버에서 최신 상품 정보 가져오기
    const res = await axios.get('/api/products?limit=100');
    const serverProducts = res.data.products || res.data;
    const serverMap = {};
    serverProducts.forEach(p => { serverMap[p.id] = p; });
    // 존재하는 상품만 순서 유지하면서 최신 데이터로 구성
    const validIds = ids.filter(id => serverMap[id]);
    if (validIds.length !== ids.length) {
      localStorage.setItem('osaka_recent', JSON.stringify(validIds));
    }
    recentProducts.value = validIds.map(id => serverMap[id]);
  } catch {}
}

async function loadProduct(id) {
  loading.value = true;
  qty.value = 1;
  currentImgIndex.value = 0;
  try {
    const res = await axios.get(`/api/products/${id}`);
    product.value = res.data;
    activeTab.value = 'info';
    detailExpanded.value = false;
    // 블로그 블록 파싱
    try {
      detailBlocks.value = JSON.parse(res.data.detail_blocks || '[]');
    } catch { detailBlocks.value = []; }
    // 이전 방식 호환
    try {
      productImages.value = JSON.parse(res.data.detail_images || '[]');
    } catch { productImages.value = []; }
    saveRecent(res.data);

    // 같은 카테고리 상품 (자신 제외, 최대 6개)
    const catRes = await axios.get(`/api/products?category=${res.data.category}`);
    similarProducts.value = catRes.data.products.filter(p => p.id !== res.data.id).slice(0, 6);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadRecent();
  loadProduct(route.params.id);
});

watch(() => route.params.id, (id) => {
  if (id) loadProduct(id);
});

function addToCart() {
  for (let i = 0; i < qty.value; i++) cartStore.addItem(product.value);
  snackMsg.value = '장바구니에 담았습니다';
  snackbar.value = true;
}

function toggleWish() {
  wishlistStore.toggle(product.value);
  snackMsg.value = wishlistStore.isWished(product.value.id) ? '찜 목록에 추가했습니다' : '찜 목록에서 제거했습니다';
  snackbar.value = true;
}

function buyNow() {
  window.open('https://smartstore.naver.com/vcat/products/13301159340', '_blank');
}
</script>

<style scoped>
.detail-page { background: #fff; min-height: 80vh; }

.detail-wrap {
  max-width: 1100px;
  margin: 0 auto;
  padding: 40px 24px 60px;
}

.product-main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 56px;
  align-items: start;
}
@media (max-width: 768px) {
  .product-main { grid-template-columns: 1fr; gap: 28px; }
}

.product-img-area {
  position: relative;
  background: #f5f5f5;
  aspect-ratio: 1/1;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10%;
}
.product-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}
.img-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  background: rgba(255,255,255,0.85);
  border: 1px solid #ddd;
  border-radius: 50%;
  font-size: 24px;
  line-height: 1;
  color: #333;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  z-index: 2;
}
.img-arrow:hover { background: #fff; }
.img-arrow-left { left: 12px; }
.img-arrow-right { right: 12px; }
.img-dots {
  position: absolute;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 2;
}
.img-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(0,0,0,0.2);
  cursor: pointer;
  transition: background 0.2s;
}
.img-dot.active {
  background: #111;
}

.product-seller {
  font-size: 11px;
  color: #999;
  letter-spacing: 1px;
  margin-bottom: 8px;
}
.product-name {
  font-size: 22px;
  font-weight: 800;
  color: #111;
  letter-spacing: -0.5px;
  margin-bottom: 16px;
  line-height: 1.3;
}
.product-price {
  font-size: 26px;
  font-weight: 900;
  color: #111;
  margin-bottom: 20px;
}
.divider {
  border-top: 1px solid #e8e8e8;
  margin-bottom: 20px;
}
.product-desc {
  font-size: 13px;
  color: #555;
  line-height: 1.9;
  margin-bottom: 16px;
}
.product-stock {
  font-size: 12px;
  color: #2a9d5c;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 24px;
}

.qty-row {
  display: flex;
  align-items: center;
  gap: 0;
  border: 1px solid #ddd;
  width: fit-content;
  margin-bottom: 20px;
}
.qty-btn {
  width: 40px;
  height: 40px;
  background: #fff;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #111;
  transition: background 0.15s;
}
.qty-btn:hover { background: #f5f5f5; }
.qty-num {
  width: 48px;
  text-align: center;
  font-size: 15px;
  font-weight: 700;
  color: #111;
  border-left: 1px solid #ddd;
  border-right: 1px solid #ddd;
  line-height: 40px;
}

/* 총 금액 */
.total-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-top: 1px solid #e8e8e8;
  border-bottom: 1px solid #e8e8e8;
  margin-bottom: 16px;
}
.total-label {
  font-size: 13px;
  color: #555;
  font-weight: 500;
}
.total-price {
  font-size: 22px;
  font-weight: 900;
  color: #111;
}
.total-qty {
  font-size: 12px;
  font-weight: 500;
  color: #999;
  margin-left: 4px;
}

/* 버튼 그룹 */
.action-row {
  display: flex;
  gap: 8px;
}
.wish-btn {
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  border: 1px solid #ddd;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #999;
  transition: all 0.2s;
}
.wish-btn:hover {
  border-color: #111;
  color: #111;
}
.wish-btn.active {
  color: #e53e3e;
  border-color: #e53e3e;
}

.cart-btn {
  flex: 1;
  background: #fff;
  color: #111;
  border: 1px solid #111;
  padding: 0 16px;
  height: 52px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, color 0.2s;
}
.cart-btn:hover {
  background: #111;
  color: #fff;
}

.buy-btn {
  flex: 1.2;
  background: #111;
  color: #fff;
  border: none;
  padding: 0 16px;
  height: 52px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
  cursor: pointer;
  transition: background 0.2s;
}
.buy-btn:hover {
  background: #333;
}

.cart-btn-disabled {
  background: #ccc;
  border-color: #ccc;
  color: #fff;
  cursor: not-allowed;
}
.cart-btn-disabled:hover {
  background: #ccc;
  color: #fff;
}
.sold-out {
  color: #e53e3e;
}

/* 관련 상품 섹션 */
.related-section {
  border-top: 1px solid #e8e8e8;
  padding: 48px 0;
}
.related-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;
}
.section-title {
  font-size: 15px;
  font-weight: 800;
  color: #111;
  letter-spacing: -0.3px;
  margin-bottom: 24px;
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0;
  border-top: 1px solid #e8e8e8;
  border-left: 1px solid #e8e8e8;
}
@media (max-width: 768px) {
  .related-grid {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    gap: 0;
    border-top: 1px solid #e8e8e8;
    border-left: none;
  }
  .related-grid::-webkit-scrollbar { display: none; }
  .related-item {
    flex: 0 0 140px;
    max-width: 140px;
    scroll-snap-align: start;
    border-right: 1px solid #e8e8e8;
    border-bottom: 1px solid #e8e8e8;
    border-left: 1px solid #e8e8e8;
  }
  .related-img-wrap {
    padding: 8%;
  }
  .related-name { font-size: 10px; }
  .related-price { font-size: 11px; }
}

.related-item {
  text-decoration: none;
  color: #111;
  border-right: 1px solid #e8e8e8;
  border-bottom: 1px solid #e8e8e8;
  display: block;
  position: relative;
  z-index: 0;
  transition: box-shadow 0.25s ease;
}
.related-item:hover {
  box-shadow: 0 6px 24px rgba(0,0,0,0.12);
  z-index: 2;
}
.related-item:hover .related-img { transform: scale(1.04); }

.related-img-wrap {
  aspect-ratio: 1/1;
  overflow: hidden;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12%;
}
.related-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  transition: transform 0.35s;
}
.related-name {
  font-size: 11px;
  font-weight: 500;
  color: #111;
  padding: 8px 10px 2px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.related-price {
  font-size: 12px;
  font-weight: 700;
  color: #111;
  padding: 0 10px 10px;
}

/* 상세 설명 섹션 */
.detail-section {
  border-top: 1px solid #e8e8e8;
}
.detail-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;
}

/* 접히는 래퍼 */
.detail-collapse {
  position: relative;
  max-height: 400px;
  overflow: hidden;
  transition: max-height 0.5s ease;
}
.detail-collapse.expanded {
  max-height: none;
}

/* 그라데이션 오버레이 */
.detail-fade-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 200px;
  background: linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,1) 100%);
  pointer-events: none;
  z-index: 2;
}

/* 더보기 / 접기 버튼 */
.detail-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 18px 0;
  background: none;
  border: 1px solid #ddd;
  border-top: none;
  font-size: 14px;
  font-weight: 700;
  color: #333;
  cursor: pointer;
  letter-spacing: 0.5px;
  transition: background 0.2s, color 0.2s;
  margin-bottom: 48px;
}
.detail-toggle-btn:hover {
  background: #f5f5f5;
  color: #111;
}

/* 탭 메뉴 */
.detail-tabs {
  display: flex;
  border-bottom: 1px solid #e0e0e0;
}
.detail-tab {
  flex: 1;
  padding: 18px 0;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #999;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
}
.detail-tab:hover { color: #555; }
.detail-tab.active {
  color: #111;
  border-bottom-color: #111;
}

/* 상세 콘텐츠 */
.detail-content {
  padding: 48px 0 64px;
}

/* 브랜드 헤더 */
.brand-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 24px 32px;
  background: #fafafa;
  border: 1px solid #eee;
  margin-bottom: 48px;
}
.brand-header-logo {
  height: 48px;
  width: auto;
  object-fit: contain;
}
.brand-header-name {
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 3px;
  color: #111;
  line-height: 1;
  margin-bottom: -1px;
}
.brand-header-sub {
  font-size: 11px;
  color: #999;
  letter-spacing: 2px;
  margin-top: 0;
}

/* 상품 설명 블록 */
.info-block {
  text-align: center;
  margin-bottom: 48px;
  padding: 0 16px;
}
.info-title {
  font-size: 20px;
  font-weight: 800;
  color: #111;
  letter-spacing: -0.3px;
  margin-bottom: 16px;
}
.info-desc {
  font-size: 14px;
  color: #555;
  line-height: 2;
  max-width: 600px;
  margin: 0 auto;
}

/* 상품 이미지 나열 */
.info-images {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-bottom: 48px;
}
.info-image {
  width: 100%;
  max-width: 700px;
  height: auto;
  display: block;
}

/* 블로그식 블록 */
.info-blocks {
  margin-bottom: 48px;
}
.info-block-text {
  font-size: 14px;
  color: #444;
  line-height: 2;
  max-width: 700px;
  margin: 0 auto 24px;
  padding: 0 16px;
  white-space: pre-line;
}
.info-block-img {
  text-align: center;
  margin-bottom: 24px;
}
.info-block-img img {
  width: 100%;
  max-width: 700px;
  height: auto;
  display: inline-block;
}

/* 케어 가이드 */
.care-guide {
  background: #fafafa;
  border: 1px solid #eee;
  padding: 32px;
}
.care-title {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 3px;
  color: #111;
  text-align: center;
  margin-bottom: 24px;
}
.care-items {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.care-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #666;
  text-align: center;
  letter-spacing: 0.3px;
}

/* 배송/교환/반품 가이드 */
.guide-section {
  margin-bottom: 36px;
}
.guide-section h4 {
  font-size: 15px;
  font-weight: 700;
  color: #111;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e8e8e8;
}
.guide-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.guide-section li {
  font-size: 13px;
  color: #555;
  line-height: 2.2;
  padding-left: 16px;
  position: relative;
}
.guide-section li::before {
  content: '·';
  position: absolute;
  left: 0;
  color: #999;
  font-weight: 700;
}

/* 반품/교환 안내 박스 */
.return-notice {
  background: #f9f9f9;
  border: 1px solid #e8e8e8;
  padding: 24px 28px;
  margin-bottom: 36px;
  text-align: center;
}
.return-notice-title {
  font-size: 16px;
  font-weight: 800;
  color: #111;
  margin-bottom: 10px;
}
.return-notice-desc {
  font-size: 13px;
  color: #666;
  line-height: 1.8;
}

/* 가이드 테이블 */
.guide-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.guide-table th {
  background: #f9f9f9;
  border: 1px solid #e8e8e8;
  padding: 10px 14px;
  text-align: left;
  color: #333;
  font-weight: 600;
  white-space: nowrap;
  width: 140px;
}
.guide-table td {
  border: 1px solid #e8e8e8;
  padding: 10px 14px;
  color: #555;
  line-height: 1.6;
}

/* 주의사항 */
.guide-notice {
  background: #fafafa;
  border: 1px solid #e8e8e8;
  padding: 20px 24px;
  margin-top: 16px;
}
.guide-notice h4 {
  border-bottom: none;
  padding-bottom: 0;
  margin-bottom: 10px;
}
.notice-list li {
  font-size: 12px;
  color: #777;
  line-height: 2;
}

@media (max-width: 768px) {
  .guide-table th {
    width: 100px;
    font-size: 12px;
    padding: 8px 10px;
  }
  .guide-table td {
    font-size: 12px;
    padding: 8px 10px;
  }
  .return-notice {
    padding: 16px 20px;
  }
  .care-items {
    grid-template-columns: repeat(2, 1fr);
  }
  .brand-header {
    padding: 16px 20px;
  }
  .detail-content {
    padding: 32px 0 48px;
  }
}
</style>
