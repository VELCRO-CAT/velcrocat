import { defineStore } from 'pinia';

// 같은 상품이라도 색상·사이즈가 다르면 별도 항목으로 취급
function variantKey(item) {
  return `${item.id}__${item.color || ''}__${item.size || ''}`;
}

const GUEST_CART_KEY = 'osaka_cart_guest';

// 비회원 장바구니도 기기에 저장해, 로그인(특히 소셜 로그인의 전체 페이지 리다이렉트)으로
// 페이지가 새로고침돼도 담아둔 상품이 사라지지 않게 한다. 로그인 시 mergeGuestIntoUser()가
// 이 비회원 장바구니를 회원 장바구니로 옮겨준다.
function getCartKey() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  return user ? `osaka_cart_${user.id}` : GUEST_CART_KEY;
}

function loadFromStorage() {
  return JSON.parse(localStorage.getItem(getCartKey()) || '[]');
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
      localStorage.setItem(getCartKey(), JSON.stringify(this.items));
    },
    load() {
      this.items = loadFromStorage();
    },
    // 로그인 직후 호출: 로그인 전 비회원 상태로 담아둔 상품을 회원 장바구니에 합친다.
    mergeGuestIntoUser() {
      const guestItems = JSON.parse(localStorage.getItem(GUEST_CART_KEY) || '[]');
      this.load();
      for (const gi of guestItems) {
        const key = variantKey(gi);
        const existing = this.items.find(i => variantKey(i) === key);
        if (existing) existing.qty += gi.qty;
        else this.items.push(gi);
      }
      this.save();
      localStorage.removeItem(GUEST_CART_KEY);
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
