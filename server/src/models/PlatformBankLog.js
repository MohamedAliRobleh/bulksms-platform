const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PlatformBankLog = sequelize.define('PlatformBankLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  type: {
    type: DataTypes.ENUM('purchase', 'sale', 'auto_recharge', 'adjustment'),
    allowNull: false,
    comment: 'purchase=achat Infobip, sale=vente client, auto_recharge=recharge auto, adjustment=correction manuelle',
  },
  quantity: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: 'Nombre de SMS (positif=entrée, négatif=sortie)',
  },
  unit_cost: {
    type: DataTypes.DECIMAL(10, 4),
    defaultValue: 0,
    comment: 'Prix unitaire DJF/SMS au moment de la transaction',
  },
  total_cost: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: 'Coût total de l\'opération (quantity * unit_cost)',
  },
  balance_after: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: 'Solde banque après cette opération',
  },
  description: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  reference_id: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'ID du paiement client lié (pour les sales)',
  },
  tenant_name: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'Nom du client (dénormalisé pour historique)',
  },
}, {
  tableName: 'platform_bank_logs',
  indexes: [
    { fields: ['type'] },
    { fields: ['created_at'] },
  ],
});

module.exports = PlatformBankLog;
