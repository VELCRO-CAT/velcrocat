<template>
  <AdminSidebar />

  <v-main class="bg-grey-lighten-4 admin-page">
    <v-container class="admin-container">
      <h1 class="dash-title">대시보드</h1>
      <p class="dash-sub">오사카마켓 관리자 페이지</p>

      <v-progress-circular v-if="loading" indeterminate color="grey-darken-3" class="d-block mx-auto my-12" />

      <template v-else>
        <!-- 통계 카드 -->
        <div class="stat-grid">
          <router-link to="/admin/products" class="stat-card">
            <div class="stat-icon">
              <v-icon size="22" color="#111">mdi-hanger</v-icon>
            </div>
            <div class="stat-num">{{ stats.totalProducts }}</div>
            <div class="stat-label">상품 수</div>
          </router-link>
          <router-link to="/admin/orders" class="stat-card">
            <div class="stat-icon">
              <v-icon size="22" color="#111">mdi-receipt-text-outline</v-icon>
            </div>
            <div class="stat-num">{{ stats.totalOrders }}</div>
            <div class="stat-label">주문 수</div>
          </router-link>
          <router-link to="/admin/users" class="stat-card">
            <div class="stat-icon">
              <v-icon size="22" color="#111">mdi-account-group-outline</v-icon>
            </div>
            <div class="stat-num">{{ stats.totalUsers }}</div>
            <div class="stat-label">회원 수</div>
          </router-link>
          <router-link to="/admin/inquiries" class="stat-card">
            <div class="stat-icon">
              <v-icon size="22" color="#111">mdi-email-outline</v-icon>
            </div>
            <div class="stat-num">{{ stats.totalInquiries }}</div>
            <div class="stat-label">문의 수</div>
          </router-link>
        </div>

        <!-- 빠른 메뉴 -->
        <h2 class="quick-title">빠른 메뉴</h2>
        <div class="quick-grid">
          <router-link to="/admin/products" class="quick-card">
            <v-icon size="20" color="#111">mdi-hanger</v-icon>
            <span>상품 관리</span>
            <v-icon size="16" color="#ccc">mdi-chevron-right</v-icon>
          </router-link>
          <router-link to="/admin/orders" class="quick-card">
            <v-icon size="20" color="#111">mdi-receipt-text-outline</v-icon>
            <span>주문 관리</span>
            <v-icon size="16" color="#ccc">mdi-chevron-right</v-icon>
          </router-link>
          <router-link to="/admin/users" class="quick-card">
            <v-icon size="20" color="#111">mdi-account-group-outline</v-icon>
            <span>회원 관리</span>
            <v-icon size="16" color="#ccc">mdi-chevron-right</v-icon>
          </router-link>
          <router-link to="/admin/inquiries" class="quick-card">
            <v-icon size="20" color="#111">mdi-email-outline</v-icon>
            <span>문의 관리</span>
            <v-icon size="16" color="#ccc">mdi-chevron-right</v-icon>
          </router-link>
          <router-link to="/admin/naver" class="quick-card">
            <v-icon size="20" color="#111">mdi-store-outline</v-icon>
            <span>네이버 스마트스토어</span>
            <v-icon size="16" color="#ccc">mdi-chevron-right</v-icon>
          </router-link>
        </div>
      </template>
    </v-container>
  </v-main>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import AdminSidebar from '../../components/AdminSidebar.vue';

const stats = ref({});
const loading = ref(true);

onMounted(async () => {
  const res = await axios.get('/api/admin/stats');
  stats.value = res.data;
  loading.value = false;
});
</script>

<style scoped>
.admin-container {
  padding: 24px;
  max-width: 900px;
}
.dash-title {
  font-size: 22px;
  font-weight: 800;
  color: #111;
  margin-bottom: 4px;
}
.dash-sub {
  font-size: 12px;
  color: #999;
  margin-bottom: 28px;
}

/* 통계 그리드 */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
  margin-bottom: 36px;
  border: 1.5px solid #111;
}
.stat-card {
  background: #fff;
  border-right: 1.5px solid #111;
  padding: 24px 12px;
  text-align: center;
  text-decoration: none;
  color: #111;
  transition: background 0.15s;
}
.stat-card:last-child {
  border-right: none;
}
.stat-card:hover {
  background: #f5f5f5;
}
.stat-icon {
  width: 44px;
  height: 44px;
  border: 1.5px solid #111;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
}
.stat-num {
  font-size: 28px;
  font-weight: 900;
  color: #111;
  margin-bottom: 4px;
}
.stat-label {
  font-size: 11px;
  color: #777;
  letter-spacing: 1px;
  font-weight: 600;
}

/* 빠른 메뉴 */
.quick-title {
  font-size: 14px;
  font-weight: 700;
  color: #111;
  margin-bottom: 12px;
}
.quick-grid {
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1.5px solid #111;
}
.quick-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  border-bottom: 1.5px solid #111;
  padding: 16px 20px;
  text-decoration: none;
  color: #111;
  font-size: 13px;
  font-weight: 600;
  transition: background 0.15s;
}
.quick-card:last-child {
  border-bottom: none;
}
.quick-card span {
  flex: 1;
}
.quick-card:hover {
  background: #f5f5f5;
}

/* 모바일 */
@media (max-width: 768px) {
  .admin-container {
    padding: 16px;
  }
  .dash-title {
    font-size: 18px;
  }
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .stat-card:nth-child(2) {
    border-right: none;
  }
  .stat-card:nth-child(1),
  .stat-card:nth-child(2) {
    border-bottom: 1.5px solid #111;
  }
  .stat-num {
    font-size: 22px;
  }
}
</style>
