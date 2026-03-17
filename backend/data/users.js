const bcrypt = require('bcryptjs');

// Pre-hashed passwords: osakamarket0316, user123
const users = [
  {
    id: 1,
    name: '관리자',
    email: 'osakamarket0316@osakamarket.kr',
    password: bcrypt.hashSync('osakamarket0316', 10),
    role: 'admin',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 2,
    name: '테스트유저',
    email: 'user@osakamarket.kr',
    password: bcrypt.hashSync('user123', 10),
    role: 'user',
    createdAt: '2026-01-01T00:00:00.000Z'
  }
];

module.exports = { users };
