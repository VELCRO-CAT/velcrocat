<template>
  <v-container style="max-width:1100px" class="py-8">
    <h1 class="text-h5 font-weight-bold mb-6">장바구니</h1>

    <div v-if="cartStore.items.length === 0" class="text-center py-16">
      <v-icon size="80" color="grey-lighten-1">mdi-cart-outline</v-icon>
      <p class="text-h6 text-grey mt-4 mb-6">장바구니가 비어있습니다</p>
      <v-btn color="red-darken-4" variant="elevated" to="/products">상품 보러가기</v-btn>
    </div>

    <v-row v-else>
      <!-- 장바구니 아이템 -->
      <v-col cols="12" md="8">
        <v-card variant="outlined" v-for="item in cartStore.items" :key="item.id" class="mb-3">
          <div class="d-flex align-center pa-4 gap-4">
            <v-img :src="item.image" width="80" height="80" rounded="lg" style="flex-shrink:0; background:#f5f5f5" />
            <div class="flex-grow-1">
              <p class="text-caption text-grey">{{ item.seller }}</p>
              <p class="font-weight-medium">{{ item.name }}</p>
              <p class="text-body-2 text-red-darken-4 font-weight-bold">₩{{ Number(item.price).toLocaleString() }}</p>
            </div>
            <div class="d-flex align-center">
              <v-btn icon variant="text" size="small" @click="cartStore.updateQty(item.id, item.qty - 1)">
                <v-icon>mdi-minus</v-icon>
              </v-btn>
              <span class="mx-3 font-weight-bold">{{ item.qty }}</span>
              <v-btn icon variant="text" size="small" @click="cartStore.updateQty(item.id, item.qty + 1)">
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </div>
            <div class="text-right" style="min-width:80px">
              <p class="font-weight-bold">₩{{ (item.price * item.qty).toLocaleString() }}</p>
              <v-btn icon variant="text" size="x-small" color="grey" @click="cartStore.removeItem(item.id)">
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </div>
          </div>
        </v-card>

        <v-btn variant="text" color="grey" size="small" @click="cartStore.clearCart()">장바구니 비우기</v-btn>
      </v-col>

      <!-- 주문 요약 -->
      <v-col cols="12" md="4">
        <v-card variant="outlined" class="pa-4">
          <h2 class="text-subtitle-1 font-weight-bold mb-4">주문 요약</h2>
          <div class="d-flex justify-space-between text-body-2 mb-2">
            <span>상품 수</span><span>{{ cartStore.itemCount }}개</span>
          </div>
          <div class="d-flex justify-space-between text-body-2 mb-2">
            <span>소계</span><span>₩{{ cartStore.total.toLocaleString() }}</span>
          </div>
          <div class="d-flex justify-space-between text-body-2 mb-3">
            <span>배송비</span><span class="text-green font-weight-medium">무료</span>
          </div>
          <v-divider class="mb-3" />
          <div class="d-flex justify-space-between font-weight-bold text-h6 mb-4">
            <span>합계</span>
            <span class="text-red-darken-4">₩{{ cartStore.total.toLocaleString() }}</span>
          </div>
          <v-btn color="red-darken-4" block size="large" @click="checkout">결제하기</v-btn>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { useCartStore } from '../stores/cart';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

const cartStore = useCartStore();
const authStore = useAuthStore();
const router = useRouter();

function checkout() {
  if (!authStore.isLoggedIn) router.push('/login');
  else router.push('/checkout');
}
</script>
