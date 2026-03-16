const sequelize = require('../config/database');

const Tenant = require('./Tenant');
const User = require('./User');
const Package = require('./Package');
const TenantCredit = require('./TenantCredit');
const CreditTransaction = require('./CreditTransaction');
const SenderID = require('./SenderID');
const ContactGroup = require('./ContactGroup');
const Contact = require('./Contact');
const Template = require('./Template');
const Campaign = require('./Campaign');
const Message = require('./Message');
const Payment = require('./Payment');
const PlatformBank = require('./PlatformBank');
const PlatformBankLog = require('./PlatformBankLog');

// Tenant associations
Tenant.hasMany(User, { foreignKey: 'tenant_id', as: 'users', onDelete: 'CASCADE' });
User.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

Tenant.hasOne(TenantCredit, { foreignKey: 'tenant_id', as: 'credit', onDelete: 'CASCADE' });
TenantCredit.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

Tenant.hasMany(CreditTransaction, { foreignKey: 'tenant_id', as: 'transactions', onDelete: 'CASCADE' });
CreditTransaction.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

Tenant.hasMany(SenderID, { foreignKey: 'tenant_id', as: 'senderIds', onDelete: 'CASCADE' });
SenderID.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

Tenant.hasMany(ContactGroup, { foreignKey: 'tenant_id', as: 'groups', onDelete: 'CASCADE' });
ContactGroup.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

ContactGroup.hasMany(Contact, { foreignKey: 'group_id', as: 'contacts', onDelete: 'SET NULL' });
Contact.belongsTo(ContactGroup, { foreignKey: 'group_id', as: 'group' });

Tenant.hasMany(Contact, { foreignKey: 'tenant_id', as: 'contacts', onDelete: 'CASCADE' });
Contact.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

Tenant.hasMany(Template, { foreignKey: 'tenant_id', as: 'templates', onDelete: 'CASCADE' });
Template.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

Tenant.hasMany(Campaign, { foreignKey: 'tenant_id', as: 'campaigns', onDelete: 'CASCADE' });
Campaign.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

Template.hasMany(Campaign, { foreignKey: 'template_id', as: 'campaigns', onDelete: 'SET NULL' });
Campaign.belongsTo(Template, { foreignKey: 'template_id', as: 'template' });

Campaign.hasMany(Message, { foreignKey: 'campaign_id', as: 'messages', onDelete: 'CASCADE' });
Message.belongsTo(Campaign, { foreignKey: 'campaign_id', as: 'campaign' });

Tenant.hasMany(Message, { foreignKey: 'tenant_id', as: 'messages', onDelete: 'CASCADE' });
Message.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

Contact.hasMany(Message, { foreignKey: 'contact_id', as: 'messages', onDelete: 'SET NULL' });
Message.belongsTo(Contact, { foreignKey: 'contact_id', as: 'contact' });

Tenant.hasMany(Payment, { foreignKey: 'tenant_id', as: 'payments', onDelete: 'CASCADE' });
Payment.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

Package.hasMany(Payment, { foreignKey: 'package_id', as: 'payments' });
Payment.belongsTo(Package, { foreignKey: 'package_id', as: 'package' });

User.hasMany(Payment, { foreignKey: 'user_id', as: 'payments' });
Payment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  sequelize,
  Tenant,
  User,
  Package,
  TenantCredit,
  CreditTransaction,
  SenderID,
  ContactGroup,
  Contact,
  Template,
  Campaign,
  Message,
  Payment,
  PlatformBank,
  PlatformBankLog,
};
