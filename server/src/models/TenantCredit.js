const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TenantCredit = sequelize.define('TenantCredit', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenant_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
  },
  balance: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  total_purchased: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  total_used: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'tenant_credits',
});

module.exports = TenantCredit;
