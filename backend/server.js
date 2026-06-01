const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const db = require('./db');

// dev-db.json → PostgreSQL 1회 복원
async function restoreFromJsonIfNeeded() {
  const sample = await db('products').orderBy('id').first();
  const isSeedData = sample?.image?.startsWith('https://placehold.co');
  if (!isSeedData) return;

  const jsonPath = path.join(__dirname, 'dev-db.json');
  if (!fs.existsSync(jsonPath)) return;

  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  if (!data.products?.length) return;

  console.log('🔄 dev-db.json → PostgreSQL 복원 시작');

  // 기존 시드 데이터 삭제 (FK 순서 주의)
  await db('notifications').del().catch(() => {});
  await db('inquiries').del().catch(() => {});
  await db('orders').del().catch(() => {});
  await db('products').del();
  await db('categories').del();
  await db('users').del();

  // 복원 (id 보존)
  if (data.users?.length) await db('users').insert(data.users);
  if (data.categories?.length) await db('categories').insert(data.categories);
  if (data.products?.length) await db('products').insert(data.products);
  if (data.orders?.length) await db('orders').insert(data.orders);
  if (data.inquiries?.length) await db('inquiries').insert(data.inquiries);
  if (data.notifications?.length) await db('notifications').insert(data.notifications);

  // PostgreSQL 시퀀스를 max(id)+1로 재설정
  for (const table of ['users', 'categories', 'products', 'orders', 'inquiries', 'notifications']) {
    try {
      await db.raw(`SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 1))`);
    } catch (e) { /* table may be empty */ }
  }

  console.log(`✅ 복원 완료: users=${data.users?.length||0}, categories=${data.categories?.length||0}, products=${data.products?.length||0}, notifications=${data.notifications?.length||0}`);
}
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 라우트
app.use('/api/products',  require('./routes/products'));
app.use('/api/categories',require('./routes/categories'));
app.use('/api/users',     require('./routes/users'));
app.use('/api/cart',      require('./routes/cart'));
app.use('/api/orders',    require('./routes/orders'));
app.use('/api/payment/mainpay', require('./routes/mainpay'));
app.use('/api/payment',   require('./routes/payment'));
app.use('/api/admin',     require('./routes/admin'));
app.use('/api/inquiries', require('./routes/inquiries'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/naver',  require('./routes/naver'));
app.use('/api/auth',   require('./routes/auth'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.json({ message: '오사카마켓 API v2.0', db: process.env.DATABASE_URL ? 'PostgreSQL' : 'JSON 파일' });
});

async function startServer() {
  try {
    // 마이그레이션 (배포 환경만 실행, 로컬은 스킵)
    await db.migrate.latest();

    // 데이터가 없으면 시드 실행
    const users = await db('users').count('id as count').first();
    const count = parseInt(users?.count || '0');

    if (count === 0) {
      const seedFn = require('./seeds/001_data');
      await seedFn.seed(db);
      console.log('✅ 초기 데이터 입력 완료');
    }

    // 시드 더미 데이터(placehold.co)가 들어있고 dev-db.json에 실데이터가 있으면 1회 복원
    if (process.env.DATABASE_URL) {
      await restoreFromJsonIfNeeded();
    }

    app.listen(PORT, () => {
      console.log(`🚀 서버 실행: http://localhost:${PORT}`);
      console.log(`📦 DB: ${process.env.DATABASE_URL ? 'PostgreSQL (Render)' : 'JSON 파일 (dev-db.json)'}`);
      console.log(`👤 관리자: velcrocat7 / kim@6521`);
    });
  } catch (err) {
    console.error('❌ 서버 시작 오류:', err);
    process.exit(1);
  }
}

startServer();
