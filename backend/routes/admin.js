const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Anthropic = require('@anthropic-ai/sdk');
const db = require('../db');
const { adminMiddleware } = require('../middleware/auth');

// 관리자 전용 로그인 (아이디/비밀번호 방식)
const ADMIN_ACCOUNTS = [
  { username: 'velcrocat7', password: 'kim@6521' },
  { username: 'wnwlgh0719', password: 'wnwlgh0719' }
];

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const account = ADMIN_ACCOUNTS.find(a => a.username === username && a.password === password);
  if (!account) {
    return res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않습니다' });
  }

  const admin = await db('users').where('role', 'admin').first();
  if (!admin) return res.status(404).json({ error: '관리자 계정이 없습니다' });

  const token = jwt.sign(
    { id: admin.id, role: 'admin' },
    process.env.JWT_SECRET || 'osakamarket_secret',
    { expiresIn: '7d' }
  );
  res.json({ token, user: { id: admin.id, name: admin.name, role: admin.role, username: account.username } });
});

router.get('/stats', adminMiddleware, async (req, res) => {
  const [productCount, orderCount, userCount, revenueResult, inquiryCount] = await Promise.all([
    db('products').count('id as count').first(),
    db('orders').count('id as count').first(),
    db('users').where('role', 'user').count('id as count').first(),
    db('orders').where('status', 'paid').sum('total as total').first(),
    db('inquiries').count('id as count').first()
  ]);
  res.json({
    totalProducts: productCount.count,
    totalOrders: orderCount.count,
    totalUsers: userCount.count,
    totalRevenue: revenueResult.total || 0,
    totalInquiries: inquiryCount.count
  });
});

// 문의 목록 조회
router.get('/inquiries', adminMiddleware, async (req, res) => {
  const inquiries = await db('inquiries').orderBy('created_at', 'desc');
  res.json(inquiries);
});

// 문의 읽음 처리 + 해당 알림도 읽음 처리
router.patch('/inquiries/:id/read', adminMiddleware, async (req, res) => {
  await db('inquiries').where('id', req.params.id).update({ status: 'read' });
  // 해당 문의의 알림도 읽음 처리
  await db('notifications').where('type', 'inquiry').where('reference_id', String(req.params.id)).update({ is_read: true });
  res.json({ message: '읽음 처리되었습니다' });
});

router.get('/orders', adminMiddleware, async (req, res) => {
  const orders = await db('orders').orderBy('created_at', 'desc');
  res.json(orders.map(o => ({
    ...o,
    items: JSON.parse(o.items_json),
    shippingAddress: o.shipping_address_json ? JSON.parse(o.shipping_address_json) : null
  })));
});

router.patch('/orders/:id/status', adminMiddleware, async (req, res) => {
  await db('orders').where('id', req.params.id).update({ status: req.body.status });
  const order = await db('orders').where('id', req.params.id).first();
  res.json(order);
});

router.delete('/orders/:id', adminMiddleware, async (req, res) => {
  const count = await db('orders').where('id', req.params.id).del();
  if (!count) return res.status(404).json({ error: '주문을 찾을 수 없습니다' });
  res.json({ message: '삭제되었습니다' });
});

router.delete('/inquiries/:id', adminMiddleware, async (req, res) => {
  const count = await db('inquiries').where('id', req.params.id).del();
  if (!count) return res.status(404).json({ error: '문의를 찾을 수 없습니다' });
  res.json({ message: '삭제되었습니다' });
});

// 알림 목록 (읽지 않은 것만)
router.get('/notifications', adminMiddleware, async (req, res) => {
  const notifications = await db('notifications').orderBy('created_at', 'desc');
  const unread = notifications.filter(n => !n.is_read);
  res.json({ notifications: unread, total: notifications.length });
});

// 알림 전체 읽음 처리 (반드시 :id 라우트보다 위에)
router.patch('/notifications/read-all', adminMiddleware, async (req, res) => {
  await db('notifications').where('is_read', false).update({ is_read: true });
  res.json({ message: '전체 읽음 처리되었습니다' });
});

// 알림 개별 읽음 처리
router.patch('/notifications/:id/read', adminMiddleware, async (req, res) => {
  await db('notifications').where('id', req.params.id).update({ is_read: true });
  res.json({ message: '읽음 처리되었습니다' });
});

router.get('/users', adminMiddleware, async (req, res) => {
  const users = await db('users').select('id', 'name', 'email', 'role', 'created_at');
  res.json(users);
});

router.get('/products', adminMiddleware, async (req, res) => {
  res.json(await db('products').orderBy('id', 'desc'));
});

// products 테이블의 실제 컬럼만 골라 반환 (잉여 필드/id/timestamps 제거)
async function pickProductColumns(body) {
  const info = await db('products').columnInfo();
  const cols = Object.keys(info);
  const out = {};
  for (const c of cols) {
    if (c === 'id' || c === 'created_at' || c === 'updated_at') continue;
    if (body[c] !== undefined) out[c] = body[c];
  }
  return out;
}

// ─────────────────────────────────────────
// Claude(Anthropic API) 자동 번역
// 관리자가 한국어만 입력하면, 저장 시 비어있는 영어/중국어/일본어 필드를
// Claude에게 한 번에 번역시켜 자동으로 채운다.
// (이미 값이 있으면 건드리지 않음 — 수동으로 고친 번역을 덮어쓰지 않기 위함)
// ─────────────────────────────────────────
const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;

async function translateProductFields(name, description) {
  if (!anthropic) return null;
  try {
    const response = await anthropic.messages.create({
      model: 'claude-opus-5',
      max_tokens: 2048,
      output_config: { effort: 'low' }, // 단순 번역 작업이라 낮은 effort로 비용 절감
      messages: [{
        role: 'user',
        content:
          '다음은 한국 온라인 쇼핑몰의 의류 상품 정보다. 영어(en), 중국어 간체(zh), 일본어(ja)로 ' +
          '자연스럽게 번역해라. 다른 설명 없이 아래 JSON 형식으로만 답변해라.\n\n' +
          `상품명: ${name || '(없음)'}\n` +
          `상세설명: ${description || '(없음)'}\n\n` +
          '{"en":{"name":"...","description":"..."},"zh":{"name":"...","description":"..."},"ja":{"name":"...","description":"..."}}'
      }]
    });
    const textBlock = response.content.find(b => b.type === 'text');
    const match = textBlock?.text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  } catch (e) {
    console.error('[Claude 번역 오류]', e.message);
    return null;
  }
}

// name/description 중 비어있는 name_xx/description_xx만 골라 번역해서 채움
async function autoTranslateProduct(data) {
  if (!anthropic) return data; // API 키 미설정 시 그냥 통과(한국어 폴백 유지)
  if (!data.name && !data.description) return data;

  const langs = ['en', 'zh', 'ja'];
  const needsTranslation = langs.some(l => (data.name && !data[`name_${l}`]) || (data.description && !data[`description_${l}`]));
  if (!needsTranslation) return data; // 이미 다 채워져 있으면 API 호출 안 함

  const translations = await translateProductFields(data.name, data.description);
  if (!translations) return data;

  for (const l of langs) {
    const t = translations[l];
    if (!t) continue;
    if (data.name && !data[`name_${l}`] && t.name) data[`name_${l}`] = t.name;
    if (data.description && !data[`description_${l}`] && t.description) data[`description_${l}`] = t.description;
  }
  return data;
}

router.post('/products', adminMiddleware, async (req, res) => {
  try {
    let data = await pickProductColumns(req.body);
    data = await autoTranslateProduct(data);
    const [{ id }] = await db('products').insert(data).returning('id');
    const product = await db('products').where('id', id).first();
    res.status(201).json(product);
  } catch (e) {
    console.error('[admin POST /products]', e.message);
    res.status(500).json({ error: '상품 추가에 실패했습니다' });
  }
});

router.put('/products/:id', adminMiddleware, async (req, res) => {
  try {
    let data = await pickProductColumns(req.body);
    data = await autoTranslateProduct(data);
    await db('products').where('id', req.params.id).update(data);
    const product = await db('products').where('id', req.params.id).first();
    if (!product) return res.status(404).json({ error: '상품을 찾을 수 없습니다' });
    res.json(product);
  } catch (e) {
    console.error('[admin PUT /products]', e.message);
    res.status(500).json({ error: '상품 수정에 실패했습니다' });
  }
});

router.delete('/products/:id', adminMiddleware, async (req, res) => {
  const count = await db('products').where('id', req.params.id).del();
  if (!count) return res.status(404).json({ error: '상품을 찾을 수 없습니다' });
  res.json({ message: '삭제되었습니다' });
});

module.exports = router;
