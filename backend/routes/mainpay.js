// MPC 인증결제(결제창) 연동
// https://mpc.icu - 상위 PG(MainPay) 라우팅 중계
// 라우트 경로(/api/payment/mainpay/...)는 호환을 위해 유지
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

// 네이버 SMTP (users.js/newsletter.js와 동일 설정 — MAIL_USER/MAIL_PASS .env)
const transporter = nodemailer.createTransport({
  host: 'smtp.naver.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  },
  tls: { rejectUnauthorized: false }
});

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// 주문 확인 메일 본문 (상품 이미지/이름/사이즈/색상/수량/배송지)
function buildOrderEmailHtml(order, items, shippingAddress) {
  const rows = items.map(item => {
    const opts = [item.color, item.size].filter(Boolean).join(' · ');
    const rawImg = item.image || '';
    const imgSrc = rawImg ? (rawImg.startsWith('http') ? rawImg : `${SITE_URL}${rawImg}`) : '';
    const thumb = imgSrc
      ? `<img src="${imgSrc}" width="56" height="56" alt="" style="width:56px;height:56px;object-fit:cover;border:1px solid #eee;border-radius:4px;display:block" />`
      : `<div style="width:56px;height:56px;background:#f5f5f5;border:1px solid #eee;border-radius:4px"></div>`;
    return `
      <tr>
        <td style="padding:12px 8px 12px 0;border-bottom:1px solid #eee;width:56px">${thumb}</td>
        <td style="padding:12px 0;border-bottom:1px solid #eee;font-size:13px;color:#111">
          ${escapeHtml(item.name)}
          <div style="font-size:12px;color:#999;margin-top:3px">${opts ? escapeHtml(opts) + ' · ' : ''}수량 ${item.quantity || 1}개</div>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #eee;font-size:13px;color:#111;text-align:right;white-space:nowrap">
          ₩${Number(item.price || 0).toLocaleString()}
        </td>
      </tr>`;
  }).join('');

  const addressBlock = shippingAddress?.address ? `
    <p style="margin:24px 0 0;font-size:12px;color:#888;line-height:1.7">
      <strong style="color:#333">배송지</strong><br>
      ${shippingAddress.name || ''}${shippingAddress.phone ? ` · ${shippingAddress.phone}` : ''}<br>
      (${shippingAddress.zip || ''}) ${shippingAddress.address || ''} ${shippingAddress.addressDetail || ''}
      ${shippingAddress.memo ? `<br>배송 메모: ${shippingAddress.memo}` : ''}
    </p>` : '';

  return `
  <div style="max-width:480px;margin:0 auto;font-family:'Apple SD Gothic Neo',sans-serif;padding:40px 20px">
    <img src="${SITE_URL}/uploads/email-logo.png" alt="VELCROCAT" width="64" height="49" style="display:block;width:64px;height:49px;margin:0 auto 6px" />
    <h2 style="text-align:center;letter-spacing:2px;margin:0 0 2px;font-size:22px;line-height:1.2">VELCROCAT</h2>
    <p style="text-align:center;font-size:11px;letter-spacing:4px;color:#999;margin:0 0 28px;line-height:1.2">SEOUL</p>
    <p style="color:#333;font-size:14px">${order.user_name}님, 주문이 정상적으로 완료되었습니다.</p>
    <p style="color:#999;font-size:12px;margin:4px 0 24px">주문번호 ${order.order_no}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${rows}
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px">
      <tr>
        <td style="padding-top:14px;font-size:14px;font-weight:700;color:#111">합계</td>
        <td style="padding-top:14px;font-size:16px;font-weight:800;color:#111;text-align:right">₩${Number(order.total).toLocaleString()}</td>
      </tr>
    </table>
    ${addressBlock}
    <p style="margin-top:32px;font-size:12px;color:#999;line-height:1.6">
      주문 내역은 마이페이지에서도 확인하실 수 있습니다.<br>
      문의사항은 고객센터로 연락해주세요.
    </p>
  </div>`;
}

const MPC_HOST          = process.env.MPC_HOST          || 'https://mpc.icu';
const MPC_CLIENT_ID     = process.env.MPC_CLIENT_ID     || 'VCAT';
const MPC_CHANNEL_ID    = process.env.MPC_CHANNEL_ID    || 'REAL';
const MPC_RETAILER_CODE = process.env.MPC_RETAILER_CODE || 'VACT_PC_MODULE';
const MPC_TID           = process.env.MPC_TID           || 'MPA2605290001';
const MPC_CLIENT_SECRET = process.env.MPC_CLIENT_SECRET || '';
const SITE_URL          = process.env.SITE_URL          || 'https://vcat.kr';

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

// MPC signature: sha256(client_id|retailerCode|orderNo|amount|client_secret|timestamp)
function sign(orderNoOrOrgRef, amount, timestamp) {
  const plain = `${MPC_CLIENT_ID}|${MPC_RETAILER_CODE}|${orderNoOrOrgRef}|${amount}|${MPC_CLIENT_SECRET}|${timestamp}`;
  return crypto.createHash('sha256').update(plain).digest('hex');
}

// 가맹점 주문번호 (영숫자 ~16자)
function generateOrderNo() {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `V${ts}${rnd}`;
}

// 브라우저 콜백(approval/close)에서 주문번호 추출.
// MPC가 closeUrl에 우리가 붙여둔 merchantData 쿼리를 유지 안 하고
// aid/result만 붙여서 부를 수도 있으므로, 그 경우 aid로 주문을 역조회한다.
async function resolveOrderNo(q) {
  const direct = q.merchantData || q.orderNo || '';
  if (direct) return direct;
  if (q.aid) {
    const order = await db('orders').where('pay_aid', q.aid).first();
    if (order) return order.order_no;
  }
  return '';
}

// 팝업 닫고 부모창 리다이렉트
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

// 1. 결제 준비 (READY)
router.post('/ready', authMiddleware, async (req, res) => {
  try {
    const { items, amount, shippingAddress, paymethod = 'CARD' } = req.body;

    if (!items?.length || !amount) {
      return res.status(400).json({ error: '주문 정보가 부족합니다' });
    }

    const orderNo = generateOrderNo();
    const timestamp = getTimestamp();
    const goodsName = (items.length === 1
      ? items[0].name
      : `${items[0].name} 외 ${items.length - 1}건`).substring(0, 30);

    await db('orders').insert({
      order_no: orderNo,
      user_id: req.user.id,
      user_name: req.user.name,
      user_email: req.user.email,
      items_json: JSON.stringify(items),
      total: amount,
      payment_method: 'mpc',
      shipping_address_json: JSON.stringify(shippingAddress || {}),
      status: 'pending'
    });

    const signature = sign(orderNo, amount, timestamp);

    const params = new URLSearchParams({
      client_id: MPC_CLIENT_ID,
      channel_id: MPC_CHANNEL_ID,
      retailerCode: MPC_RETAILER_CODE,
      orderNo,
      paymethod,
      amount: String(amount),
      goodsName,
      customerName: req.user.name || '',
      customerEmail: req.user.email || '',
      merchantData: orderNo,
      timestamp,
      signature,
      // 일부 결제창 UI가 사용하는 리다이렉트 URL (MPC가 무시해도 무해)
      // orderNo를 쿼리로 직접 붙여서 MPC가 자체 파라미터명을 쓰더라도 주문 식별이 항상 가능하게 함
      approvalUrl: `${SITE_URL}/api/payment/mainpay/approval?merchantData=${orderNo}`,
      closeUrl: `${SITE_URL}/api/payment/mainpay/close?merchantData=${orderNo}`,
      notiUrl: `${SITE_URL}/api/payment/mainpay/notify`
    });

    const response = await fetch(`${MPC_HOST}/api/payment/payment_ready.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' },
      body: params
    });

    const data = await response.json();

    if (!data.result) {
      console.error('[MPC ready 실패]', data);
      await db('orders').where('order_no', orderNo).del();
      return res.status(400).json({ error: data.message || '결제 준비 실패' });
    }

    const d = data.data || {};

    // MPC의 closeUrl 리다이렉트는 aid/result만 붙여서 호출하므로(merchantData 유지 여부 불확실),
    // aid로도 주문을 찾을 수 있도록 미리 저장해둔다.
    if (d.aid) {
      await db('orders').where('order_no', orderNo).update({ pay_aid: d.aid });
    }

    res.json({
      success: true,
      orderNo,
      mbrRefNo: d.mbrRefNo,
      aid: d.aid,
      nextPcUrl: d.nextPcUrl,
      nextMobileUrl: d.nextMobileUrl,
      nextAppUrl: d.nextAppUrl
    });
  } catch (e) {
    console.error('[MPC ready 오류]', e);
    res.status(500).json({ error: '결제 준비 중 오류가 발생했습니다' });
  }
});

// 1-1. 주문 상태 확인 (프론트가 결제창을 닫은 후 실제 결제 완료 여부를 확인할 때 사용)
router.get('/status/:orderNo', authMiddleware, async (req, res) => {
  try {
    const order = await db('orders')
      .where('order_no', req.params.orderNo)
      .where('user_id', req.user.id)
      .first();

    if (!order) {
      // 이미 취소/정리되어 삭제된 주문(=결제 미완료)일 수 있음
      return res.status(404).json({ status: 'not_found' });
    }

    res.json({
      orderNo: order.order_no,
      status: order.status,
      total: order.total
    });
  } catch (e) {
    console.error('[MPC status 오류]', e);
    res.status(500).json({ error: '주문 상태 확인 중 오류가 발생했습니다' });
  }
});

// 1-2. 결제 포기 처리 (결제창을 열지 못했거나, 결제 완료를 확인하지 못한 채 이탈한 경우)
// 실제 결제(paid)로 확정된 주문은 절대 건드리지 않는다 — status가 여전히 'pending'일 때만 제거.
router.post('/abandon', authMiddleware, async (req, res) => {
  try {
    const { orderNo } = req.body;
    if (!orderNo) return res.status(400).json({ error: '주문번호가 없습니다' });

    const deleted = await db('orders')
      .where('order_no', orderNo)
      .where('user_id', req.user.id)
      .where('status', 'pending')
      .del();

    res.json({ success: true, removed: deleted > 0 });
  } catch (e) {
    console.error('[MPC abandon 오류]', e);
    res.status(500).json({ error: '처리 중 오류가 발생했습니다' });
  }
});

// 2. 결제창 완료 후 브라우저 복귀 (approvalUrl)
// MPC가 승인/후처리를 내부에서 마무리하므로 별도 /pay 호출은 불필요.
// 여기서는 주문번호 기준으로 상태 확인 후 완료 페이지로 이동.
router.all('/approval', async (req, res) => {
  try {
    const q = { ...req.query, ...req.body };
    const orderNo = await resolveOrderNo(q);

    if (!orderNo) {
      return res.send(closeAndRedirectHtml(`${SITE_URL}/checkout?error=invalid_request`, '잘못된 요청입니다'));
    }

    const order = await db('orders').where('order_no', orderNo).first();
    if (!order) {
      return res.send(closeAndRedirectHtml(`${SITE_URL}/checkout?error=order_not_found`, '주문 정보를 찾을 수 없습니다'));
    }

    // notify가 먼저 도착해 paid 처리됐을 수도 있음
    if (order.status === 'paid') {
      return res.send(closeAndRedirectHtml(`${SITE_URL}/order-complete?orderNo=${orderNo}`, '결제 완료'));
    }

    // MPC가 redirect 파라미터로 결과를 함께 전달하는 경우 처리
    const isFail = q.result === 'false' || q.resultCode === 'FAIL' || q.status === 'fail';
    if (isFail) {
      // 실제 결제가 이루어지지 않았으므로 pending 주문을 남기지 않고 제거한다
      // (이미 notify로 paid 처리됐다면 위에서 걸러지므로 여기선 항상 미결제 상태)
      await db('orders').where('order_no', orderNo).where('status', 'pending').del();
      const msg = q.message || q.resultMessage || '결제 실패';
      return res.send(closeAndRedirectHtml(
        `${SITE_URL}/checkout?error=${encodeURIComponent(msg)}`,
        '결제 실패: ' + msg
      ));
    }

    // 성공 추정 → notify 미수신이라도 완료 화면으로 진입시키되,
    // 실제 paid 전환은 notify 또는 관리자가 수동 확인하도록 pending 유지
    return res.send(closeAndRedirectHtml(`${SITE_URL}/order-complete?orderNo=${orderNo}`, '결제 처리 중...'));
  } catch (e) {
    console.error('[MPC approval 오류]', e);
    res.send(closeAndRedirectHtml(`${SITE_URL}/checkout?error=server_error`, '결제 처리 중 오류가 발생했습니다'));
  }
});

// 3. 결제창 닫기/취소
// ⚠️ 2026-09-17 확인: MPC가 이 URL을 "사용자가 취소했다"는 의미로만 부르는 게 아니라,
// 결제 성공 여부와 무관하게 팝업을 닫는 관례적인 단계로도 호출하는 것으로 보임
// (approvalUrl 직후 곧바로 이어서 호출되는 사례 확인 — 이때 notify가 아직 도착 전이라
// 주문이 여전히 'pending'인 상태였는데, 예전 코드가 이걸 '취소'로 오판해 결제 완료된
// 주문을 삭제해버리는 사고가 있었음). 그래서 여기서는 절대 주문을 지우지 않고,
// order-complete로 보내 실제 상태(notify 결과)를 폴링해서 확정하게 한다.
router.all('/close', async (req, res) => {
  const q = { ...req.query, ...req.body };
  const orderNo = await resolveOrderNo(q);
  if (orderNo) {
    return res.send(closeAndRedirectHtml(`${SITE_URL}/order-complete?orderNo=${orderNo}`, '결제 확인 중...'));
  }
  res.send(closeAndRedirectHtml(`${SITE_URL}/checkout?error=cancelled`, '결제가 취소되었습니다'));
});

// 4. MPC → 가맹점 노티 (서버-투-서버)
// MPC 결제 완료 시 호출되는 콜백. 시그니처 검증 후 주문 paid 처리.
router.post('/notify', async (req, res) => {
  try {
    const p = { ...req.body, ...req.query };

    // ⚠️ 2026-09-18 확인: 실서비스 notify 페이로드에는 orderNo/merchantData 필드가 없고,
    // MPC가 부여한 mbrRefNo(형식: "{issued_tid}_{orderNo}")에 주문번호가 들어있다.
    // (예: mbrRefNo="MPA2605290001_VMU5ZIC3VGAQJ" → orderNo="VMU5ZIC3VGAQJ")
    // 예전 코드는 orderNo/merchantData만 찾아서 매번 "orderNo 누락"으로 실패,
    // 실제 승인된 결제가 계속 pending에 머물러 있던 원인이었다.
    let orderNo = p.merchantData || p.orderNo;
    if (!orderNo && p.mbrRefNo) {
      const idx = String(p.mbrRefNo).indexOf('_');
      orderNo = idx !== -1 ? p.mbrRefNo.slice(idx + 1) : p.mbrRefNo;
    }

    const ackJson = (resultCode, message) => ({
      resultCode,
      message,
      mbrNo: p.mbrNo,
      mbrRefNo: p.mbrRefNo,
      refNo: p.refNo
    });

    if (!orderNo) {
      console.warn('[MPC notify] orderNo 누락', p);
      return res.status(400).json(ackJson('9999', 'orderNo 누락'));
    }

    const amount = p.amount;
    const timestamp = p.timestamp;
    const sig = p.signature;

    // 시그니처 검증 (전달된 경우만 — 실서비스 notify는 signature를 안 보내는 것으로 확인됨)
    if (sig && timestamp && amount) {
      const expected = sign(orderNo, amount, timestamp);
      if (expected !== sig) {
        console.warn('[MPC notify] 서명 불일치', { orderNo, expected, sig });
        return res.status(400).json(ackJson('9998', '서명 불일치'));
      }
    }

    const order = await db('orders').where('order_no', orderNo).first();
    if (!order) {
      console.warn('[MPC notify] 주문 없음', orderNo);
      return res.status(404).json(ackJson('9997', '주문 없음'));
    }

    if (order.status === 'paid') {
      return res.json(ackJson('0000', '정상')); // idempotent
    }

    // cmd: 0=승인, 1=취소, 2=부분취소 (문서 기준). 레거시 필드도 함께 확인.
    const cmd = String(p.cmd ?? '');
    const isApproval = cmd === '0' || p.result === true || p.result === 'true' || p.result === 'OK' || p.resultCode === '200' || p.status === 'paid';
    const isCancel = cmd === '1' || cmd === '2';

    if (isCancel) {
      await db('orders').where('order_no', orderNo).update({ status: 'cancelled' });
      console.log('[MPC notify] 취소 통지 처리', orderNo);
      return res.json(ackJson('0000', '정상'));
    }

    if (!isApproval) {
      // 인식 못한 상태값 — 과거에 이 분기에서 결제 완료 주문을 잘못 삭제한 사고가 있었으므로
      // 여기서는 주문을 건드리지 않고 로그만 남긴다 (관리자가 수동 확인).
      console.warn('[MPC notify] 인식 불가 상태 — 주문 변경 없이 무시', orderNo, p);
      return res.json(ackJson('0000', '정상'));
    }

    await db('orders').where('order_no', orderNo).update({
      status: 'paid',
      pay_ref_no: p.refNo || null,
      pay_tran_date: p.tranDate || null
    });

    let items = [];
    try { items = JSON.parse(order.items_json || '[]'); } catch {}
    let shippingAddress = null;
    try { shippingAddress = order.shipping_address_json ? JSON.parse(order.shipping_address_json) : null; } catch {}

    // 재고 차감 (결제 확정 시점에만 — 위 idempotent 체크 덕분에 같은 주문은 한 번만 차감됨)
    try {
      for (const item of items) {
        const qty = Number(item.quantity) || 0;
        if (!item.id || qty <= 0) continue;
        await db('products')
          .where('id', item.id)
          .update({ stock: db.raw('GREATEST(stock - ?, 0)', [qty]) });
      }
    } catch (stockErr) {
      console.error('[MPC notify] 재고 차감 실패', orderNo, stockErr.message);
    }

    // 주문 확인 메일 (상품/사이즈/색상/배송지 안내)
    if (order.user_email && process.env.MAIL_USER && process.env.MAIL_PASS) {
      try {
        await transporter.sendMail({
          from: `"VELCROCAT" <${process.env.MAIL_USER}>`,
          to: order.user_email,
          subject: `[VELCROCAT] 주문이 완료되었습니다 (${orderNo})`,
          html: buildOrderEmailHtml(order, items, shippingAddress)
        });
      } catch (mailErr) {
        console.error('[MPC notify] 주문 확인 메일 발송 실패', orderNo, mailErr.message);
      }
    }

    await db('notifications').insert({
      type: 'order',
      title: '새 주문이 접수되었습니다',
      message: `${order.user_name}님이 ₩${Number(order.total).toLocaleString()} 결제 완료`,
      reference_id: orderNo,
      is_read: false
    });

    console.log(`[MPC notify] 결제 완료 ${orderNo} / ${order.total}원`);
    res.json(ackJson('0000', '정상'));
  } catch (e) {
    console.error('[MPC notify 오류]', e);
    res.status(500).json({ resultCode: '9990', message: 'ERROR' });
  }
});

module.exports = router;
