<template>
  <div class="brand-marquee">
    <div class="marquee-track">
      <span class="marquee-item" v-for="n in 2" :key="n">
        VELCROCAT <span class="dot"></span>
        PREMIUM WOOL 100% <span class="dot"></span>
        SEOUL <span class="dot"></span>
        COMFORTABLE <span class="dot"></span>
        MINIMAL <span class="dot"></span>
        EVERYDAY <span class="dot"></span>
        2026 SPRING <span class="dot"></span>
      </span>
    </div>
  </div>
</template>

<script setup>
// 정적 마키 — 추후 settings.marquee_items 로 확장 가능
</script>

<style scoped>
.brand-marquee {
  background: var(--c-ink);                       /* 검정 띠 */
  border-top: none;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  overflow: hidden;
  padding: 8px 0;                                  /* 슬림 */
  user-select: none;
}
.marquee-track {
  display: inline-flex;
  white-space: nowrap;
  animation: marquee 60s linear infinite;          /* 더 차분히 */
}
.marquee-item {
  font-family: var(--ff-label);
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.36em;                          /* 명품 시그니처 트래킹 */
  text-transform: uppercase;
  color: var(--c-cream);                           /* 흰 글자 */
  display: inline-flex;
  align-items: center;
  gap: 22px;
  padding-right: 22px;
}
.dot {
  display: inline-block;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--c-cream);
  flex-shrink: 0;
}
@keyframes marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
@media (max-width: 599px) {
  .brand-marquee { padding: 6px 0; }
  .marquee-item { font-size: 9.5px; gap: 14px; padding-right: 14px; letter-spacing: 0.3em; }
}
</style>
