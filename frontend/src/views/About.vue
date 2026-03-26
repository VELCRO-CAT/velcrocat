<template>
  <div class="about-page">

    <!-- MRU식 네비게이션 -->
    <nav class="brand-nav">
      <router-link to="/" class="brand-nav-logo">
        <img src="../image/osakamarketLOGO2.png" alt="Velcro Cat" />
        <span class="brand-nav-name">VELCROCAT</span>
      </router-link>
      <div class="brand-nav-main">
        <router-link to="/home">HOME</router-link>
        <a href="#concept" @click.prevent="scrollTo('concept')">CONCEPT</a>
        <a href="#pickup" @click.prevent="scrollTo('pickup')">PICK UP</a>
        <router-link to="/products">SHOP</router-link>
        <router-link to="/contact">CONTACT</router-link>
      </div>
      <div class="brand-nav-sub">
        <a href="#" class="sub-link">회사 소개</a>
        <router-link to="/privacy" class="sub-link">개인정보처리방침</router-link>
        <a href="https://www.instagram.com/" target="_blank" class="sub-social">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
        </a>
      </div>
      <div class="brand-nav-btns">
        <router-link to="/products" class="nav-btn nav-btn-gray">ONLINE SHOP</router-link>
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
        <span class="hero-label hero-reveal">Brand Concept</span>
        <img src="../image/osakamarketLOGO6.png" alt="Velcro Cat" class="hero-main-logo hero-reveal hero-reveal-2" />
        <p class="hero-desc hero-reveal hero-reveal-3">
          일상과 스타일의 경계를 허무는 브랜드.<br>
          편안함 속에서 나만의 감각을 찾다.
        </p>
        <div class="hero-btns hero-reveal hero-reveal-4">
          <router-link to="/products" class="second-hero-btn">SHOP 바로가기</router-link>
          <router-link to="/contact" class="second-hero-btn btn-outline">문의하기</router-link>
        </div>
      </div>
      <!-- 스크롤 인디케이터 (우측 하단, hero-content 밖) -->
      <div class="scroll-indicator">
        <span class="scroll-text">Scroll</span>
        <div class="scroll-line"></div>
      </div>
    </section>

    <!-- 마키 텍스트 -->
    <div class="marquee-section">
      <div class="marquee-track">
        <span class="marquee-item" v-for="n in 2" :key="n">
          VELCROCAT <span class="dot"></span>
          PREMIUM WOOL 100% <span class="dot"></span>
          HIGH QUALITY <span class="dot"></span>
          COMFORTABLE <span class="dot"></span>
          MINIMAL <span class="dot"></span>
          EVERYDAY <span class="dot"></span>
        </span>
      </div>
    </div>

    <!-- 패럴랙스 로고 섹션 -->
    <div class="parallax-wrap">
      <!-- 로고 고정 배경 -->
      <div class="parallax-bg">
        <div class="parallax-logo-text">
          <img src="../image/osakamarketLOGO2.png" alt="Velcro Cat" class="parallax-cat" />
          <div class="parallax-velcro">VELCRO</div>
          <div class="parallax-cat-text">CAT</div>
        </div>
      </div>
      <!-- 스크롤 콘텐츠 -->
      <div class="parallax-content">
        <!-- 설명 블록들이 먼저 보임 -->
        <div class="parallax-card parallax-card-1">
          <p class="parallax-label">ABOUT US</p>
          <h2 class="parallax-title">일상에 스며드는<br>감각적인 스타일</h2>
          <p class="parallax-desc">Velcro Cat은 편안함과 스타일의 균형을 추구합니다.<br>매일 입고 싶은 옷, 오래 곁에 두고 싶은 브랜드.</p>
        </div>
        <div class="parallax-card parallax-card-2">
          <p class="parallax-label">PHILOSOPHY</p>
          <h2 class="parallax-title">과하지 않은<br>심플함의 가치</h2>
          <p class="parallax-desc">불필요한 것을 덜어내고 본질에 집중합니다.<br>자연스러운 실루엣, 시간이 지나도 변하지 않는 품질.</p>
        </div>
        <div class="parallax-card parallax-card-3">
          <p class="parallax-label">ORIGIN</p>
          <h2 class="parallax-title">서울에서<br>세계로</h2>
          <p class="parallax-desc">서울의 감성과 일본의 장인 정신을 담아<br>누구나 공감할 수 있는 스타일을 만들어갑니다.</p>
        </div>
        <!-- 마지막에 로고가 드러나는 빈 공간 -->
        <div class="parallax-spacer"></div>
      </div>
    </div>

    <!-- 브랜드 스토리 (CONCEPT) -->
    <section id="concept" class="section story" ref="storyRef">
      <div class="story-layout">
        <div class="story-visual">
          <img src="../image/video3.gif" alt="Velcro Cat Lookbook" class="story-gif" />
          <div class="visual-label">EST. 2026 — SEOUL</div>
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
          <img src="../image/osakamarketLOGO5.png" alt="Velcro Cat" class="features-gif" />
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

    <!-- PICK UP 섹션 -->
    <section id="pickup" class="section pickup">
      <div class="pickup-header">
        <p class="section-label">Pick Up</p>
        <h2 class="section-title">추천 아이템</h2>
        <p class="pickup-sub">Velcro Cat이 제안하는 이번 시즌 스타일</p>
      </div>
      <div class="pickup-grid">
        <router-link
          v-for="item in pickupItems"
          :key="item.id"
          :to="`/products/${item.id}`"
          class="pickup-card"
        >
          <div class="pickup-img-wrap">
            <img :src="item.image" :alt="item.name" />
          </div>
          <p class="pickup-name">{{ item.name }}</p>
          <p class="pickup-price">₩{{ Number(item.price).toLocaleString() }}</p>
        </router-link>
      </div>
      <div class="pickup-more">
        <router-link to="/products" class="btn-outline">모든 상품 보기 →</router-link>
      </div>
    </section>

    <!-- CTA (video3.gif 배경) -->
    <section class="second-hero">
      <video src="../image/video3.mp4" class="second-hero-bg" autoplay muted loop playsinline />
      <div class="second-hero-overlay"></div>
      <div class="second-hero-content">
        <p class="second-hero-label">Shop Now</p>
        <h2 class="second-hero-title">오늘의 스타일을<br>만나보세요</h2>
        <p class="second-hero-desc">
          Velcro Cat의 새로운 컬렉션을 지금 확인하세요.<br>
          편안함과 스타일, 두 가지 모두를 놓치지 마세요.
        </p>
        <div class="second-hero-actions">
          <router-link to="/products" class="second-hero-btn">SHOP 바로가기</router-link>
          <router-link to="/contact" class="second-hero-btn btn-outline">문의하기</router-link>
        </div>
      </div>
    </section>

    <!-- 브랜드 푸터 -->
    <footer class="brand-footer">
      <div class="footer-inner">
        <div class="footer-logo">
          <img src="../image/osakamarketLOGO2.png" alt="Velcro Cat" />
          <span>VELCROCAT</span>
        </div>
        <div class="footer-nav">
          <router-link to="/home">HOME</router-link>
          <router-link to="/products">SHOP</router-link>
          <router-link to="/contact">CONTACT</router-link>
          <router-link to="/">BRAND</router-link>
          <a href="https://smartstore.naver.com/vcat" target="_blank">NAVER STORE</a>
        </div>
        <div class="footer-biz">
          <p>상호 : 벨크로캣(velcrocat) | 대표 : 김충성</p>
          <p>사업자등록번호 : 180-02-03888 | 업태 : 도소매 | 종목 : 전자상거래 소매업</p>
          <p>주소 : 경기도 안양시 동안구 동편로183번길 86, 201호(관양동)</p>
          <p>E-MAIL : velcrocat@velcrocat.com</p>
        </div>
        <p class="footer-copy">© 2026 벨크로캣(velcrocat). All rights reserved.</p>
      </div>
    </footer>

  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import axios from 'axios';

const storyRef = ref(null);
const pickupItems = ref([]);

async function loadPickup() {
  try {
    const res = await axios.get('/api/products?limit=4');
    pickupItems.value = (res.data.products || res.data).slice(0, 4);
  } catch { /* ignore */ }
}

function scrollTo(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

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

// 스크롤 시 네비바 배경 + 글씨 색 전환
function handleScroll() {
  const nav = document.querySelector('.brand-nav');
  const page = document.querySelector('.about-page');
  if (!nav || !page) return;
  const scrollTop = page.scrollTop;
  const heroHeight = window.innerHeight;
  if (scrollTop > heroHeight - 80) {
    nav.style.opacity = '0';
    nav.style.pointerEvents = 'none';
  } else {
    nav.style.opacity = '1';
    nav.style.pointerEvents = 'auto';
  }
}

onMounted(() => {
  const page = document.querySelector('.about-page');
  if (page) page.addEventListener('scroll', handleScroll);
  window.addEventListener('scroll', handleScroll);
  loadPickup();
  // 히어로 텍스트 순차 등장
  setTimeout(() => {
    document.querySelectorAll('.hero-reveal').forEach((el, i) => {
      setTimeout(() => el.classList.add('show'), 300 * (i + 1));
    });
  }, 200);
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
  const page = document.querySelector('.about-page');
  if (page) page.removeEventListener('scroll', handleScroll);
  window.removeEventListener('scroll', handleScroll);
});
</script>

<style scoped>
/* MRU식 네비게이션 */
.brand-nav {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 24px 48px;
  gap: 20px;
  background: transparent;
  backdrop-filter: none;
  transition: background 0.3s;
  white-space: nowrap;
  min-height: 52px;
  flex-wrap: nowrap;
  overflow: hidden;
}
/* 흰 배경일 때 검은 글씨 */
.brand-nav.nav-light .brand-nav-name { color: #111; }
.brand-nav.nav-light .brand-nav-main a { color: rgba(0,0,0,0.5); }
.brand-nav.nav-light .brand-nav-main a:hover,
.brand-nav.nav-light .brand-nav-main a.router-link-active { color: #111; }
.brand-nav.nav-light .brand-nav-sub { border-left-color: rgba(0,0,0,0.15); }
.brand-nav.nav-light .sub-link { color: rgba(0,0,0,0.4); }
.brand-nav.nav-light .sub-link:hover { color: #111; }
.brand-nav.nav-light .sub-social { color: rgba(0,0,0,0.4); }
.brand-nav.nav-light .sub-social:hover { color: #111; }
.brand-nav.nav-light .nav-btn { border-color: #111; color: #111; }
.brand-nav.nav-light .nav-btn:hover { background: #111; color: #fff; }

.brand-nav-logo {
  display: flex;
  align-items: center;
  gap: 5px;
  text-decoration: none;
  flex-shrink: 0;
  margin-left: 60px;
}
.brand-nav-logo img {
  height: 26px;
  width: auto;
  object-fit: contain;
}
.brand-nav-name {
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 1px;
  color: #fff;
}
.brand-nav-main {
  display: flex;
  gap: 20px;
  margin-left: 790px;
  flex-shrink: 0;
}
.brand-nav-main a {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 2px;
  color: rgba(255,255,255,0.65);
  text-decoration: none;
  transition: color 0.2s;
  text-transform: uppercase;
}
.brand-nav-main a:hover,
.brand-nav-main a.router-link-active { color: #fff; }
.brand-nav-sub {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: 16px;
  border-left: 1px solid rgba(255,255,255,0.15);
  padding-left: 16px;
}
.sub-link {
  font-size: 12px;
  color: rgba(255,255,255,0.4);
  text-decoration: none;
  transition: color 0.2s;
}
.sub-link:hover { color: #fff; }
.sub-social {
  color: rgba(255,255,255,0.4);
  transition: color 0.2s;
  display: flex;
  align-items: center;
}
.sub-social:hover { color: #fff; }
.brand-nav-btns {
  margin-left: 16px;
  flex-shrink: 0;
}
.nav-btn {
  display: inline-block;
  padding: 10px 24px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2px;
  text-decoration: none;
  border: 1px solid rgba(255,255,255,0.3);
  color: #fff;
  transition: all 0.2s;
}
.nav-btn:hover {
  background: #fff;
  color: #111;
}
.nav-btn-gray {
  background: rgba(255,255,255,0.1);
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
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: #999;
  margin-bottom: 14px;
}
.section-title {
  font-size: 38px;
  font-weight: 800;
  line-height: 1.3;
  letter-spacing: -0.5px;
  color: #111;
  margin-bottom: 24px;
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
  z-index: 2;
  padding: 0 24px;
}
/* 히어로 텍스트 순차 등장 */
.hero-reveal {
  opacity: 0;
  transform: translateY(36px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}
.hero-reveal.show {
  opacity: 1;
  transform: translateY(0);
}
.hero-label {
  display: inline-block;
  font-size: 14px;
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
.hero-logo {
  height: 120px;
  width: auto;
  object-fit: contain;
  display: block;
  margin: 0 auto -10px;
}
.hero-main-logo {
  height: 280px;
  width: auto;
  object-fit: contain;
  display: block;
  margin: 0 auto 16px;
}
.hero-desc {
  font-size: 17px;
  color: #999;
  line-height: 1.8;
  letter-spacing: 0.5px;
  max-width: 480px;
  margin: 0 auto;
}
.hero-btns {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 32px;
}
.hero-reveal-4 {
  transition-delay: 1.2s;
}
/* 스크롤 인디케이터 (우측 하단) */
.scroll-indicator {
  position: absolute;
  bottom: 32px;
  right: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  z-index: 3;
}
.scroll-text {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 4px;
  color: rgba(255,255,255,0.55);
  text-transform: uppercase;
  writing-mode: vertical-rl;
  padding-right: 2px;
}
.scroll-line {
  width: 1px;
  height: 56px;
  background: rgba(255,255,255,0.3);
  position: relative;
  overflow: hidden;
}
.scroll-line::after {
  content: '';
  position: absolute;
  top: -100%;
  left: 0;
  width: 1px;
  height: 100%;
  background: #fff;
  animation: scrollDown 1.8s ease-in-out infinite;
}
@keyframes scrollDown {
  0% { top: -100%; }
  100% { top: 100%; }
}

/* 마키 텍스트 */
.marquee-section {
  background: #fff;
  padding: 28px 0;
  overflow: hidden;
  white-space: nowrap;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
}
.marquee-track {
  display: inline-flex;
  animation: marquee 25s linear infinite;
}
.marquee-item {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 6px;
  color: #111;
  padding: 0 12px;
}
.dot {
  display: inline-block;
  width: 5px;
  height: 5px;
  background: #ccc;
  border-radius: 50%;
  vertical-align: middle;
  margin: 0 20px;
}
@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

/* 패럴랙스 로고 섹션 */
.parallax-wrap {
  position: relative;
}
.parallax-bg {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  z-index: 0;
}
.parallax-logo-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  user-select: none;
  pointer-events: none;
}
.parallax-cat {
  height: 130px;
  width: auto;
  object-fit: contain;
  margin-bottom: -6px;
}
.parallax-velcro {
  font-size: 80px;
  font-weight: 900;
  color: #111;
  letter-spacing: 6px;
  line-height: 1;
}
.parallax-cat-text {
  font-size: 68px;
  font-weight: 900;
  color: #111;
  letter-spacing: 8px;
  line-height: 1;
  margin-top: -2px;
}

.parallax-logo-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  user-select: none;
  pointer-events: none;
}
.parallax-logo-top {
  height: 55vh;
  max-height: 420px;
  width: auto;
  object-fit: contain;
}
.parallax-logo-bottom {
  height: 22vh;
  max-height: 180px;
  width: auto;
  object-fit: contain;
  margin-top: 4px;
}
.parallax-logo {
  height: 80vh;
  max-height: 600px;
  width: auto;
  object-fit: contain;
  user-select: none;
  pointer-events: none;
}
.parallax-content {
  position: relative;
  z-index: 1;
}
.parallax-spacer {
  height: 100vh;
}
.parallax-card {
  max-width: 100%;
  margin: 0;
  padding: 80px 32px;
  text-align: center;
  background: rgba(255,255,255,0.95);
}
.parallax-card-1 {
  background: rgba(255,255,255,0.97);
}
.parallax-card-2 {
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(2px);
}
.parallax-card-3 {
  background: rgba(255,255,255,0.6);
  backdrop-filter: blur(2px);
}
.parallax-label {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 5px;
  color: #999;
  text-transform: uppercase;
  margin-bottom: 20px;
}
.parallax-title {
  font-size: 42px;
  font-weight: 800;
  line-height: 1.3;
  color: #111;
  margin-bottom: 24px;
}
.parallax-desc {
  font-size: 16px;
  line-height: 2;
  color: #666;
}

/* 브랜드 스토리 */
.story-layout {
  display: flex;
  gap: 80px;
  align-items: center;
}
.story-visual {
  flex-shrink: 0;
  width: 460px;
  height: 560px;
  background: #fff;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
}
.story-gif {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.visual-label {
  position: absolute;
  bottom: 16px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 13px;
  letter-spacing: 3px;
  color: #999;
  font-weight: 600;
  z-index: 1;
}
.story-text { flex: 1; }
.story-desc {
  font-size: 16px;
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
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 12px;
  letter-spacing: 1px;
}
.value-card p {
  font-size: 15px;
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
  width: 420px;
  height: 540px;
  background: #fff;
  overflow: hidden;
  position: sticky;
  top: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
}
.features-gif {
  width: 100%;
  height: 100%;
  object-fit: contain;
  position: absolute;
  top: 0;
  left: 0;
}
.visual-label-dark {
  position: relative;
  z-index: 1;
  font-size: 13px;
  letter-spacing: 3px;
  color: #999;
  font-weight: 600;
  padding: 16px 0;
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
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 10px;
  letter-spacing: 1px;
}
.feature-item p {
  font-size: 15px;
  line-height: 1.9;
  color: #777;
}

/* CTA */
/* 세컨드 히어로 (video3.gif) */
.second-hero {
  position: relative;
  width: 100%;
  height: 100vh;
  min-height: 600px;
  overflow: hidden;
  margin-bottom: 0;
}
.second-hero + .brand-footer {
  margin-top: 0;
}
.second-hero-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #0a0a0a;
}
.second-hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%);
  z-index: 1;
}
.second-hero-content {
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0 24px;
}
.second-hero-label {
  font-size: 11px;
  letter-spacing: 6px;
  color: rgba(255,255,255,0.7);
  margin-bottom: 20px;
  font-weight: 500;
}
.second-hero-title {
  font-size: 52px;
  font-weight: 300;
  color: #fff;
  line-height: 1.2;
  margin-bottom: 20px;
  letter-spacing: 2px;
}
.second-hero-desc {
  font-size: 15px;
  line-height: 1.8;
  color: rgba(255,255,255,0.8);
  margin-bottom: 36px;
}
.second-hero-btn {
  display: inline-block;
  padding: 14px 40px;
  border: 1px solid #fff;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 3px;
  text-decoration: none;
  transition: all 0.3s;
}
.second-hero-btn:hover {
  background: #fff;
  color: #111;
}
.second-hero-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}
.second-hero-btn.btn-outline {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.5);
  color: #fff;
}
.second-hero-btn.btn-outline:hover {
  border-color: #fff;
  background: rgba(255,255,255,0.1);
  color: #fff;
}
@media (max-width: 768px) {
  .second-hero { height: 70vh; min-height: 400px; }
  .second-hero-bg { object-fit: cover; }
  .second-hero-title { font-size: 28px; margin-bottom: 14px; }
  .second-hero-label { font-size: 10px; letter-spacing: 4px; margin-bottom: 14px; }
  .second-hero-desc { font-size: 13px; margin-bottom: 24px; }
  .second-hero-btn { padding: 12px 28px; font-size: 11px; }
  .second-hero-actions { gap: 10px; }
}


/* PICK UP */
.pickup { max-width: 1200px; }
.pickup-header {
  text-align: center;
  margin-bottom: 48px;
}
.pickup-sub {
  font-size: 13px;
  color: #999;
  margin-top: 8px;
}
.pickup-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}
.pickup-card {
  text-decoration: none;
  color: #111;
  transition: transform 0.3s;
}
.pickup-card:hover { transform: translateY(-4px); }
.pickup-img-wrap {
  aspect-ratio: 1/1;
  overflow: hidden;
  background: #f5f5f5;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12%;
}
.pickup-img-wrap img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 0.4s;
}
.pickup-card:hover .pickup-img-wrap img { transform: scale(1.04); }
.pickup-name {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 4px;
  line-height: 1.4;
}
.pickup-price {
  font-size: 13px;
  font-weight: 700;
}
.pickup-more {
  text-align: center;
  margin-top: 40px;
}
.btn-outline {
  display: inline-block;
  padding: 14px 40px;
  border: 1px solid #111;
  color: #111;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2px;
  text-decoration: none;
  transition: background 0.2s, color 0.2s;
}
.btn-outline:hover { background: #111; color: #fff; }

/* 브랜드 푸터 */
.brand-footer {
  background: #111;
  padding: 48px 32px 32px;
  margin-top: 0;
}
.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
}
.footer-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.footer-logo img { height: 80px; }
.footer-logo span {
  font-size: 18px;
  font-weight: 800;
  color: #fff;
  letter-spacing: 5px;
}
.footer-nav {
  display: flex;
  gap: 24px;
  justify-content: center;
  margin-bottom: 16px;
}
.footer-nav a {
  font-size: 11px;
  color: #666;
  text-decoration: none;
  letter-spacing: 1px;
  transition: color 0.2s;
}
.footer-nav a:hover { color: #fff; }
.footer-sub {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 20px;
}
.footer-biz {
  text-align: center;
  margin-bottom: 20px;
}
.footer-biz p {
  font-size: 11px;
  color: #555;
  line-height: 1.9;
  margin: 0;
}
.footer-copy {
  font-size: 11px;
  color: #444;
}

/* 모바일 반응형 */
@media (max-width: 768px) {
  .parallax-logo { height: 50vh; }
  .parallax-title { font-size: 28px; }
  .parallax-desc { font-size: 14px; }
  .parallax-card { padding: 60px 20px; }
  .parallax-spacer { height: 80vh; }
  .brand-nav {
    padding: 12px 16px;
    flex-wrap: wrap;
  }
  .brand-nav-logo img { height: 24px; }
  .brand-nav-name { font-size: 11px; letter-spacing: 2px; }
  .brand-nav-main {
    order: 3;
    width: 100%;
    justify-content: center;
    gap: 14px;
    padding-top: 10px;
    border-top: 1px solid rgba(255,255,255,0.08);
    margin-top: 10px;
  }
  .brand-nav-main a { font-size: 10px; letter-spacing: 1px; }
  .brand-nav-sub { display: none; }
  .brand-nav-btns { display: none; }
  .pickup-grid { grid-template-columns: repeat(2, 1fr); }
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
    height: auto;
    aspect-ratio: 4/3;
  }
  .story-gif {
    object-fit: cover;
  }
  .story-desc { font-size: 14px; }
  .section { padding: 60px 16px; }
  .values-grid {
    grid-template-columns: 1fr;
  }
  .features-layout {
    flex-direction: column;
    gap: 40px;
  }
  .features-visual {
    width: 100%;
    height: auto;
    aspect-ratio: 4/3;
    position: static !important;
  }
  .features-gif {
    position: relative !important;
  }
  .feature-item h3 { font-size: 16px; }
  .feature-item p { font-size: 13px; }
  .feature-item { padding: 24px 0; }
  .section-title {
    font-size: 26px;
  }
}
</style>
