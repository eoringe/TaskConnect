// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const mpesaRouter = require('./mpesa/routes');

admin.initializeApp();

const app = express();
app.use(express.json());
app.use('/mpesa', mpesaRouter);

exports.api = functions.https.onRequest(app);


// import * as functions from 'firebase-functions';
// import * as admin from 'firebase-admin';
// const config = require('./runtimeconfig.json');  // adjust path if needed
// import axios from 'axios';

// admin.initializeApp();

// // helper to get Daraja access_token
// async function getDarajaToken() {
//   const creds = Buffer.from(`${config.consumer_key}:${config.consumer_secret}`).toString('base64');
//   const { data } = await axios.get(
//     config.sandbox
//       ? 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
//       : 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
//     { headers: { Authorization: `Basic ${creds}` } }
//   );
//   return data.access_token;
// }

// // STK push endpoint
// export const stkPush = functions.https.onRequest(async (req, res) => {
//   const { amount, phoneNumber, accountReference, transactionDesc } = req.body;
//   try {
//     const token = await getDarajaToken();
//     const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
//     const password = Buffer.from(
//       config.shortcode + config.passkey + timestamp
//     ).toString('base64');
//     const url = config.sandbox
//       ? 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
//       : 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

//     const { data } = await axios.post(url, {
//       BusinessShortCode: config.shortcode,
//       Password: password,
//       Timestamp: timestamp,
//       TransactionType: 'CustomerPayBillOnline',
//       Amount: amount,
//       PartyA: phoneNumber,
//       PartyB: config.shortcode,
//       PhoneNumber: phoneNumber,
//       CallBackURL: config.callback_url,
//       AccountReference: accountReference,
//       TransactionDesc: transactionDesc
//     }, {
//       headers: { Authorization: `Bearer ${token}` }
//     });

//     res.json({ checkoutRequestId: data.CheckoutRequestID });
//   } catch (e) {
//     console.error('STK Push error', e.response?.data || e);
//     res.status(500).send('Daraja STK failed');
//   }
// });

// // (Add your callback handler, B2C, etc., similarly importing `config`.)
