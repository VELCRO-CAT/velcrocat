<template>
  <div class="privacy-page">
    <div class="privacy-wrap">
      <h1 class="privacy-title">{{ t('cookies.pageTitle') }}</h1>
      <p class="privacy-date">{{ t('cookies.effectiveDate') }}</p>

      <div class="privacy-content">
        <section class="privacy-section">
          <h2>{{ t('cookies.s1Title') }}</h2>
          <p>{{ t('cookies.s1Desc') }}</p>
        </section>

        <section class="privacy-section">
          <h2>{{ t('cookies.s2Title') }}</h2>
          <p>{{ t('cookies.s2Desc') }}</p>
          <ul>
            <li>{{ t('cookies.s2Item1') }}</li>
            <li>{{ t('cookies.s2Item2') }}</li>
            <li>{{ t('cookies.s2Item3') }}</li>
          </ul>
        </section>

        <section class="privacy-section">
          <h2>{{ t('cookies.s3Title') }}</h2>
          <p>{{ t('cookies.s3Desc') }}</p>
        </section>

        <section class="privacy-section">
          <h2>{{ t('cookies.s4Title') }}</h2>
          <p>{{ t('cookies.s4Desc') }}</p>
          <ul>
            <li>{{ t('cookies.s4Item1') }}</li>
            <li>{{ t('cookies.s4Item2') }}</li>
          </ul>
        </section>

        <section class="privacy-section">
          <h2>{{ t('cookies.s5Title') }}</h2>
          <p>{{ t('cookies.s5Desc') }}</p>
        </section>

        <div class="privacy-footer-info">
          <p>{{ t('cookies.footerLine1') }}</p>
          <p>{{ t('cookies.footerLine2') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<style scoped>
.privacy-page { background: #fff; min-height: 80vh; }
.privacy-wrap { max-width: 800px; margin: 0 auto; padding: 60px 24px 80px; }
.privacy-title { font-size: 24px; font-weight: 900; color: #111; letter-spacing: -0.5px; margin-bottom: 8px; }
.privacy-date { font-size: 12px; color: #767676; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 1.5px solid #111; }
.privacy-content { display: flex; flex-direction: column; gap: 0; }
.privacy-section { padding: 28px 0; border-bottom: 1px solid #e8e8e8; }
.privacy-section h2 { font-size: 15px; font-weight: 800; color: #111; margin-bottom: 14px; letter-spacing: -0.3px; }
.privacy-section p { font-size: 13px; color: #555; line-height: 2; margin-bottom: 12px; }
.privacy-section ul { list-style: none; padding: 0; margin: 0; }
.privacy-section li { font-size: 13px; color: #555; line-height: 2; padding-left: 16px; position: relative; }
.privacy-section li::before { content: '·'; position: absolute; left: 0; color: #767676; font-weight: 700; }
.privacy-footer-info { margin-top: 40px; padding-top: 24px; border-top: 1.5px solid #111; text-align: center; }
.privacy-footer-info p { font-size: 11px; color: #767676; line-height: 1.8; margin: 0; }
@media (max-width: 768px) {
  .privacy-wrap { padding: 40px 16px 60px; }
  .privacy-title { font-size: 20px; }
}
</style>
