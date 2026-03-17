import { defineStore } from 'pinia';

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: []
  }),
  getters: {
    itemCount: (state) => state.items.reduce((sum, i) => sum + i.qty, 0),
    total: (state) => state.items.reduce((sum, i) => sum + i.price * i.qty, 0)
  },
  actions: {
    addItem(product) {
      const existing = this.items.find(i => i.id === product.id);
      if (existing) {
        existing.qty++;
      } else {
        this.items.push({ ...product, qty: 1 });
      }
    },
    removeItem(id) {
      this.items = this.items.filter(i => i.id !== id);
    },
    updateQty(id, qty) {
      const item = this.items.find(i => i.id === id);
      if (item) {
        if (qty <= 0) this.removeItem(id);
        else item.qty = qty;
      }
    },
    clearCart() {
      this.items = [];
    }
  }
});
