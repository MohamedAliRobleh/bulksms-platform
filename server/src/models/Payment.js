const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenant_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  package_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  currency: {
    type: DataTypes.STRING(5),
    defaultValue: 'DJF',
  },
  sms_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  payment_method: {
    type: DataTypes.STRING(30),
    defaultValue: 'waafi',
  },
  phone_number: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled'),
    defaultValue: 'pending',
  },
  waafi_transaction_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  waafi_reference_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  waafi_response: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'payments',
  indexes: [
    { fields: ['tenant_id'] },
    { fields: ['status'] },
    { fields: ['waafi_transaction_id'] },
  ],
});

module.exports = Payment;
