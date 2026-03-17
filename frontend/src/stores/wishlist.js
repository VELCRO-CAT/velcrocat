import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useWishlistStore = defineStore('wishlist', () => {
  const items = ref(JSON.parse(localStorage.getItem('osaka_wishlist') || '[]'));

  const count = computed(() => items.value.length);

  function isWished(productId) {
    return items.value.some(item => item.id === productId);
  }

  function toggle(product) {
    const idx = items.value.findIndex(item => item.id === product.id);
    if (idx >= 0) {
      items.value.splice(idx, 1);
    } else {
      items.value.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image
      });
    }
    localStorage.setItem('osaka_wishlist', JSON.stringify(items.value));
  }

  function remove(productId) {
    items.value = items.value.filter(item => item.id !== productId);
    localStorage.setItem('osaka_wishlist', JSON.stringify(items.value));
  }

  return { items, count, isWished, toggle, remove };
});
