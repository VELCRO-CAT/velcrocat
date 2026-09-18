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
  <v-dialog v-model="mailDialog" max-width="520" persistent>
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
          class="mb-3"
        />
        <v-textarea
          v-model="mailForm.body"
          label="내용 *"
          variant="outlined"
          density="compact"
          rows="8"
          placeholder="줄바꿈은 그대로 반영됩니다"
        />
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
          :disabled="!mailForm.subject.trim() || !mailForm.body.trim()"
          @click="sendMail"
        >발송</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue';
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
const mailForm = ref({ subject: '', body: '' });
const mailSending = ref(false);
const mailError = ref('');
const mailSuccess = ref('');

function openMailDialog(user) {
  mailTarget.value = user;
  mailForm.value = { subject: '', body: '' };
  mailError.value = '';
  mailSuccess.value = '';
  mailDialog.value = true;
}

function closeMailDialog() {
  mailDialog.value = false;
}

async function sendMail() {
  mailError.value = '';
  mailSuccess.value = '';
  mailSending.value = true;
  try {
    const res = await axios.post('/api/newsletter/send', {
      subject: mailForm.value.subject.trim(),
      body: mailForm.value.body.trim(),
      recipients: [mailTarget.value.email]
    });
    if (res.data.sent > 0) {
      mailSuccess.value = `${mailTarget.value.email} 로 메일을 발송했습니다`;
      mailForm.value = { subject: '', body: '' };
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
</style>
