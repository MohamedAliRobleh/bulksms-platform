const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SenderID = sequelize.define('SenderID', {
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
    type: DataTypes.STRING(15),
    allowNull: false,
  },
  is_default: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'sender_ids',
  indexes: [{ fields: ['tenant_id'] }],
});

module.exports = SenderID;
