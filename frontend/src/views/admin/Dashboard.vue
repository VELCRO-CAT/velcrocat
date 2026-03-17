<template>
  <AdminSidebar />

  <v-main class="admin-main bg-grey-lighten-4">
    <v-container class="admin-container">
      <h1 class="dash-title">대시보드</h1>
      <p class="dash-sub">오사카마켓 관리자 페이지</p>

      <v-progress-circular v-if="loading" indeterminate color="grey-darken-3" class="d-block mx-auto my-12" />

      <template v-else>
        <!-- 총 매출 (상단 강조) -->
        <div class="revenue-card">
          <v-icon size="28" color="white">mdi-currency-krw</v-icon>
          <div class="revenue-amount">₩{{ Number(stats.totalRevenue || 0).toLocaleString() }}</div>
          <div class="revenue-label">총 매출</div>
        </div>

        <!-- 통계 카드 -->
        <div class="stat-grid">
          <div class="stat-card">
            <v-icon size="28" color="blue">mdi-hanger</v-icon>
            <div class="stat-num">{{ stats.totalProducts }}</div>
            <div class="stat-label">상품 수</div>
          </div>
          <div class="stat-card">
            <v-icon size="28" color="orange">mdi-receipt</v-icon>
            <div class="stat-num">{{ stats.totalOrders }}</div>
            <div class="stat-label">주문 수</div>
          </div>
          <div class="stat-card">
            <v-icon size="28" color="purple">mdi-account-group</v-icon>
            <div class="stat-num">{{ stats.totalUsers }}</div>
            <div class="stat-label">회원 수</div>
          </div>
          <div class="stat-card">
            <v-icon size="28" color="teal">mdi-email-outline</v-icon>
            <div class="stat-num">{{ stats.totalInquiries }}</div>
            <div class="stat-label">문의 수</div>
          </div>
        </div>

        <!-- 빠른 메뉴 -->
        <h2 class="quick-title">빠른 메뉴</h2>
        <div class="quick-grid">
          <router-link to="/admin/products" class="quick-card">
            <v-icon size="22" color="#555">mdi-hanger</v-icon>
            <span>상품 관리</span>
            <v-icon size="16" color="#ccc">mdi-chevron-right</v-icon>
          </router-link>
          <router-link to="/admin/orders" class="quick-card">
            <v-icon size="22" color="#555">mdi-receipt</v-icon>
            <span>주문 관리</span>
            <v-icon size="16" color="#ccc">mdi-chevron-right</v-icon>
          </router-link>
          <router-link to="/admin/users" class="quick-card">
            <v-icon size="22" color="#555">mdi-account-group</v-icon>
            <span>회원 관리</span>
            <v-icon size="16" color="#ccc">mdi-chevron-right</v-icon>
          </router-link>
          <router-link to="/admin/inquiries" class="quick-card">
            <v-icon size="22" color="#555">mdi-email-outline</v-icon>
            <span>문의 관리</span>
            <v-icon size="16" color="#ccc">mdi-chevron-right</v-icon>
          </router-link>
          <router-link to="/admin/naver" class="quick-card">
            <v-icon size="22" color="#555">mdi-store-outline</v-icon>
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
  margin-bottom: 24px;
}

/* 총 매출 카드 */
.revenue-card {
  background: #111;
  padding: 28px 24px;
  text-align: center;
  margin-bottom: 20px;
  border-radius: 8px;
}
.revenue-amount {
  font-size: 28px;
  font-weight: 900;
  color: #fff;
  margin: 8px 0 4px;
}
.revenue-label {
  font-size: 12px;
  color: #888;
  letter-spacing: 1px;
}

/* 통계 그리드 */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 32px;
}
.stat-card {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 20px 12px;
  text-align: center;
}
.stat-num {
  font-size: 26px;
  font-weight: 800;
  color: #111;
  margin: 8px 0 4px;
}
.stat-label {
  font-size: 11px;
  color: #999;
  letter-spacing: 0.5px;
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
  gap: 8px;
}
.quick-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 16px;
  text-decoration: none;
  color: #333;
  font-size: 13px;
  font-weight: 600;
  transition: background 0.15s;
}
.quick-card span {
  flex: 1;
}
.quick-card:hover {
  background: #f8f8f8;
}

/* 모바일 */
@media (max-width: 768px) {
  .admin-main {
    padding-top: 52px !important;
  }
  .admin-container {
    padding: 16px;
  }
  .dash-title {
    font-size: 18px;
  }
  .revenue-card {
    padding: 20px 16px;
  }
  .revenue-amount {
    font-size: 24px;
  }
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
  .stat-card {
    padding: 16px 8px;
  }
  .stat-num {
    font-size: 22px;
  }
}
</style>
