const db = require('../db');

function isCouponExpired(coupon, now = new Date()) {
  return coupon.expires_at != null && new Date(coupon.expires_at).getTime() <= now.getTime();
}

// 관리자 화면 날짜 입력("YYYY-MM-DD")은 "그 날짜까지 사용 가능"이라는 뜻이므로,
// 한국 시간 기준 그날 23:59:59.999에 만료되도록 변환한다. new Date("YYYY-MM-DD")를 그대로 쓰면
// UTC 자정(한국 시간 오전 9시)에 만료돼 관리자가 고른 날짜와 실제 만료 시각이 어긋난다.
function toExpiryDate(dateOnly) {
  if (!dateOnly) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return new Date(`${dateOnly}T23:59:59.999+09:00`);
  return new Date(dateOnly);
}

class CouponError extends Error {
  constructor(message) {
    super(message);
    this.status = 400;
  }
}

// 가격/재고와 같은 원칙 — 클라이언트가 보여주는 할인액은 미리보기일 뿐,
// 실제 주문 생성 시 여기서 다시 검증·계산한 값만 신뢰한다.
async function validateCoupon(code, subtotal) {
  const normalized = String(code || '').trim().toUpperCase();
  const coupon = await db('coupons').where('code', normalized).first();
  if (!coupon || !coupon.is_active) {
    throw new CouponError('유효하지 않은 쿠폰 코드입니다.');
  }
  if (isCouponExpired(coupon)) {
    throw new CouponError('기간이 만료된 쿠폰입니다.');
  }
  if (coupon.min_order_amount && subtotal < coupon.min_order_amount) {
    throw new CouponError(`${Number(coupon.min_order_amount).toLocaleString()}원 이상 주문 시 사용 가능한 쿠폰입니다.`);
  }
  if (coupon.usage_limit != null && coupon.used_count >= coupon.usage_limit) {
    throw new CouponError('사용 횟수가 모두 소진된 쿠폰입니다.');
  }

  const rawDiscount = coupon.discount_type === 'FIXED'
    ? coupon.discount_value
    : Math.floor((subtotal * coupon.discount_value) / 100);
  const capped = coupon.max_discount_amount ? Math.min(rawDiscount, coupon.max_discount_amount) : rawDiscount;
  const discountAmount = Math.max(0, Math.min(capped, subtotal)); // 총액보다 더 할인되지 않게 clamp

  return { coupon, discountAmount };
}

module.exports = { validateCoupon, isCouponExpired, toExpiryDate, CouponError };
