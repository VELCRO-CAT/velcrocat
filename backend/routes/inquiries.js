const express = require('express');
const router = express.Router();
const db = require('../db');

// 문의 접수 (누구나 가능)
router.post('/', async (req, res) => {
  const { name, phone, email, orderNumber, inquiryType, message } = req.body;
  if (!name || !phone || !email || !message) {
    return res.status(400).json({ error: '이름, 전화번호, 이메일, 문의 내용을 모두 입력해주세요' });
  }
  const [id] = await db('inquiries').insert({
    name, phone, email,
    order_number: orderNumber || null,
    inquiry_type: inquiryType || '기타',
    message,
    status: 'unread'
  });
  // 관리자 알림 생성
  await db('notifications').insert({
    type: 'inquiry',
    title: '새 문의가 접수되었습니다',
    message: `${name}님 - ${inquiryType || '기타'} 문의`,
    reference_id: String(id),
    is_read: false
  });

  res.status(201).json({ id, message: '문의가 접수되었습니다' });
});

module.exports = router;
