const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

// ─────────────────────────────────────────
// 포트원(PortOne) 결제 검증
// ─────────────────────────────────────────
// ★ 실제 운영 시 아래 키를 포트원에서 발급받은 값으로 교체
const PORTONE_REST_KEY = process.env.PORTONE_REST_KEY || 'TEST_REST_KEY';
const PORTONE_REST_SECRET = process.env.PORTONE_REST_SECRET || 'TEST_REST_SECRET';

// 포트원 액세스 토큰 발급
async function getPortOneToken() {
  // 실제 운영 시 아래 주석을 해제하고 사용
  /*
  const axios = require('axios');
  const res = await axios.post('https://api.iamport.kr/users/getToken', {
    imp_key: PORTONE_REST_KEY,
    imp_secret: PORTONE_REST_SECRET
  });
  return res.data.response.access_token;
  */

  // 테스트 모드: 토큰 없이 통과
  return 'test_token';
}

// 결제 검증 API
router.post('/verify', authMiddleware, async (req, res) => {
  try {
    const { imp_uid, merchant_uid, amount } = req.body;

    if (!imp_uid || !merchant_uid) {
      return res.status(400).json({ error: '결제 정보가 누락되었습니다' });
    }

    // ─────────────────────────────────────
    // 실제 운영 시: 포트원 API로 결제 금액 검증
    // ─────────────────────────────────────
    /*
    const axios = require('axios');
    const token = await getPortOneToken();
    const paymentRes = await axios.get(
      `https://api.iamport.kr/payments/${imp_uid}`,
      { headers: { Authorization: token } }
    );
    const payment = paymentRes.data.response;

    // 결제 금액 위변조 검증
    if (payment.amount !== amount) {
      return res.status(400).json({ error: '결제 금액이 일치하지 않습니다' });
    }

    if (payment.status !== 'paid') {
      return res.status(400).json({ error: '결제가 완료되지 않았습니다' });
    }
    */

    // 테스트 모드: 검증 통과
    console.log(`[결제 검증] imp_uid: ${imp_uid}, merchant_uid: ${merchant_uid}, amount: ${amount}`);

    // 주문 상태를 paid(결제완료)로 업데이트
    await db('orders').where('order_no', merchant_uid).update({ status: 'paid' });

    res.json({
      success: true,
      message: '결제가 검증되었습니다',
      imp_uid,
      merchant_uid
    });
  } catch (e) {
    console.error('결제 검증 오류:', e.message);
    res.status(500).json({ error: '결제 검증에 실패했습니다' });
  }
});

// 기존 mock 결제 (호환성 유지)
router.post('/process', authMiddleware, (req, res) => {
  const { cardNumber, amount } = req.body;
  const paymentId = 'PAY-' + Date.now();
  res.json({ success: true, paymentId, amount });
});

module.exports = router;
