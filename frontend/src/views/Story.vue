<template>
  <div class="story-page">
    <!-- 01. 정체성 -->
    <section class="story-hero">
      <div class="story-hero-inner reveal-in" ref="heroEl">
        <img src="../image/osakamarketLOGO2.png" alt="Velcrocat" class="story-hero-cat" />
        <p class="story-kicker">
          나는 누구의 고양이도 아니었다.<br />
          <em>But somehow, I always stuck around.</em>
        </p>
        <h1 class="story-headline">I belong to<br />no one.</h1>
        <button type="button" class="story-cta story-cta-light" @click="scrollTo('origin')">MEET VELCROCAT</button>
      </div>
      <div class="story-scroll-hint">
        <span>SCROLL</span>
        <span class="story-scroll-line"></span>
      </div>
    </section>

    <!-- 출생 -->
    <section id="origin" class="story-block story-block-light reveal" ref="originEl">
      <p class="story-eyebrow">ORIGIN</p>
      <p class="story-copy">
        나는 일본의 어느 작은 골목에서 태어났다.
      </p>
      <p class="story-copy story-copy-muted">
        집도, 이름도, 주인도 없었다. 마음에 드는 곳에서 잠들고, 마음에 들지 않으면 떠났다.<br />
        누구에게 허락을 구할 필요도 없었다.
      </p>
    </section>

    <!-- 02. 이름의 탄생 -->
    <section class="story-block story-block-warm reveal" ref="nameEl">
      <p class="story-eyebrow">THE NAME</p>
      <h2 class="story-headline-sm">A little cat<br />that sticks around.</h2>
      <div class="story-name-grid">
        <div class="story-name-media">
          <img src="../image/osakamarketLOGO2.png" alt="Velcrocat" class="story-name-cat" />
        </div>
        <div class="story-name-copy">
          <p>
            그러던 어느 날, 오래된 옷 수선점에 들어갔다.
          </p>
          <p>
            그곳에는 낡은 재킷과 잘려 나간 천 조각, 엉켜 있는 실들이 가득했다. 나는 그 사이에 몸을 웅크리고
            앉아 있기를 좋아했다. 사람들은 나를 쫓아내려 했지만, 이상하게도 나는 자꾸만 그곳으로 돌아왔다.
          </p>
          <p>
            옷감 위에 올라앉고, 소매에 몸을 비비고, 마음에 드는 천 조각을 앞발로 끌어당겼다.
          </p>
          <p>
            그 모습을 지켜보던 수선점 주인이 나를 보고 웃었다.
          </p>
          <p class="story-quote">“You little Velcrocat.”</p>
          <p>
            어디든 착 달라붙는 고양이라는 뜻이었다.<br />
            그날부터 내 이름은 Velcrocat이 되었다.
          </p>
        </div>
      </div>
    </section>

    <!-- 태도 / 철학 -->
    <section class="story-block story-block-dark reveal" ref="philosophyEl">
      <p class="story-eyebrow story-eyebrow-light">ATTITUDE</p>
      <p class="story-copy story-copy-light">
        나는 여전히 길고양이다. 누군가의 것이 되기 위해 살아가지 않는다.<br />
        내가 좋아하는 것을 고르고, 나만의 방식으로 살아간다.
      </p>
      <p class="story-copy story-copy-light story-copy-muted-light">그리고 옷도 그렇다.</p>
      <p class="story-copy story-copy-light story-copy-muted-light">
        무엇을 입어야 하는지 정해진 답은 없다.<br />
        남들이 좋아하는 옷보다 내가 좋아하는 옷. 유행을 따라가는 것보다 나를 표현할 수 있는 것.
      </p>
      <p class="story-pullquote">
        옷은 나를 바꾸는 것이 아니라,<br />원래의 나를 드러내는 것이니까.
      </p>
    </section>

    <!-- 03. 상품과 연결 -->
    <section id="products" class="story-block story-products reveal" ref="productsEl">
      <div v-if="products.length" class="story-teaser-strip">
        <div
          v-for="p in products"
          :key="`teaser-${p.id}`"
          class="story-teaser-thumb"
          :style="{ backgroundImage: `url(${p.image})` }"
        ></div>
      </div>

      <p class="story-eyebrow">THE COLLECTION</p>
      <p class="story-copy">
        이곳은 Velcrocat의 작은 세계다.<br />
        고양이 한 마리의 취향에서 시작된 옷들.
      </p>
      <p class="story-copy story-copy-muted">
        누군가에게는 그저 옷일지 모르지만,<br />
        누군가에게는 자신을 표현하는 하나의 방식이 될 것이다.<br />
        마음에 들었다면, 그냥 가져가도 좋다.
      </p>
      <p class="story-copy story-emphasis">나는 누구의 고양이도 아니니까.</p>
      <h2 class="story-headline-sm story-headline-tight">STICK TO<br />YOURSELF.</h2>

      <div v-if="products.length" class="story-product-grid">
        <router-link
          v-for="p in products"
          :key="p.id"
          :to="`/products/${p.id}`"
          class="story-product-card"
        >
          <div class="story-product-img" :style="{ backgroundImage: `url(${p.image})` }"></div>
          <p class="story-product-name">{{ lf(p, 'name') }}</p>
          <p class="story-product-price">₩{{ Number(p.price).toLocaleString() }}</p>
        </router-link>
      </div>

      <router-link to="/products" class="story-cta story-cta-dark">EXPLORE THE COLLECTION</router-link>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import axios from 'axios';
import { useLocalized } from '../composables/useLocalized';

const { lf } = useLocalized();

const products = ref([]);
onMounted(async () => {
  try {
    const res = await axios.get('/api/products');
    products.value = (res.data.products || []).slice(0, 4);
  } catch {}
});

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 스크롤 진입 시 reveal
let observer = null;
onMounted(() => {
  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

  document.querySelectorAll('.story-page .reveal, .story-page .reveal-in').forEach((el) => observer.observe(el));
});
onBeforeUnmount(() => observer?.disconnect());
</script>

<style scoped>
.story-page {
  font-family: 'Noto Sans KR', sans-serif;
  color: #111;
  overflow-x: hidden;
}

.reveal, .reveal-in {
  opacity: 0;
  transform: translateY(28px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}
.reveal.is-visible, .reveal-in.is-visible {
  opacity: 1;
  transform: translateY(0);
}

/* ===== 01. 정체성 ===== */
.story-hero {
  position: relative;
  min-height: 92vh;
  background: #0a0a0a;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 80px 20px;
}
.story-hero-inner { max-width: 560px; display: flex; flex-direction: column; align-items: center; }
.story-hero-cat {
  width: 116px;
  height: auto;
  margin-bottom: 28px;
  filter: drop-shadow(0 8px 28px rgba(0, 0, 0, 0.5));
}
.story-kicker {
  font-size: 13px;
  line-height: 1.9;
  color: rgba(255, 255, 255, 0.55);
  letter-spacing: 0.02em;
  margin: 0 0 22px;
}
.story-kicker em { font-style: italic; color: rgba(255, 255, 255, 0.8); }
.story-headline {
  font-family: 'Arial Black', 'Helvetica Neue', sans-serif;
  font-weight: 900;
  font-size: clamp(38px, 7vw, 64px);
  line-height: 1.08;
  letter-spacing: -0.01em;
  margin: 0 0 36px;
  text-wrap: balance;
}
.story-cta {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
  padding: 15px 30px;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid currentColor;
}
.story-cta-light { background: #fff; color: #111; border-color: #fff; }
.story-cta-light:hover { background: transparent; color: #fff; }
.story-cta-dark { background: #111; color: #fff; border-color: #111; }
.story-cta-dark:hover { background: transparent; color: #111; }

.story-scroll-hint {
  position: absolute;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.45);
  font-size: 10px;
  letter-spacing: 0.3em;
}
.story-scroll-line {
  width: 1px;
  height: 36px;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.6), transparent);
  animation: storyScrollPulse 1.8s ease-in-out infinite;
}
@keyframes storyScrollPulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

/* ===== 공통 섹션 ===== */
.story-block {
  padding: 120px 24px;
  text-align: center;
}
.story-block-light { background: #fff; }
.story-block-warm { background: #faf7f2; }
.story-block-dark { background: #0a0a0a; color: #fff; }

.story-eyebrow {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.32em;
  color: #999;
  margin: 0 0 28px;
}
.story-eyebrow-light { color: rgba(255, 255, 255, 0.45); }

.story-copy {
  max-width: 560px;
  margin: 0 auto 14px;
  font-size: 18px;
  line-height: 1.9;
  color: #222;
}
.story-copy-muted { color: #888; font-size: 15px; }
.story-copy-light { color: #fff; }
.story-copy-muted-light { color: rgba(255, 255, 255, 0.55); font-size: 15px; }
.story-emphasis {
  font-weight: 800;
  font-size: 18px;
  color: #111;
  margin: 22px auto 40px;
}

.story-headline-sm {
  font-family: 'Arial Black', 'Helvetica Neue', sans-serif;
  font-weight: 900;
  font-size: clamp(28px, 5vw, 46px);
  line-height: 1.15;
  letter-spacing: -0.01em;
  margin: 0 0 56px;
}
.story-headline-tight { margin-bottom: 28px; }

/* ===== 02. 이름의 탄생 ===== */
.story-name-grid {
  max-width: 880px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 56px;
  align-items: center;
  text-align: left;
}
.story-name-media {
  display: flex;
  align-items: center;
  justify-content: center;
}
.story-name-cat {
  width: 100%;
  max-width: 220px;
  filter: drop-shadow(0 10px 24px rgba(0, 0, 0, 0.12));
}
.story-name-copy p {
  font-size: 15.5px;
  line-height: 1.9;
  color: #444;
  margin: 0 0 18px;
}
.story-quote {
  font-family: 'Arial Black', 'Helvetica Neue', sans-serif;
  font-weight: 900;
  font-size: 24px !important;
  color: #111 !important;
  margin: 24px 0 !important;
}

/* ===== 태도 / 철학 ===== */
.story-pullquote {
  max-width: 520px;
  margin: 48px auto 0;
  font-family: 'Arial Black', 'Helvetica Neue', sans-serif;
  font-weight: 900;
  font-size: clamp(22px, 3.6vw, 32px);
  line-height: 1.4;
  letter-spacing: -0.01em;
  color: #fff;
}

/* ===== 03. 상품과 연결 ===== */
.story-products { background: #fff; padding-top: 72px; padding-bottom: 88px; }
.story-teaser-strip {
  display: flex;
  justify-content: center;
  margin-bottom: 32px;
}
.story-teaser-thumb {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-size: cover;
  background-position: center;
  background-color: #f5f5f5;
  border: 3px solid #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-left: -16px;
}
.story-teaser-thumb:first-child { margin-left: 0; }
.story-product-grid {
  max-width: 920px;
  margin: 0 auto 56px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 20px;
}
.story-product-card { text-decoration: none; color: #111; display: block; }
.story-product-img {
  width: 100%;
  aspect-ratio: 3 / 4;
  background-size: cover;
  background-position: center;
  background-color: #f5f5f5;
  margin-bottom: 12px;
  transition: opacity 0.2s;
}
.story-product-card:hover .story-product-img { opacity: 0.8; }
.story-product-name {
  font-size: 13px;
  font-weight: 500;
  margin: 0 0 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.story-product-price { font-size: 13px; font-weight: 700; margin: 0; }

/* ===== 반응형 ===== */
@media (max-width: 640px) {
  .story-hero { min-height: 100vh; padding: 60px 20px; }
  .story-block { padding: 80px 20px; }
  .story-name-grid { grid-template-columns: 1fr; gap: 28px; text-align: center; }
  .story-name-copy { text-align: left; }
  .story-name-media { max-width: 140px; margin: 0 auto; }
}
</style>
