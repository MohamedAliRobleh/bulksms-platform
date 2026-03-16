const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Campaign = sequelize.define('Campaign', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenant_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  sender_id: {
    type: DataTypes.STRING(15),
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  template_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('draft', 'scheduled', 'sending', 'sent', 'paused', 'failed'),
    defaultValue: 'draft',
  },
  target_type: {
    type: DataTypes.ENUM('all', 'group', 'custom'),
    defaultValue: 'all',
  },
  target_ids: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  scheduled_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  sent_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  total_recipients: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  sent_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  delivered_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  failed_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  credits_used: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'campaigns',
  indexes: [
    { fields: ['tenant_id'] },
    { fields: ['status'] },
    { fields: ['scheduled_at'] },
  ],
});

module.exports = Campaign;
