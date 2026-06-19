<template>
  <AdminSidebar />

  <v-main class="bg-grey-lighten-4 admin-page">
    <v-container class="admin-container" style="max-width:960px">
      <div class="page-header">
        <div>
          <h1 class="page-title">사이트 디자인</h1>
          <p class="page-sub">메인 페이지 히어로 · 에디토리얼 · 룩북 · 모자이크</p>
        </div>
        <div class="saved-pill" v-if="savedHint">
          <v-icon size="14" color="#2F6B47">mdi-check-circle</v-icon>
          저장됨
        </div>
      </div>

      <!-- ── 히어로 ── -->
      <section class="ss-section">
        <h2 class="ss-section-title">메인 히어로</h2>
        <p class="ss-section-sub">홈 페이지 상단의 큰 타이틀과 CTA 버튼을 편집합니다.</p>

        <div class="ss-grid">
          <SettingField
            label="키커 (작은 영문 라벨)"
            placeholder="VELCROCAT — SEOUL"
            :model-value="value('hero_kicker')"
            @update:model-value="(v) => save('hero_kicker', v)"
          />
          <SettingField
            label="타이틀 메인 (세리프 이탤릭)"
            placeholder="2026"
            :model-value="value('hero_title_main')"
            @update:model-value="(v) => save('hero_title_main', v)"
          />
          <SettingField
            label="타이틀 서브 (트래킹된 영문)"
            placeholder="SPRING COLLECTION"
            :model-value="value('hero_title_sub')"
            @update:model-value="(v) => save('hero_title_sub', v)"
          />
          <SettingField
            label="CTA 텍스트"
            placeholder="SHOP THE COLLECTION"
            :model-value="value('hero_cta_text')"
            @update:model-value="(v) => save('hero_cta_text', v)"
          />
          <SettingField
            label="CTA 링크 (라우트)"
            placeholder="/products"
            :model-value="value('hero_cta_link')"
            @update:model-value="(v) => save('hero_cta_link', v)"
          />
        </div>

        <!-- 라이브 프리뷰 -->
        <p class="ss-section-sub" style="margin-top:24px">미리보기</p>
        <div class="preview-hero">
          <p class="preview-kicker">{{ value('hero_kicker') }}</p>
          <p class="preview-title-main">{{ value('hero_title_main') }}</p>
          <p class="preview-title-sub">{{ value('hero_title_sub') }}</p>
          <span class="preview-cta">{{ value('hero_cta_text') }}</span>
        </div>
      </section>

      <!-- ── 에디토리얼 스트립 ── -->
      <section class="ss-section">
        <h2 class="ss-section-title">에디토리얼 스트립</h2>
        <p class="ss-section-sub">풀-블리드 이미지 위에 세리프 인용구가 올라갑니다.</p>

        <ImageField
          label="에디토리얼 이미지"
          :model-value="value('editorial_image_url')"
          @update:model-value="(v) => save('editorial_image_url', v)"
        />
        <SettingField
          label="인용구 (개행 가능)"
          placeholder="일상에 스며드는 감각적인 스타일,&#10;과하지 않은 심플함의 가치."
          textarea
          :model-value="value('editorial_quote')"
          @update:model-value="(v) => save('editorial_quote', v)"
        />
      </section>

      <!-- ── 룩북 스플릿 ── -->
      <section class="ss-section">
        <h2 class="ss-section-title">룩북 스플릿</h2>
        <p class="ss-section-sub">좌측 텍스트 + 우측 풀-블리드 이미지의 2분할 섹션.</p>

        <ImageField
          label="룩북 이미지"
          :model-value="value('lookbook_image_url')"
          @update:model-value="(v) => save('lookbook_image_url', v)"
        />
        <SettingField
          label="룩북 타이틀 (세리프)"
          placeholder="2026 SPRING LOOKBOOK"
          :model-value="value('lookbook_title')"
          @update:model-value="(v) => save('lookbook_title', v)"
        />
        <SettingField
          label="룩북 캡션 (서브 카피)"
          placeholder="울 100%, 한 벌의 완성도."
          :model-value="value('lookbook_caption')"
          @update:model-value="(v) => save('lookbook_caption', v)"
        />
      </section>

      <!-- ── 카테고리 모자이크 ── -->
      <section class="ss-section">
        <h2 class="ss-section-title">카테고리 모자이크</h2>
        <p class="ss-section-sub">MEN / WOMEN / UNISEX 3-col 모자이크. 이미지를 비우면 해당 타일이 숨겨집니다.</p>

        <div class="ss-grid-3">
          <ImageField label="MEN" :model-value="value('mosaic_men_image')"    @update:model-value="(v) => save('mosaic_men_image', v)" />
          <ImageField label="WOMEN" :model-value="value('mosaic_women_image')"  @update:model-value="(v) => save('mosaic_women_image', v)" />
          <ImageField label="UNISEX" :model-value="value('mosaic_unisex_image')" @update:model-value="(v) => save('mosaic_unisex_image', v)" />
        </div>
      </section>

      <!-- ── 컬렉션 라벨 ── -->
      <section class="ss-section">
        <h2 class="ss-section-title">컬렉션 라벨</h2>
        <p class="ss-section-sub">룩북 키커 등에 사용되는 짧은 시즌 라벨.</p>

        <SettingField
          label="컬렉션 라벨"
          placeholder="2026 SPRING"
          :model-value="value('collection_label')"
          @update:model-value="(v) => save('collection_label', v)"
        />
      </section>
    </v-container>
  </v-main>
</template>

<script setup>
import { ref, onMounted, h } from 'vue';
import axios from 'axios';
import AdminSidebar from '../../components/AdminSidebar.vue';
import { useSettingsStore, SETTINGS_DEFAULTS } from '../../stores/settings';

const settings = useSettingsStore();
const savedHint = ref(false);
let savedTimer = null;

function value(key) {
  return settings.values[key] ?? SETTINGS_DEFAULTS[key] ?? '';
}

// 800ms 디바운스 저장
const timers = new Map();
function save(key, val) {
  // 낙관적으로 store 갱신
  settings.values = { ...settings.values, [key]: val };

  if (timers.has(key)) clearTimeout(timers.get(key));
  const t = setTimeout(async () => {
    timers.delete(key);
    try {
      await settings.update(key, val);
      showSaved();
    } catch (e) {
      console.error('settings save failed', e);
    }
  }, 800);
  timers.set(key, t);
}

function showSaved() {
  savedHint.value = true;
  if (savedTimer) clearTimeout(savedTimer);
  savedTimer = setTimeout(() => { savedHint.value = false; }, 1800);
}

onMounted(async () => {
  // 관리자 페이지 진입 시 최신 값으로 한 번 더 로드
  await settings.load();
});

// ─── 인라인 작은 컴포넌트: SettingField + ImageField (단일 파일 내에서 정의) ───
import { defineComponent } from 'vue';

const SettingField = defineComponent({
  name: 'SettingField',
  props: {
    label: String,
    placeholder: String,
    modelValue: { type: String, default: '' },
    textarea: { type: Boolean, default: false }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () =>
      h('div', { class: 'sf' }, [
        h('label', { class: 'sf-label' }, props.label),
        h(props.textarea ? 'textarea' : 'input', {
          class: 'sf-input',
          rows: props.textarea ? 3 : undefined,
          placeholder: props.placeholder,
          value: props.modelValue,
          onInput: (e) => emit('update:modelValue', e.target.value)
        })
      ]);
  }
});

const ImageField = defineComponent({
  name: 'ImageField',
  props: {
    label: String,
    modelValue: { type: String, default: '' }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const uploading = ref(false);
    async function onFile(e) {
      const file = e.target.files?.[0];
      if (!file) return;
      uploading.value = true;
      try {
        const fd = new FormData();
        fd.append('image', file);
        const res = await axios.post('/api/upload', fd);
        emit('update:modelValue', res.data.url);
      } catch (err) {
        console.error('upload failed', err);
      } finally {
        uploading.value = false;
        e.target.value = '';
      }
    }
    return () =>
      h('div', { class: 'sf' }, [
        h('label', { class: 'sf-label' }, props.label),
        h('div', { class: 'imf-row' }, [
          h('input', {
            class: 'sf-input',
            type: 'text',
            placeholder: '/uploads/... 또는 https://...',
            value: props.modelValue,
            onInput: (e) => emit('update:modelValue', e.target.value)
          }),
          h('label', { class: 'imf-upload' }, [
            uploading.value ? '업로드 중...' : '이미지 업로드',
            h('input', {
              type: 'file',
              accept: 'image/*',
              style: 'display:none',
              onChange: onFile
            })
          ])
        ]),
        props.modelValue
          ? h('div', { class: 'imf-preview' }, [
              h('img', { src: props.modelValue, alt: props.label })
            ])
          : null
      ]);
  }
});
</script>

<style scoped>
.page-header {
  display: flex; align-items: flex-end; justify-content: space-between;
  margin-bottom: 24px;
}
.page-title {
  font-family: var(--ff-serif);
  font-style: italic;
  font-weight: 500;
  font-size: 32px;
  line-height: 1.1;
  color: var(--c-ink);
  margin: 0;
}
.page-sub {
  font-size: 12px;
  color: var(--c-muted);
  margin: 6px 0 0;
}
.saved-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: #2F6B47;
  background: rgba(47,107,71,0.08);
  border: 1px solid rgba(47,107,71,0.25);
  padding: 4px 10px;
  border-radius: 999px;
}

.ss-section {
  background: #fff;
  border: 1px solid #eee;
  padding: 24px;
  margin-bottom: 18px;
}
.ss-section-title {
  font-family: var(--ff-serif);
  font-style: italic;
  font-weight: 500;
  font-size: 22px;
  color: #111;
  margin: 0 0 4px;
}
.ss-section-sub {
  font-size: 12px;
  color: #888;
  margin: 0 0 18px;
}

.ss-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}
.ss-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}
@media (max-width: 768px) {
  .ss-grid-3 { grid-template-columns: 1fr; }
}

/* SettingField / ImageField (deep) */
:deep(.sf) { display: flex; flex-direction: column; }
:deep(.sf-label) {
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #666;
  margin-bottom: 6px;
}
:deep(.sf-input) {
  width: 100%;
  padding: 9px 11px;
  border: 1px solid #e0e0e0;
  background: #fafafa;
  font-size: 13px;
  color: #111;
  outline: none;
  font-family: inherit;
}
:deep(.sf-input:focus) { border-color: #111; background: #fff; }

:deep(.imf-row) { display: flex; gap: 6px; }
:deep(.imf-upload) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 14px;
  background: #111;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  cursor: pointer;
  white-space: nowrap;
  border: 0;
}
:deep(.imf-preview) {
  margin-top: 10px;
  border: 1px solid #eee;
  background: #fafafa;
  padding: 6px;
  max-width: 320px;
}
:deep(.imf-preview img) {
  width: 100%;
  height: auto;
  display: block;
  max-height: 220px;
  object-fit: cover;
}

/* 미리보기 (실제 히어로 스타일 미러링) */
.preview-hero {
  background: var(--c-cream);
  text-align: center;
  padding: 56px 24px;
  border: 1px solid var(--c-line);
}
.preview-kicker {
  font-family: var(--ff-label);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: var(--c-ink-soft);
  margin: 0 0 16px;
}
.preview-title-main {
  font-family: var(--ff-serif);
  font-style: italic;
  font-weight: 400;
  font-size: 64px;
  line-height: 0.95;
  color: var(--c-ink);
  margin: 0;
}
.preview-title-sub {
  font-family: var(--ff-label);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  color: var(--c-ink);
  margin: 8px 0 24px;
}
.preview-cta {
  display: inline-block;
  font-family: var(--ff-label);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  border: 1px solid var(--c-ink);
  color: var(--c-ink);
  padding: 10px 22px;
}
</style>
