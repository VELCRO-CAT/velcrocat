import { defineStore } from 'pinia';

// 같은 상품이라도 색상·사이즈가 다르면 별도 항목으로 취급
function variantKey(item) {
  return `${item.id}__${item.color || ''}__${item.size || ''}`;
}

// 로그인한 회원만 장바구니를 기기에 저장해 새로고침/재방문에도 유지한다 (비회원은 유지 안 함)
function getCartKey() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  return user ? `osaka_cart_${user.id}` : null;
}

function loadFromStorage() {
  const key = getCartKey();
  return key ? JSON.parse(localStorage.getItem(key) || '[]') : [];
}

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: loadFromStorage()
  }),
  getters: {
    itemCount: (state) => state.items.reduce((sum, i) => sum + i.qty, 0),
    total: (state) => state.items.reduce((sum, i) => sum + i.price * i.qty, 0)
  },
  actions: {
    save() {
      const key = getCartKey();
      if (key) localStorage.setItem(key, JSON.stringify(this.items));
    },
    load() {
      this.items = loadFromStorage();
    },
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
      this.save();
    },
    removeItem(key) {
      this.items = this.items.filter(i => variantKey(i) !== key);
      this.save();
    },
    updateQty(key, qty) {
      const item = this.items.find(i => variantKey(i) === key);
      if (item) {
        if (qty <= 0) this.removeItem(key);
        else { item.qty = qty; this.save(); }
      }
    },
    clearCart() {
      this.items = [];
      this.save();
    }
  }
});

export { variantKey };
