const { PlatformBankLog, Package } = require('../models');
const platformBankService = require('../services/platformBankService');
const { Op } = require('sequelize');

// ─── GET /admin/bank ───────────────────────────────────────
exports.getBank = async (req, res, next) => {
  try {
    const bank = await platformBankService.getBank();

    // Calcul des marges par package
    const packages = await Package.findAll({ where: { is_active: true }, order: [['sms_count', 'ASC']] });
    const packagesWithMargin = packages.map(pkg => {
      const costTotal = Number(pkg.sms_count) * Number(bank.cost_per_sms || 0);
      const revenue = Number(pkg.price);
      const margin = revenue - costTotal;
      const marginPct = revenue > 0 ? ((margin / revenue) * 100).toFixed(1) : 0;
      return {
        ...pkg.toJSON(),
        cost_total: costTotal,
        margin,
        margin_pct: parseFloat(marginPct),
      };
    });

    res.json({ bank, packages: packagesWithMargin });
  } catch (error) {
    next(error);
  }
};

// ─── POST /admin/bank/add ─────────────────────────────────
exports.addCredits = async (req, res, next) => {
  try {
    const { quantity, unit_cost, description } = req.body;

    if (!quantity || isNaN(quantity) || Number(quantity) <= 0) {
      return res.status(400).json({ error: 'Quantité invalide' });
    }

    const result = await platformBankService.addCredits({
      quantity: Number(quantity),
      unitCost: unit_cost !== undefined ? Number(unit_cost) : undefined,
      description,
    });

    res.json({
      message: `${Number(quantity).toLocaleString()} crédits ajoutés à la banque`,
      balance: result.balance,
    });
  } catch (error) {
    next(error);
  }
};

// ─── PUT /admin/bank/settings ─────────────────────────────
exports.updateSettings = async (req, res, next) => {
  try {
    const { cost_per_sms, auto_recharge_enabled, auto_recharge_threshold, auto_recharge_target } = req.body;

    if (auto_recharge_threshold !== undefined && auto_recharge_target !== undefined) {
      if (Number(auto_recharge_threshold) >= Number(auto_recharge_target)) {
        return res.status(400).json({ error: 'Le seuil doit être inférieur au maximum' });
      }
    }

    const bank = await platformBankService.updateSettings({
      costPerSms: cost_per_sms !== undefined ? Number(cost_per_sms) : undefined,
      autoRechargeEnabled: auto_recharge_enabled,
      autoRechargeThreshold: auto_recharge_threshold !== undefined ? Number(auto_recharge_threshold) : undefined,
      autoRechargeTarget: auto_recharge_target !== undefined ? Number(auto_recharge_target) : undefined,
    });

    res.json({ message: 'Paramètres mis à jour', bank });
  } catch (error) {
    next(error);
  }
};

// ─── GET /admin/bank/logs ─────────────────────────────────
exports.getLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 30, type } = req.query;
    const offset = (page - 1) * limit;
    const where = type ? { type } : {};

    const { count, rows } = await PlatformBankLog.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({ logs: rows, total: count });
  } catch (error) {
    next(error);
  }
};
