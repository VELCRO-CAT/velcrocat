<template>
  <v-container class="py-16 d-flex justify-center align-center" style="min-height:60vh">
    <div class="text-center">
      <v-progress-circular indeterminate color="#111" size="48" class="mb-4" />
      <p class="text-body-1">{{ t('authCallback.processing') }}</p>
    </div>
  </v-container>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useWishlistStore } from '../stores/wishlist';
import { useCartStore } from '../stores/cart';
import axios from 'axios';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

onMounted(async () => {
  const code = route.query.code;
  const state = route.query.state;
  const provider = route.params.provider;

  if (!code) {
    router.replace({ path: '/login', query: { socialError: '1' } });
    return;
  }

  try {
    const res = await axios.post(`/api/auth/${provider}/callback`, { code, state });
    authStore.token = res.data.token;
    authStore.user = res.data.user;
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
    useWishlistStore().load();
    useCartStore().load();
    router.push('/products');
  } catch (e) {
    router.replace({ path: '/login', query: { socialError: '1' } });
  }
});
</script>
