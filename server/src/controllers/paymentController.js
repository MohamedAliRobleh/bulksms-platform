const { Payment, Package, TenantCredit, CreditTransaction, Tenant, User, sequelize } = require('../models');
const waafiService = require('../services/waafiService');
const emailService = require('../services/emailService');
const invoiceService = require('../services/invoiceService');
const platformBankService = require('../services/platformBankService');

// ─── Client : obtenir les packages disponibles ────────────
exports.getPackages = async (req, res, next) => {
  try {
    const packages = await Package.findAll({
      where: { is_active: true },
      order: [['sort_order', 'ASC'], ['sms_count', 'ASC']],
    });
    res.json(packages);
  } catch (error) {
    next(error);
  }
};

// ─── Client : initier un paiement ─────────────────────────
exports.initiatePayment = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { package_id, phone_number } = req.body;

    if (!package_id || !phone_number) {
      return res.status(400).json({ error: 'Package et numéro de téléphone requis' });
    }

    const pkg = await Package.findByPk(package_id);
    if (!pkg || !pkg.is_active) {
      return res.status(404).json({ error: 'Package non trouvé' });
    }

    // Créer le paiement en statut pending
    const payment = await Payment.create({
      tenant_id: req.tenantId,
      package_id,
      user_id: req.user.id,
      amount: pkg.price,
      currency: pkg.currency,
      sms_count: pkg.sms_count,
      payment_method: 'waafi',
      phone_number,
      status: 'pending',
    }, { transaction: t });

    // Initier le paiement Waafi
    let waafiResult;
    if (process.env.WAAFI_TEST_MODE === 'true') {
      // Mode test : simuler un paiement réussi sans appel API
      waafiResult = {
        success: true,
        transactionId: `TEST-${Date.now()}`,
        waafiTransactionId: `WAAFI-TEST-${Date.now()}`,
        waafiResponse: { test: true },
      };
    } else {
      try {
        waafiResult = await waafiService.initiatePayment({
          phone: phone_number,
          amount: pkg.price,
          description: `BulkSMS - ${pkg.name} (${pkg.sms_count} SMS)`,
          referenceId: payment.id,
        });
      } catch (waafiErr) {
        await t.rollback();
        return res.status(502).json({
          error: 'Erreur de connexion avec Waafi Pay. Réessayez.',
          details: waafiErr.message,
        });
      }
    }

    // Mettre à jour le paiement avec la réponse Waafi
    await payment.update({
      waafi_transaction_id: waafiResult.transactionId,
      waafi_reference_id: waafiResult.waafiTransactionId,
      waafi_response: waafiResult.waafiResponse,
      status: waafiResult.success ? 'completed' : 'pending',
      completed_at: waafiResult.success ? new Date() : null,
    }, { transaction: t });

    // Si paiement approuvé → créditer le wallet
    if (waafiResult.success) {
      await creditWallet(req.tenantId, pkg.sms_count, pkg.name, payment.id, req.user.id, t, req.user.tenant?.name);
    }

    await t.commit();

    // Email de confirmation (non bloquant)
    if (waafiResult.success) {
      emailService.sendPaymentConfirmation(req.user.email, req.user.first_name, {
        packageName: pkg.name,
        smsCount: pkg.sms_count,
        amount: pkg.price,
        currency: pkg.currency,
        paymentId: payment.id,
        date: new Date(),
      }).catch(() => {});
    }

    res.json({
      payment_id: payment.id,
      status: waafiResult.success ? 'completed' : 'pending',
      message: waafiResult.success
        ? `Paiement confirmé ! ${pkg.sms_count} crédits ajoutés à votre compte.`
        : 'Paiement initié. Confirmez sur votre téléphone Waafi.',
      sms_count: pkg.sms_count,
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// ─── Client : vérifier statut d'un paiement ───────────────
exports.checkPayment = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const payment = await Payment.findOne({
      where: { id: req.params.id, tenant_id: req.tenantId },
      include: [{ model: Package, as: 'package' }],
    });

    if (!payment) return res.status(404).json({ error: 'Paiement non trouvé' });

    if (payment.status === 'completed') {
      await t.rollback();
      return res.json({ status: 'completed', message: 'Paiement déjà traité' });
    }

    // Vérifier statut chez Waafi
    let statusResult;
    try {
      statusResult = await waafiService.checkPaymentStatus(payment.waafi_transaction_id);
    } catch {
      await t.rollback();
      return res.json({ status: payment.status });
    }

    if (statusResult.success && payment.status !== 'completed') {
      await payment.update({
        status: 'completed',
        completed_at: new Date(),
        waafi_response: statusResult.waafiResponse,
      }, { transaction: t });

      await creditWallet(req.tenantId, payment.sms_count, payment.package?.name, payment.id, payment.user_id, t, req.user.tenant?.name);
      await t.commit();

      emailService.sendPaymentConfirmation(req.user.email, req.user.first_name, {
        packageName: payment.package?.name || 'Package',
        smsCount: payment.sms_count,
        amount: payment.amount,
        currency: payment.currency,
        paymentId: payment.id,
        date: new Date(),
      }).catch(() => {});

      return res.json({
        status: 'completed',
        message: `${payment.sms_count} crédits ajoutés à votre compte !`,
      });
    }

    await t.rollback();
    res.json({ status: payment.status });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// ─── Client : historique des paiements ────────────────────
exports.getPaymentHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Payment.findAndCountAll({
      where: { tenant_id: req.tenantId },
      include: [{ model: Package, as: 'package', attributes: ['name', 'sms_count'] }],
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']],
    });

    res.json({ payments: rows, total: count });
  } catch (error) {
    next(error);
  }
};

// ─── Admin : tous les paiements ────────────────────────────
exports.getAllPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 30, status } = req.query;
    const offset = (page - 1) * limit;
    const where = status ? { status } : {};

    const { count, rows } = await Payment.findAndCountAll({
      where,
      include: [
        { model: Tenant, as: 'tenant', attributes: ['name', 'email'] },
        { model: Package, as: 'package', attributes: ['name', 'sms_count'] },
        { model: User, as: 'user', attributes: ['first_name', 'last_name', 'email'] },
      ],
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']],
    });

    res.json({ payments: rows, total: count });
  } catch (error) {
    next(error);
  }
};

// ─── Admin : valider manuellement un paiement ─────────────
exports.approvePayment = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const payment = await Payment.findByPk(req.params.id, {
      include: [{ model: Package, as: 'package' }],
    });

    if (!payment) return res.status(404).json({ error: 'Paiement non trouvé' });
    if (payment.status === 'completed') {
      await t.rollback();
      return res.status(400).json({ error: 'Paiement déjà approuvé' });
    }

    await payment.update({
      status: 'completed',
      completed_at: new Date(),
      notes: `Approuvé manuellement par admin (${req.user.email})`,
    }, { transaction: t });

    await creditWallet(payment.tenant_id, payment.sms_count, payment.package?.name, payment.id, payment.user_id, t, payment.tenant?.name);
    await t.commit();

    // Notifier le client par email
    const paymentUser = await User.findByPk(payment.user_id, { attributes: ['email', 'first_name'] });
    if (paymentUser) {
      emailService.sendPaymentConfirmation(paymentUser.email, paymentUser.first_name, {
        packageName: payment.package?.name || 'Package',
        smsCount: payment.sms_count,
        amount: payment.amount,
        currency: payment.currency,
        paymentId: payment.id,
        date: new Date(),
      }).catch(() => {});
    }

    res.json({ message: `Paiement approuvé. ${payment.sms_count} crédits ajoutés.` });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// ─── Client : télécharger la facture PDF ──────────────────
exports.downloadInvoice = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({
      where: { id: req.params.id, tenant_id: req.tenantId },
      include: [
        { model: Package, as: 'package' },
        { model: Tenant, as: 'tenant' },
        { model: User, as: 'user', attributes: ['first_name', 'last_name', 'email'] },
      ],
    });

    if (!payment) return res.status(404).json({ error: 'Paiement non trouvé' });
    if (payment.status !== 'completed') return res.status(400).json({ error: 'Facture disponible uniquement pour les paiements confirmés' });

    invoiceService.generateInvoice(res, {
      payment,
      pkg: payment.package,
      tenant: payment.tenant,
      user: payment.user,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Helper : créditer le wallet client + déduire de la banque ─────
async function creditWallet(tenantId, smsCount, packageName, paymentId, userId, transaction, tenantName) {
  // 1. Déduire de la banque plateforme
  await platformBankService.deductCredits({
    quantity: smsCount,
    paymentId,
    tenantName,
  }, transaction);

  // 2. Créditer le wallet client
  const wallet = await TenantCredit.findOne({ where: { tenant_id: tenantId }, transaction });
  if (!wallet) return;

  const newBalance = wallet.balance + smsCount;
  await wallet.update({
    balance: newBalance,
    total_purchased: wallet.total_purchased + smsCount,
  }, { transaction });

  await CreditTransaction.create({
    tenant_id: tenantId,
    type: 'credit',
    amount: smsCount,
    balance_after: newBalance,
    description: `Achat package: ${packageName}`,
    package_id: paymentId,
    created_by: userId,
  }, { transaction });
}
