const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Waafi Pay Merchant API
// Documentation: https://developer.waafipay.com
const WAAFI_API_URL = process.env.WAAFI_API_URL || 'https://api.waafipay.net/asm';

/**
 * Initie un paiement Waafi Pay (debit push vers le client)
 * Le client reçoit une notification sur son téléphone pour confirmer
 */
exports.initiatePayment = async ({ phone, amount, description, referenceId }) => {
  const transactionId = `BULKSMS-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;

  const payload = {
    schemaVersion: '1.0',
    requestId: uuidv4(),
    timestamp: new Date().toISOString(),
    channelName: 'WEB',
    serviceName: 'API_PURCHASE',
    serviceParams: {
      merchantUid: process.env.WAAFI_MERCHANT_UID,
      apiUserId: process.env.WAAFI_API_USER_ID,
      apiKey: process.env.WAAFI_API_KEY,
      paymentMethod: 'MWALLET_ACCOUNT',
      payerInfo: {
        accountNo: phone,  // ex: 25377XXXXXXX
      },
      transactionInfo: {
        referenceId: referenceId || transactionId,
        invoiceId: transactionId,
        amount: String(amount),
        currency: 'SLSH', // Franc Djiboutien = SLSH dans Waafi
        description: description || 'Achat de crédits SMS BulkSMS',
      },
    },
  };

  const response = await axios.post(WAAFI_API_URL, payload, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000,
  });

  return {
    transactionId,
    waafiResponse: response.data,
    success: response.data?.params?.state === 'APPROVED',
    responseCode: response.data?.params?.responseCode,
    waafiTransactionId: response.data?.params?.transactionId,
  };
};

/**
 * Vérifie le statut d'un paiement Waafi
 */
exports.checkPaymentStatus = async (transactionId) => {
  const payload = {
    schemaVersion: '1.0',
    requestId: uuidv4(),
    timestamp: new Date().toISOString(),
    channelName: 'WEB',
    serviceName: 'API_TRANSACTION_INQUIRY',
    serviceParams: {
      merchantUid: process.env.WAAFI_MERCHANT_UID,
      apiUserId: process.env.WAAFI_API_USER_ID,
      apiKey: process.env.WAAFI_API_KEY,
      transactionId,
    },
  };

  const response = await axios.post(WAAFI_API_URL, payload, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
  });

  return {
    success: response.data?.params?.state === 'APPROVED',
    state: response.data?.params?.state,
    waafiResponse: response.data,
  };
};
