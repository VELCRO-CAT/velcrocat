import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useWishlistStore = defineStore('wishlist', () => {
  const items = ref([]);

  const count = computed(() => items.value.length);

  function getKey() {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user ? `osaka_wishlist_${user.id}` : 'osaka_wishlist_guest';
  }

  function load() {
    items.value = JSON.parse(localStorage.getItem(getKey()) || '[]');
  }

  function save() {
    localStorage.setItem(getKey(), JSON.stringify(items.value));
  }

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
    save();
  }

  function remove(productId) {
    items.value = items.value.filter(item => item.id !== productId);
    save();
  }

  // 초기 로드
  load();

  return { items, count, isWished, toggle, remove, load };
});
