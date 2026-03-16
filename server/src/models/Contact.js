const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Contact = sequelize.define('Contact', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenant_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  group_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  first_name: {
    type: DataTypes.STRING(60),
    allowNull: true,
  },
  last_name: {
    type: DataTypes.STRING(60),
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  is_subscribed: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  custom_fields: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
}, {
  tableName: 'contacts',
  indexes: [
    { fields: ['tenant_id'] },
    { fields: ['group_id'] },
    { fields: ['phone', 'tenant_id'], unique: true },
  ],
});

module.exports = Contact;
