const { PlatformBank, PlatformBankLog, sequelize } = require('../models');
const emailService = require('./emailService');
const logger = require('./loggerService');

const BANK_ID = 1;

// ─── Obtenir ou initialiser la banque ─────────────────────
exports.getBank = async () => {
  let bank = await PlatformBank.findByPk(BANK_ID);
  if (!bank) {
    bank = await PlatformBank.create({
      id: BANK_ID,
      balance: 0,
      total_purchased: 0,
      total_sold: 0,
      cost_per_sms: 0,
      auto_recharge_enabled: false,
      auto_recharge_threshold: 10000,
      auto_recharge_target: 100000,
    });
  }
  return bank;
};

// ─── Ajouter des crédits (achat Infobip) ──────────────────
exports.addCredits = async ({ quantity, unitCost, description }, transaction) => {
  const t = transaction || await sequelize.transaction();
  const isExternal = !transaction;
  try {
    const bank = await PlatformBank.findByPk(BANK_ID, { transaction: t, lock: true });
    if (!bank) throw new Error('Platform bank not initialized');

    const newBalance = Number(bank.balance) + Number(quantity);
    const totalCost = Number(quantity) * Number(unitCost || bank.cost_per_sms || 0);

    await bank.update({
      balance: newBalance,
      total_purchased: Number(bank.total_purchased) + Number(quantity),
      ...(unitCost !== undefined && { cost_per_sms: unitCost }),
    }, { transaction: t });

    await PlatformBankLog.create({
      type: 'purchase',
      quantity: Number(quantity),
      unit_cost: unitCost || bank.cost_per_sms || 0,
      total_cost: totalCost,
      balance_after: newBalance,
      description: description || `Achat de ${Number(quantity).toLocaleString()} crédits SMS`,
    }, { transaction: t });

    if (isExternal) await t.commit();
    logger.info(`PlatformBank: +${quantity} SMS added (balance: ${newBalance})`);
    return { success: true, balance: newBalance };
  } catch (err) {
    if (isExternal) await t.rollback();
    throw err;
  }
};

// ─── Déduire des crédits (vente client) ───────────────────
exports.deductCredits = async ({ quantity, paymentId, tenantName }, transaction) => {
  const bank = await PlatformBank.findByPk(BANK_ID, { transaction, lock: true });
  if (!bank) throw new Error('Platform bank not initialized');

  if (Number(bank.balance) < Number(quantity)) {
    throw new Error(`Solde insuffisant dans la banque plateforme (disponible: ${bank.balance}, requis: ${quantity})`);
  }

  const newBalance = Number(bank.balance) - Number(quantity);
  const unitCost = Number(bank.cost_per_sms || 0);

  await bank.update({
    balance: newBalance,
    total_sold: Number(bank.total_sold) + Number(quantity),
  }, { transaction });

  await PlatformBankLog.create({
    type: 'sale',
    quantity: -Number(quantity),
    unit_cost: unitCost,
    total_cost: Number(quantity) * unitCost,
    balance_after: newBalance,
    description: `Vente à ${tenantName || 'client'}`,
    reference_id: paymentId,
    tenant_name: tenantName,
  }, { transaction });

  logger.info(`PlatformBank: -${quantity} SMS sold to ${tenantName} (balance: ${newBalance})`);

  // Vérifier auto-recharge APRÈS la transaction principale
  setImmediate(() => checkAutoRecharge(bank, newBalance));

  return { success: true, balance: newBalance };
};

// ─── Auto-recharge ─────────────────────────────────────────
async function checkAutoRecharge(bankSnapshot, currentBalance) {
  try {
    if (!bankSnapshot.auto_recharge_enabled) return;
    if (currentBalance > bankSnapshot.auto_recharge_threshold) return;

    const quantityToAdd = Number(bankSnapshot.auto_recharge_target) - currentBalance;
    if (quantityToAdd <= 0) return;

    logger.info(`PlatformBank: Auto-recharge triggered (balance ${currentBalance} ≤ ${bankSnapshot.auto_recharge_threshold}). Adding ${quantityToAdd} SMS.`);

    const t = await sequelize.transaction();
    try {
      const bank = await PlatformBank.findByPk(BANK_ID, { transaction: t, lock: true });
      const newBalance = Number(bank.balance) + quantityToAdd;

      await bank.update({ balance: newBalance, total_purchased: Number(bank.total_purchased) + quantityToAdd }, { transaction: t });

      await PlatformBankLog.create({
        type: 'auto_recharge',
        quantity: quantityToAdd,
        unit_cost: bank.cost_per_sms || 0,
        total_cost: quantityToAdd * Number(bank.cost_per_sms || 0),
        balance_after: newBalance,
        description: `Auto-recharge: ${quantityToAdd.toLocaleString()} SMS ajoutés (seuil: ${bankSnapshot.auto_recharge_threshold})`,
      }, { transaction: t });

      await t.commit();
      logger.info(`PlatformBank: Auto-recharge done. New balance: ${newBalance}`);

      // Email alerte à l'admin
      await sendAutoRechargeAlert(quantityToAdd, newBalance, bank.cost_per_sms);
    } catch (err) {
      await t.rollback();
      logger.error('Auto-recharge failed', { error: err.message });
    }
  } catch (err) {
    logger.error('checkAutoRecharge error', { error: err.message });
  }
}

// ─── Email alerte auto-recharge ───────────────────────────
async function sendAutoRechargeAlert(quantity, newBalance, costPerSms) {
  try {
    const { User } = require('../models');
    const admins = await User.findAll({ where: { role: 'super_admin' } });
    const totalCost = (quantity * Number(costPerSms || 0)).toLocaleString('fr-DJ');

    for (const admin of admins) {
      const html = `
        <!DOCTYPE html><html><head><meta charset="UTF-8"><style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f7fa; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
          .header { background: linear-gradient(135deg, #7c3aed, #4f46e5); padding: 36px; text-align: center; }
          .header h1 { color: #fff; margin: 0; font-size: 22px; }
          .body { padding: 36px; }
          .info-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .info-box p { margin: 6px 0; color: #374151; }
          .alert-box { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin: 20px 0; }
          .footer { text-align: center; padding: 24px; background: #f8fafc; color: #94a3b8; font-size: 13px; }
        </style></head>
        <body><div class="container">
          <div class="header"><h1>⚡ Auto-recharge banque SMS</h1></div>
          <div class="body">
            <h2>Bonjour ${admin.first_name},</h2>
            <p>Le solde de votre banque SMS est descendu sous le seuil d'alerte. L'auto-recharge a été déclenchée automatiquement.</p>
            <div class="info-box">
              <p><strong>SMS ajoutés :</strong> ${Number(quantity).toLocaleString()} crédits</p>
              <p><strong>Nouveau solde :</strong> ${Number(newBalance).toLocaleString()} crédits</p>
              <p><strong>Coût estimé :</strong> ${totalCost} DJF</p>
            </div>
            <div class="alert-box">
              <strong>⚠️ Action requise :</strong> Vérifiez que votre compte Infobip est suffisamment approvisionné pour couvrir ces ${Number(quantity).toLocaleString()} SMS supplémentaires.
            </div>
          </div>
          <div class="footer"><p>BulkSMS Platform &bull; support@bulksms.dj</p></div>
        </div></body></html>
      `;
      await emailService.sendMail?.({ to: admin.email, subject: `⚡ Auto-recharge: ${Number(quantity).toLocaleString()} SMS ajoutés à votre banque`, html })
        .catch(() => {});
    }
  } catch (err) {
    logger.error('sendAutoRechargeAlert error', { error: err.message });
  }
}

// ─── Mettre à jour les paramètres ─────────────────────────
exports.updateSettings = async ({ costPerSms, autoRechargeEnabled, autoRechargeThreshold, autoRechargeTarget }) => {
  const bank = await exports.getBank();
  const updates = {};
  if (costPerSms !== undefined) updates.cost_per_sms = costPerSms;
  if (autoRechargeEnabled !== undefined) updates.auto_recharge_enabled = autoRechargeEnabled;
  if (autoRechargeThreshold !== undefined) updates.auto_recharge_threshold = autoRechargeThreshold;
  if (autoRechargeTarget !== undefined) updates.auto_recharge_target = autoRechargeTarget;
  await bank.update(updates);
  return bank.reload();
};
