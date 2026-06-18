require('dotenv').config();

if (process.env.DATABASE_URL) {
  // 배포 환경: PostgreSQL + Knex
  // 로컬 DB(VPS에 직접 설치한 Postgres)는 SSL 미사용, 원격 관리형 DB(Render 등)는 SSL 사용
  const isLocalDb = /@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL);
  const knex = require('knex')({
    client: 'pg',
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: isLocalDb ? false : { rejectUnauthorized: false }
    },
    migrations: { directory: './migrations' },
    seeds: { directory: './seeds' }
  });
  module.exports = knex;
} else {
  // 로컬 개발: JSON 파일 DB (Python/빌드 도구 불필요)
  module.exports = require('./db-local');
}
