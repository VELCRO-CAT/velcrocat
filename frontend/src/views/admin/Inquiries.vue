<template>
  <AdminSidebar />

  <v-main class="bg-grey-lighten-4 admin-page">
    <v-container class="admin-container">
      <h1 class="page-title">문의 관리</h1>
      <p class="page-sub mb-5">고객 문의 목록</p>

      <v-progress-circular v-if="loading" indeterminate color="grey-darken-3" />

      <div v-else-if="!inquiries.length" class="text-center py-12 text-grey">
        <v-icon size="48">mdi-email-outline</v-icon>
        <p class="mt-3">아직 접수된 문의가 없습니다</p>
      </div>

      <div v-else>
        <v-card
          v-for="item in inquiries"
          :key="item.id"
          variant="outlined"
          class="mb-3 pa-4"
          :class="{ 'unread-card': item.status === 'unread' }"
        >
          <div class="inq-top">
            <div class="inq-chips">
              <v-chip :color="item.status === 'unread' ? 'orange' : 'grey'" size="x-small" variant="tonal">
                {{ item.status === 'unread' ? '미확인' : '확인' }}
              </v-chip>
              <v-chip v-if="item.inquiry_type" size="x-small" variant="tonal" color="blue-grey">{{ item.inquiry_type }}</v-chip>
            </div>
            <div class="inq-actions">
              <v-btn v-if="item.status === 'unread'" size="x-small" variant="outlined" @click="markRead(item)">읽음</v-btn>
              <button class="inq-delete-btn" @click="deleteInquiry(item)">
                <v-icon size="16">mdi-delete-outline</v-icon>
              </button>
            </div>
          </div>
          <div class="inq-meta">
            <span class="inq-name">{{ item.name }}</span>
            <span class="inq-contact">{{ item.email }}</span>
            <span v-if="item.phone" class="inq-contact">{{ item.phone }}</span>
            <span v-if="item.order_number" class="inq-contact">주문: {{ item.order_number }}</span>
          </div>
          <p class="inq-message">{{ item.message }}</p>
          <p class="inq-date">{{ formatDate(item.created_at) }}</p>
        </v-card>
      </div>
    </v-container>
  </v-main>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import AdminSidebar from '../../components/AdminSidebar.vue';

const inquiries = ref([]);
const loading = ref(true);

onMounted(async () => {
  const res = await axios.get('/api/admin/inquiries');
  inquiries.value = res.data;
  loading.value = false;
});

async function markRead(item) {
  await axios.patch(`/api/admin/inquiries/${item.id}/read`);
  item.status = 'read';
}

async function deleteInquiry(item) {
  if (!confirm(`"${item.name}"님의 문의를 삭제하시겠습니까?`)) return;
  await axios.delete(`/api/admin/inquiries/${item.id}`);
  inquiries.value = inquiries.value.filter(i => i.id !== item.id);
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}
</script>

<style scoped>
.page-title { font-size: 20px; font-weight: 800; color: #111; }
.page-sub { font-size: 12px; color: #999; margin-top: 2px; }
.unread-card { border-left: 3px solid #f59e0b !important; background: #fffbf0; }

.inq-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.inq-chips { display: flex; gap: 6px; flex-wrap: wrap; }
.inq-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 8px;
}
.inq-name { font-size: 13px; font-weight: 700; color: #111; }
.inq-contact { font-size: 11px; color: #888; }
.inq-message {
  font-size: 13px;
  color: #333;
  white-space: pre-wrap;
  line-height: 1.6;
  margin-bottom: 8px;
}
.inq-date { font-size: 11px; color: #aaa; }
.inq-actions { display: flex; align-items: center; gap: 8px; }
.inq-delete-btn {
  background: none;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 4px 6px;
  cursor: pointer;
  color: #999;
  transition: all 0.15s;
}
.inq-delete-btn:hover { color: #e53e3e; border-color: #e53e3e; }

@media (max-width: 768px) {
  .admin-page { padding-top: 52px !important; }
  .admin-container { padding: 16px !important; }
  .page-title { font-size: 17px; }
}
</style>
