const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ContactGroup = sequelize.define('ContactGroup', {
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
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  contact_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'contact_groups',
  indexes: [{ fields: ['tenant_id'] }],
});

module.exports = ContactGroup;
