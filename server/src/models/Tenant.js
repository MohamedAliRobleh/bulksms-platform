const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Tenant = sequelize.define('Tenant', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  phone: {
    type: DataTypes.STRING(30),
    allowNull: true,
  },
  logo: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  primary_color: {
    type: DataTypes.STRING(10),
    defaultValue: '#4F46E5',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  timezone: {
    type: DataTypes.STRING(50),
    defaultValue: 'Africa/Djibouti',
  },
  country: {
    type: DataTypes.STRING(50),
    defaultValue: 'DJ',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'tenants',
  indexes: [{ fields: ['slug'] }, { fields: ['email'] }],
});

module.exports = Tenant;
