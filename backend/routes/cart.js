const express = require('express');
const router = express.Router();

const carts = {};

router.get('/:userId', (req, res) => {
  const cart = carts[req.params.userId] || [];
  res.json({ cart, total: cart.reduce((sum, item) => sum + item.price * item.qty, 0) });
});

router.post('/:userId/add', (req, res) => {
  const { productId, name, price, qty = 1 } = req.body;
  if (!carts[req.params.userId]) carts[req.params.userId] = [];
  const cart = carts[req.params.userId];
  const existing = cart.find(i => i.productId === productId);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ productId, name, price, qty });
  }
  res.json({ cart, total: cart.reduce((sum, item) => sum + item.price * item.qty, 0) });
});

router.delete('/:userId/remove/:productId', (req, res) => {
  if (carts[req.params.userId]) {
    carts[req.params.userId] = carts[req.params.userId].filter(i => i.productId !== parseInt(req.params.productId));
  }
  const cart = carts[req.params.userId] || [];
  res.json({ cart, total: cart.reduce((sum, item) => sum + item.price * item.qty, 0) });
});

module.exports = router;
