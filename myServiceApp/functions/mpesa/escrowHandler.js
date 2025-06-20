// functions/mpesa/escrowHandler.js
const admin = require('firebase-admin');
const axios = require('axios');
const config = require('../runtimeconfig.json');

// 1️⃣ STK Push
exports.initiateStkPush = async (req, res) => {
  const { amount, phoneNumber, accountReference, transactionDesc } = req.body;
  try {
    // getDarajaToken()… build password… call /stkpush/v1/processrequest…
    const token = await getDarajaToken();
    const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0,14);
    const password  = Buffer.from(config.shortcode + config.passkey + timestamp).toString('base64');
    const url = config.sandbox
      ? 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
      : 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

    const { data } = await axios.post(url, {
      BusinessShortCode: config.shortcode,
      Password:          password,
      Timestamp:         timestamp,
      TransactionType:   'CustomerPayBillOnline',
      Amount:            amount,
      PartyA:            phoneNumber,
      PartyB:            config.shortcode,
      PhoneNumber:       phoneNumber,
      CallBackURL:       config.callback_url,
      AccountReference:  accountReference,
      TransactionDesc:   transactionDesc
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return res.json({ checkoutRequestId: data.CheckoutRequestID });
  } catch (err) {
    console.error('STK Push failed', err.response?.data || err);
    return res.status(500).send('STK Push failed');
  }
};

// 2️⃣ STK Callback
exports.handleStkCallback = async (req, res) => {
  const callbackData = req.body;  
  console.log('🏦 STK Callback:', callbackData);
  // e.g. update your Firestore job doc:
  // const jobId = callbackData.Body.stkCallback.CallbackMetadata…;
  // await admin.firestore().collection('jobs').doc(jobId).update({ status: 'in_escrow' });
  return res.sendStatus(200);
};

// 3️⃣ B2C Disbursement
exports.initiateB2C = async (req, res) => {
  const { jobId, taskerPhone, amount } = req.body;
  try {
    const token = await getDarajaToken();
    const url = config.sandbox
      ? 'https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest'
      : 'https://api.safaricom.co.ke/mpesa/b2c/v1/paymentrequest';

    const payload = {
      InitiatorName:      config.b2c_initiator,
      SecurityCredential: config.b2c_security_cred,
      CommandID:          'BusinessPayment',
      Amount:             amount,
      PartyA:             config.shortcode,
      PartyB:             taskerPhone,
      Remarks:            'Payout to Tasker',
      QueueTimeOutURL:    config.b2c_timeout_url,
      ResultURL:          config.b2c_result_url,
      Occasion:           jobId
    };

    const { data } = await axios.post(url, payload, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return res.json(data);
  } catch (err) {
    console.error('B2C failed', err.response?.data || err);
    return res.status(500).send('B2C failed');
  }
};

// don’t forget to implement getDarajaToken in this file or import it!
async function getDarajaToken() {
  const creds = Buffer.from(`${config.consumer_key}:${config.consumer_secret}`).toString('base64');
  const authUrl = config.sandbox
    ? 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
    : 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
  const { data } = await axios.get(authUrl, { headers: { Authorization: `Basic ${creds}` }});
  return data.access_token;
}
