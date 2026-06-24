const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const db = require('../db');
const { adminMiddleware } = require('../middleware/auth');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 네이버 SMTP (users.js와 동일 설정 — MAIL_USER/MAIL_PASS .env)
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

// 명품 미니멀 HTML 래퍼 — 본문(plain text 또는 HTML)을 감쌈
function wrapEmail(subject, body) {
  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#F6F1E7;font-family:'Apple SD Gothic Neo','Noto Sans KR',sans-serif;color:#1A1714">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F6F1E7;padding:40px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border:1px solid #E8E0CF">
        <tr><td style="padding:36px 40px 0 40px;text-align:center">
          <p style="margin:0;font-family:'Manrope',sans-serif;font-size:12px;font-weight:600;letter-spacing:0.34em;color:#1A1714">VELCROCAT</p>
          <p style="margin:6px 0 0 0;font-size:8px;letter-spacing:0.28em;color:#4A433C">SEOUL</p>
        </td></tr>
        <tr><td style="padding:28px 40px 40px 40px">
          <h1 style="margin:0 0 20px 0;font-family:'Cormorant Garamond',serif;font-style:italic;font-weight:500;font-size:28px;line-height:1.2;color:#1A1714">${subject}</h1>
          <div style="font-size:14px;line-height:1.75;color:#1A1714">${body}</div>
        </td></tr>
        <tr><td style="padding:24px 40px;border-top:1px solid #E8E0CF;text-align:center;font-size:10.5px;letter-spacing:0.04em;color:#4A433C">
          본 메일은 VELCROCAT 뉴스레터 구독자에게 발송되었습니다.<br>
          더 이상 받지 않으시려면 회신으로 알려주세요.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

// 공개 — 누구나 구독 가능. 중복은 멱등 처리.
router.post('/subscribe', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: '올바른 이메일을 입력해주세요' });
    }

    const existing = await db('newsletter_subscribers').where('email', email).first();
    if (existing) {
      return res.json({ ok: true, alreadySubscribed: true });
    }

    await db('newsletter_subscribers').insert({
      email,
      source: 'site_footer'
    });
    res.status(201).json({ ok: true });
  } catch (e) {
    console.error('[newsletter /subscribe]', e.message);
    res.status(500).json({ error: '구독 처리에 실패했습니다' });
  }
});

// 관리자 목록 조회 (최근 500건)
router.get('/', adminMiddleware, async (req, res) => {
  try {
    const rows = await db('newsletter_subscribers')
      .orderBy('created_at', 'desc');
    res.json((rows || []).slice(0, 500));
  } catch (e) {
    console.error('[newsletter GET]', e.message);
    res.status(500).json({ error: '목록 조회에 실패했습니다' });
  }
});

// 관리자 — 구독자 삭제
router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: '잘못된 ID' });
    const n = await db('newsletter_subscribers').where('id', id).del();
    if (!n) return res.status(404).json({ error: '구독자를 찾을 수 없습니다' });
    res.json({ ok: true });
  } catch (e) {
    console.error('[newsletter DELETE]', e.message);
    res.status(500).json({ error: '삭제에 실패했습니다' });
  }
});

// 관리자 — 발송
// body: { subject, body, recipients?: string[] | 'all', testTo?: string }
// recipients 미지정 또는 'all' 이면 전체 구독자, testTo 가 있으면 그 주소로만 시험 발송.
router.post('/send', adminMiddleware, async (req, res) => {
  try {
    const subject = String(req.body?.subject || '').trim();
    const body = String(req.body?.body || '').trim();
    const testTo = String(req.body?.testTo || '').trim().toLowerCase();
    const recipientsInput = req.body?.recipients;

    if (!subject) return res.status(400).json({ error: '제목을 입력해주세요' });
    if (!body) return res.status(400).json({ error: '본문을 입력해주세요' });

    if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
      return res.status(503).json({
        error: 'MAIL_USER / MAIL_PASS 환경변수가 설정되지 않아 발송할 수 없습니다 (.env 확인)'
      });
    }

    // 수신자 결정
    let targets = [];
    if (testTo) {
      if (!EMAIL_RE.test(testTo)) return res.status(400).json({ error: '시험 발송 주소가 올바르지 않습니다' });
      targets = [testTo];
    } else if (Array.isArray(recipientsInput) && recipientsInput.length > 0) {
      targets = recipientsInput
        .map(e => String(e || '').trim().toLowerCase())
        .filter(e => EMAIL_RE.test(e));
    } else {
      const rows = await db('newsletter_subscribers').select('email');
      targets = rows.map(r => r.email);
    }

    if (targets.length === 0) {
      return res.status(400).json({ error: '발송 대상이 없습니다' });
    }

    // 본문이 HTML 태그를 포함하지 않으면 줄바꿈을 <br>로 변환
    const hasHtml = /<[a-z][\s\S]*>/i.test(body);
    const safeBody = hasHtml
      ? body
      : body
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\r?\n/g, '<br>');

    const html = wrapEmail(subject, safeBody);
    const from = `"VELCROCAT" <${process.env.MAIL_USER}>`;

    // 개인정보 보호를 위해 개별 발송 (BCC 묶음 회피)
    let sent = 0;
    const failures = [];
    for (const to of targets) {
      try {
        await transporter.sendMail({ from, to, subject, html });
        sent++;
      } catch (err) {
        failures.push({ to, error: err.message });
        console.error('[newsletter /send] fail', to, err.message);
      }
    }

    res.json({
      ok: true,
      total: targets.length,
      sent,
      failed: failures.length,
      failures: failures.slice(0, 20),
      test: !!testTo
    });
  } catch (e) {
    console.error('[newsletter /send]', e.message);
    res.status(500).json({ error: '발송 처리에 실패했습니다' });
  }
});

module.exports = router;
