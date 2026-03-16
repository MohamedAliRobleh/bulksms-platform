const axios = require('axios');
const { Message, Campaign, TenantCredit, CreditTransaction, User, Tenant, sequelize } = require('../models');
const logger = require('./loggerService');
const emailService = require('./emailService');

const infobipClient = axios.create({
  baseURL: process.env.INFOBIP_BASE_URL,
  headers: {
    Authorization: `App ${process.env.INFOBIP_API_KEY}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30000,
});

const personalizeContent = (content, contact) => {
  return content
    .replace(/\{first_name\}/gi, contact.first_name || '')
    .replace(/\{last_name\}/gi, contact.last_name || '')
    .replace(/\{prenom\}/gi, contact.first_name || '')
    .replace(/\{nom\}/gi, contact.last_name || '')
    .replace(/\{phone\}/gi, contact.phone || '')
    .replace(/\{email\}/gi, contact.email || '');
};

exports.sendSingle = async (to, content, senderId) => {
  const response = await infobipClient.post('/sms/2/text/advanced', {
    messages: [{
      from: senderId || process.env.INFOBIP_DEFAULT_SENDER,
      destinations: [{ to }],
      text: content,
    }],
  });
  return response.data;
};

exports.sendBulk = async (campaign, contacts, tenantId) => {
  const BATCH_SIZE = 50;
  let sentCount = 0;
  let deliveredCount = 0;
  let failedCount = 0;

  // Create message records
  const messageRecords = contacts.map(contact => ({
    campaign_id: campaign.id,
    tenant_id: tenantId,
    contact_id: contact.id,
    phone: contact.phone,
    content: personalizeContent(campaign.content, contact),
    status: 'pending',
  }));

  await Message.bulkCreate(messageRecords, { ignoreDuplicates: true });

  // Process in batches
  for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
    const batch = contacts.slice(i, i + BATCH_SIZE);

    const destinations = batch.map(c => ({ to: c.phone }));
    const texts = batch.map(c => personalizeContent(campaign.content, c));

    try {
      // Check if all messages are personalized or use single text
      const allSame = texts.every(t => t === texts[0]);

      let response;
      if (allSame) {
        response = await infobipClient.post('/sms/2/text/advanced', {
          messages: [{
            from: campaign.sender_id,
            destinations,
            text: texts[0],
          }],
        });
      } else {
        // Individual messages for personalized content
        response = await infobipClient.post('/sms/2/text/advanced', {
          messages: batch.map((c, idx) => ({
            from: campaign.sender_id,
            destinations: [{ to: c.phone }],
            text: texts[idx],
          })),
        });
      }

      const results = response.data?.messages || [];

      for (let j = 0; j < batch.length; j++) {
        const result = results[j];
        const status = result?.status?.groupName === 'PENDING' || result?.status?.groupName === 'DELIVERED'
          ? 'sent' : 'failed';

        await Message.update({
          status,
          provider_message_id: result?.messageId,
          sent_at: new Date(),
        }, {
          where: { campaign_id: campaign.id, phone: batch[j].phone },
        });

        if (status === 'sent') sentCount++;
        else failedCount++;
      }
    } catch (err) {
      logger.error(`SMS batch ${i}-${i + BATCH_SIZE} failed`, { campaign: campaign.id, error: err.message });

      await Message.update(
        { status: 'failed', error_message: err.message },
        { where: { campaign_id: campaign.id, phone: { $in: batch.map(c => c.phone) } } }
      );
      failedCount += batch.length;
    }

    // Small delay between batches to respect rate limits
    if (i + BATCH_SIZE < contacts.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Update campaign stats
  const creditsUsed = sentCount;
  await Campaign.update({
    status: 'sent',
    sent_count: sentCount,
    failed_count: failedCount,
    credits_used: creditsUsed,
  }, { where: { id: campaign.id } });

  // Deduct credits
  if (creditsUsed > 0) {
    const wallet = await TenantCredit.findOne({ where: { tenant_id: tenantId } });
    if (wallet) {
      const newBalance = Math.max(0, wallet.balance - creditsUsed);
      await wallet.update({ balance: newBalance, total_used: wallet.total_used + creditsUsed });
      await CreditTransaction.create({
        tenant_id: tenantId,
        type: 'debit',
        amount: creditsUsed,
        balance_after: newBalance,
        description: `Campaign: ${campaign.name}`,
        campaign_id: campaign.id,
      });

      // Alerte solde faible
      const threshold = parseInt(process.env.LOW_BALANCE_THRESHOLD) || 100;
      if (newBalance <= threshold) {
        const tenant = await Tenant.findByPk(tenantId, { include: [{ model: User, as: 'users', where: { role: 'tenant_admin' }, required: false, limit: 1 }] });
        const adminUser = tenant?.users?.[0];
        if (adminUser) {
          emailService.sendLowBalanceAlert(adminUser.email, adminUser.first_name, {
            balance: newBalance,
            threshold,
            tenantName: tenant.name,
          }).catch(() => {});
        }
      }
    }
  }

  return { sentCount, failedCount, creditsUsed };
};

exports.getDeliveryReport = async (messageId) => {
  try {
    const response = await infobipClient.get(`/sms/1/reports?messageId=${messageId}`);
    return response.data?.results?.[0] || null;
  } catch (err) {
    logger.warn('Delivery report error', { messageId, error: err.message });
    return null;
  }
};
