const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// 내 배송지 목록 (기본 배송지가 맨 앞)
router.get('/', async (req, res) => {
  try {
    const rows = await db('addresses')
      .where('user_id', req.user.id)
      .orderBy([{ column: 'is_default', order: 'desc' }, { column: 'created_at', order: 'desc' }]);
    res.json(rows);
  } catch (e) {
    console.error('배송지 조회 실패:', e.message);
    res.status(500).json({ error: '배송지를 불러오지 못했습니다' });
  }
});

// 배송지 추가 (첫 배송지는 자동으로 기본 배송지가 됨)
router.post('/', async (req, res) => {
  try {
    const { recipient, phone, zip, address, addressDetail, memo, isDefault } = req.body;
    if (!recipient || !phone || !address) {
      return res.status(400).json({ error: '받는 사람, 전화번호, 주소를 입력해주세요' });
    }

    const { c } = await db('addresses').where('user_id', req.user.id).count('id as c').first();
    const shouldBeDefault = !!isDefault || Number(c) === 0;

    if (shouldBeDefault) {
      await db('addresses').where('user_id', req.user.id).update({ is_default: false });
    }

    const [{ id }] = await db('addresses').insert({
      user_id: req.user.id,
      recipient,
      phone,
      zip: zip || null,
      address,
      address_detail: addressDetail || null,
      memo: memo || null,
      is_default: shouldBeDefault
    }).returning('id');

    const row = await db('addresses').where('id', id).first();
    res.status(201).json(row);
  } catch (e) {
    console.error('배송지 추가 실패:', e.message);
    res.status(500).json({ error: '배송지 저장에 실패했습니다' });
  }
});

// 배송지 수정
router.put('/:id', async (req, res) => {
  try {
    const addr = await db('addresses').where({ id: req.params.id, user_id: req.user.id }).first();
    if (!addr) return res.status(404).json({ error: '배송지를 찾을 수 없습니다' });

    const { recipient, phone, zip, address, addressDetail, memo } = req.body;
    if (!recipient || !phone || !address) {
      return res.status(400).json({ error: '받는 사람, 전화번호, 주소를 입력해주세요' });
    }

    await db('addresses').where('id', addr.id).update({
      recipient,
      phone,
      zip: zip || null,
      address,
      address_detail: addressDetail || null,
      memo: memo || null
    });
    const updated = await db('addresses').where('id', addr.id).first();
    res.json(updated);
  } catch (e) {
    console.error('배송지 수정 실패:', e.message);
    res.status(500).json({ error: '배송지 수정에 실패했습니다' });
  }
});

// 기본 배송지로 지정 (한 번에 1곳만 기본일 수 있음)
router.patch('/:id/default', async (req, res) => {
  try {
    const addr = await db('addresses').where({ id: req.params.id, user_id: req.user.id }).first();
    if (!addr) return res.status(404).json({ error: '배송지를 찾을 수 없습니다' });

    await db('addresses').where('user_id', req.user.id).update({ is_default: false });
    await db('addresses').where('id', addr.id).update({ is_default: true });
    res.json({ message: '기본 배송지로 설정되었습니다' });
  } catch (e) {
    console.error('기본 배송지 설정 실패:', e.message);
    res.status(500).json({ error: '기본 배송지 설정에 실패했습니다' });
  }
});

// 배송지 삭제 (기본 배송지를 지웠다면 남은 것 중 최신 것을 기본으로 승격)
router.delete('/:id', async (req, res) => {
  try {
    const addr = await db('addresses').where({ id: req.params.id, user_id: req.user.id }).first();
    if (!addr) return res.status(404).json({ error: '배송지를 찾을 수 없습니다' });

    await db('addresses').where('id', addr.id).del();

    if (addr.is_default) {
      const next = await db('addresses').where('user_id', req.user.id).orderBy('created_at', 'desc').first();
      if (next) await db('addresses').where('id', next.id).update({ is_default: true });
    }

    res.json({ message: '삭제되었습니다' });
  } catch (e) {
    console.error('배송지 삭제 실패:', e.message);
    res.status(500).json({ error: '삭제에 실패했습니다' });
  }
});

module.exports = router;
