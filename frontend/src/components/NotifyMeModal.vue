<template>
  <transition name="notify-fade">
    <div v-if="open" class="notify-overlay" @click.self="close">
      <div class="notify-modal" @click.stop>
        <button class="notify-close" @click="close" aria-label="닫기">
          <svg viewBox="0 0 24 24" width="14" height="14"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/></svg>
        </button>

        <template v-if="!success">
          <h3 class="notify-title">Notify me when available.</h3>
          <p class="notify-sub">재입고되면 가장 먼저 알려드릴게요.</p>

          <p class="notify-product">{{ product?.name }}</p>

          <div v-if="sizes.length" class="notify-field">
            <label class="notify-label">사이즈</label>
            <select v-model="size" class="notify-select">
              <option value="">— 선택 —</option>
              <option v-for="s in sizes" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>

          <div class="notify-field">
            <label class="notify-label">EMAIL</label>
            <input
              v-model="email"
              type="email"
              class="notify-input"
              placeholder="your@email.com"
              @keyup.enter="submit"
            />
          </div>

          <p v-if="error" class="notify-error">{{ error }}</p>

          <button class="notify-submit" :disabled="loading" @click="submit">
            <span v-if="loading" class="notify-spinner" />
            <span v-else>알림 만들기</span>
          </button>
        </template>

        <template v-else>
          <div class="notify-success">
            <p class="notify-title">Thank you.</p>
            <p class="notify-sub">재입고 시 이메일로 알려드릴게요.</p>
            <button class="notify-submit" @click="close" style="margin-top:24px">닫기</button>
          </div>
        </template>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import axios from 'axios';
import { parseSizes } from '../utils/colorPalette';

const props = defineProps({
  open: { type: Boolean, default: false },
  product: { type: Object, default: () => ({}) },
  initialColor: { type: String, default: '' }
});
const emit = defineEmits(['close']);

const email = ref('');
const size = ref('');
const loading = ref(false);
const error = ref('');
const success = ref(false);

const sizes = computed(() => parseSizes(props.product?.sizes));

watch(() => props.open, (v) => {
  if (v) {
    // reset on open
    email.value = '';
    size.value = '';
    error.value = '';
    success.value = false;
    loading.value = false;
  }
});

function close() { emit('close'); }

async function submit() {
  error.value = '';
  if (!email.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    error.value = '올바른 이메일을 입력해주세요';
    return;
  }
  loading.value = true;
  try {
    await axios.post('/api/notify/restock', {
      productId: props.product?.id,
      email: email.value,
      color: props.initialColor || null,
      size: size.value || null
    });
    success.value = true;
  } catch (e) {
    error.value = e.response?.data?.error || '알림 신청에 실패했습니다';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.notify-overlay {
  position: fixed; inset: 0; z-index: 250;
  background: rgba(26,23,20,0.55);
  display: flex; align-items: center; justify-content: center;
  padding: 16px;
}
.notify-modal {
  position: relative;
  width: 100%;
  max-width: 420px;
  background: var(--c-cream-soft);
  border: 1px solid var(--c-ink);
  padding: 36px 32px 28px;
  font-family: var(--ff-sans);
  color: var(--c-ink);
}
.notify-close {
  position: absolute; top: 12px; right: 12px;
  width: 28px; height: 28px;
  background: none; border: 0; cursor: pointer;
  color: var(--c-ink-soft);
  display: inline-flex; align-items: center; justify-content: center;
}
.notify-close:hover { color: var(--c-ink); }

.notify-title {
  font-family: var(--ff-serif);
  font-style: italic;
  font-weight: 500;
  font-size: 28px;
  line-height: 1.2;
  color: var(--c-ink);
  margin: 0 0 8px;
}
.notify-sub {
  font-size: 13px;
  color: var(--c-ink-soft);
  line-height: 1.6;
  margin: 0 0 24px;
}
.notify-product {
  margin: 0 0 20px;
  padding: 10px 0;
  border-top: 1px solid var(--c-line);
  border-bottom: 1px solid var(--c-line);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.02em;
}

.notify-field { margin-bottom: 16px; }
.notify-label {
  display: block;
  font-family: var(--ff-label);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--c-ink-soft);
  margin-bottom: 6px;
}
.notify-input, .notify-select {
  width: 100%;
  background: transparent;
  border: 0;
  border-bottom: 1px solid var(--c-ink);
  padding: 8px 0;
  font-size: 14px;
  color: var(--c-ink);
  font-family: inherit;
  outline: none;
}
.notify-select { padding: 8px 0; cursor: pointer; }
.notify-input:focus { border-bottom-color: var(--c-accent); }

.notify-error {
  color: var(--c-accent);
  font-size: 12px;
  margin: -6px 0 12px;
}

.notify-submit {
  width: 100%;
  height: 44px;
  background: var(--c-ink);
  color: var(--c-cream);
  border: 1px solid var(--c-ink);
  cursor: pointer;
  font-family: var(--ff-label);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  transition: background 0.2s;
  margin-top: 8px;
  display: inline-flex; align-items: center; justify-content: center;
}
.notify-submit:hover { background: #000; }
.notify-submit:disabled { opacity: 0.6; cursor: default; }

.notify-spinner {
  width: 16px; height: 16px;
  border: 1.5px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: notify-spin 0.7s linear infinite;
}
@keyframes notify-spin { to { transform: rotate(360deg); } }

.notify-success { text-align: center; padding-top: 12px; }

.notify-fade-enter-from, .notify-fade-leave-to { opacity: 0; }
.notify-fade-enter-from .notify-modal,
.notify-fade-leave-to .notify-modal { transform: translateY(8px); }
.notify-fade-enter-active, .notify-fade-leave-active { transition: opacity 0.2s; }
.notify-fade-enter-active .notify-modal,
.notify-fade-leave-active .notify-modal { transition: transform 0.25s ease; }
</style>
