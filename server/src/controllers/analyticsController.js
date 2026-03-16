const { Op, fn, col, literal } = require('sequelize');
const { Campaign, Message, Contact, TenantCredit, CreditTransaction, sequelize } = require('../models');

exports.getDashboard = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;

    const [
      totalContacts,
      totalCampaigns,
      sentCampaigns,
      wallet,
      totalMessages,
      deliveredMessages,
      recentCampaigns,
    ] = await Promise.all([
      Contact.count({ where: { tenant_id: tenantId } }),
      Campaign.count({ where: { tenant_id: tenantId } }),
      Campaign.count({ where: { tenant_id: tenantId, status: 'sent' } }),
      TenantCredit.findOne({ where: { tenant_id: tenantId } }),
      Message.count({ where: { tenant_id: tenantId } }),
      Message.count({ where: { tenant_id: tenantId, status: 'delivered' } }),
      Campaign.findAll({
        where: { tenant_id: tenantId },
        limit: 5,
        order: [['created_at', 'DESC']],
        attributes: ['id', 'name', 'status', 'total_recipients', 'sent_count', 'delivered_count', 'created_at'],
      }),
    ]);

    const deliveryRate = totalMessages > 0 ? Math.round((deliveredMessages / totalMessages) * 100) : 0;

    res.json({
      stats: {
        total_contacts: totalContacts,
        total_campaigns: totalCampaigns,
        sent_campaigns: sentCampaigns,
        sms_balance: wallet?.balance || 0,
        total_messages: totalMessages,
        delivered_messages: deliveredMessages,
        delivery_rate: deliveryRate,
      },
      recent_campaigns: recentCampaigns,
    });
  } catch (error) {
    next(error);
  }
};

exports.getCampaignStats = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const { days = 30 } = req.query;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Messages per day
    const dailyData = await Message.findAll({
      where: { tenant_id: tenantId, created_at: { [Op.gte]: since } },
      attributes: [
        [fn('DATE', col('created_at')), 'date'],
        [fn('COUNT', col('id')), 'total'],
        [fn('SUM', literal("CASE WHEN status = 'delivered' THEN 1 ELSE 0 END")), 'delivered'],
        [fn('SUM', literal("CASE WHEN status = 'failed' THEN 1 ELSE 0 END")), 'failed'],
      ],
      group: [fn('DATE', col('created_at'))],
      order: [[fn('DATE', col('created_at')), 'ASC']],
      raw: true,
    });

    // Status breakdown
    const statusBreakdown = await Message.findAll({
      where: { tenant_id: tenantId },
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true,
    });

    res.json({ daily: dailyData, status_breakdown: statusBreakdown });
  } catch (error) {
    next(error);
  }
};

exports.getCreditHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await CreditTransaction.findAndCountAll({
      where: { tenant_id: req.tenantId },
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']],
    });

    res.json({ transactions: rows, total: count });
  } catch (error) {
    next(error);
  }
};
