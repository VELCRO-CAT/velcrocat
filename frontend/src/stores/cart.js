import { defineStore } from 'pinia';

// 같은 상품이라도 색상·사이즈가 다르면 별도 항목으로 취급
function variantKey(item) {
  return `${item.id}__${item.color || ''}__${item.size || ''}`;
}

// 장바구니는 단일 키로 브라우저에 영속화한다.
// (게스트로 담고 → 로그인 → 결제 흐름에서 카트가 비워지지 않도록 유저별 키를 쓰지 않음)
const CART_KEY = 'osaka_cart';

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: []
  }),
  getters: {
    itemCount: (state) => state.items.reduce((sum, i) => sum + i.qty, 0),
    total: (state) => state.items.reduce((sum, i) => sum + i.price * i.qty, 0)
  },
  actions: {
    loadCart() {
      try {
        const saved = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
        this.items = Array.isArray(saved) ? saved : [];
      } catch {
        this.items = [];
      }
    },
    saveCart() {
      localStorage.setItem(CART_KEY, JSON.stringify(this.items));
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
      this.saveCart();
    },
    removeItem(key) {
      this.items = this.items.filter(i => variantKey(i) !== key);
      this.saveCart();
    },
    updateQty(key, qty) {
      const item = this.items.find(i => variantKey(i) === key);
      if (item) {
        if (qty <= 0) {
          this.removeItem(key);
        } else {
          item.qty = qty;
          this.saveCart();
        }
      }
    },
    clearCart() {
      this.items = [];
      this.saveCart();
    }
  }
});

export { variantKey };
