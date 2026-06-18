require('dotenv').config();

module.exports = {
  development: {
    client: 'better-sqlite3',
    connection: {
      filename: './dev.sqlite3'
    },
    useNullAsDefault: true,
    migrations: {
      directory: './migrations'
    },
    seeds: {
      directory: './seeds'
    }
  },
  production: {
    client: 'pg',
    connection: {
      connectionString: process.env.DATABASE_URL,
      // 로컬 DB(localhost)는 SSL 미사용, 원격 관리형 DB는 SSL 사용
      ssl: /@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL || '')
        ? false
        : { rejectUnauthorized: false }
    },
    migrations: {
      directory: './migrations'
    },
    seeds: {
      directory: './seeds'
    }
  }
};
