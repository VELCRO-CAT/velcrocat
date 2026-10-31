import { createRouter, createWebHistory } from 'vue-router';
import Products from '../views/Products.vue';
import ProductDetail from '../views/ProductDetail.vue';
import Cart from '../views/Cart.vue';
import Login from '../views/Login.vue';
import Register from '../views/Register.vue';
import ForgotPassword from '../views/ForgotPassword.vue';
import MyPage from '../views/MyPage.vue';
import AuthCallback from '../views/AuthCallback.vue';
import Checkout from '../views/Checkout.vue';
import OrderComplete from '../views/OrderComplete.vue';
import GuestOrderLookup from '../views/GuestOrderLookup.vue';
import Contact from '../views/Contact.vue';
import About from '../views/About.vue';
import Story from '../views/Story.vue';
import Privacy from '../views/Privacy.vue';
import AdminLogin from '../views/admin/Login.vue';
import AdminDashboard from '../views/admin/Dashboard.vue';
import AdminProducts from '../views/admin/Products.vue';
import AdminOrders from '../views/admin/Orders.vue';
import AdminInquiries from '../views/admin/Inquiries.vue';
import AdminNaver from '../views/admin/Naver.vue';
import AdminUsers from '../views/admin/Users.vue';

const routes = [
  { path: '/', redirect: '/brand' },
  { path: '/home', redirect: '/products' },
  { path: '/brand', component: About },
  { path: '/story', component: Story },
  { path: '/products', component: Products },
  { path: '/products/:id', component: ProductDetail },
  { path: '/cart', component: Cart },
  { path: '/login', component: Login, meta: { guestOnly: true } },
  { path: '/register', component: Register, meta: { guestOnly: true } },
  { path: '/forgot-password', component: ForgotPassword, meta: { guestOnly: true } },
  { path: '/mypage', component: MyPage, meta: { requiresAuth: true } },
  { path: '/auth/:provider/callback', component: AuthCallback },
  { path: '/checkout', component: Checkout },
  { path: '/order-complete', component: OrderComplete },
  { path: '/order-lookup', component: GuestOrderLookup },
  { path: '/contact', component: Contact },
  { path: '/about', redirect: '/brand' },
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
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      // shortcut: 목록이 API로 상품을 새로 불러오는 동안 페이지가 짧아 스크롤이 안 먹음.
      // 데이터 로딩 끝날 시간을 벌어주는 용도 (500ms 넘게 걸리는 요청이면 다시 깨질 수 있음)
      return new Promise((resolve) => {
        setTimeout(() => resolve(savedPosition), 500);
      });
    }
    return { top: 0 };
  }
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
    // /admin-login은 콘솔에서 velcrocat() 실행 없이는 접근 불가
    if (sessionStorage.getItem('__osaka_admin_access') !== '1') {
      return next('/');
    }
  } else if (to.meta.requiresAdmin) {
    // 토큰이 유효하고 role이 admin이면 접근 허용 (일반/카카오/네이버 로그인 모두 동일하게 적용)
    const payload = token ? getTokenPayload(token) : null;
    const isAdminToken = payload?.role === 'admin';
    const notExpired = payload?.exp ? payload.exp * 1000 > Date.now() : false;

    if (!isAdminToken || !notExpired) {
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
