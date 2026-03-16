const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Table à une seule ligne — représente la banque de crédits du super admin
const PlatformBank = sequelize.define('PlatformBank', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    defaultValue: 1, // Toujours l'ID 1
  },
  balance: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    allowNull: false,
    comment: 'Crédits SMS disponibles à vendre',
  },
  total_purchased: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    comment: 'Total SMS achetés chez Infobip depuis le début',
  },
  total_sold: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    comment: 'Total SMS vendus aux clients depuis le début',
  },
  cost_per_sms: {
    type: DataTypes.DECIMAL(10, 4),
    defaultValue: 0,
    comment: 'Prix d\'achat chez Infobip (DJF par SMS)',
  },
  currency: {
    type: DataTypes.STRING(5),
    defaultValue: 'DJF',
  },
  // Auto-recharge
  auto_recharge_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  auto_recharge_threshold: {
    type: DataTypes.INTEGER,
    defaultValue: 10000,
    comment: 'Déclencher la recharge quand le solde atteint ce seuil',
  },
  auto_recharge_target: {
    type: DataTypes.INTEGER,
    defaultValue: 100000,
    comment: 'Recharger jusqu\'à ce niveau',
  },
}, {
  tableName: 'platform_bank',
});

module.exports = PlatformBank;
