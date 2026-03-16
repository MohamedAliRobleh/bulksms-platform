const { Op } = require('sequelize');
const { Campaign, Message, Contact, ContactGroup, TenantCredit, CreditTransaction, sequelize } = require('../models');
const smsService = require('../services/smsService');

exports.getCampaigns = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;
    const where = { tenant_id: req.tenantId };

    if (status) where.status = status;

    const { count, rows } = await Campaign.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']],
    });

    res.json({ campaigns: rows, total: count, page: parseInt(page), totalPages: Math.ceil(count / limit) });
  } catch (error) {
    next(error);
  }
};

exports.getCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findOne({
      where: { id: req.params.id, tenant_id: req.tenantId },
    });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    res.json(campaign);
  } catch (error) {
    next(error);
  }
};

exports.createCampaign = async (req, res, next) => {
  try {
    const { name, sender_id, content, template_id, target_type, target_ids, scheduled_at } = req.body;

    // Count recipients
    let recipients = [];

    if (target_type === 'all') {
      recipients = await Contact.findAll({
        where: { tenant_id: req.tenantId, is_subscribed: true },
        attributes: ['id', 'phone', 'first_name', 'last_name'],
      });
    } else if (target_type === 'group') {
      const groupIds = Array.isArray(target_ids) ? target_ids : [target_ids];
      recipients = await Contact.findAll({
        where: { tenant_id: req.tenantId, group_id: { [Op.in]: groupIds }, is_subscribed: true },
        attributes: ['id', 'phone', 'first_name', 'last_name'],
      });
    } else if (target_type === 'custom') {
      recipients = await Contact.findAll({
        where: { tenant_id: req.tenantId, id: { [Op.in]: target_ids }, is_subscribed: true },
        attributes: ['id', 'phone', 'first_name', 'last_name'],
      });
    }

    if (recipients.length === 0) {
      return res.status(400).json({ error: 'No valid recipients found' });
    }

    // Check credits
    const wallet = await TenantCredit.findOne({ where: { tenant_id: req.tenantId } });
    if (!wallet || wallet.balance < recipients.length) {
      return res.status(400).json({
        error: `Insufficient credits. Need ${recipients.length}, have ${wallet?.balance || 0}`,
      });
    }

    const status = scheduled_at ? 'scheduled' : 'draft';

    const campaign = await Campaign.create({
      tenant_id: req.tenantId,
      name, sender_id, content, template_id,
      target_type, target_ids: target_ids || [],
      scheduled_at: scheduled_at || null,
      status,
      total_recipients: recipients.length,
    });

    res.status(201).json({ campaign, recipients_count: recipients.length });
  } catch (error) {
    next(error);
  }
};

exports.sendCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findOne({
      where: { id: req.params.id, tenant_id: req.tenantId },
    });

    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    if (['sending', 'sent'].includes(campaign.status)) {
      return res.status(400).json({ error: 'Campaign already sent or sending' });
    }

    // Get recipients
    let contacts = [];
    if (campaign.target_type === 'all') {
      contacts = await Contact.findAll({ where: { tenant_id: req.tenantId, is_subscribed: true } });
    } else if (campaign.target_type === 'group') {
      contacts = await Contact.findAll({
        where: { tenant_id: req.tenantId, group_id: { [Op.in]: campaign.target_ids }, is_subscribed: true },
      });
    } else {
      contacts = await Contact.findAll({
        where: { tenant_id: req.tenantId, id: { [Op.in]: campaign.target_ids }, is_subscribed: true },
      });
    }

    if (contacts.length === 0) {
      return res.status(400).json({ error: 'No recipients found' });
    }

    // Check credits
    const wallet = await TenantCredit.findOne({ where: { tenant_id: req.tenantId } });
    if (!wallet || wallet.balance < contacts.length) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }

    await campaign.update({ status: 'sending', sent_at: new Date(), total_recipients: contacts.length });

    // Send async
    smsService.sendBulk(campaign, contacts, req.tenantId).catch(err => {
      console.error('Bulk send error:', err);
    });

    res.json({ message: 'Campaign is being sent', recipients: contacts.length });
  } catch (error) {
    next(error);
  }
};

exports.duplicateCampaign = async (req, res, next) => {
  try {
    const original = await Campaign.findOne({ where: { id: req.params.id, tenant_id: req.tenantId } });
    if (!original) return res.status(404).json({ error: 'Campaign not found' });

    const copy = await Campaign.create({
      tenant_id: req.tenantId,
      name: `${original.name} (Copy)`,
      sender_id: original.sender_id,
      content: original.content,
      template_id: original.template_id,
      target_type: original.target_type,
      target_ids: original.target_ids,
      status: 'draft',
    });

    res.status(201).json(copy);
  } catch (error) {
    next(error);
  }
};

exports.deleteCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findOne({ where: { id: req.params.id, tenant_id: req.tenantId } });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    if (campaign.status === 'sending') {
      return res.status(400).json({ error: 'Cannot delete a campaign that is being sent' });
    }
    await campaign.destroy();
    res.json({ message: 'Campaign deleted' });
  } catch (error) {
    next(error);
  }
};

exports.getCampaignMessages = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const offset = (page - 1) * limit;
    const where = { campaign_id: req.params.id, tenant_id: req.tenantId };
    if (status) where.status = status;

    const { count, rows } = await Message.findAndCountAll({
      where, limit: parseInt(limit), offset,
      order: [['created_at', 'DESC']],
    });

    res.json({ messages: rows, total: count });
  } catch (error) {
    next(error);
  }
};
