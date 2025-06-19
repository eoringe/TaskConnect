const express = require('express');
const router = express.Router();
const { initiateStkPush, handleStkCallback, initiateB2C } = require('./escrowHandler');

router.post('/stkpush', initiateStkPush);
router.post('/callback', handleStkCallback);
router.post('/b2c', initiateB2C);

module.exports = router;