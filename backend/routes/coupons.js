const express = require('express');
const router = express.Router();
const { validateCoupon } = require('../services/coupons');

// 체크아웃에서 "코드 적용" 버튼을 누를 때 호출 — 여기서 보여주는 할인액은 미리보기일 뿐,
// 실제 결제 생성 시 서버(mainpay.js /ready)가 다시 검증·계산한다.
router.post('/validate', async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: '쿠폰 코드를 입력해주세요' });
    }
    const subtotalNum = Number(subtotal);
    if (!Number.isFinite(subtotalNum) || subtotalNum < 0) {
      return res.status(400).json({ error: '주문 금액이 올바르지 않습니다' });
    }
    const { discountAmount } = await validateCoupon(code, subtotalNum);
    res.json({ discountAmount });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message });
    console.error('쿠폰 검증 실패:', e);
    res.status(500).json({ error: '쿠폰 확인 중 오류가 발생했습니다' });
  }
});

module.exports = router;
