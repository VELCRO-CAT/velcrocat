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
        <div class="notif-left">
          <div class="notif-icon">
            <v-icon size="20" color="#111">
              {{ n.type === 'order' ? 'mdi-receipt-text-outline' : n.type === 'user' ? 'mdi-account-plus-outline' : 'mdi-email-outline' }}
            </v-icon>
          </div>
        </div>
        <div class="notif-body">
          <p class="notif-title">{{ n.title }}</p>
          <p class="notif-msg">{{ n.message }}</p>
          <p class="notif-time">{{ timeAgo(n.created_at) }}</p>
        </div>
        <button class="notif-close" @click.stop="dismiss(n)">
          <v-icon size="16" color="#111">mdi-close</v-icon>
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
      const toShow = newNotifs.slice(0, 5);
      toShow.forEach(n => {
        knownIds.value.add(n.id);
        visibleNotifs.value.unshift(n);

        // 회원가입 알림은 한 번 뜨고 바로 읽음 처리
        if (n.type === 'user') {
          axios.patch(`/api/admin/notifications/${n.id}/read`).catch(() => {});
        }
      });

      if (visibleNotifs.value.length > 5) {
        visibleNotifs.value = visibleNotifs.value.slice(0, 5);
      }

      // 10초 후 자동 사라짐
      setTimeout(() => {
        toShow.forEach(n => {
          const idx = visibleNotifs.value.findIndex(v => v.id === n.id);
          if (idx !== -1) visibleNotifs.value.splice(idx, 1);
        });
      }, 10000);
    }
  } catch {}
}

function dismiss(n) {
  const idx = visibleNotifs.value.findIndex(v => v.id === n.id);
  if (idx !== -1) visibleNotifs.value.splice(idx, 1);
  axios.patch(`/api/admin/notifications/${n.id}/read`).catch(() => {});
}

function handleClick(n) {
  dismiss(n);
  if (n.type === 'order') {
    router.push('/admin/orders');
  } else if (n.type === 'user') {
    router.push('/admin/users');
  } else {
    router.push('/admin/inquiries');
  }
}

onMounted(() => {
  fetchNotifications();
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
  gap: 10px;
  width: 400px;
}

.notif-toast {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  background: #fff;
  border: 1.5px solid #111;
  border-radius: 0;
  padding: 18px 20px;
  cursor: pointer;
  transition: all 0.2s;
}
.notif-toast:hover {
  background: #fafafa;
}

.notif-left {
  flex-shrink: 0;
}

.notif-icon {
  width: 40px;
  height: 40px;
  border: 1.5px solid #111;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notif-body {
  flex: 1;
  min-width: 0;
}

.notif-title {
  font-size: 13px;
  font-weight: 800;
  color: #111;
  margin-bottom: 4px;
  letter-spacing: -0.3px;
}
.notif-msg {
  font-size: 12px;
  color: #555;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.notif-time {
  font-size: 10px;
  color: #999;
  letter-spacing: 0.3px;
}

.notif-close {
  background: none;
  border: 1.5px solid #ddd;
  cursor: pointer;
  padding: 4px;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.notif-close:hover {
  border-color: #111;
  background: #f5f5f5;
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
    width: auto;
  }
}
</style>
