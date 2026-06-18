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

  // 테이블 실제 컬럼만 골라서 넣기 (JSON에 잉여 필드가 있어도 안전)
  async function insertFiltered(table, rows) {
    if (!rows?.length) return 0;
    const info = await db(table).columnInfo();
    const cols = Object.keys(info);
    const cleaned = rows.map(row => {
      const r = {};
      for (const c of cols) if (row[c] !== undefined) r[c] = row[c];
      return r;
    });
    await db(table).insert(cleaned);
    return cleaned.length;
  }

  // 복원 (id 보존)
  const counts = {
    users: await insertFiltered('users', data.users),
    categories: await insertFiltered('categories', data.categories),
    products: await insertFiltered('products', data.products),
    orders: await insertFiltered('orders', data.orders),
    inquiries: await insertFiltered('inquiries', data.inquiries),
    notifications: await insertFiltered('notifications', data.notifications)
  };

  // PostgreSQL 시퀀스를 max(id)+1로 재설정
  for (const table of ['users', 'categories', 'products', 'orders', 'inquiries', 'notifications']) {
    try {
      await db.raw(`SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 1))`);
    } catch (e) { /* table may be empty */ }
  }

  console.log(`✅ 복원 완료: users=${counts.users}, categories=${counts.categories}, products=${counts.products}, orders=${counts.orders}, inquiries=${counts.inquiries}, notifications=${counts.notifications}`);
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

// 전역 에러 핸들러 — 상세 오류는 서버 로그에만 남기고 클라이언트엔 일반 메시지만 반환
app.use((err, req, res, next) => {
  console.error('처리되지 않은 오류:', err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({ error: '서버 오류가 발생했습니다' });
});

async function startServer() {
  try {
    // 프로덕션에서 JWT_SECRET 미설정 시 경고 (폴백 시크릿은 토큰 위조에 취약)
    if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
      console.warn('⚠️  JWT_SECRET가 설정되지 않았습니다. 프로덕션에서는 반드시 환경변수로 설정하세요.');
    }

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
    // 복원이 실패해도 서버 가동은 진행 (502 무한 크래시 루프 방지)
    if (process.env.DATABASE_URL) {
      try {
        await restoreFromJsonIfNeeded();
      } catch (e) {
        console.error('⚠️ 복원 실패 (서버는 계속 가동):', e.message);
      }
    }

    app.listen(PORT, () => {
      console.log(`🚀 서버 실행: http://localhost:${PORT}`);
      console.log(`📦 DB: ${process.env.DATABASE_URL ? 'PostgreSQL (Render)' : 'JSON 파일 (dev-db.json)'}`);
    });
  } catch (err) {
    console.error('❌ 서버 시작 오류:', err);
    process.exit(1);
  }
}

startServer();
