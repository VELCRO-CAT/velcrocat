const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// 이미지 파일만 허용 (확장자 + MIME 동시 검증)
const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => {
    // 원본 파일명/경로는 신뢰하지 않는다. 화이트리스트 확장자만 취해 안전한 랜덤 파일명 생성
    let ext = path.extname(file.originalname || '').toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) ext = '.jpg';
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
  }
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (ALLOWED_MIME.includes(file.mimetype) && ALLOWED_EXT.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('이미지 파일만 업로드할 수 있습니다 (jpg, png, webp, gif)'));
  }
}

const upload = multer({ storage, fileFilter, limits: { fileSize: 20 * 1024 * 1024 } });

function handleUploadError(err, res) {
  console.error('Upload error:', err.message);
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: '파일 크기가 20MB를 초과합니다' });
  return res.status(400).json({ error: err.message || '업로드에 실패했습니다' });
}

router.post('/', (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) return handleUploadError(err, res);
    if (!req.file) return res.status(400).json({ error: '파일이 없습니다' });
    res.json({ url: `/uploads/${req.file.filename}` });
  });
});

// 다중 이미지 업로드 (최대 10장)
router.post('/multiple', (req, res) => {
  upload.array('images', 10)(req, res, (err) => {
    if (err) return handleUploadError(err, res);
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: '파일이 없습니다' });
    const urls = req.files.map(f => `/uploads/${f.filename}`);
    res.json({ urls });
  });
});

module.exports = router;
