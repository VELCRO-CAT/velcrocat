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
import Terms from '../views/Terms.vue';
import Refund from '../views/Refund.vue';
import Cookies from '../views/Cookies.vue';
import NotFound from '../views/NotFound.vue';
import AdminLogin from '../views/admin/Login.vue';
import AdminDashboard from '../views/admin/Dashboard.vue';
import AdminProducts from '../views/admin/Products.vue';
import AdminOrders from '../views/admin/Orders.vue';
import AdminCoupons from '../views/admin/Coupons.vue';
import AdminInquiries from '../views/admin/Inquiries.vue';
import AdminNaver from '../views/admin/Naver.vue';
import AdminUsers from '../views/admin/Users.vue';

const DEFAULT_DESC = '벨크로캣(VELCROCAT, VCAT) - 일본식 의류의 트렌드와 스타일링. 가디건, 니트, 풀오버 등 프리미엄 울 100% 의류';

const routes = [
  { path: '/', redirect: '/brand' },
  { path: '/home', redirect: '/products' },
  { path: '/brand', component: About, meta: { title: '벨크로캣(VELCROCAT) | 브랜드 소개', description: DEFAULT_DESC } },
  { path: '/story', component: Story, meta: { title: '브랜드 스토리 | 벨크로캣(VELCROCAT)', description: DEFAULT_DESC } },
  { path: '/products', component: Products, meta: { title: '전체 상품 | 벨크로캣(VELCROCAT)', description: '벨크로캣(VELCROCAT) 전체 상품 - 가디건, 니트, 풀오버 등 프리미엄 울 100% 의류를 만나보세요.' } },
  { path: '/products/:id', component: ProductDetail },
  { path: '/cart', component: Cart, meta: { title: '장바구니 | 벨크로캣(VELCROCAT)' } },
  { path: '/login', component: Login, meta: { guestOnly: true, title: '로그인 | 벨크로캣(VELCROCAT)' } },
  { path: '/register', component: Register, meta: { guestOnly: true, title: '회원가입 | 벨크로캣(VELCROCAT)' } },
  { path: '/forgot-password', component: ForgotPassword, meta: { guestOnly: true, title: '비밀번호 찾기 | 벨크로캣(VELCROCAT)' } },
  { path: '/mypage', component: MyPage, meta: { requiresAuth: true, title: '마이페이지 | 벨크로캣(VELCROCAT)' } },
  { path: '/auth/:provider/callback', component: AuthCallback },
  { path: '/checkout', component: Checkout, meta: { title: '주문/결제 | 벨크로캣(VELCROCAT)' } },
  { path: '/order-complete', component: OrderComplete, meta: { title: '주문완료 | 벨크로캣(VELCROCAT)' } },
  { path: '/order-lookup', component: GuestOrderLookup, meta: { title: '비회원 주문조회 | 벨크로캣(VELCROCAT)' } },
  { path: '/contact', component: Contact, meta: { title: '문의하기 | 벨크로캣(VELCROCAT)', description: '벨크로캣(VELCROCAT)에 궁금한 점을 문의해보세요.' } },
  { path: '/about', redirect: '/brand' },
  { path: '/privacy', component: Privacy, meta: { title: '개인정보처리방침 | 벨크로캣(VELCROCAT)' } },
  { path: '/terms', component: Terms, meta: { title: '이용약관 | 벨크로캣(VELCROCAT)' } },
  { path: '/refund', component: Refund, meta: { title: '환불정책 | 벨크로캣(VELCROCAT)' } },
  { path: '/cookies', component: Cookies, meta: { title: '쿠키 정책 | 벨크로캣(VELCROCAT)' } },
  { path: '/admin-login', component: AdminLogin, meta: { requiresConsole: true } },
  { path: '/admin', component: AdminDashboard, meta: { requiresAdmin: true } },
  { path: '/admin/products', component: AdminProducts, meta: { requiresAdmin: true } },
  { path: '/admin/orders', component: AdminOrders, meta: { requiresAdmin: true } },
  { path: '/admin/coupons', component: AdminCoupons, meta: { requiresAdmin: true } },
  { path: '/admin/inquiries', component: AdminInquiries, meta: { requiresAdmin: true } },
  { path: '/admin/users', component: AdminUsers, meta: { requiresAdmin: true } },
  { path: '/admin/naver', component: AdminNaver, meta: { requiresAdmin: true } },
  { path: '/:pathMatch(.*)*', component: NotFound, meta: { title: '페이지를 찾을 수 없습니다 | 벨크로캣(VELCROCAT)' } }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 };
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
