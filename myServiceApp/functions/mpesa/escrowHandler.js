// functions/mpesa/escrowHandler.js
const admin = require('firebase-admin');
const axios = require('axios');
// WARNING: This is not the recommended way to handle secrets in production.
// This file should be in your .gitignore and NOT committed to version control.
const config = require('../runtimeconfig.json');

// Helper to get Daraja access_token
async function getDarajaToken() {
    if (!config || !config.consumer_key || !config.consumer_secret) {
        throw new Error('MPESA consumer_key or consumer_secret is not set in runtimeconfig.json.');
    }
    const creds = Buffer.from(`${config.consumer_key}:${config.consumer_secret}`).toString('base64');
    const authUrl = config.sandbox === 'true'
        ? 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
        : 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

    const { data } = await axios.get(authUrl, { headers: { Authorization: `Basic ${creds}` } });
    return data.access_token;
}

// 1️⃣ STK Push
exports.initiateStkPush = async (req, res) => {
    const { amount, phoneNumber, accountReference, transactionDesc } = req.body;

    if (!amount || !phoneNumber || !accountReference || !transactionDesc) {
        return res.status(400).send('Missing required parameters: amount, phoneNumber, accountReference, transactionDesc.');
    }

    try {
        const token = await getDarajaToken();
        const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
        const password = Buffer.from(config.shortcode + config.passkey + timestamp).toString('base64');
        const url = config.sandbox === 'true'
            ? 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
            : 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

        const { data } = await axios.post(url, {
            BusinessShortCode: config.shortcode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: amount,
            PartyA: phoneNumber,
            PartyB: config.shortcode,
            PhoneNumber: phoneNumber,
            CallBackURL: config.callback_url,
            AccountReference: accountReference,
            TransactionDesc: transactionDesc
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        return res.json({ checkoutRequestId: data.CheckoutRequestID });
    } catch (err) {
        console.error('STK Push failed', err.response?.data || err.message);
        return res.status(500).send('STK Push failed. Check function logs.');
    }
};

// 2️⃣ STK Callback
exports.handleStkCallback = async (req, res) => {
    console.log('🏦 STK Callback received');

    // Immediately acknowledge the request from Safaricom
    res.sendStatus(200);

    const callbackData = req.body;
    if (!callbackData.Body || !callbackData.Body.stkCallback) {
        console.error('Invalid STK callback format received.');
        return;
    }

    const stkCallback = callbackData.Body.stkCallback;
    const checkoutRequestId = stkCallback.CheckoutRequestID;
    const resultCode = stkCallback.ResultCode;

    console.log(`Processing callback for CheckoutRequestID: ${checkoutRequestId}, ResultCode: ${resultCode}`);

    try {
        const db = admin.firestore();
        const jobsRef = db.collection('jobs');
        const querySnapshot = await jobsRef.where('checkoutRequestId', '==', checkoutRequestId).get();

        if (querySnapshot.empty) {
            console.error(`No job found with checkoutRequestId: ${checkoutRequestId}`);
            return;
        }

        const jobDoc = querySnapshot.docs[0];
        const jobId = jobDoc.id;

        if (resultCode === 0) {
            console.log(`Payment successful for job: ${jobId}`);
            const metadata = stkCallback.CallbackMetadata.Item;
            const mpesaReceiptNumber = metadata.find(item => item.Name === 'MpesaReceiptNumber')?.Value;

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
            console.log(`Successfully updated job ${jobId} to 'in_escrow'.`);
        } else {
            console.log(`Payment failed for job: ${jobId}. Reason: ${stkCallback.ResultDesc}`);
            await jobDoc.ref.update({
                status: 'payment_failed',
                paymentStatus: 'failed',
                paymentDetails: {
                    ResultCode: resultCode,
                    ResultDesc: stkCallback.ResultDesc,
                },
            });
        }
    } catch (error) {
        console.error(`Error processing STK callback for ${checkoutRequestId}:`, error);
    }
};

// 3️⃣ B2C Disbursement
exports.initiateB2C = async (req, res) => {
    const { jobId, taskerPhone, amount } = req.body;
    if (!jobId || !taskerPhone || !amount) {
        return res.status(400).send('Missing required parameters: jobId, taskerPhone, amount.');
    }

    try {
        const token = await getDarajaToken();
        const url = config.sandbox === 'true'
            ? 'https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest'
            : 'https://api.safaricom.co.ke/mpesa/b2c/v1/paymentrequest';

        const payload = {
            InitiatorName: config.b2c_initiator,
            SecurityCredential: config.b2c_security_cred, // This needs to be generated and encrypted
            CommandID: 'BusinessPayment',
            Amount: amount,
            PartyA: config.shortcode,
            PartyB: taskerPhone,
            Remarks: `Payout for job ${jobId}`,
            QueueTimeOutURL: config.b2c_timeout_url,
            ResultURL: config.b2c_result_url,
            Occasion: jobId
        };

        const { data } = await axios.post(url, payload, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log(`B2C initiated for job ${jobId}. Response:`, data);
        return res.json(data);
    } catch (err) {
        console.error('B2C failed', err.response?.data || err.message);
        return res.status(500).send('B2C disbursement failed. Check function logs.');
    }
};
