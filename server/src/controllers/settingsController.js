const { SenderID, User, Tenant } = require('../models');

exports.getSenderIds = async (req, res, next) => {
  try {
    const senderIds = await SenderID.findAll({
      where: { tenant_id: req.tenantId },
      order: [['is_default', 'DESC'], ['created_at', 'DESC']],
    });
    res.json(senderIds);
  } catch (error) {
    next(error);
  }
};

exports.createSenderId = async (req, res, next) => {
  try {
    const { name, is_default } = req.body;

    if (name.length > 11) {
      return res.status(400).json({ error: 'Sender ID must be 11 characters max' });
    }

    if (is_default) {
      await SenderID.update({ is_default: false }, { where: { tenant_id: req.tenantId } });
    }

    const senderId = await SenderID.create({ tenant_id: req.tenantId, name, is_default: !!is_default });
    res.status(201).json(senderId);
  } catch (error) {
    next(error);
  }
};

exports.updateSenderId = async (req, res, next) => {
  try {
    const sender = await SenderID.findOne({ where: { id: req.params.id, tenant_id: req.tenantId } });
    if (!sender) return res.status(404).json({ error: 'Sender ID not found' });

    if (req.body.is_default) {
      await SenderID.update({ is_default: false }, { where: { tenant_id: req.tenantId } });
    }

    await sender.update(req.body);
    res.json(sender);
  } catch (error) {
    next(error);
  }
};

exports.deleteSenderId = async (req, res, next) => {
  try {
    const sender = await SenderID.findOne({ where: { id: req.params.id, tenant_id: req.tenantId } });
    if (!sender) return res.status(404).json({ error: 'Sender ID not found' });
    if (sender.is_default) return res.status(400).json({ error: 'Cannot delete default sender ID' });
    await sender.destroy();
    res.json({ message: 'Sender ID deleted' });
  } catch (error) {
    next(error);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      where: { tenant_id: req.tenantId },
      order: [['created_at', 'DESC']],
    });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const { first_name, last_name, email, password, role } = req.body;
    const user = await User.create({
      tenant_id: req.tenantId,
      first_name, last_name,
      email: email.toLowerCase(),
      password,
      role: role || 'tenant_user',
    });
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { id: req.params.id, tenant_id: req.tenantId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { first_name, last_name, is_active, role } = req.body;
    await user.update({ first_name, last_name, is_active, role });
    res.json(user);
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    const user = await User.findOne({ where: { id: req.params.id, tenant_id: req.tenantId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    await user.destroy();
    res.json({ message: 'User deleted' });
  } catch (error) {
    next(error);
  }
};
