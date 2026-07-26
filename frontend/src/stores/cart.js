import { defineStore } from 'pinia';

// 같은 상품이라도 색상·사이즈가 다르면 별도 항목으로 취급
function variantKey(item) {
  return `${item.id}__${item.color || ''}__${item.size || ''}`;
}

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: []
  }),
  getters: {
    itemCount: (state) => state.items.reduce((sum, i) => sum + i.qty, 0),
    total: (state) => state.items.reduce((sum, i) => sum + i.price * i.qty, 0)
  },
  actions: {
    addItem(product, options = {}) {
      const newItem = {
        ...product,
        color: options.color || null,
        size: options.size || null
      };
      const key = variantKey(newItem);
      const existing = this.items.find(i => variantKey(i) === key);
      if (existing) {
        existing.qty++;
      } else {
        this.items.push({ ...newItem, qty: 1 });
      }
    },
    removeItem(key) {
      this.items = this.items.filter(i => variantKey(i) !== key);
    },
    updateQty(key, qty) {
      const item = this.items.find(i => variantKey(i) === key);
      if (item) {
        if (qty <= 0) this.removeItem(key);
        else item.qty = qty;
      }
    },
    clearCart() {
      this.items = [];
    }
  }
});

export { variantKey };
