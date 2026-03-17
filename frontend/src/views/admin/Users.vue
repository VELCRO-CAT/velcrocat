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
        </div>
      </div>
    </v-container>
  </v-main>
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
}
</style>
