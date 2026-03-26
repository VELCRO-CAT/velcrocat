<template>
  <!-- 알림 팝업들 (우측 하단) -->
  <div class="notif-container">
    <transition-group name="notif-slide">
      <div
        v-for="n in visibleNotifs"
        :key="n.id"
        class="notif-toast"
        @click="handleClick(n)"
      >
        <div class="notif-icon">
          <v-icon size="18" :color="n.type === 'order' ? '#2a9d5c' : '#e8913a'">
            {{ n.type === 'order' ? 'mdi-receipt' : 'mdi-email-outline' }}
          </v-icon>
        </div>
        <div class="notif-body">
          <p class="notif-title">{{ n.title }}</p>
          <p class="notif-msg">{{ n.message }}</p>
          <p class="notif-time">{{ timeAgo(n.created_at) }}</p>
        </div>
        <button class="notif-close" @click.stop="dismiss(n)">
          <v-icon size="14" color="#999">mdi-close</v-icon>
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const visibleNotifs = ref([]);
const knownIds = ref(new Set());
let pollTimer = null;

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금 전';
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

async function fetchNotifications() {
  try {
    const res = await axios.get('/api/admin/notifications');
    const newNotifs = res.data.notifications.filter(n => !knownIds.value.has(n.id));

    if (newNotifs.length > 0) {
      // 최대 5개만 표시
      const toShow = newNotifs.slice(0, 5);
      toShow.forEach(n => {
        knownIds.value.add(n.id);
        visibleNotifs.value.unshift(n);
      });

      // 5개 초과 시 오래된 것 제거
      if (visibleNotifs.value.length > 5) {
        visibleNotifs.value = visibleNotifs.value.slice(0, 5);
      }

      // 8초 후 자동 사라짐
      setTimeout(() => {
        toShow.forEach(n => {
          const idx = visibleNotifs.value.findIndex(v => v.id === n.id);
          if (idx !== -1) visibleNotifs.value.splice(idx, 1);
        });
      }, 8000);
    }
  } catch {}
}

function dismiss(n) {
  const idx = visibleNotifs.value.findIndex(v => v.id === n.id);
  if (idx !== -1) visibleNotifs.value.splice(idx, 1);
  // 읽음 처리
  axios.patch(`/api/admin/notifications/${n.id}/read`).catch(() => {});
}

function handleClick(n) {
  dismiss(n);
  if (n.type === 'order') {
    router.push('/admin/orders');
  } else {
    router.push('/admin/inquiries');
  }
}

onMounted(() => {
  // 첫 로드 시 바로 확인
  fetchNotifications();
  // 30초마다 폴링
  pollTimer = setInterval(fetchNotifications, 30000);
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
});
</script>

<style scoped>
.notif-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column-reverse;
  gap: 8px;
  max-width: 360px;
}

.notif-toast {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  padding: 14px 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s;
}
.notif-toast:hover {
  box-shadow: 0 6px 28px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.notif-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notif-body {
  flex: 1;
  min-width: 0;
}

.notif-title {
  font-size: 12px;
  font-weight: 700;
  color: #111;
  margin-bottom: 2px;
}
.notif-msg {
  font-size: 11px;
  color: #666;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.notif-time {
  font-size: 10px;
  color: #aaa;
}

.notif-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.15s;
}
.notif-toast:hover .notif-close {
  opacity: 1;
}

/* 애니메이션 */
.notif-slide-enter-active {
  transition: all 0.35s ease;
}
.notif-slide-leave-active {
  transition: all 0.25s ease;
}
.notif-slide-enter-from {
  opacity: 0;
  transform: translateX(60px);
}
.notif-slide-leave-to {
  opacity: 0;
  transform: translateX(60px);
}

@media (max-width: 480px) {
  .notif-container {
    right: 12px;
    bottom: 12px;
    left: 12px;
    max-width: none;
  }
}
</style>
