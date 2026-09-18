<template>
  <AdminSidebar />

  <v-main class="bg-grey-lighten-4 admin-page">
    <v-container class="admin-container" style="max-width:900px">
      <h1 class="page-title">회원 관리</h1>
      <p class="page-sub mb-5">가입된 회원 목록 ({{ users.length }}명)</p>

      <v-progress-circular v-if="loading" indeterminate color="grey-darken-3" class="d-block mx-auto my-12" />

      <div v-else-if="!users.length" class="text-center py-12 text-grey">
        <v-icon size="48">mdi-account-group</v-icon>
        <p class="mt-3">가입된 회원이 없습니다</p>
      </div>

      <div v-else class="user-list">
        <div v-for="user in users" :key="user.id" class="user-card">
          <div class="user-avatar">
            <v-icon size="20" color="#999">mdi-account</v-icon>
          </div>
          <div class="user-info">
            <div class="user-name">{{ user.name }}</div>
            <div class="user-email">{{ user.email }}</div>
          </div>
          <div class="user-date">{{ formatDate(user.created_at) }}</div>
          <v-btn
            size="small"
            variant="outlined"
            color="grey-darken-3"
            class="ml-3"
            prepend-icon="mdi-email-outline"
            @click="openMailDialog(user)"
          >메일 보내기</v-btn>
        </div>
      </div>
    </v-container>
  </v-main>

  <!-- 개별 메일 발송 다이얼로그 -->
  <v-dialog v-model="mailDialog" max-width="640" persistent scrollable>
    <v-card>
      <v-card-title class="pa-5 pb-3 text-body-1 font-weight-bold">
        메일 보내기
        <p class="text-caption text-grey mt-1" style="font-weight:400">받는 사람: {{ mailTarget?.name }} ({{ mailTarget?.email }})</p>
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-5">
        <v-text-field
          v-model="mailForm.subject"
          label="제목 *"
          variant="outlined"
          density="compact"
          class="mb-4"
        />

        <p class="text-caption font-weight-bold text-grey mb-2" style="letter-spacing:1px">내용 * (텍스트/이미지 자유롭게 추가)</p>

        <!-- 블록 리스트 -->
        <div class="mail-editor">
          <div v-for="(block, i) in mailBlocks" :key="i" class="mail-block">
            <div class="mail-block-header">
              <span class="mail-block-type">
                <v-icon size="14">{{ block.type === 'text' ? 'mdi-text' : 'mdi-image' }}</v-icon>
                {{ block.type === 'text' ? '텍스트' : '이미지' }}
              </span>
              <div class="mail-block-actions">
                <button class="mail-action-btn" @click.prevent="moveBlock(i, -1)" :disabled="i === 0" title="위로">
                  <v-icon size="14">mdi-arrow-up</v-icon>
                </button>
                <button class="mail-action-btn" @click.prevent="moveBlock(i, 1)" :disabled="i === mailBlocks.length - 1" title="아래로">
                  <v-icon size="14">mdi-arrow-down</v-icon>
                </button>
                <button class="mail-action-btn mail-delete-btn" @click.prevent="removeBlock(i)" title="삭제">
                  <v-icon size="14">mdi-close</v-icon>
                </button>
              </div>
            </div>
            <!-- 텍스트 블록 -->
            <textarea
              v-if="block.type === 'text'"
              v-model="block.content"
              class="mail-textarea"
              placeholder="텍스트를 입력하세요..."
              rows="3"
            ></textarea>
            <!-- 이미지 블록 -->
            <div v-else class="mail-img-block">
              <div v-if="block.content" class="mail-img-has-image">
                <img :src="block.content" class="mail-img-preview" />
                <label class="mail-img-change-btn">
                  <v-icon size="14">mdi-pencil</v-icon>
                  <span>이미지 변경</span>
                  <input type="file" accept="image/*" style="display:none" @change="uploadBlockImage($event, i)" />
                </label>
              </div>
              <div v-else class="mail-img-placeholder">
                <label class="mail-img-upload-btn">
                  <v-icon size="20" color="grey">mdi-upload</v-icon>
                  <span>이미지 업로드</span>
                  <input type="file" accept="image/*" style="display:none" @change="uploadBlockImage($event, i)" />
                </label>
              </div>
            </div>
          </div>

          <!-- 블록 추가 버튼 -->
          <div class="mail-add-btns">
            <button class="mail-add-btn" @click.prevent="addBlock('text')">
              <v-icon size="16">mdi-text</v-icon>
              텍스트 추가
            </button>
            <button class="mail-add-btn" @click.prevent="addBlock('image')">
              <v-icon size="16">mdi-image-plus</v-icon>
              이미지 추가
            </button>
          </div>
        </div>

        <v-alert v-if="mailError" type="error" variant="tonal" density="compact" class="mt-2">{{ mailError }}</v-alert>
        <v-alert v-if="mailSuccess" type="success" variant="tonal" density="compact" class="mt-2">{{ mailSuccess }}</v-alert>
      </v-card-text>
      <v-divider />
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="outlined" @click="closeMailDialog">닫기</v-btn>
        <v-btn
          color="grey-darken-4"
          :loading="mailSending"
          :disabled="!mailForm.subject.trim() || !hasMailContent"
          @click="sendMail"
        >발송</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import AdminSidebar from '../../components/AdminSidebar.vue';

const users = ref([]);
const loading = ref(true);

onMounted(async () => {
  const res = await axios.get('/api/admin/users');
  users.value = res.data.filter(u => u.email !== 'osakamarket0316@osakamarket.kr');
  loading.value = false;
});

function formatDate(str) {
  if (!str) return '-';
  return new Date(str).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

// 개별 메일 발송
const mailDialog = ref(false);
const mailTarget = ref(null);
const mailForm = ref({ subject: '' });
const mailBlocks = ref([{ type: 'text', content: '' }]);
const mailSending = ref(false);
const mailError = ref('');
const mailSuccess = ref('');

const hasMailContent = computed(() =>
  mailBlocks.value.some(b => (b.content || '').trim())
);

function openMailDialog(user) {
  mailTarget.value = user;
  mailForm.value = { subject: '' };
  mailBlocks.value = [{ type: 'text', content: '' }];
  mailError.value = '';
  mailSuccess.value = '';
  mailDialog.value = true;
}

function closeMailDialog() {
  mailDialog.value = false;
}

function addBlock(type) {
  mailBlocks.value.push({ type, content: '' });
}

function removeBlock(i) {
  mailBlocks.value.splice(i, 1);
}

function moveBlock(i, dir) {
  const j = i + dir;
  if (j < 0 || j >= mailBlocks.value.length) return;
  const temp = mailBlocks.value[i];
  mailBlocks.value[i] = mailBlocks.value[j];
  mailBlocks.value[j] = temp;
  mailBlocks.value = [...mailBlocks.value];
}

async function uploadBlockImage(event, blockIndex) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const fd = new FormData();
    fd.append('image', file);
    const res = await axios.post('/api/upload', fd);
    mailBlocks.value[blockIndex].content = res.data.url;
  } catch { /* skip */ }
  event.target.value = '';
}

// 블록을 이메일용 HTML로 변환 (이미지는 메일 클라이언트가 읽을 수 있도록 절대경로로 변환)
function blocksToHtml(blocks) {
  const origin = window.location.origin;
  return blocks
    .filter(b => (b.content || '').trim())
    .map(b => {
      if (b.type === 'image') {
        const src = b.content.startsWith('http') ? b.content : `${origin}${b.content}`;
        return `<img src="${src}" style="max-width:100%;display:block;margin:16px 0;border-radius:4px" />`;
      }
      const escaped = b.content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\r?\n/g, '<br>');
      return `<p style="margin:0 0 16px 0">${escaped}</p>`;
    })
    .join('\n');
}

async function sendMail() {
  mailError.value = '';
  mailSuccess.value = '';
  mailSending.value = true;
  try {
    const res = await axios.post('/api/newsletter/send', {
      subject: mailForm.value.subject.trim(),
      body: blocksToHtml(mailBlocks.value),
      recipients: [mailTarget.value.email]
    });
    if (res.data.sent > 0) {
      mailSuccess.value = `${mailTarget.value.email} 로 메일을 발송했습니다`;
      mailForm.value = { subject: '' };
      mailBlocks.value = [{ type: 'text', content: '' }];
    } else {
      mailError.value = res.data.failures?.[0]?.error || '발송에 실패했습니다';
    }
  } catch (e) {
    mailError.value = e.response?.data?.error || '발송에 실패했습니다';
  } finally {
    mailSending.value = false;
  }
}
</script>

<style scoped>
.page-title { font-size: 20px; font-weight: 800; color: #111; }
.page-sub { font-size: 12px; color: #999; margin-top: 2px; }

.user-list { display: flex; flex-direction: column; gap: 8px; }

.user-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 14px 16px;
}
.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.user-info { flex: 1; min-width: 0; }
.user-name {
  font-size: 13px;
  font-weight: 700;
  color: #111;
}
.user-email {
  font-size: 12px;
  color: #888;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.user-date {
  font-size: 11px;
  color: #aaa;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .admin-page { padding-top: 52px !important; }
  .admin-container { padding: 16px !important; }
  .page-title { font-size: 17px; }
  .user-card { flex-wrap: wrap; }
  .user-date { order: 3; margin-left: 54px; }
}

/* 메일 블록 에디터 (상품 상세설명 에디터와 동일 패턴) */
.mail-editor {
  margin-bottom: 8px;
}
.mail-block {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  margin-bottom: 10px;
  overflow: hidden;
}
.mail-block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}
.mail-block-type {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: #555;
}
.mail-block-actions { display: flex; gap: 2px; }
.mail-action-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  color: #777;
  transition: background 0.15s;
}
.mail-action-btn:hover { background: #e0e0e0; }
.mail-action-btn:disabled { opacity: 0.3; cursor: default; }
.mail-action-btn:disabled:hover { background: none; }
.mail-delete-btn:hover { background: #ffebee; color: #c62828; }
.mail-textarea {
  width: 100%;
  border: none;
  outline: none;
  padding: 12px 14px;
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
  min-height: 60px;
  color: #111;
}
.mail-img-block { padding: 8px; }
.mail-img-has-image { position: relative; }
.mail-img-preview {
  width: 100%;
  max-height: 260px;
  object-fit: contain;
  display: block;
  background: #f9f9f9;
}
.mail-img-change-btn {
  position: absolute;
  bottom: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: rgba(0,0,0,0.7);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}
.mail-img-change-btn:hover { background: rgba(0,0,0,0.9); }
.mail-img-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80px;
  background: #fafafa;
  border: 1px dashed #ddd;
  border-radius: 4px;
}
.mail-img-upload-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #777;
  cursor: pointer;
}
.mail-img-upload-btn:hover { color: #111; }
.mail-add-btns {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
.mail-add-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  border: 1px dashed #ccc;
  background: #fafafa;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  color: #555;
  border-radius: 6px;
  transition: all 0.15s;
}
.mail-add-btn:hover { border-color: #111; color: #111; background: #f0f0f0; }
</style>
