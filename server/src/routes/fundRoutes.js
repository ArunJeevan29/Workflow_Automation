// server/routes/fundRoutes.js
const express = require('express');
const router = express.Router();
const fundController = require('../controllers/fundController');

router.get('/', fundController.getWalletData);
router.post('/topup', fundController.topUpWallet);
router.post('/withdraw', fundController.withdrawWallet);

module.exports = router;