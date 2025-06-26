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
    console.log('Raw callback payload:', JSON.stringify(req.body, null, 2));

    // Acknowledge the request from Safaricom immediately to prevent timeouts
    res.sendStatus(200);

    // Use optional chaining for safety
    const stkCallback = req.body?.Body?.stkCallback;

    // Validate callback structure
    if (!stkCallback || !stkCallback.CheckoutRequestID) {
        console.error('Invalid STK callback format or missing CheckoutRequestID:', req.body);
        return;
    }

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

    console.log(`Processing callback for CheckoutRequestID: ${CheckoutRequestID}, ResultCode: ${ResultCode}`);

    try {
        const db = admin.firestore();
        const jobsRef = db.collection('jobs');
        const querySnapshot = await jobsRef.where('checkoutRequestId', '==', CheckoutRequestID).get();

        if (querySnapshot.empty) {
            console.error(`No job found with checkoutRequestId: ${CheckoutRequestID}. This may happen if the callback arrives before the initial STK push function completes its Firestore write. Or it could be an unknown ID.`);
            return;
        }

        const jobDoc = querySnapshot.docs[0];
        const jobId = jobDoc.id;

        console.log(`Found job: ${jobId}. Current status: ${jobDoc.data().status}`);

        if (ResultCode === 0) {
            // Payment was successful
            console.log(`Payment successful for job: ${jobId}`);

            // Safely extract receipt number and other metadata
            const metadata = CallbackMetadata?.Item || [];
            const mpesaReceiptNumber = metadata.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
            const amount = metadata.find(item => item.Name === 'Amount')?.Value;
            const phoneNumber = metadata.find(item => item.Name === 'PhoneNumber')?.Value;

            console.log(`Updating job ${jobId} with receipt: ${mpesaReceiptNumber}, amount: ${amount}`);

            await jobDoc.ref.update({
                status: 'in_escrow', // Update status to show payment is held
                paymentStatus: 'paid',
                mpesaReceipt: mpesaReceiptNumber || null,
                // Store the entire callback from Safaricom for auditing
                paymentDetails: { ...stkCallback },
            });
            console.log(`Successfully updated job ${jobId} to 'in_escrow'.`);
        } else {
            // Payment failed or was cancelled by the user
            console.log(`Payment failed for job: ${jobId}. Reason: ${ResultDesc}`);
            await jobDoc.ref.update({
                status: 'payment_failed',
                paymentStatus: 'failed',
                // Store the entire callback for debugging
                paymentDetails: { ...stkCallback },
            });
            console.log(`Successfully updated job ${jobId} to 'payment_failed'.`);
        }
    } catch (error) {
        console.error(`Error processing STK callback for ${CheckoutRequestID}:`, error);
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

        // Check if Safaricom accepted the request
        if (data.ResponseCode === '0') {
            // Update job status to 'processing_payment' immediately
            await admin.firestore().collection('jobs').doc(jobId).update({
                status: 'processing_payment',
                b2cConversationId: data.ConversationID,
                b2cOriginatorConversationId: data.OriginatorConversationID,
            });
            return res.status(200).json({ success: true, message: 'Payout to tasker initiated successfully.' });
        } else {
            // Safaricom rejected the request
            return res.status(400).json({ success: false, message: data.ResponseDescription || 'The B2C request was rejected by the provider.' });
        }
    } catch (err) {
        console.error('B2C failed', err.response?.data || err.message);
        // Add job status update here to reflect failure if needed
        return res.status(500).json({ success: false, message: 'B2C disbursement failed. Check function logs.' });
    }
};

/**
 * Handles the B2C Result callback from Safaricom.
 * This is where the final status of the payout is confirmed.
 */
exports.handleB2cResult = async (req, res) => {
    console.log('✅ B2C Result Callback received');
    console.log('Raw B2C result:', JSON.stringify(req.body, null, 2));
    res.sendStatus(200);

    const result = req.body?.Result;
    if (!result) {
        console.error('Invalid B2C result format. Missing "Result" object.');
        return;
    }

    // Destructure for easier access and logging
    const { ConversationID, ResultCode, ResultDesc, OriginatorConversationID } = result;
    console.log(`Processing B2C Result for ConversationID: ${ConversationID}, ResultCode: ${ResultCode}, Desc: ${ResultDesc}`);

    try {
        const db = admin.firestore();
        const jobsRef = db.collection('jobs');
        // Find the job using the ConversationID we saved earlier
        const q = jobsRef.where('b2cConversationId', '==', ConversationID);
        const querySnapshot = await q.get();

        if (querySnapshot.empty) {
            console.error(`No job found for B2C ConversationID: ${ConversationID}. This might also be identified by OriginatorID: ${OriginatorConversationID}`);
            return;
        }

        const jobDoc = querySnapshot.docs[0];
        const jobId = jobDoc.id;
        console.log(`Found job ${jobId} for B2C callback.`);

        const updatePayload = {
            b2cResult: { ...result } // Store the entire result for auditing
        };

        if (ResultCode === 0) {
            console.log(`B2C payout SUCCESSFUL for job ${jobId}.`);
            updatePayload.status = 'completed';
            updatePayload.paymentStatus = 'completed';
        } else {
            console.error(`B2C payout FAILED for job ${jobId}. Reason: ${ResultDesc}`);
            updatePayload.status = 'payout_failed';
        }

        console.log(`Updating job ${jobId} with payload:`, JSON.stringify(updatePayload, null, 2));
        await jobDoc.ref.update(updatePayload);
        console.log(`Job ${jobId} updated successfully with final B2C status.`);

    } catch (error) {
        console.error(`FATAL: Error processing B2C result for ${ConversationID}:`, error);
    }
};
