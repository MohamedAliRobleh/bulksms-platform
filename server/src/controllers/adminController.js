const { Op } = require('sequelize');
const { Tenant, User, TenantCredit, CreditTransaction, Package, SenderID, sequelize } = require('../models');
const emailService = require('../services/emailService');
const crypto = require('crypto');

// ─── TENANTS ───────────────────────────────────────────────────────────────
exports.getTenants = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, is_active } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (is_active !== undefined) where.is_active = is_active === 'true';

    const { count, rows } = await Tenant.findAndCountAll({
      where,
      include: [{ model: TenantCredit, as: 'credit' }],
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']],
    });

    res.json({
      tenants: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    next(error);
  }
};

exports.getTenant = async (req, res, next) => {
  try {
    const tenant = await Tenant.findByPk(req.params.id, {
      include: [
        { model: TenantCredit, as: 'credit' },
        { model: User, as: 'users', attributes: ['id', 'first_name', 'last_name', 'email', 'role', 'is_active', 'last_login'] },
        { model: SenderID, as: 'senderIds' },
      ],
    });

    if (!tenant) return res.status(404).json({ error: 'Client not found' });
    res.json(tenant);
  } catch (error) {
    next(error);
  }
};

exports.createTenant = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const {
      name, email, phone, primary_color,
      admin_first_name, admin_last_name, admin_email,
      sender_name, initial_credits, notes,
    } = req.body;

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const tenant = await Tenant.create({
      name, email, phone, slug, primary_color, notes,
    }, { transaction: t });

    // Wallet
    await TenantCredit.create({ tenant_id: tenant.id }, { transaction: t });

    // Default sender ID
    if (sender_name) {
      await SenderID.create({
        tenant_id: tenant.id,
        name: sender_name,
        is_default: true,
      }, { transaction: t });
    }

    // Initial credits
    if (initial_credits && initial_credits > 0) {
      await TenantCredit.update(
        { balance: initial_credits, total_purchased: initial_credits },
        { where: { tenant_id: tenant.id }, transaction: t }
      );
      await CreditTransaction.create({
        tenant_id: tenant.id,
        type: 'credit',
        amount: initial_credits,
        balance_after: initial_credits,
        description: 'Initial credits allocation',
        created_by: req.user.id,
      }, { transaction: t });
    }

    // Admin user
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const adminUser = await User.create({
      tenant_id: tenant.id,
      first_name: admin_first_name,
      last_name: admin_last_name,
      email: admin_email?.toLowerCase(),
      password: tempPassword,
      role: 'tenant_admin',
    }, { transaction: t });

    await t.commit();

    // Send welcome email
    try {
      await emailService.sendWelcome(admin_email, admin_first_name, {
        platform_url: process.env.CLIENT_URL,
        email: admin_email,
        password: tempPassword,
        tenant_name: name,
      });
    } catch (emailErr) {
      console.error('Welcome email failed:', emailErr.message);
    }

    const result = await Tenant.findByPk(tenant.id, {
      include: [{ model: TenantCredit, as: 'credit' }],
    });

    res.status(201).json(result);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

exports.updateTenant = async (req, res, next) => {
  try {
    const tenant = await Tenant.findByPk(req.params.id);
    if (!tenant) return res.status(404).json({ error: 'Client not found' });

    const { name, email, phone, primary_color, is_active, notes } = req.body;
    await tenant.update({ name, email, phone, primary_color, is_active, notes });

    res.json(tenant);
  } catch (error) {
    next(error);
  }
};

exports.deleteTenant = async (req, res, next) => {
  try {
    const tenant = await Tenant.findByPk(req.params.id);
    if (!tenant) return res.status(404).json({ error: 'Client not found' });

    await tenant.destroy();
    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ─── CREDITS ───────────────────────────────────────────────────────────────
exports.addCredits = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { tenant_id, amount, description, package_id } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }

    const wallet = await TenantCredit.findOne({ where: { tenant_id }, transaction: t });
    if (!wallet) return res.status(404).json({ error: 'Tenant wallet not found' });

    const newBalance = wallet.balance + parseInt(amount);
    await wallet.update({
      balance: newBalance,
      total_purchased: wallet.total_purchased + parseInt(amount),
    }, { transaction: t });

    await CreditTransaction.create({
      tenant_id,
      type: 'credit',
      amount: parseInt(amount),
      balance_after: newBalance,
      description: description || `Manual credit by admin`,
      package_id: package_id || null,
      created_by: req.user.id,
    }, { transaction: t });

    await t.commit();
    res.json({ wallet: await TenantCredit.findOne({ where: { tenant_id } }) });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

exports.getCreditTransactions = async (req, res, next) => {
  try {
    const { tenant_id } = req.params;
    const { page = 1, limit = 30 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await CreditTransaction.findAndCountAll({
      where: { tenant_id },
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']],
    });

    res.json({ transactions: rows, total: count });
  } catch (error) {
    next(error);
  }
};

// ─── PACKAGES ─────────────────────────────────────────────────────────────
exports.getPackages = async (req, res, next) => {
  try {
    const packages = await Package.findAll({ order: [['sort_order', 'ASC'], ['sms_count', 'ASC']] });
    res.json(packages);
  } catch (error) {
    next(error);
  }
};

exports.createPackage = async (req, res, next) => {
  try {
    const { name, description, sms_count, price, currency, validity_days, is_featured, sort_order } = req.body;
    const pkg = await Package.create({ name, description, sms_count, price, currency, validity_days, is_featured, sort_order });
    res.status(201).json(pkg);
  } catch (error) {
    next(error);
  }
};

exports.updatePackage = async (req, res, next) => {
  try {
    const pkg = await Package.findByPk(req.params.id);
    if (!pkg) return res.status(404).json({ error: 'Package not found' });
    await pkg.update(req.body);
    res.json(pkg);
  } catch (error) {
    next(error);
  }
};

exports.deletePackage = async (req, res, next) => {
  try {
    const pkg = await Package.findByPk(req.params.id);
    if (!pkg) return res.status(404).json({ error: 'Package not found' });
    await pkg.destroy();
    res.json({ message: 'Package deleted' });
  } catch (error) {
    next(error);
  }
};

// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────
exports.getDashboardStats = async (req, res, next) => {
  try {
    const { Campaign, Message, Contact, Payment } = require('../models');

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalTenants, activeTenants, totalMessages, totalContacts, recentMessages, pendingPaymentsCount] = await Promise.all([
      Tenant.count(),
      Tenant.count({ where: { is_active: true } }),
      Message.count(),
      Contact.count(),
      Message.count({ where: { created_at: { [Op.gte]: sevenDaysAgo } } }),
      Payment.count({ where: { status: 'pending' } }),
    ]);

    // Credits overview
    const creditsResult = await TenantCredit.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('balance')), 'total_balance'],
        [sequelize.fn('SUM', sequelize.col('total_used')), 'total_used'],
        [sequelize.fn('SUM', sequelize.col('total_purchased')), 'total_purchased'],
      ],
      raw: true,
    });

    // Revenus (paiements complétés 30 derniers jours)
    const revenueResult = await Payment.findAll({
      where: { status: 'completed', created_at: { [Op.gte]: thirtyDaysAgo } },
      attributes: [[sequelize.fn('SUM', sequelize.col('amount')), 'total']],
      raw: true,
    });

    // Paiements en attente avec détails
    const pendingPayments = await Payment.findAll({
      where: { status: 'pending' },
      include: [
        { model: Tenant, as: 'tenant', attributes: ['name', 'email'] },
        { model: User, as: 'user', attributes: ['first_name', 'last_name', 'email'] },
        { model: Package, as: 'package', attributes: ['name', 'sms_count'] },
      ],
      order: [['created_at', 'DESC']],
      limit: 10,
    });

    // Derniers paiements complétés
    const recentPayments = await Payment.findAll({
      where: { status: 'completed', created_at: { [Op.gte]: thirtyDaysAgo } },
      include: [
        { model: Tenant, as: 'tenant', attributes: ['name'] },
        { model: Package, as: 'package', attributes: ['name', 'sms_count'] },
      ],
      order: [['completed_at', 'DESC']],
      limit: 5,
    });

    res.json({
      total_tenants: totalTenants,
      active_tenants: activeTenants,
      total_messages: totalMessages,
      total_contacts: totalContacts,
      recent_messages: recentMessages,
      credits: creditsResult[0] || {},
      pending_payments_count: pendingPaymentsCount,
      pending_payments: pendingPayments,
      recent_payments: recentPayments,
      revenue_30d: parseFloat(revenueResult[0]?.total || 0),
    });
  } catch (error) {
    next(error);
  }
};
