const admin = require('firebase-admin');
const db = admin.firestore();
const { stkPush, b2c } = require('./daraja');

// STK Push initiation
exports.initiateStkPush = async (req, res) => {
  try {
    const { amount, phoneNumber, accountReference, transactionDesc } = req.body;
    const stkRes = await stkPush({ amount, phoneNumber, accountReference, transactionDesc });
    res.json({ checkoutRequestId: stkRes.CheckoutRequestID });
  } catch (err) {
    console.error(err.response?.data || err);
    res.status(500).json({ error: 'STK Push failed' });
  }
};

// Daraja callback handler
exports.handleStkCallback = async (req, res) => {
  const { Body } = req.body;
  const result = Body.stkCallback.ResultCode === 0 ? 'in_escrow' : 'failed';
  const jobId = Body.stkCallback.CallbackMetadata?.Item?.find(i => i.Name === 'AccountReference')?.Value;
  if (!jobId) return res.sendStatus(400);
  await db.collection('jobs').doc(jobId).update({ status: result });
  res.sendStatus(200);
};

// B2C disbursement
exports.initiateB2C = async (req, res) => {
  try {
    const { jobId, taskerPhone, amount } = req.body;
    const b2cRes = await b2c({ amount, taskerPhone, jobId });
    await db.collection('jobs').doc(jobId).update({
      status: 'paid',
      disbursementId: b2cRes.ConversationID,
    });
    res.json({ disbursementId: b2cRes.ConversationID });
  } catch (err) {
    console.error(err.response?.data || err);
    res.status(500).json({ error: 'B2C payment failed' });
  }
};