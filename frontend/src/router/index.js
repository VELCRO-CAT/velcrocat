import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import Products from '../views/Products.vue';
import ProductDetail from '../views/ProductDetail.vue';
import Cart from '../views/Cart.vue';
import Login from '../views/Login.vue';
import Register from '../views/Register.vue';
import ForgotPassword from '../views/ForgotPassword.vue';
import MyPage from '../views/MyPage.vue';
import Checkout from '../views/Checkout.vue';
import OrderComplete from '../views/OrderComplete.vue';
import Contact from '../views/Contact.vue';
import About from '../views/About.vue';
import Privacy from '../views/Privacy.vue';
import AdminLogin from '../views/admin/Login.vue';
import AdminDashboard from '../views/admin/Dashboard.vue';
import AdminProducts from '../views/admin/Products.vue';
import AdminOrders from '../views/admin/Orders.vue';
import AdminInquiries from '../views/admin/Inquiries.vue';
import AdminNaver from '../views/admin/Naver.vue';
import AdminUsers from '../views/admin/Users.vue';

const routes = [
  { path: '/', component: About },
  { path: '/home', component: Home },
  { path: '/products', component: Products },
  { path: '/products/:id', component: ProductDetail },
  { path: '/cart', component: Cart },
  { path: '/login', component: Login, meta: { guestOnly: true } },
  { path: '/register', component: Register, meta: { guestOnly: true } },
  { path: '/forgot-password', component: ForgotPassword, meta: { guestOnly: true } },
  { path: '/mypage', component: MyPage, meta: { requiresAuth: true } },
  { path: '/checkout', component: Checkout, meta: { requiresAuth: true } },
  { path: '/order-complete', component: OrderComplete },
  { path: '/contact', component: Contact },
  { path: '/about', redirect: '/' },
  { path: '/privacy', component: Privacy },
  { path: '/admin-login', component: AdminLogin, meta: { requiresConsole: true } },
  { path: '/admin', component: AdminDashboard, meta: { requiresAdmin: true } },
  { path: '/admin/products', component: AdminProducts, meta: { requiresAdmin: true } },
  { path: '/admin/orders', component: AdminOrders, meta: { requiresAdmin: true } },
  { path: '/admin/inquiries', component: AdminInquiries, meta: { requiresAdmin: true } },
  { path: '/admin/users', component: AdminUsers, meta: { requiresAdmin: true } },
  { path: '/admin/naver', component: AdminNaver, meta: { requiresAdmin: true } }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() { return { top: 0 }; }
});

// JWT payload 디코딩 (검증 없이 내용만 읽기)
function getTokenPayload(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');

  if (to.meta.requiresConsole) {
    // /admin-login 도 콘솔 실행 없이는 접근 불가
    if (sessionStorage.getItem('__osaka_admin_access') !== '1') {
      return next('/');
    }
  } else if (to.meta.requiresAdmin) {
    // 조건 1: 콘솔에서 osakamarket() 실행 후 로그인한 세션이어야 함
    const hasSessionFlag = sessionStorage.getItem('__osaka_admin') === '1';
    // 조건 2: 토큰이 존재하고 role이 admin이어야 함
    const payload = token ? getTokenPayload(token) : null;
    const isAdminToken = payload?.role === 'admin';
    // 조건 3: 토큰 만료 확인
    const notExpired = payload?.exp ? payload.exp * 1000 > Date.now() : false;

    if (!hasSessionFlag || !isAdminToken || !notExpired) {
      // 세션 플래그와 토큰 모두 제거 후 홈으로
      sessionStorage.removeItem('__osaka_admin');
      return next('/');
    }
  } else if (to.meta.requiresAuth) {
    if (!token) {
      return next('/login');
    }
  } else if (to.meta.guestOnly) {
    if (token) {
      return next('/');
    }
  }
  next();
});

export default router;
