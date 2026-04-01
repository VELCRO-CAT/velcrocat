import { defineStore } from 'pinia';
import axios from 'axios';
import { useWishlistStore } from './wishlist';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    token: localStorage.getItem('token') || null
  }),
  getters: {
    isLoggedIn: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'admin'
  },
  actions: {
    async login(email, password) {
      const res = await axios.post('/api/users/login', { email, password });
      this.token = res.data.token;
      this.user = res.data.user;
      localStorage.setItem('token', this.token);
      localStorage.setItem('user', JSON.stringify(this.user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
      useWishlistStore().load();
    },
    async register(name, email, password) {
      const res = await axios.post('/api/users/register', { name, email, password });
      this.token = res.data.token;
      this.user = res.data.user;
      localStorage.setItem('token', this.token);
      localStorage.setItem('user', JSON.stringify(this.user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
      useWishlistStore().load();
    },
    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
      useWishlistStore().load();
    },
    initAuth() {
      if (this.token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
      }
    }
  }
});
