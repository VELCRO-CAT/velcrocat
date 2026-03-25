const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db');
const { adminMiddleware } = require('../middleware/auth');

// 네이버 커머스 API 설정 저장/조회
router.get('/config', adminMiddleware, async (req, res) => {
  try {
    const config = await db('settings').where('key', 'naver_api').first();
    if (!config) return res.json({ clientId: '', clientSecret: '', storeUrl: '' });
    const data = JSON.parse(config.value);
    res.json({
      clientId: data.clientId || '',
      clientSecret: data.clientSecret ? '••••••••' : '',
      storeUrl: data.storeUrl || '',
      connected: !!data.clientId && !!data.clientSecret
    });
  } catch {
    res.json({ clientId: '', clientSecret: '', storeUrl: '', connected: false });
  }
});

router.post('/config', adminMiddleware, async (req, res) => {
  const { clientId, clientSecret, storeUrl } = req.body;
  try {
    const existing = await db('settings').where('key', 'naver_api').first();
    const value = JSON.stringify({ clientId, clientSecret, storeUrl });
    if (existing) {
      await db('settings').where('key', 'naver_api').update({ value });
    } else {
      await db('settings').insert({ key: 'naver_api', value });
    }
    res.json({ message: 'API 설정이 저장되었습니다' });
  } catch (e) {
    res.status(500).json({ error: '설정 저장 실패' });
  }
});

// 네이버 커머스 API 토큰 발급
async function getNaverToken() {
  const config = await db('settings').where('key', 'naver_api').first();
  if (!config) throw new Error('네이버 API 설정이 없습니다');
  const { clientId, clientSecret } = JSON.parse(config.value);
  if (!clientId || !clientSecret) throw new Error('API 키가 설정되지 않았습니다');

  const timestamp = Date.now();
  const password = `${clientId}_${timestamp}`;
  const signature = crypto.createHmac('sha256', clientSecret).update(password).digest('base64');
  const tokenUrl = 'https://api.commerce.naver.com/external/v1/oauth2/token';

  const params = new URLSearchParams({
    client_id: clientId,
    timestamp: timestamp.toString(),
    client_secret_sign: signature,
    grant_type: 'client_credentials',
    type: 'SELF'
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`토큰 발급 실패: ${err}`);
  }
  return response.json();
}

// API 연결 테스트
router.post('/test', adminMiddleware, async (req, res) => {
  try {
    const token = await getNaverToken();
    res.json({ success: true, message: 'API 연결 성공', token_type: token.token_type });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

// 상품 동기화 (오사카마켓 → 네이버)
router.post('/sync/products', adminMiddleware, async (req, res) => {
  try {
    const tokenData = await getNaverToken();
    const accessToken = tokenData.access_token;
    const products = await db('products').select('*');

    const results = { success: 0, fail: 0, errors: [] };

    for (const p of products) {
      try {
        // 네이버 커머스 API 상품 등록
        const productData = {
          originProduct: {
            statusType: 'SALE',
            saleType: 'NEW',
            leafCategoryId: '50000803', // 기본 카테고리 (의류)
            name: p.name,
            detailContent: p.description || '',
            images: {
              representativeImage: { url: p.image || '' }
            },
            salePrice: p.price,
            stockQuantity: p.stock,
            detailAttribute: {
              naverShoppingSearchInfo: {
                manufacturerName: '벨크로캣'
              }
            }
          },
          smartstoreChannelProduct: {
            channelProductName: p.name,
            storeKeepExclusiveProduct: false
          }
        };

        const response = await fetch('https://api.commerce.naver.com/external/v2/products', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(productData)
        });

        if (response.ok) {
          results.success++;
        } else {
          const err = await response.text();
          results.fail++;
          results.errors.push({ product: p.name, error: err });
        }
      } catch (e) {
        results.fail++;
        results.errors.push({ product: p.name, error: e.message });
      }
    }

    res.json(results);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 주문 조회 (네이버 → 오사카마켓)
router.get('/orders', adminMiddleware, async (req, res) => {
  try {
    const tokenData = await getNaverToken();
    const accessToken = tokenData.access_token;

    const response = await fetch('https://api.commerce.naver.com/external/v1/pay-order/seller/product-orders/last-changed-statuses', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(err);
    }

    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
