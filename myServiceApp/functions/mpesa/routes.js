const express = require('express');
const router = express.Router();
const { initiateStkPush, handleStkCallback, initiateB2C, handleB2cResult } = require('./escrowHandler');

router.post('/stkpush', initiateStkPush);
router.post('/callback', handleStkCallback);
router.post('/b2c', initiateB2C);
router.post('/b2c_result', handleB2cResult);

module.exports = router;