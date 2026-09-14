<template>
  <div class="privacy-page">
    <div class="privacy-wrap">
      <h1 class="privacy-title">{{ t('privacy.pageTitle') }}</h1>
      <p class="privacy-date">{{ t('privacy.effectiveDate') }}</p>

      <div class="privacy-content">
        <section class="privacy-section">
          <h2>{{ t('privacy.s1Title') }}</h2>
          <p>{{ t('privacy.s1Desc') }}</p>
          <ul>
            <li>{{ t('privacy.s1Item1') }}</li>
            <li>{{ t('privacy.s1Item2') }}</li>
            <li>{{ t('privacy.s1Item3') }}</li>
          </ul>
        </section>

        <section class="privacy-section">
          <h2>{{ t('privacy.s2Title') }}</h2>
          <p>{{ t('privacy.s2Desc') }}</p>
          <ul>
            <li>{{ t('privacy.s2Item1') }}</li>
            <li>{{ t('privacy.s2Item2') }}</li>
            <li>{{ t('privacy.s2Item3') }}</li>
            <li>{{ t('privacy.s2Item4') }}</li>
            <li>{{ t('privacy.s2Item5') }}</li>
          </ul>
        </section>

        <section class="privacy-section">
          <h2>{{ t('privacy.s3Title') }}</h2>
          <p>{{ t('privacy.s3Desc') }}</p>
          <ul>
            <li>{{ t('privacy.s3Item1') }}</li>
            <li>{{ t('privacy.s3Item2') }}</li>
            <li>{{ t('privacy.s3Item3') }}</li>
          </ul>
        </section>

        <section class="privacy-section">
          <h2>{{ t('privacy.s4Title') }}</h2>
          <p>{{ t('privacy.s4Desc') }}</p>
          <ul>
            <li>{{ t('privacy.s4Item1') }}</li>
            <li>{{ t('privacy.s4Item2') }}</li>
            <li>{{ t('privacy.s4Item3') }}</li>
          </ul>
        </section>

        <section class="privacy-section">
          <h2>{{ t('privacy.s5Title') }}</h2>
          <p>{{ t('privacy.s5Desc') }}</p>
          <ul>
            <li>{{ t('privacy.s5Item1') }}</li>
            <li>{{ t('privacy.s5Item2') }}</li>
          </ul>
        </section>

        <section class="privacy-section">
          <h2>{{ t('privacy.s6Title') }}</h2>
          <p>{{ t('privacy.s6Desc') }}</p>
          <ul>
            <li>{{ t('privacy.s6Item1') }}</li>
            <li>{{ t('privacy.s6Item2') }}</li>
            <li>{{ t('privacy.s6Item3') }}</li>
            <li>{{ t('privacy.s6Item4') }}</li>
          </ul>
        </section>

        <section class="privacy-section">
          <h2>{{ t('privacy.s7Title') }}</h2>
          <p>{{ t('privacy.s7Desc') }}</p>
          <ul>
            <li>{{ t('privacy.s7Item1') }}</li>
            <li>{{ t('privacy.s7Item2') }}</li>
            <li>{{ t('privacy.s7Item3') }}</li>
          </ul>
        </section>

        <section class="privacy-section">
          <h2>{{ t('privacy.s8Title') }}</h2>
          <div class="privacy-info-box">
            <p><strong>{{ t('privacy.officerBoxTitle') }}</strong></p>
            <p>{{ t('privacy.officerName') }}</p>
            <p>{{ t('privacy.officerTitle') }}</p>
            <p>{{ t('privacy.officerContact') }}</p>
            <p>{{ t('privacy.officerEmail') }}</p>
          </div>
          <p style="margin-top:16px">{{ t('privacy.s8Desc') }}</p>
        </section>

        <section class="privacy-section">
          <h2>{{ t('privacy.s9Title') }}</h2>
          <p>{{ t('privacy.s9Desc') }}</p>
        </section>

        <div class="privacy-footer-info">
          <p>{{ t('privacy.footerLine1') }}</p>
          <p>{{ t('privacy.footerLine2') }}</p>
          <p>{{ t('privacy.footerLine3') }}</p>
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
.privacy-page {
  background: #fff;
  min-height: 80vh;
}
.privacy-wrap {
  max-width: 800px;
  margin: 0 auto;
  padding: 60px 24px 80px;
}
.privacy-title {
  font-size: 24px;
  font-weight: 900;
  color: #111;
  letter-spacing: -0.5px;
  margin-bottom: 8px;
}
.privacy-date {
  font-size: 12px;
  color: #999;
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 1.5px solid #111;
}

.privacy-content {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.privacy-section {
  padding: 28px 0;
  border-bottom: 1px solid #e8e8e8;
}
.privacy-section h2 {
  font-size: 15px;
  font-weight: 800;
  color: #111;
  margin-bottom: 14px;
  letter-spacing: -0.3px;
}
.privacy-section p {
  font-size: 13px;
  color: #555;
  line-height: 2;
  margin-bottom: 12px;
}
.privacy-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.privacy-section li {
  font-size: 13px;
  color: #555;
  line-height: 2;
  padding-left: 16px;
  position: relative;
}
.privacy-section li::before {
  content: '·';
  position: absolute;
  left: 0;
  color: #999;
  font-weight: 700;
}

.privacy-info-box {
  background: #f9f9f9;
  border: 1px solid #e8e8e8;
  padding: 20px 24px;
}
.privacy-info-box p {
  font-size: 13px;
  color: #555;
  line-height: 2;
  margin: 0;
}
.privacy-info-box strong {
  color: #111;
}

.privacy-footer-info {
  margin-top: 40px;
  padding-top: 24px;
  border-top: 1.5px solid #111;
  text-align: center;
}
.privacy-footer-info p {
  font-size: 11px;
  color: #999;
  line-height: 1.8;
  margin: 0;
}

@media (max-width: 768px) {
  .privacy-wrap {
    padding: 40px 16px 60px;
  }
  .privacy-title {
    font-size: 20px;
  }
}
</style>
