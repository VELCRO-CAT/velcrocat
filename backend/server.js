const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('./db');
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
app.use('/api/payment',   require('./routes/payment'));
app.use('/api/admin',     require('./routes/admin'));
app.use('/api/inquiries', require('./routes/inquiries'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/naver',  require('./routes/naver'));
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

    app.listen(PORT, () => {
      console.log(`🚀 서버 실행: http://localhost:${PORT}`);
      console.log(`📦 DB: ${process.env.DATABASE_URL ? 'PostgreSQL (Render)' : 'JSON 파일 (dev-db.json)'}`);
      console.log(`👤 관리자: osakamarket0316 / osakamarket0316`);
    });
  } catch (err) {
    console.error('❌ 서버 시작 오류:', err);
    process.exit(1);
  }
}

startServer();
