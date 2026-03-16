require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const sequelize = require('../config/database');
const { User, Package, PlatformBank } = require('../models/index');

const seed = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected');

    // Super Admin
    const [admin, created] = await User.findOrCreate({
      where: { email: 'admin@bulksms.dj' },
      defaults: {
        first_name: 'Super',
        last_name: 'Admin',
        email: 'admin@bulksms.dj',
        password: 'Admin@1234',
        role: 'super_admin',
        tenant_id: null,
      },
    });

    if (created) {
      console.log('✅ Super admin created: admin@bulksms.dj / Admin@1234');
    } else {
      console.log('ℹ️  Super admin already exists');
    }

    // Default packages
    const packages = [
      { name: 'Starter', description: 'Idéal pour débuter', sms_count: 500, price: 5000, currency: 'DJF', validity_days: 365, sort_order: 1 },
      { name: 'Business', description: 'Pour les PME', sms_count: 2000, price: 17000, currency: 'DJF', validity_days: 365, is_featured: true, sort_order: 2 },
      { name: 'Pro', description: 'Pour les grandes entreprises', sms_count: 10000, price: 75000, currency: 'DJF', validity_days: 365, sort_order: 3 },
      { name: 'Enterprise', description: 'Volume sur mesure', sms_count: 50000, price: 300000, currency: 'DJF', validity_days: 365, sort_order: 4 },
    ];

    for (const pkg of packages) {
      await Package.findOrCreate({ where: { name: pkg.name }, defaults: pkg });
    }
    console.log('✅ Default packages created');

    // Platform bank
    await PlatformBank.findOrCreate({
      where: { id: 1 },
      defaults: {
        id: 1, balance: 0, total_purchased: 0, total_sold: 0,
        cost_per_sms: 0, auto_recharge_enabled: false,
        auto_recharge_threshold: 10000, auto_recharge_target: 100000,
      },
    });
    console.log('✅ Platform bank initialized');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
};

seed();
