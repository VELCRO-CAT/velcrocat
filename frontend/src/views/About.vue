<template>
  <div class="about-page">

    <!-- 미니 네비게이션 (브랜드 페이지 전용) -->
    <nav class="brand-nav">
      <router-link to="/" class="brand-nav-logo">
        <img src="../image/osakamarketLOGO2.png" alt="Velcro Cat" />
      </router-link>
      <div class="brand-nav-links">
        <router-link to="/">HOME</router-link>
        <router-link to="/products">SHOP</router-link>
        <router-link to="/contact">CONTACT</router-link>
      </div>
    </nav>

    <!-- 히어로 (배경 영상 슬라이드쇼) -->
    <section class="about-hero">
      <div class="hero-video-wrap">
        <video
          v-for="(vid, i) in heroVideos"
          :key="i"
          :ref="el => { if (el) videoRefs[i] = el }"
          class="hero-video"
          :class="{ active: currentVideo === i }"
          muted
          playsinline
          :preload="i === 0 ? 'auto' : 'none'"
          :poster="i === 0 ? 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&h=1080&fit=crop' : ''"
          :src="vid.src"
          @ended="nextVideo"
        />
        <div class="hero-video-overlay"></div>
      </div>
      <div class="hero-content">
        <span class="hero-label">Brand Concept</span>
        <h1 class="hero-title">
          VELCRO<br>
          <span class="accent">CAT</span>
        </h1>
        <p class="hero-desc">
          일상과 스타일의 경계를 허무는 브랜드.<br>
          편안함 속에서 나만의 감각을 찾다.
        </p>
        <div class="hero-scroll">
          <span>Scroll</span>
          <div class="hero-scroll-line"></div>
        </div>
      </div>
    </section>

    <!-- 마키 텍스트 -->
    <div class="marquee-section">
      <div class="marquee-track">
        <span class="marquee-item" v-for="n in 2" :key="n">
          COMFORTABLE <span class="dot"></span>
          MINIMAL <span class="dot"></span>
          EVERYDAY <span class="dot"></span>
          JAPANESE STYLE <span class="dot"></span>
          VELCRO CAT <span class="dot"></span>
        </span>
      </div>
    </div>

    <!-- 브랜드 스토리 -->
    <section class="section story" ref="storyRef">
      <div class="story-layout">
        <div class="story-visual">
          <img src="../image/osakamarketLOGO3.png" alt="Velcro Cat" class="story-logo" />
          <div class="visual-label">EST. 2026 OSAKA</div>
        </div>
        <div class="story-text">
          <p class="section-label">Our Story</p>
          <h2 class="section-title">고양이처럼<br>자유롭게</h2>
          <p class="story-desc">
            Velcro Cat은 오사카에서 시작된 라이프스타일 패션 브랜드입니다.
            고양이가 어디에나 자연스럽게 녹아드는 것처럼,
            일상 속에서 편안하면서도 감각적인 스타일을 추구합니다.
          </p>
          <p class="story-desc">
            우리는 과하지 않은 심플함, 몸이 기억하는 편안함,
            그리고 오래 입어도 질리지 않는 디자인을 믿습니다.
          </p>
        </div>
      </div>
    </section>

    <!-- 브랜드 가치 -->
    <section class="section values">
      <div class="values-header">
        <p class="section-label">Values</p>
        <h2 class="section-title">우리가 추구하는<br>네 가지 가치</h2>
      </div>
      <div class="values-grid">
        <div class="value-card">
          <div class="value-number">01</div>
          <h3>Comfort First</h3>
          <p>입는 순간 느껴지는 편안함. 소재 선정부터 패턴 설계까지, 착용감을 최우선으로 합니다.</p>
        </div>
        <div class="value-card">
          <div class="value-number">02</div>
          <h3>Minimal Design</h3>
          <p>불필요한 장식을 덜어내고 본질에 집중합니다. 심플하지만 존재감 있는 디자인.</p>
        </div>
        <div class="value-card">
          <div class="value-number">03</div>
          <h3>Quality Material</h3>
          <p>직접 만져보고 선택한 원단만 사용합니다. 세탁 후에도 변하지 않는 품질을 약속합니다.</p>
        </div>
        <div class="value-card">
          <div class="value-number">04</div>
          <h3>Everyday Style</h3>
          <p>특별한 날이 아닌, 매일 입고 싶은 옷. 일상에 자연스럽게 스며드는 스타일을 만듭니다.</p>
        </div>
      </div>
    </section>

    <!-- 특징 섹션 -->
    <section class="section features">
      <div class="features-layout">
        <div class="features-visual">
          <img src="../image/osakamarketLOGO2.png" alt="Velcro Cat" class="features-logo" />
          <div class="visual-label-dark">Velcro Cat Collection</div>
        </div>
        <div class="features-list">
          <div class="feature-item">
            <h3>Japan Quality</h3>
            <p>일본 현지에서 엄선한 원단과 부자재를 사용합니다. 오사카 특유의 캐주얼 감성을 담았습니다.</p>
          </div>
          <div class="feature-item">
            <h3>Unisex Fit</h3>
            <p>남녀 구분 없이 누구나 편하게 입을 수 있는 유니섹스 핏. 체형에 구애받지 않는 자유로운 실루엣.</p>
          </div>
          <div class="feature-item">
            <h3>Season-less</h3>
            <p>계절에 얽매이지 않는 소재와 디자인. 레이어링으로 사계절 내내 활용할 수 있습니다.</p>
          </div>
          <div class="feature-item">
            <h3>Sustainable</h3>
            <p>환경을 생각하는 소량 생산 방식. 과잉 재고 없이, 필요한 만큼만 정직하게 만듭니다.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="section cta">
      <div class="cta-content">
        <p class="section-label">Shop Now</p>
        <h2 class="section-title">오늘의 스타일을<br>만나보세요</h2>
        <p class="cta-desc">
          Velcro Cat의 새로운 컬렉션을 지금 확인하세요.<br>
          편안함과 스타일, 두 가지 모두를 놓치지 마세요.
        </p>
        <div class="cta-actions">
          <router-link to="/products" class="btn-primary">SHOP 바로가기</router-link>
          <router-link to="/contact" class="btn-secondary">문의하기</router-link>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';

const storyRef = ref(null);

// 히어로 영상 슬라이드쇼
const heroVideos = [
  { src: 'https://assets.mixkit.co/videos/34707/34707-720.mp4' },     // 매장 행거에 걸린 티셔츠들
  { src: 'https://assets.mixkit.co/videos/21328/21328-720.mp4' },     // 매장을 걷는 여성
  { src: 'https://assets.mixkit.co/videos/23327/23327-720.mp4' },     // 손으로 옷을 넘기며 고르기
  { src: 'https://assets.mixkit.co/videos/33125/33125-720.mp4' },     // 매장 진열대를 보는 남성
  { src: 'https://assets.mixkit.co/videos/33167/33167-720.mp4' },     // 코트랙에 걸린 스웨터들
  { src: 'https://assets.mixkit.co/videos/21330/21330-720.mp4' },     // 쇼핑백 들고 매장 걷기
];
const currentVideo = ref(0);
const videoRefs = ref([]);

function nextVideo() {
  const prev = currentVideo.value;
  currentVideo.value = (prev + 1) % heroVideos.length;
  const nextEl = videoRefs.value[currentVideo.value];
  if (nextEl) {
    nextEl.currentTime = 0;
    nextEl.play().catch(() => {});
  }
  // 그 다음 영상도 미리 로드
  const upcoming = (currentVideo.value + 1) % heroVideos.length;
  const upcomingEl = videoRefs.value[upcoming];
  if (upcomingEl && upcomingEl.preload === 'none') {
    upcomingEl.preload = 'auto';
    upcomingEl.load();
  }
}

function startFirstVideo() {
  const first = videoRefs.value[0];
  if (first) {
    first.play().catch(() => {});
  }
  // 두 번째 영상만 미리 로드
  setTimeout(() => {
    const second = videoRefs.value[1];
    if (second) {
      second.preload = 'auto';
      second.load();
    }
  }, 2000);
}

// 스크롤 시 네비바 배경 추가
function handleScroll() {
  const nav = document.querySelector('.brand-nav');
  if (!nav) return;
  if (window.scrollY > 80) {
    nav.style.background = 'rgba(0,0,0,0.85)';
    nav.style.backdropFilter = 'blur(10px)';
  } else {
    nav.style.background = 'transparent';
    nav.style.backdropFilter = 'none';
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
  // 첫 영상 자동재생
  setTimeout(startFirstVideo, 300);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

  document.querySelectorAll('.about-page .section, .about-page .value-card, .about-page .feature-item').forEach(el => {
    observer.observe(el);
  });
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<style scoped>
/* 브랜드 전용 네비 */
.brand-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 32px;
  transition: background 0.3s;
}
.brand-nav-logo img {
  height: 36px;
  width: auto;
  object-fit: contain;
}
.brand-nav-links {
  display: flex;
  gap: 24px;
}
.brand-nav-links a {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2px;
  color: rgba(255,255,255,0.7);
  text-decoration: none;
  transition: color 0.2s;
}
.brand-nav-links a:hover {
  color: #fff;
}

/* 공통 */
.about-page {
  background: #fff;
  color: #111;
  overflow-x: hidden;
  overflow-y: auto;
  height: 100vh;
}
.section {
  padding: 100px 24px;
  max-width: 1200px;
  margin: 0 auto;
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.7s ease, transform 0.7s ease;
}
.section.visible {
  opacity: 1;
  transform: translateY(0);
}
.section-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: #999;
  margin-bottom: 12px;
}
.section-title {
  font-size: 32px;
  font-weight: 800;
  line-height: 1.3;
  letter-spacing: -0.5px;
  color: #111;
  margin-bottom: 20px;
}

/* 히어로 */
.about-hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  overflow: hidden;
  background: #0a0a0a;
}
.hero-video-wrap {
  position: absolute;
  inset: 0;
  z-index: 0;
}
.hero-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 1.5s ease;
}
.hero-video.active {
  opacity: 1;
}
.hero-video-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: rgba(0, 0, 0, 0.5);
}
.hero-content {
  position: relative;
  z-index: 1;
  padding: 0 24px;
}
.hero-label {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 5px;
  text-transform: uppercase;
  color: #888;
  border: 1px solid #333;
  padding: 8px 20px;
  margin-bottom: 32px;
}
.hero-title {
  font-size: 72px;
  font-weight: 900;
  letter-spacing: 8px;
  line-height: 1.1;
  color: #fff;
  margin-bottom: 24px;
}
.hero-title .accent {
  background: linear-gradient(135deg, #e0e0e0, #888);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.hero-desc {
  font-size: 15px;
  color: #999;
  line-height: 1.8;
  letter-spacing: 0.5px;
  max-width: 480px;
  margin: 0 auto;
}
.hero-scroll {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.hero-scroll span {
  font-size: 10px;
  letter-spacing: 3px;
  color: #666;
  text-transform: uppercase;
}
.hero-scroll-line {
  width: 1px;
  height: 48px;
  background: linear-gradient(to bottom, #666, transparent);
  animation: scrollPulse 2s ease-in-out infinite;
}
@keyframes scrollPulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

/* 마키 텍스트 */
.marquee-section {
  background: #111;
  padding: 18px 0;
  overflow: hidden;
  white-space: nowrap;
}
.marquee-track {
  display: inline-flex;
  animation: marquee 25s linear infinite;
}
.marquee-item {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 4px;
  color: #555;
  padding: 0 12px;
}
.dot {
  display: inline-block;
  width: 4px;
  height: 4px;
  background: #444;
  border-radius: 50%;
  vertical-align: middle;
  margin: 0 16px;
}
@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

/* 브랜드 스토리 */
.story-layout {
  display: flex;
  gap: 80px;
  align-items: center;
}
.story-visual {
  flex-shrink: 0;
  width: 360px;
  height: 360px;
  background: #f8f8f8;
  border: 1px solid #eee;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}
.story-logo {
  height: 200px;
  width: auto;
  object-fit: contain;
}
.visual-label {
  font-size: 10px;
  letter-spacing: 3px;
  color: #bbb;
  font-weight: 600;
}
.story-text { flex: 1; }
.story-desc {
  font-size: 14px;
  line-height: 2;
  color: #555;
  margin-bottom: 16px;
  letter-spacing: 0.3px;
}

/* 브랜드 가치 */
.values-header {
  text-align: center;
  margin-bottom: 56px;
}
.values-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0;
  border-top: 1px solid #e0e0e0;
  border-left: 1px solid #e0e0e0;
}
.value-card {
  padding: 40px 32px;
  border-right: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.5s ease, transform 0.5s ease, background 0.2s;
}
.value-card.visible {
  opacity: 1;
  transform: translateY(0);
}
.value-card:hover {
  background: #fafafa;
}
.value-number {
  font-size: 36px;
  font-weight: 900;
  color: #e0e0e0;
  margin-bottom: 16px;
  letter-spacing: 2px;
}
.value-card h3 {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 12px;
  letter-spacing: 1px;
}
.value-card p {
  font-size: 13px;
  line-height: 1.8;
  color: #777;
}

/* 특징 */
.features-layout {
  display: flex;
  gap: 64px;
  align-items: flex-start;
}
.features-visual {
  flex-shrink: 0;
  width: 320px;
  height: 400px;
  background: #fff;
  border: 1px solid #eee;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  position: sticky;
  top: 80px;
}
.features-logo {
  height: 180px;
  width: auto;
  object-fit: contain;
}
.visual-label-dark {
  font-size: 10px;
  letter-spacing: 3px;
  color: #999;
  font-weight: 600;
}
.features-list { flex: 1; }
.feature-item {
  padding: 32px 0;
  border-bottom: 1px solid #eee;
  opacity: 0;
  transform: translateX(20px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.feature-item.visible {
  opacity: 1;
  transform: translateX(0);
}
.feature-item h3 {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 10px;
  letter-spacing: 1px;
}
.feature-item p {
  font-size: 13px;
  line-height: 1.9;
  color: #777;
}

/* CTA */
.cta {
  text-align: center;
  background: #0a0a0a;
  max-width: 100%;
  padding: 100px 24px;
  color: #fff;
}
.cta .section-label { color: #666; }
.cta .section-title { color: #fff; }
.cta-desc {
  font-size: 14px;
  line-height: 1.9;
  color: #888;
  margin-bottom: 36px;
}
.cta-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}
.btn-primary {
  display: inline-block;
  padding: 14px 36px;
  background: #fff;
  color: #111;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2px;
  text-decoration: none;
  transition: background 0.2s, transform 0.2s;
}
.btn-primary:hover {
  background: #e0e0e0;
  transform: translateY(-2px);
}
.btn-secondary {
  display: inline-block;
  padding: 14px 36px;
  border: 1px solid #555;
  color: #aaa;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2px;
  text-decoration: none;
  transition: border-color 0.2s, color 0.2s;
}
.btn-secondary:hover {
  border-color: #fff;
  color: #fff;
}

/* 모바일 반응형 */
@media (max-width: 768px) {
  .brand-nav {
    padding: 12px 16px;
  }
  .brand-nav-logo img {
    height: 28px;
  }
  .brand-nav-links {
    gap: 14px;
  }
  .brand-nav-links a {
    font-size: 10px;
    letter-spacing: 1px;
  }
  .hero-title {
    font-size: 42px;
    letter-spacing: 4px;
  }
  .story-layout {
    flex-direction: column;
    gap: 40px;
  }
  .story-visual {
    width: 100%;
    height: 280px;
  }
  .values-grid {
    grid-template-columns: 1fr;
  }
  .features-layout {
    flex-direction: column;
    gap: 40px;
  }
  .features-visual {
    width: 100%;
    height: 280px;
    position: static;
  }
  .section-title {
    font-size: 26px;
  }
}
</style>
