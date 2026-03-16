const { body, param, validationResult } = require('express-validator');

// Retourne les erreurs au client si la validation échoue
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: 'Données invalides',
      details: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ─── Auth ──────────────────────────────────────────────────
exports.validateLogin = [
  body('email').isEmail().withMessage('Email invalide').normalizeEmail(),
  body('password').notEmpty().withMessage('Mot de passe requis'),
  handleValidation,
];

exports.validateChangePassword = [
  body('current_password').notEmpty().withMessage('Mot de passe actuel requis'),
  body('new_password')
    .isLength({ min: 8 }).withMessage('Le nouveau mot de passe doit faire au moins 8 caractères')
    .matches(/[A-Z]/).withMessage('Doit contenir au moins une majuscule')
    .matches(/[0-9]/).withMessage('Doit contenir au moins un chiffre'),
  handleValidation,
];

exports.validateForgotPassword = [
  body('email').isEmail().withMessage('Email invalide').normalizeEmail(),
  handleValidation,
];

// ─── Paiements ─────────────────────────────────────────────
exports.validateInitiatePayment = [
  body('package_id').isUUID().withMessage('Package invalide'),
  body('phone_number')
    .notEmpty().withMessage('Numéro de téléphone requis')
    .matches(/^[0-9]{10,15}$/).withMessage('Numéro de téléphone invalide (10-15 chiffres)'),
  handleValidation,
];

// ─── Contacts ──────────────────────────────────────────────
exports.validateContact = [
  body('phone')
    .notEmpty().withMessage('Numéro de téléphone requis')
    .matches(/^\+?[0-9]{8,15}$/).withMessage('Numéro de téléphone invalide'),
  body('first_name').optional().trim().isLength({ max: 100 }).withMessage('Prénom trop long'),
  body('last_name').optional().trim().isLength({ max: 100 }).withMessage('Nom trop long'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Email invalide'),
  handleValidation,
];

// ─── Campagnes ─────────────────────────────────────────────
exports.validateCampaign = [
  body('name').notEmpty().withMessage('Nom de campagne requis').trim().isLength({ max: 200 }),
  body('content').notEmpty().withMessage('Contenu du message requis').isLength({ max: 1600 }).withMessage('Message trop long (max 1600 caractères)'),
  body('sender_id').notEmpty().withMessage('Expéditeur requis'),
  handleValidation,
];

// ─── Tenant ────────────────────────────────────────────────
exports.validateTenant = [
  body('name').notEmpty().withMessage('Nom requis').trim().isLength({ max: 200 }),
  body('email').isEmail().withMessage('Email invalide').normalizeEmail(),
  body('admin_first_name').notEmpty().withMessage('Prénom admin requis'),
  body('admin_last_name').notEmpty().withMessage('Nom admin requis'),
  body('admin_password')
    .isLength({ min: 8 }).withMessage('Mot de passe admin trop court (min 8 caractères)'),
  handleValidation,
];

// ─── Package ───────────────────────────────────────────────
exports.validatePackage = [
  body('name').notEmpty().withMessage('Nom du package requis').trim(),
  body('sms_count').isInt({ min: 1 }).withMessage('Nombre de SMS invalide'),
  body('price').isFloat({ min: 0 }).withMessage('Prix invalide'),
  handleValidation,
];

// ─── UUID params ───────────────────────────────────────────
exports.validateUuidParam = [
  param('id').isUUID().withMessage('Identifiant invalide'),
  handleValidation,
];
