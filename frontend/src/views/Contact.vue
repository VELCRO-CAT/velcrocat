<template>
  <div class="contact-page">
    <!-- 페이지 헤더 -->
    <div class="page-header reveal">
      <span class="page-label">CONTACT</span>
      <h1 class="page-title">문의하기</h1>
      <p class="page-desc">궁금한 점이 있으시면 아래 양식으로 문의해 주세요.<br>빠른 시일 내에 답변 드리겠습니다.</p>
    </div>

    <!-- 문의 폼 -->
    <div class="form-wrap">
      <div v-if="sent" class="success-box">
        <v-icon size="48" color="#111">mdi-check-circle-outline</v-icon>
        <h2>문의가 접수되었습니다</h2>
        <p>빠른 시일 내에 이메일로 답변 드리겠습니다.</p>
        <button class="submit-btn" @click="sent = false">새 문의 작성</button>
      </div>

      <form v-else @submit.prevent="submit" class="contact-form">

        <!-- 문의 유형 -->
        <div class="field reveal">
          <label>문의 유형 <span class="required">*</span></label>
          <div class="type-grid">
            <button
              v-for="t in inquiryTypes"
              :key="t"
              type="button"
              class="type-btn hvr-bounce-to-top"
              :class="{ active: form.inquiryType === t }"
              @click="form.inquiryType = t"
            >{{ t }}</button>
          </div>
        </div>

        <!-- 이름 / 전화번호 -->
        <div class="field-group reveal">
          <div class="field">
            <label>이름 <span class="required">*</span></label>
            <input v-model="form.name" type="text" placeholder="이름을 입력해주세요" required />
          </div>
          <div class="field">
            <label>전화번호 <span class="required">*</span></label>
            <input
              v-model="form.phone"
              type="tel"
              placeholder="010-0000-0000"
              pattern="[0-9\-]+"
              required
            />
          </div>
        </div>

        <!-- 이메일 / 주문번호 -->
        <div class="field-group reveal">
          <div class="field">
            <label>이메일 <span class="required">*</span></label>
            <input v-model="form.email" type="email" placeholder="이메일을 입력해주세요" required />
          </div>
          <div class="field">
            <label>주문번호 <span class="optional">(선택)</span></label>
            <input v-model="form.orderNumber" type="text" placeholder="주문번호가 있는 경우 입력" />
          </div>
        </div>

        <!-- 문의 내용 -->
        <div class="field reveal">
          <label>문의 내용 <span class="required">*</span></label>
          <textarea v-model="form.message" placeholder="문의 내용을 자세히 입력해주세요" rows="7" required></textarea>
        </div>

        <p v-if="error" class="error-msg">{{ error }}</p>
        <button type="submit" class="submit-btn hvr-sweep-to-right reveal" :disabled="loading">
          {{ loading ? 'SENDING...' : 'SEND MESSAGE' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

onMounted(() => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.contact-page .reveal').forEach(el => observer.observe(el));
});

const inquiryTypes = ['상품 문의', '배송 문의', '교환/반품', '결제 문의', '기타'];

const form = ref({
  inquiryType: '기타',
  name: '',
  phone: '',
  email: '',
  orderNumber: '',
  message: ''
});
const loading = ref(false);
const sent = ref(false);
const error = ref('');

async function submit() {
  error.value = '';
  loading.value = true;
  try {
    await axios.post('/api/inquiries', form.value);
    sent.value = true;
    form.value = { inquiryType: '기타', name: '', phone: '', email: '', orderNumber: '', message: '' };
  } catch (e) {
    error.value = e.response?.data?.error || '전송에 실패했습니다. 다시 시도해주세요.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.contact-page {
  background: #fff;
  min-height: 80vh;
}

.page-header {
  text-align: center;
  padding: 72px 24px 56px;
  border-bottom: 1px solid #e0e0e0;
}
.page-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 4px;
  color: #999;
  margin-bottom: 12px;
}
.page-title {
  font-size: 28px;
  font-weight: 900;
  color: #111;
  letter-spacing: -0.5px;
  margin-bottom: 16px;
}
.page-desc {
  font-size: 13px;
  color: #666;
  line-height: 1.8;
  margin: 0;
}

.form-wrap {
  max-width: 640px;
  margin: 0 auto;
  padding: 64px 24px 80px;
}

.success-box {
  text-align: center;
  padding: 40px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.success-box h2 {
  font-size: 20px;
  font-weight: 800;
  color: #111;
  margin: 0;
}
.success-box p {
  font-size: 13px;
  color: #666;
  line-height: 1.7;
  margin: 0;
}

.contact-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.type-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.type-btn {
  border: 1px solid #ddd;
  background: #fff;
  padding: 8px 16px;
  font-size: 12px;
  color: #555;
  cursor: pointer;
  letter-spacing: 0.3px;
  transition: all 0.15s;
  font-family: inherit;
}
.type-btn:hover { border-color: #111; color: #111; }
.type-btn.active { background: #111; color: #fff; border-color: #111; }

.field-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
@media (max-width: 480px) {
  .field-group { grid-template-columns: 1fr; }
}
.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.field label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 2px;
  color: #555;
}
.required { color: #c00; margin-left: 2px; }
.optional { color: #aaa; font-weight: 400; letter-spacing: 0; font-size: 10px; }

.field input,
.field textarea {
  border: 1px solid #ddd;
  padding: 12px 14px;
  font-size: 13px;
  color: #111;
  outline: none;
  resize: vertical;
  font-family: inherit;
  transition: border-color 0.2s;
  background: #fff;
}
.field input:focus,
.field textarea:focus {
  border-color: #111;
}

.error-msg {
  font-size: 12px;
  color: #c00;
  margin: 0;
}
.submit-btn {
  background: #111;
  color: #fff;
  border: none;
  padding: 15px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2px;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 4px;
}
.submit-btn:hover:not(:disabled) { background: #333; }
.submit-btn:disabled { background: #aaa; cursor: not-allowed; }

/* 스크롤 등장 애니메이션 */
.reveal {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
</style>
