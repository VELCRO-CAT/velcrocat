<template>
  <section class="nl">
    <div class="nl-inner">
      <p class="nl-kicker">VELCROCAT JOURNAL</p>
      <h2 class="nl-title">Stay in the Loop</h2>
      <p class="nl-sub">신상품 · 룩북 · 단독 이야기를 가장 먼저 받아보세요.</p>
      <form class="nl-form" @submit.prevent="submit">
        <input
          v-model="email"
          type="email"
          required
          placeholder="이메일 주소"
          class="nl-input"
          :disabled="loading"
        />
        <button type="submit" class="nl-btn" :disabled="loading">
          {{ loading ? '...' : 'SUBSCRIBE' }}
        </button>
      </form>
      <p v-if="msg" class="nl-msg" :class="{ error: !ok }">{{ msg }}</p>
      <p class="nl-fine">언제든 구독 해지하실 수 있습니다 · 개인정보는 안전하게 보호됩니다</p>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';

const email = ref('');
const loading = ref(false);
const msg = ref('');
const ok = ref(true);

async function submit() {
  msg.value = '';
  if (!email.value) return;
  loading.value = true;
  try {
    const res = await axios.post('/api/newsletter/subscribe', { email: email.value });
    ok.value = true;
    msg.value = res.data.alreadySubscribed
      ? '이미 구독 중이신 이메일입니다'
      : '구독해 주셔서 감사합니다 · 곧 만나뵙겠습니다';
    if (!res.data.alreadySubscribed) email.value = '';
  } catch (e) {
    ok.value = false;
    msg.value = e.response?.data?.error || '구독 처리에 실패했습니다';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.nl {
  background: var(--c-cream-deep);
  border-top: 1px solid var(--c-line);
}
.nl-inner {
  max-width: 720px;
  margin: 0 auto;
  padding: 72px 24px;
  text-align: center;
}
.nl-kicker {
  font-family: var(--ff-label);
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.34em;
  text-transform: uppercase;
  color: var(--c-ink-soft);
  margin: 0 0 18px;
}
.nl-title {
  font-family: var(--ff-serif);
  font-style: italic;
  font-weight: 400;
  font-size: 48px;
  line-height: 1;
  color: var(--c-ink);
  margin: 0 0 18px;
}
.nl-sub {
  font-size: 13.5px;
  color: var(--c-ink-soft);
  line-height: 1.7;
  margin: 0 0 32px;
}
.nl-form {
  display: flex;
  max-width: 480px;
  margin: 0 auto;
  border-bottom: 1.5px solid var(--c-ink);
}
.nl-input {
  flex: 1;
  border: 0;
  outline: none;
  background: transparent;
  padding: 14px 0;
  font-size: 14px;
  color: var(--c-ink);
  font-family: inherit;
}
.nl-input::placeholder { color: var(--c-ink-soft); }
.nl-input:disabled { opacity: 0.5; }
.nl-btn {
  background: none;
  border: 0;
  cursor: pointer;
  padding: 14px 4px 14px 16px;
  font-family: var(--ff-label);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--c-ink);
  transition: opacity 0.2s;
}
.nl-btn:hover:not(:disabled) { opacity: 0.55; }
.nl-btn:disabled { opacity: 0.4; cursor: default; }

.nl-msg {
  margin: 18px 0 0;
  font-size: 12px;
  color: #2F6B47;
}
.nl-msg.error { color: var(--c-accent); }
.nl-fine {
  margin-top: 24px;
  font-size: 10.5px;
  color: var(--c-ink-soft);
  letter-spacing: 0.04em;
}

@media (max-width: 600px) {
  .nl-inner { padding: 56px 20px; }
  .nl-title { font-size: 36px; }
}
@media (max-width: 420px) {
  .nl-form {
    flex-direction: column;
    border-bottom: 0;
    gap: 10px;
  }
  .nl-input {
    border-bottom: 1.5px solid var(--c-ink);
    padding: 12px 0;
  }
  .nl-btn {
    padding: 12px;
    background: var(--c-ink);
    color: var(--c-cream);
    width: 100%;
  }
}
</style>
