<template>
  <section class="trust-strip">
    <div class="trust-inner">
      <div v-for="(item, i) in items" :key="i" class="trust-item">
        <v-icon size="24" color="#1A1714">{{ item.icon }}</v-icon>
        <p class="trust-label">{{ item.label }}</p>
        <p class="trust-sub">{{ item.sub }}</p>
      </div>
    </div>
  </section>
</template>

<script setup>
// 명품 사이트 표준 4개 USP — v1은 하드코딩 (브랜드 안정 카피)
const items = [
  { icon: 'mdi-truck-outline',       label: 'FREE SHIPPING',   sub: '₩100,000 이상 무료배송' },
  { icon: 'mdi-swap-horizontal',     label: 'EASY RETURNS',    sub: '7일 무료 교환 · 반품' },
  { icon: 'mdi-sheep',               label: 'PREMIUM WOOL',    sub: '울 100% · 서울 제작' },
  { icon: 'mdi-earth',               label: 'WORLDWIDE',       sub: '전 세계 배송' }
];
</script>

<style scoped>
.trust-strip {
  background: var(--c-cream-soft);
  border-top: 1px solid var(--c-line);
  border-bottom: 1px solid var(--c-line);
}
.trust-inner {
  max-width: 1600px;
  margin: 0 auto;
  padding: 40px 24px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
}
.trust-item {
  text-align: center;
  padding: 8px 16px;
  border-right: 1px solid var(--c-line);
}
.trust-item:last-child { border-right: none; }
.trust-label {
  font-family: var(--ff-label);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--c-ink);
  margin: 12px 0 6px;
  line-height: 1;
}
.trust-sub {
  font-size: 12px;
  color: var(--c-ink-soft);
  line-height: 1.5;
  margin: 0;
}
@media (max-width: 768px) {
  .trust-inner { grid-template-columns: repeat(2, 1fr); padding: 28px 20px; }
  .trust-item {
    padding: 16px 8px;
    border-right: none;
    border-bottom: 1px solid var(--c-line);
  }
  .trust-item:nth-child(odd) { border-right: 1px solid var(--c-line); }
  .trust-item:nth-last-child(-n+2) { border-bottom: none; }
}
@media (max-width: 420px) {
  .trust-inner { grid-template-columns: 1fr; }
  .trust-item, .trust-item:nth-child(odd) {
    border-right: none;
    border-bottom: 1px solid var(--c-line);
  }
  .trust-item:last-child { border-bottom: none; }
}
</style>
