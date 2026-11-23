const db = require('../db');
const nodemailer = require('nodemailer');

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

const SITE_URL = process.env.SITE_URL || 'https://vcat.kr';

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// 주문 확인 메일 본문 (상품 이미지/이름/사이즈/색상/수량/배송지) — mainpay.js의 MPC notify와
// admin.js의 무통장입금 수동 확인이 공통으로 사용한다.
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
    <img src="${SITE_URL}/uploads/email-logo.png" alt="VELCROCAT" width="64" height="48" style="display:block;width:64px;height:48px;margin:26px auto 2px" />
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
    <div style="text-align:center;margin-top:28px">
      <a href="${SITE_URL}/mypage" style="display:inline-block;background:#111;color:#fff;text-decoration:none;font-size:13px;font-weight:700;letter-spacing:0.3px;padding:12px 28px;border-radius:4px">주문 내역 보기</a>
    </div>
    <p style="margin-top:20px;font-size:12px;color:#999;line-height:1.6;text-align:center">
      문의사항은 고객센터로 연락해주세요.
    </p>
  </div>`;
}

// 결제 확정(paid) 시점에 공통으로 해야 하는 일 — 재고 차감, 쿠폰 소진, 확인 메일.
// MPC notify(자동)와 관리자의 무통장입금 수동 확인 둘 다 이 함수를 거친다.
// 호출 전에 status를 'paid'로 바꾸는 건 호출부 책임 — 이 함수는 부수효과만 담당한다.
async function applyOrderPaid(order) {
  let items = [];
  try { items = JSON.parse(order.items_json || '[]'); } catch {}
  let shippingAddress = null;
  try { shippingAddress = order.shipping_address_json ? JSON.parse(order.shipping_address_json) : null; } catch {}

  try {
    for (const item of items) {
      const qty = Number(item.quantity) || 0;
      if (!item.id || qty <= 0) continue;
      await db('products')
        .where('id', item.id)
        .update({ stock: db.raw('GREATEST(stock - ?, 0)', [qty]) });
    }
  } catch (stockErr) {
    console.error('[applyOrderPaid] 재고 차감 실패', order.order_no, stockErr.message);
  }

  if (order.coupon_code) {
    try {
      const affected = await db('coupons')
        .where('code', order.coupon_code)
        .where(function () {
          this.whereNull('usage_limit').orWhereRaw('used_count < usage_limit');
        })
        .update({ used_count: db.raw('used_count + 1') });
      if (!affected) {
        console.error(`[ALERT][coupon-overuse] order=${order.order_no} code=${order.coupon_code}`);
      }
    } catch (couponErr) {
      console.error('[applyOrderPaid] 쿠폰 소진 처리 실패', order.order_no, couponErr.message);
    }
  }

  if (order.user_email && process.env.MAIL_USER && process.env.MAIL_PASS) {
    try {
      await transporter.sendMail({
        from: `"VELCROCAT" <${process.env.MAIL_USER}>`,
        to: order.user_email,
        subject: `[VELCROCAT] 주문이 완료되었습니다 (${order.order_no})`,
        html: buildOrderEmailHtml(order, items, shippingAddress)
      });
    } catch (mailErr) {
      console.error('[applyOrderPaid] 주문 확인 메일 발송 실패', order.order_no, mailErr.message);
    }
  }
}

module.exports = { applyOrderPaid };
