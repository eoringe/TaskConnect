const functions = require('firebase-functions');
const express = require('express');
const admin = require('firebase-admin');
admin.initializeApp();

const mpesaRoutes = require('./mpesa/routes');

const app = express();
app.use(express.json());
app.use('/mpesa', mpesaRoutes);

exports.api = functions.https.onRequest(app);