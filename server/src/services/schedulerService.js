const cron = require('node-cron');
const { Op } = require('sequelize');

exports.init = () => {
  // Check for scheduled campaigns every minute
  cron.schedule('* * * * *', async () => {
    try {
      const { Campaign, Contact } = require('../models');
      const smsService = require('./smsService');

      const now = new Date();
      const campaigns = await Campaign.findAll({
        where: {
          status: 'scheduled',
          scheduled_at: { [Op.lte]: now },
        },
      });

      for (const campaign of campaigns) {
        console.log(`[Scheduler] Sending campaign: ${campaign.name}`);

        let contacts = [];
        if (campaign.target_type === 'all') {
          contacts = await Contact.findAll({ where: { tenant_id: campaign.tenant_id, is_subscribed: true } });
        } else if (campaign.target_type === 'group') {
          contacts = await Contact.findAll({
            where: { tenant_id: campaign.tenant_id, group_id: { [Op.in]: campaign.target_ids }, is_subscribed: true },
          });
        } else {
          contacts = await Contact.findAll({
            where: { tenant_id: campaign.tenant_id, id: { [Op.in]: campaign.target_ids }, is_subscribed: true },
          });
        }

        if (contacts.length > 0) {
          await campaign.update({ status: 'sending', sent_at: new Date() });
          smsService.sendBulk(campaign, contacts, campaign.tenant_id).catch(err => {
            console.error(`[Scheduler] Campaign ${campaign.id} failed:`, err.message);
          });
        } else {
          await campaign.update({ status: 'failed' });
        }
      }
    } catch (err) {
      console.error('[Scheduler] Error:', err.message);
    }
  });

  console.log('[Scheduler] Campaign scheduler running');
};
