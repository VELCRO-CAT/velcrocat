// MainPay (메인페이) 결제 연동
// https://developers.mainpay.co.kr/
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const MAINPAY_HOST = process.env.MAINPAY_HOST || 'https://test-api-std.mainpay.co.kr';
const MAINPAY_MBR_NO = process.env.MAINPAY_MBR_NO || '100011';
const MAINPAY_API_KEY = process.env.MAINPAY_API_KEY || 'U1FVQVJFLTEwMDAxMTIwMTgwNDA2MDkyNTMyMTA1MjM0';
const SITE_URL = process.env.SITE_URL || 'https://vcat.kr';

// yyMMddHHmmssSSS 형식 timestamp
function getTimestamp() {
  const now = new Date();
  const pad = (n, w = 2) => String(n).padStart(w, '0');
  const yy = String(now.getFullYear()).slice(-2);
  const MM = pad(now.getMonth() + 1);
  const dd = pad(now.getDate());
  const HH = pad(now.getHours());
  const mm = pad(now.getMinutes());
  const ss = pad(now.getSeconds());
  const SSS = pad(now.getMilliseconds(), 3);
  return `${yy}${MM}${dd}${HH}${mm}${ss}${SSS}`;
}

// SHA-256 signature 생성: mbrNo|mbrRefNo|amount|apiKey|timestamp
function generateSignature(mbrNo, mbrRefNo, amount, apiKey, timestamp) {
  const plain = `${mbrNo}|${mbrRefNo}|${amount}|${apiKey}|${timestamp}`;
  return crypto.createHash('sha256').update(plain).digest('hex');
}

// 가맹점 주문번호 생성 (최대 20byte)
function generateMbrRefNo() {
  const ts = Date.now().toString(36).toUpperCase(); // ~8 chars
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase(); // 4 chars
  return `V${ts}${rnd}`; // 총 ~13자
}

// 닫기/결과 전달용 HTML
function closeAndRedirectHtml(redirectUrl, message = '결제 처리 중...') {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>결제 처리</title></head>
<body style="font-family:sans-serif;text-align:center;padding:40px">
  <p>${message}</p>
  <script>
    (function(){
      try {
        if (window.opener && !window.opener.closed) {
          window.opener.location.href = ${JSON.stringify(redirectUrl)};
          window.close();
        } else {
          window.location.href = ${JSON.stringify(redirectUrl)};
        }
      } catch (e) {
        window.location.href = ${JSON.stringify(redirectUrl)};
      }
    })();
  </script>
</body></html>`;
}

// 1. 결제 준비
router.post('/ready', authMiddleware, async (req, res) => {
  try {
    const { items, amount, shippingAddress, paymethod = 'CARD' } = req.body;

    if (!items?.length || !amount) {
      return res.status(400).json({ error: '주문 정보가 부족합니다' });
    }

    const mbrRefNo = generateMbrRefNo();
    const timestamp = getTimestamp();
    const goodsName = (items.length === 1
      ? items[0].name
      : `${items[0].name} 외 ${items.length - 1}건`).substring(0, 30);

    // pending 주문 생성
    await db('orders').insert({
      order_no: mbrRefNo,
      user_id: req.user.id,
      user_name: req.user.name,
      user_email: req.user.email,
      items_json: JSON.stringify(items),
      total: amount,
      payment_method: 'mainpay',
      shipping_address_json: JSON.stringify(shippingAddress || {}),
      status: 'pending'
    });

    const signature = generateSignature(MAINPAY_MBR_NO, mbrRefNo, amount, MAINPAY_API_KEY, timestamp);

    const params = new URLSearchParams({
      version: 'V1',
      mbrNo: MAINPAY_MBR_NO,
      mbrRefNo,
      paymethod,
      amount: String(amount),
      goodsName,
      approvalUrl: `${SITE_URL}/api/payment/mainpay/approval`,
      closeUrl: `${SITE_URL}/api/payment/mainpay/close`,
      timestamp,
      signature,
      customerName: req.user.name || '',
      customerEmail: req.user.email || '',
      merchantData: encodeURIComponent(mbrRefNo)
    });

    const response = await fetch(`${MAINPAY_HOST}/v1/payment/ready`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' },
      body: params
    });

    const data = await response.json();

    if (data.resultCode !== '200') {
      console.error('[MainPay ready 실패]', data);
      await db('orders').where('order_no', mbrRefNo).del();
      return res.status(400).json({ error: data.resultMessage || '결제 준비 실패' });
    }

    res.json({
      success: true,
      mbrRefNo,
      aid: data.data.aid,
      nextPcUrl: data.data.nextPcUrl,
      nextMobileUrl: data.data.nextMobileUrl,
      expireTime: data.data.expireTime
    });
  } catch (e) {
    console.error('[MainPay ready 오류]', e);
    res.status(500).json({ error: '결제 준비 중 오류가 발생했습니다' });
  }
});

// 2. 인증결과 수신 → 결제 승인
// MainPay가 호출하는 GET 엔드포인트
router.get('/approval', async (req, res) => {
  try {
    const { aid, authToken, payType, merchantData } = req.query;
    const mbrRefNo = decodeURIComponent(merchantData || '');

    if (!aid || !authToken || !mbrRefNo) {
      return res.status(400).send(closeAndRedirectHtml(`${SITE_URL}/checkout?error=invalid_request`, '잘못된 요청입니다'));
    }

    const order = await db('orders').where('order_no', mbrRefNo).first();
    if (!order) {
      return res.send(closeAndRedirectHtml(`${SITE_URL}/checkout?error=order_not_found`, '주문 정보를 찾을 수 없습니다'));
    }

    // 이미 처리된 주문이면 결과만 표시
    if (order.status === 'paid') {
      return res.send(closeAndRedirectHtml(`${SITE_URL}/order-complete?orderNo=${mbrRefNo}`, '결제 완료'));
    }

    // 결제 승인 호출
    const timestamp = getTimestamp();
    const signature = generateSignature(MAINPAY_MBR_NO, mbrRefNo, order.total, MAINPAY_API_KEY, timestamp);

    const params = new URLSearchParams({
      version: 'V1',
      mbrNo: MAINPAY_MBR_NO,
      aid,
      mbrRefNo,
      authToken,
      paymethod: 'CARD',
      amount: String(order.total),
      timestamp,
      signature
    });

    const response = await fetch(`${MAINPAY_HOST}/v1/payment/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' },
      body: params
    });

    const data = await response.json();

    if (data.resultCode === '200') {
      const pay = data.data || {};
      await db('orders').where('order_no', mbrRefNo).update({
        status: 'paid',
        pay_ref_no: pay.refNo || null,
        pay_tran_date: pay.tranDate || null
      });

      await db('notifications').insert({
        type: 'order',
        title: '새 주문이 접수되었습니다',
        message: `${order.user_name}님이 ₩${Number(order.total).toLocaleString()} 결제 완료`,
        reference_id: mbrRefNo,
        is_read: false
      });

      console.log(`[MainPay 결제 완료] ${mbrRefNo} / ${order.total}원`);
      return res.send(closeAndRedirectHtml(`${SITE_URL}/order-complete?orderNo=${mbrRefNo}`, '결제 완료 처리 중...'));
    } else {
      console.error('[MainPay 승인 실패]', data);
      await db('orders').where('order_no', mbrRefNo).update({ status: 'cancelled' });
      return res.send(closeAndRedirectHtml(
        `${SITE_URL}/checkout?error=${encodeURIComponent(data.resultMessage || '결제 실패')}`,
        '결제 실패: ' + (data.resultMessage || '알 수 없는 오류')
      ));
    }
  } catch (e) {
    console.error('[MainPay approval 오류]', e);
    res.send(closeAndRedirectHtml(`${SITE_URL}/checkout?error=server_error`, '결제 처리 중 오류가 발생했습니다'));
  }
});

// 3. 결제창 종료 수신
router.get('/close', async (req, res) => {
  res.send(closeAndRedirectHtml(`${SITE_URL}/checkout?error=cancelled`, '결제가 취소되었습니다'));
});

module.exports = router;
