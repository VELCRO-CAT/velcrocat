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
  background: var(--c-cream);
  border-top: 1px solid var(--c-line);
  border-bottom: 1px solid var(--c-line);
  overflow: hidden;
  padding: 16px 0;
  user-select: none;
}
.marquee-track {
  display: inline-flex;
  white-space: nowrap;
  animation: marquee 40s linear infinite;
}
.marquee-item {
  font-family: var(--ff-label);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: var(--c-ink);
  display: inline-flex;
  align-items: center;
  gap: 18px;
  padding-right: 18px;
}
.dot {
  display: inline-block;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--c-ink);
  flex-shrink: 0;
}
@keyframes marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
@media (max-width: 599px) {
  .marquee-item { font-size: 10.5px; gap: 12px; padding-right: 12px; }
}
</style>
