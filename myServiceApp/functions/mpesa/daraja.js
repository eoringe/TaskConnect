const axios = require('axios');
const admin = require('firebase-admin');


exports.getDarajaToken = async () => {
  const { data } = await axios.get(
    'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    {
      auth: {
        username: process.env.MPESA_CONSUMER_KEY,
        password: process.env.MPESA_CONSUMER_SECRET,
      },
    }
  );
  return data.access_token;
};

exports.stkPush = async ({ amount, phoneNumber, accountReference, transactionDesc }) => {
  const token = await exports.getDarajaToken();
  const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  const password = Buffer.from(
    process.env.MPESA_SHORTCODE + process.env.MPESA_PASSKEY + timestamp
  ).toString('base64');
  const { data } = await axios.post(
    'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
    {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: phoneNumber,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: accountReference,
      TransactionDesc: transactionDesc,
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
};

exports.b2c = async ({ amount, taskerPhone, jobId }) => {
  const token = await exports.getDarajaToken();
  const { data } = await axios.post(
    'https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest',
    {
      InitiatorName: process.env.MPESA_INITIATOR,
      SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
      CommandID: 'BusinessPayment',
      Amount: amount,
      PartyA: process.env.MPESA_SHORTCODE,
      PartyB: taskerPhone,
      Remarks: jobId,
      QueueTimeOutURL: process.env.MPESA_B2C_TIMEOUT_URL,
      ResultURL: process.env.MPESA_B2C_RESULT_URL,
      Occasion: 'Service Payment',
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
};

exports.handleStkCallback = async (req, res) => {
  // Log the full raw callback payload
  console.log('Raw callback payload:', JSON.stringify(req.body, null, 2));
  // Acknowledge Safaricom immediately
  res.sendStatus(200);

  // Defensive: check structure
  const stkCallback = req.body?.Body?.stkCallback;
  if (!stkCallback) {
    console.error('Invalid STK callback format:', req.body);
    return;
  }
  const checkoutRequestId = stkCallback.CheckoutRequestID;
  const resultCode = stkCallback.ResultCode;

  // Find job by checkoutRequestId
  const db = admin.firestore();
  const jobsRef = db.collection('jobs');
  const querySnapshot = await jobsRef.where('checkoutRequestId', '==', checkoutRequestId).get();

  if (querySnapshot.empty) {
    console.error('No job found for checkoutRequestId:', checkoutRequestId);
    return;
  }
  const jobDoc = querySnapshot.docs[0];

  // Extract mpesaReceiptNumber if available
  let mpesaReceiptNumber = null;
  if (stkCallback.CallbackMetadata && Array.isArray(stkCallback.CallbackMetadata.Item)) {
    const receiptItem = stkCallback.CallbackMetadata.Item.find(item => item.Name === 'MpesaReceiptNumber');
    mpesaReceiptNumber = receiptItem ? receiptItem.Value : null;
  }

  if (resultCode === 0) {
    // Payment successful
    await jobDoc.ref.update({
      status: 'in_escrow',
      paymentStatus: 'paid',
      mpesaReceipt: mpesaReceiptNumber,
      paymentDetails: {
        ...stkCallback.CallbackMetadata,
        ResultCode: resultCode,
        ResultDesc: stkCallback.ResultDesc,
      },
    });
  } else {
    // Payment failed
    await jobDoc.ref.update({
      status: 'payment_failed',
      paymentStatus: 'failed',
      paymentDetails: {
        ResultCode: resultCode,
        ResultDesc: stkCallback.ResultDesc,
      },
    });
  }
};