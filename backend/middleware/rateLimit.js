const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: '너무 많이 시도하셨습니다. 15분 후 다시 시도해주세요' },
});

const codeRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: '너무 많이 요청하셨습니다. 15분 후 다시 시도해주세요' },
});

module.exports = { loginLimiter, codeRequestLimiter };
