<template>
  <AdminSidebar />

  <v-main class="bg-grey-lighten-4 admin-page">
    <v-container class="admin-container" style="max-width:700px">
      <h1 class="page-title">무통장입금 계좌 설정</h1>
      <p class="page-sub mb-5">체크아웃에서 무통장입금을 선택한 고객에게 안내되는 계좌 정보입니다.</p>

      <v-progress-circular v-if="loading" indeterminate color="grey-darken-3" class="d-block mx-auto my-12" />

      <v-card v-else variant="outlined">
        <v-card-title class="text-body-1 font-weight-bold pa-4 pb-3">
          <v-icon size="20" class="mr-2">mdi-bank-outline</v-icon>
          입금 계좌 정보
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <v-text-field
            v-model="form.bank_transfer_bank_name"
            label="은행명"
            variant="outlined"
            density="compact"
            class="mb-3"
            placeholder="예: 카카오뱅크"
          />
          <v-text-field
            v-model="form.bank_transfer_account_number"
            label="계좌번호"
            variant="outlined"
            density="compact"
            class="mb-3"
            placeholder="예: 3333102045899"
          />
          <v-text-field
            v-model="form.bank_transfer_account_holder"
            label="예금주"
            variant="outlined"
            density="compact"
            placeholder="예: 김충성"
          />
          <v-btn color="grey-darken-4" :loading="saving" @click="save">
            <v-icon size="16" class="mr-1">mdi-content-save</v-icon>저장
          </v-btn>
          <v-alert v-if="msg" :type="msgType" variant="tonal" density="compact" class="mt-3">{{ msg }}</v-alert>
        </v-card-text>
      </v-card>
    </v-container>
  </v-main>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import AdminSidebar from '../../components/AdminSidebar.vue';

const KEYS = ['bank_transfer_bank_name', 'bank_transfer_account_number', 'bank_transfer_account_holder'];

const loading = ref(true);
const saving = ref(false);
const msg = ref('');
const msgType = ref('success');
const form = ref({
  bank_transfer_bank_name: '',
  bank_transfer_account_number: '',
  bank_transfer_account_holder: ''
});

onMounted(async () => {
  try {
    const { data } = await axios.get('/api/settings');
    for (const key of KEYS) {
      if (data[key] !== undefined) form.value[key] = data[key];
    }
  } finally {
    loading.value = false;
  }
});

async function save() {
  saving.value = true;
  msg.value = '';
  try {
    await Promise.all(KEYS.map(key =>
      axios.put(`/api/settings/${key}`, { value: form.value[key] })
    ));
    msg.value = '저장되었습니다';
    msgType.value = 'success';
  } catch (e) {
    msg.value = e.response?.data?.error || '저장에 실패했습니다';
    msgType.value = 'error';
  } finally {
    saving.value = false;
    setTimeout(() => { msg.value = ''; }, 3000);
  }
}
</script>

<style scoped>
.page-title { font-size: 20px; font-weight: 800; color: #111; }
.page-sub { font-size: 12px; color: #999; margin-top: 2px; }

@media (max-width: 768px) {
  .admin-page { padding-top: 52px !important; }
  .admin-container { padding: 16px !important; }
  .page-title { font-size: 17px; }
}
</style>
