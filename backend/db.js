require('dotenv').config();

if (process.env.DATABASE_URL) {
  // 배포 환경 (Render): PostgreSQL + Knex 사용
  const knex = require('knex')({
    client: 'pg',
    connection: { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } },
    migrations: { directory: './migrations' },
    seeds: { directory: './seeds' }
  });
  module.exports = knex;
} else {
  // 로컬 개발: JSON 파일 DB (Python/빌드 도구 불필요)
  module.exports = require('./db-local');
}
