<template>
  <AdminSidebar />

  <v-main class="bg-grey-lighten-4 admin-page">
    <v-container class="admin-container" style="max-width:1100px">
      <div class="page-header">
        <div>
          <h1 class="page-title">뉴스레터 관리</h1>
          <p class="page-sub">"Stay in the Loop" 폼으로 들어온 구독자 목록과 메일 발송.</p>
        </div>
        <div class="header-stats">
          <span class="stat-pill stat-done">구독자 {{ rows.length }}명</span>
        </div>
      </div>

      <!-- 사용법 안내 -->
      <div class="usage-card">
        <h3 class="usage-title">사용 흐름</h3>
        <ol class="usage-list">
          <li>고객이 홈 하단 <strong>"Stay in the Loop"</strong> 폼에서 이메일 등록 → 이 목록에 누적</li>
          <li>아래 <strong>"메일 작성"</strong>에 제목·본문 입력 (본문은 일반 텍스트 또는 HTML)</li>
          <li><strong>"시험 발송"</strong>으로 본인 이메일로 먼저 미리보기를 받아 확인</li>
          <li><strong>"전체 발송"</strong>으로 모든 구독자에게 일괄 발송 (개별 발송이라 BCC 노출 없음)</li>
          <li>네이버 SMTP를 사용하므로 <strong>MAIL_USER / MAIL_PASS</strong> .env 설정 필수</li>
        </ol>
      </div>

      <!-- 메일 작성 -->
      <div class="compose-card">
        <h3 class="compose-title">메일 작성</h3>
        <div class="compose-field">
          <label class="compose-label">제목</label>
          <input
            v-model="subject"
            type="text"
            class="compose-input"
            placeholder="2026 SPRING COLLECTION — 가장 먼저 만나보세요"
            maxlength="200"
          />
        </div>
        <div class="compose-field">
          <label class="compose-label">본문 <span class="compose-label-hint">(빈 줄은 단락 / HTML 태그 사용 가능)</span></label>
          <textarea
            v-model="body"
            class="compose-textarea"
            rows="10"
            placeholder="안녕하세요, VELCROCAT입니다.&#10;&#10;곧 공개될 2026 SPRING COLLECTION 을 가장 먼저 소개해 드립니다..."
          ></textarea>
        </div>

        <!-- 시험 발송 -->
        <div class="compose-test-row">
          <label class="compose-label">시험 발송 주소 (선택)</label>
          <div class="compose-test-row-inner">
            <input
              v-model="testTo"
              type="email"
              class="compose-input compose-input-inline"
              placeholder="myemail@example.com"
            />
            <button
              class="btn-ghost hvr-sweep-to-right"
              :disabled="sending || !subject.trim() || !body.trim() || !testTo.trim()"
              @click="send(true)"
            >시험 발송</button>
          </div>
        </div>

        <!-- 액션 바 -->
        <div class="compose-actions">
          <p v-if="lastResult" class="compose-msg" :class="{ error: lastResult.error }">
            <span v-if="lastResult.error">{{ lastResult.error }}</span>
            <span v-else-if="lastResult.test">시험 발송 완료 · {{ lastResult.sent }}/{{ lastResult.total }}건</span>
            <span v-else>발송 완료 · 성공 {{ lastResult.sent }} · 실패 {{ lastResult.failed }} (총 {{ lastResult.total }}명)</span>
          </p>
          <button
            class="btn-primary hvr-shadow"
            :disabled="sending || !subject.trim() || !body.trim() || rows.length === 0"
            @click="confirmSendAll"
          >
            <span v-if="sending && !testMode">
              <span class="compose-spinner" /> 발송 중…
            </span>
            <span v-else>전체 발송 ({{ rows.length }}명)</span>
          </button>
        </div>
      </div>

      <v-progress-circular v-if="loading" indeterminate color="grey-darken-3" class="d-block mx-auto my-12" />

      <div v-else-if="!rows.length" class="empty">
        <v-icon size="48" color="grey-lighten-1">mdi-email-outline</v-icon>
        <p>구독자가 없습니다 — 홈 하단 뉴스레터 폼에서 가입을 받아보세요</p>
      </div>

      <!-- 구독자 목록 -->
      <div v-else class="group-card">
        <div class="group-head">
          <div class="group-info">
            <p class="group-name">구독자 목록 (최근 가입 순 · 최대 500명)</p>
            <p class="group-meta">총 {{ rows.length }}명</p>
          </div>
        </div>
        <table class="nl-table">
          <thead>
            <tr>
              <th>이메일</th>
              <th>유입 경로</th>
              <th>가입일</th>
              <th>액션</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.id">
              <td class="cell-email">
                <a :href="'mailto:' + r.email">{{ r.email }}</a>
              </td>
              <td class="cell-source">{{ r.source || '-' }}</td>
              <td class="cell-date">{{ formatDate(r.created_at) }}</td>
              <td class="cell-actions">
                <button class="btn btn-del hvr-sink" @click="del(r.id)" title="구독자 삭제">
                  <v-icon size="14">mdi-trash-can-outline</v-icon>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </v-container>
  </v-main>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import AdminSidebar from '../../components/AdminSidebar.vue';

const rows = ref([]);
const loading = ref(true);
const sending = ref(false);
const testMode = ref(false);

const subject = ref('');
const body = ref('');
const testTo = ref('');
const lastResult = ref(null);

const authHeader = () => {
  const t = localStorage.getItem('token');
  return t ? { Authorization: `Bearer ${t}` } : {};
};

async function fetchRows() {
  loading.value = true;
  try {
    const res = await axios.get('/api/newsletter', { headers: authHeader() });
    rows.value = res.data || [];
  } catch (e) {
    console.error('뉴스레터 목록 조회 실패', e);
    rows.value = [];
  } finally {
    loading.value = false;
  }
}

async function del(id) {
  if (!confirm('이 구독자를 삭제하시겠습니까?')) return;
  try {
    await axios.delete(`/api/newsletter/${id}`, { headers: authHeader() });
    rows.value = rows.value.filter(r => r.id !== id);
  } catch (e) {
    alert(e.response?.data?.error || '삭제 실패');
  }
}

function confirmSendAll() {
  const n = rows.value.length;
  if (!confirm(`전체 ${n}명에게 발송합니다. 계속할까요?`)) return;
  send(false);
}

async function send(isTest) {
  lastResult.value = null;
  if (isTest && !testTo.value.trim()) {
    lastResult.value = { error: '시험 발송 이메일을 입력하세요' };
    return;
  }
  if (!isTest && rows.value.length === 0) {
    lastResult.value = { error: '구독자가 0명이라 전체 발송할 수 없습니다. 먼저 시험 발송으로 본인 이메일에 테스트해 주세요.' };
    return;
  }
  sending.value = true;
  testMode.value = isTest;
  try {
    const payload = {
      subject: subject.value.trim(),
      body: body.value.trim()
    };
    if (isTest) payload.testTo = testTo.value.trim();

    console.log('[newsletter] POST /api/newsletter/send', { ...payload, isTest });
    const res = await axios.post('/api/newsletter/send', payload, {
      headers: authHeader(),
      timeout: 120000  // 네이버 SMTP는 수신자당 1~2초씩 걸려 다수 발송 시 길어짐
    });
    console.log('[newsletter] 응답', res.status, res.data);
    lastResult.value = res.data;
  } catch (e) {
    console.error('[newsletter] 실패', e);
    let msg;
    if (e.code === 'ECONNABORTED') msg = '시간 초과 (SMTP 응답 없음) — 백엔드 콘솔 로그 확인 필요';
    else if (e.response?.status === 401) msg = '관리자 인증 만료 — 다시 로그인해 주세요';
    else if (e.response?.status === 503) msg = e.response?.data?.error || 'MAIL_USER / MAIL_PASS 설정 누락';
    else msg = e.response?.data?.error || e.message || '발송 실패';
    lastResult.value = { error: msg };
  } finally {
    sending.value = false;
    testMode.value = false;
  }
}

function formatDate(d) {
  if (!d) return '-';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  const hh = String(dt.getHours()).padStart(2, '0');
  const mi = String(dt.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

onMounted(fetchRows);
</script>

<style scoped>
.page-header {
  display: flex; align-items: flex-end; justify-content: space-between;
  margin-bottom: 24px; gap: 16px;
}
.page-title {
  font-family: var(--ff-serif);
  font-style: italic; font-weight: 500;
  font-size: 32px; line-height: 1.1; color: var(--c-ink); margin: 0;
}
.page-sub { font-size: 12px; color: var(--c-muted); margin: 6px 0 0; }

.header-stats { display: flex; gap: 8px; flex-shrink: 0; }
.stat-pill {
  display: inline-flex; align-items: center;
  font-size: 11px; font-weight: 600;
  background: rgba(47,107,71,0.08);
  color: #2F6B47;
  border: 1px solid rgba(47,107,71,0.25);
  padding: 5px 12px;
  border-radius: 999px;
  letter-spacing: 0.02em;
}

.usage-card {
  background: #fff;
  border: 1px solid #eee;
  padding: 20px 24px;
  margin-bottom: 20px;
}
.usage-title {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #555;
  margin: 0 0 12px;
}
.usage-list {
  margin: 0; padding: 0 0 0 18px;
  font-size: 13px; line-height: 1.9;
  color: #444;
}
.usage-list strong { color: #111; font-weight: 600; }

/* 메일 작성 카드 */
.compose-card {
  background: #fff;
  border: 1px solid #eee;
  padding: 24px;
  margin-bottom: 20px;
}
.compose-title {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #555;
  margin: 0 0 16px;
}
.compose-field { margin-bottom: 16px; }
.compose-label {
  display: block;
  font-family: var(--ff-label);
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--c-ink-soft);
  margin-bottom: 6px;
}
.compose-label-hint {
  font-size: 9.5px;
  letter-spacing: 0.06em;
  color: #aaa;
  text-transform: none;
  font-weight: 400;
  margin-left: 6px;
}
.compose-input,
.compose-textarea {
  width: 100%;
  background: #fff;
  border: 1px solid #ddd;
  padding: 10px 14px;
  font-size: 14px;
  font-family: inherit;
  color: #111;
  outline: none;
  box-sizing: border-box;
  border-radius: 2px;
}
.compose-input:focus,
.compose-textarea:focus {
  border-color: #111;
}
.compose-textarea {
  resize: vertical;
  line-height: 1.65;
  font-family: 'Apple SD Gothic Neo','Noto Sans KR',sans-serif;
}

.compose-test-row {
  background: #fafafa;
  border: 1px solid #eee;
  padding: 14px 16px;
  margin-bottom: 16px;
}
.compose-test-row-inner {
  display: flex;
  gap: 10px;
  align-items: center;
}
.compose-input-inline {
  flex: 1;
}

.compose-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 8px;
}
.compose-msg {
  margin: 0;
  font-size: 12px;
  color: #2F6B47;
  font-weight: 500;
}
.compose-msg.error { color: var(--c-accent); }

.btn-primary {
  background: #111;
  color: #fff;
  border: 1px solid #111;
  cursor: pointer;
  padding: 0 24px;
  height: 42px;
  font-family: var(--ff-label);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.btn-primary:hover:not(:disabled) { background: #000; }
.btn-primary:disabled { opacity: 0.45; cursor: default; }

.btn-ghost {
  background: #fff;
  color: #111;
  border: 1px solid #111;
  cursor: pointer;
  padding: 0 16px;
  height: 38px;
  font-family: var(--ff-label);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  flex-shrink: 0;
}
.btn-ghost:disabled { opacity: 0.45; cursor: default; }

.compose-spinner {
  display: inline-block;
  width: 12px; height: 12px;
  border: 1.5px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: nl-spin 0.7s linear infinite;
  margin-right: 6px;
  vertical-align: -2px;
}
@keyframes nl-spin { to { transform: rotate(360deg); } }

/* 구독자 목록 */
.empty {
  text-align: center; padding: 80px 20px;
  color: #999;
}
.empty p { margin-top: 14px; font-size: 14px; }

.group-card {
  background: #fff;
  border: 1px solid #eee;
  overflow: hidden;
}
.group-head {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: #fafafa;
  border-bottom: 1px solid #eee;
}
.group-info { flex: 1; min-width: 0; }
.group-name {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #111;
}
.group-meta {
  margin: 4px 0 0;
  font-size: 12px;
  color: #888;
}

.nl-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.nl-table thead th {
  text-align: left;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #888;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
}
.nl-table tbody tr { border-bottom: 1px solid #f3f3f3; }
.nl-table tbody tr:last-child { border-bottom: none; }
.nl-table td { padding: 12px 16px; color: #333; }
.cell-email a { color: #111; text-decoration: none; border-bottom: 1px dotted #ccc; }
.cell-email a:hover { border-bottom-color: #111; }
.cell-source { color: #888; font-size: 12px; }
.cell-date { color: #888; font-size: 12px; font-variant-numeric: tabular-nums; }
.cell-actions { white-space: nowrap; text-align: right; }
.btn {
  background: none;
  border: 1px solid #ddd;
  cursor: pointer;
  width: 28px; height: 28px;
  display: inline-flex; align-items: center; justify-content: center;
  margin-right: 4px;
  color: #555;
  transition: all 0.15s;
  padding: 0;
}
.btn:hover { color: #111; border-color: #111; }
.btn-del:hover { color: var(--c-accent); border-color: var(--c-accent); }

@media (max-width: 768px) {
  .compose-test-row-inner { flex-direction: column; align-items: stretch; }
  .compose-actions { flex-direction: column; align-items: stretch; }
  .btn-primary { justify-content: center; }
  .nl-table thead { display: none; }
  .nl-table tr { display: grid; grid-template-columns: 1fr auto; gap: 4px 12px; padding: 12px 16px; }
  .nl-table td { padding: 2px 0; border: 0; }
  .cell-actions { grid-column: 2; grid-row: 1 / span 3; align-self: start; }
}
</style>
