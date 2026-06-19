<template>
  <div class="home">
    <!-- 에디토리얼 히어로 (settings-driven) -->
    <section class="hero">
      <p class="hero-kicker">{{ settings.get('hero_kicker') }}</p>
      <h1 class="hero-title">
        <span class="hero-title-main">{{ settings.get('hero_title_main') }}</span>
        <span class="hero-title-sub">{{ settings.get('hero_title_sub') }}</span>
      </h1>
      <router-link :to="settings.get('hero_cta_link') || '/products'" class="hero-cta">
        {{ settings.get('hero_cta_text') }}
      </router-link>
    </section>

    <!-- 브랜드 마키 -->
    <BrandMarquee />

    <!-- 에디토리얼 스트립 (관리자 이미지+인용구) -->
    <section v-if="settings.get('editorial_image_url')" class="editorial-strip">
      <img :src="settings.get('editorial_image_url')" alt="Editorial" class="editorial-img" />
      <div class="editorial-quote-wrap">
        <p class="editorial-quote">{{ settings.get('editorial_quote') }}</p>
      </div>
    </section>

    <!-- 상품 그리드 (NEW IN) -->
    <section class="grid-section">
      <div class="section-head">
        <h2 class="section-title">NEW IN</h2>
        <router-link to="/products" class="section-more">전체 보기 →</router-link>
      </div>

      <div v-if="loading" class="state">
        <v-progress-circular indeterminate color="#1A1714" size="32" />
      </div>

      <div v-else-if="!sortedProducts.length" class="state state-empty">
        <v-icon size="40" color="#ccc">mdi-hanger</v-icon>
        <p>상품을 불러오지 못했습니다</p>
      </div>

      <div v-else class="pgrid">
        <ProductCard
          v-for="p in sortedProducts"
          :key="p.id"
          :product="p"
          @added="onAdded"
          @wished="onWished"
        />
      </div>
    </section>

    <!-- 룩북 스플릿 (좌측 카피 + 우측 풀-블리드 이미지) -->
    <section v-if="settings.get('lookbook_image_url')" class="lookbook">
      <div class="lookbook-text">
        <p class="lookbook-kicker">{{ settings.get('collection_label') }}</p>
        <h3 class="lookbook-title">{{ settings.get('lookbook_title') }}</h3>
        <p class="lookbook-caption">{{ settings.get('lookbook_caption') }}</p>
        <router-link to="/products" class="lookbook-cta">VIEW LOOKBOOK →</router-link>
      </div>
      <div class="lookbook-img-wrap">
        <img :src="settings.get('lookbook_image_url')" alt="Lookbook" class="lookbook-img" />
      </div>
    </section>

    <!-- 카테고리 모자이크 (3-col MEN/WOMEN/UNISEX) -->
    <section v-if="anyMosaic" class="mosaic">
      <router-link
        v-if="settings.get('mosaic_men_image')"
        to="/products?gender=men"
        class="mosaic-tile"
      >
        <img :src="settings.get('mosaic_men_image')" alt="MEN" class="mosaic-tile-img" />
        <div class="mosaic-tile-overlay">
          <span class="mosaic-tile-label">MEN</span>
        </div>
      </router-link>
      <router-link
        v-if="settings.get('mosaic_women_image')"
        to="/products?gender=women"
        class="mosaic-tile"
      >
        <img :src="settings.get('mosaic_women_image')" alt="WOMEN" class="mosaic-tile-img" />
        <div class="mosaic-tile-overlay">
          <span class="mosaic-tile-label">WOMEN</span>
        </div>
      </router-link>
      <router-link
        v-if="settings.get('mosaic_unisex_image')"
        to="/products?gender=unisex"
        class="mosaic-tile"
      >
        <img :src="settings.get('mosaic_unisex_image')" alt="UNISEX" class="mosaic-tile-img" />
        <div class="mosaic-tile-overlay">
          <span class="mosaic-tile-label">UNISEX</span>
        </div>
      </router-link>
    </section>

    <v-snackbar v-model="snackbar" color="#1A1714" timeout="2000" location="bottom right">
      <v-icon start color="white">mdi-check-circle</v-icon>
      <span style="color:#fff">{{ snackMsg }}</span>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import ProductCard from '../components/ProductCard.vue';
import BrandMarquee from '../components/BrandMarquee.vue';
import { useWishlistStore } from '../stores/wishlist';
import { useSettingsStore } from '../stores/settings';

const wishlistStore = useWishlistStore();
const settings = useSettingsStore();

const products = ref([]);
const loading = ref(true);
const snackbar = ref(false);
const snackMsg = ref('');

// 찜한 상품을 앞으로
const sortedProducts = computed(() => {
  const wished = products.value.filter(p => wishlistStore.isWished(p.id));
  const rest = products.value.filter(p => !wishlistStore.isWished(p.id));
  return [...wished, ...rest];
});

const anyMosaic = computed(() =>
  settings.get('mosaic_men_image') ||
  settings.get('mosaic_women_image') ||
  settings.get('mosaic_unisex_image')
);

onMounted(async () => {
  // settings는 main.js에서 이미 load() 호출됨 — 늦게 도착해도 reactivity로 반영
  try {
    const res = await axios.get('/api/products');
    products.value = res.data.products || [];
  } catch (e) {
    console.error('상품 목록을 불러오지 못했습니다', e);
    products.value = [];
  } finally {
    loading.value = false;
  }
});

function onAdded() {
  snackMsg.value = '장바구니에 담았습니다';
  snackbar.value = true;
}
function onWished(product) {
  snackMsg.value = wishlistStore.isWished(product.id) ? '찜 목록에 추가했습니다' : '찜 목록에서 제거했습니다';
  snackbar.value = true;
}
</script>

<style scoped>
.home { background: var(--c-cream); }

/* ── 히어로 (에디토리얼 + 세리프 이탤릭) ── */
.hero {
  text-align: center;
  padding: 110px 24px 90px;
  border-bottom: 1px solid var(--c-line);
  background: var(--c-cream);
}
.hero-kicker {
  font-family: var(--ff-label);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: var(--c-ink-soft);
  margin: 0 0 28px;
}
.hero-title {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin: 0 0 36px;
}
.hero-title-main {
  font-family: var(--ff-serif);
  font-style: italic;
  font-weight: 400;
  font-size: 96px;
  line-height: 0.95;
  color: var(--c-ink);
  letter-spacing: 0.005em;
}
.hero-title-sub {
  font-family: var(--ff-label);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.42em;
  text-transform: uppercase;
  color: var(--c-ink);
}
.hero-cta {
  display: inline-block;
  font-family: var(--ff-label);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
  text-decoration: none;
  color: var(--c-ink);
  border: 1px solid var(--c-ink);
  padding: 14px 28px;
  transition: background 0.25s, color 0.25s;
}
.hero-cta:hover {
  background: var(--c-ink);
  color: var(--c-cream);
}
@media (max-width: 599px) {
  .hero { padding: 70px 20px 56px; }
  .hero-kicker { font-size: 10px; letter-spacing: 0.28em; margin-bottom: 22px; }
  .hero-title-main { font-size: 64px; }
  .hero-title-sub { font-size: 11px; letter-spacing: 0.32em; }
  .hero-cta { padding: 12px 22px; font-size: 10.5px; }
}

/* ── 에디토리얼 스트립 ── */
.editorial-strip {
  position: relative;
  width: 100%;
  height: 60vh;
  min-height: 380px;
  max-height: 640px;
  overflow: hidden;
  border-bottom: 1px solid var(--c-line);
}
.editorial-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.editorial-quote-wrap {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, rgba(26,23,20,0.18) 0%, rgba(26,23,20,0.35) 100%);
}
.editorial-quote {
  margin: 0;
  max-width: 720px;
  padding: 0 24px;
  text-align: center;
  font-family: var(--ff-serif);
  font-style: italic;
  font-weight: 400;
  font-size: 32px;
  line-height: 1.45;
  color: var(--c-cream);
  white-space: pre-line;
  text-shadow: 0 2px 16px rgba(0,0,0,0.25);
}
@media (max-width: 599px) {
  .editorial-strip { height: 50vh; min-height: 320px; }
  .editorial-quote { font-size: 22px; }
}

/* ── 그리드 섹션 ── */
.grid-section {
  max-width: 1600px;
  margin: 0 auto;
  padding: 80px 24px 80px;
}
.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 36px;
}
.section-title {
  font-family: var(--ff-label);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--c-ink);
}
.section-more {
  font-family: var(--ff-label);
  font-size: 10.5px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--c-ink-soft);
  text-decoration: none;
}
.section-more:hover { color: var(--c-ink); }

.pgrid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  column-gap: 16px;
  row-gap: 40px;
}
@media (max-width: 1024px) { .pgrid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 599px) {
  .pgrid { grid-template-columns: repeat(2, 1fr); column-gap: 10px; row-gap: 28px; }
  .grid-section { padding: 56px 16px 56px; }
}

/* ── 룩북 스플릿 ── */
.lookbook {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  min-height: 540px;
  background: var(--c-cream-soft);
  border-top: 1px solid var(--c-line);
  border-bottom: 1px solid var(--c-line);
}
.lookbook-text {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 80px 80px 80px 80px;
}
.lookbook-kicker {
  font-family: var(--ff-label);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: var(--c-ink-soft);
  margin: 0 0 24px;
}
.lookbook-title {
  font-family: var(--ff-serif);
  font-style: italic;
  font-weight: 400;
  font-size: 56px;
  line-height: 1.05;
  color: var(--c-ink);
  margin: 0 0 28px;
}
.lookbook-caption {
  font-size: 14px;
  line-height: 1.8;
  color: var(--c-ink-soft);
  margin: 0 0 36px;
  max-width: 380px;
}
.lookbook-cta {
  align-self: flex-start;
  font-family: var(--ff-label);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--c-ink);
  text-decoration: none;
  border-bottom: 1px solid var(--c-ink);
  padding-bottom: 4px;
  transition: opacity 0.2s;
}
.lookbook-cta:hover { opacity: 0.55; }
.lookbook-img-wrap { overflow: hidden; background: var(--c-paper); }
.lookbook-img { width: 100%; height: 100%; object-fit: cover; display: block; }
@media (max-width: 900px) {
  .lookbook { grid-template-columns: 1fr; min-height: auto; }
  .lookbook-text { padding: 56px 24px; }
  .lookbook-title { font-size: 44px; }
  .lookbook-img-wrap { aspect-ratio: 4/5; }
}

/* ── 카테고리 모자이크 (3-col) ── */
.mosaic {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2px;
  background: var(--c-line);
  padding: 0;
}
.mosaic-tile {
  position: relative;
  display: block;
  overflow: hidden;
  background: var(--c-paper);
  aspect-ratio: 3/4;
  text-decoration: none;
}
.mosaic-tile-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.6s ease;
}
.mosaic-tile:hover .mosaic-tile-img { transform: scale(1.04); }
.mosaic-tile-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, rgba(26,23,20,0) 0%, rgba(26,23,20,0.55) 100%);
  transition: background 0.3s;
}
.mosaic-tile:hover .mosaic-tile-overlay {
  background: linear-gradient(180deg, rgba(26,23,20,0.1) 0%, rgba(26,23,20,0.7) 100%);
}
.mosaic-tile-label {
  font-family: var(--ff-serif);
  font-style: italic;
  font-weight: 500;
  font-size: 42px;
  color: var(--c-cream);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  text-shadow: 0 2px 16px rgba(0,0,0,0.3);
}
@media (max-width: 768px) {
  .mosaic { grid-template-columns: 1fr; }
  .mosaic-tile { aspect-ratio: 16/10; }
  .mosaic-tile-label { font-size: 36px; }
}

/* ── 상태 ── */
.state {
  text-align: center;
  padding: 100px 24px;
  color: var(--c-muted);
}
.state-empty p { margin-top: 14px; font-size: 14px; }
</style>
