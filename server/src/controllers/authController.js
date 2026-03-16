const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, Tenant } = require('../models');
const emailService = require('../services/emailService');

const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({
      where: { email: email.toLowerCase() },
      include: [{ model: Tenant, as: 'tenant', required: false }],
    });

    if (!user || !await user.comparePassword(password)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is disabled. Contact support.' });
    }

    if (user.role !== 'super_admin' && user.tenant && !user.tenant.is_active) {
      return res.status(403).json({ error: 'Your account has been suspended. Contact support.' });
    }

    await user.update({ last_login: new Date() });

    const token = generateToken(user.id, user.role);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        tenant_id: user.tenant_id,
        preferred_language: user.preferred_language,
        tenant: user.tenant || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Tenant, as: 'tenant', required: false }],
    });
    res.json(user);
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { first_name, last_name, preferred_language } = req.body;
    await req.user.update({ first_name, last_name, preferred_language });
    res.json(req.user);
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Both passwords are required' });
    }

    if (new_password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const valid = await req.user.comparePassword(current_password);
    if (!valid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    await req.user.update({ password: new_password });
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email: email?.toLowerCase() } });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ message: 'If this email exists, a reset link has been sent.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await user.update({ reset_token: token, reset_token_expires: expires });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    await emailService.sendPasswordReset(user.email, user.first_name, resetUrl);

    res.json({ message: 'If this email exists, a reset link has been sent.' });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const user = await User.findOne({
      where: { reset_token: token },
    });

    if (!user || !user.reset_token_expires || user.reset_token_expires < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    await user.update({
      password,
      reset_token: null,
      reset_token_expires: null,
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
};
