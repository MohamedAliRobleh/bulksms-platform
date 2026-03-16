const express = require('express');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const { authenticate, requireSuperAdmin, requireTenantAdmin } = require('../middleware/auth');
const {
  validateLogin, validateChangePassword, validateForgotPassword,
  validateInitiatePayment, validateContact, validateCampaign,
  validateTenant, validatePackage, validateUuidParam,
} = require('../middleware/validate');

const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');
const contactController = require('../controllers/contactController');
const campaignController = require('../controllers/campaignController');
const templateController = require('../controllers/templateController');
const analyticsController = require('../controllers/analyticsController');
const settingsController = require('../controllers/settingsController');
const paymentController = require('../controllers/paymentController');
const bankController = require('../controllers/bankController');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Rate limiters spécifiques
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 20,
  message: { error: 'Trop de tentatives. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 heure
  max: 10,
  message: { error: 'Limite de paiements atteinte. Réessayez dans 1 heure.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── AUTH ─────────────────────────────────────────────────────────────────
router.post('/auth/login', authLimiter, validateLogin, authController.login);
router.post('/auth/forgot-password', authLimiter, validateForgotPassword, authController.forgotPassword);
router.post('/auth/reset-password', authController.resetPassword);
router.get('/auth/me', authenticate, authController.getMe);
router.put('/auth/profile', authenticate, authController.updateProfile);
router.put('/auth/change-password', authenticate, validateChangePassword, authController.changePassword);

// ─── SUPER ADMIN ──────────────────────────────────────────────────────────
router.get('/admin/dashboard', authenticate, requireSuperAdmin, adminController.getDashboardStats);

// Tenants
router.get('/admin/tenants', authenticate, requireSuperAdmin, adminController.getTenants);
router.post('/admin/tenants', authenticate, requireSuperAdmin, validateTenant, adminController.createTenant);
router.get('/admin/tenants/:id', authenticate, requireSuperAdmin, adminController.getTenant);
router.put('/admin/tenants/:id', authenticate, requireSuperAdmin, adminController.updateTenant);
router.delete('/admin/tenants/:id', authenticate, requireSuperAdmin, validateUuidParam, adminController.deleteTenant);

// Credits
router.post('/admin/credits/add', authenticate, requireSuperAdmin, adminController.addCredits);
router.get('/admin/credits/:tenant_id/transactions', authenticate, requireSuperAdmin, adminController.getCreditTransactions);

// Packages
router.get('/admin/packages', authenticate, adminController.getPackages);
router.post('/admin/packages', authenticate, requireSuperAdmin, validatePackage, adminController.createPackage);
router.put('/admin/packages/:id', authenticate, requireSuperAdmin, adminController.updatePackage);
router.delete('/admin/packages/:id', authenticate, requireSuperAdmin, adminController.deletePackage);

// ─── ANALYTICS ────────────────────────────────────────────────────────────
router.get('/analytics/dashboard', authenticate, analyticsController.getDashboard);
router.get('/analytics/campaigns', authenticate, analyticsController.getCampaignStats);
router.get('/analytics/credits', authenticate, analyticsController.getCreditHistory);

// ─── CONTACTS ─────────────────────────────────────────────────────────────
router.get('/contacts', authenticate, contactController.getContacts);
router.post('/contacts', authenticate, validateContact, contactController.createContact);
router.post('/contacts/import', authenticate, upload.single('file'), contactController.importContacts);
router.post('/contacts/delete-bulk', authenticate, contactController.deleteContacts);
router.put('/contacts/:id', authenticate, validateContact, contactController.updateContact);
router.delete('/contacts/:id', authenticate, contactController.deleteContact);

// Groups
router.get('/groups', authenticate, contactController.getGroups);
router.post('/groups', authenticate, contactController.createGroup);
router.put('/groups/:id', authenticate, contactController.updateGroup);
router.delete('/groups/:id', authenticate, contactController.deleteGroup);

// ─── CAMPAIGNS ────────────────────────────────────────────────────────────
router.get('/campaigns', authenticate, campaignController.getCampaigns);
router.post('/campaigns', authenticate, validateCampaign, campaignController.createCampaign);
router.get('/campaigns/:id', authenticate, campaignController.getCampaign);
router.post('/campaigns/:id/send', authenticate, campaignController.sendCampaign);
router.post('/campaigns/:id/duplicate', authenticate, campaignController.duplicateCampaign);
router.delete('/campaigns/:id', authenticate, campaignController.deleteCampaign);
router.get('/campaigns/:id/messages', authenticate, campaignController.getCampaignMessages);

// ─── TEMPLATES ────────────────────────────────────────────────────────────
router.get('/templates', authenticate, templateController.getTemplates);
router.post('/templates', authenticate, templateController.createTemplate);
router.get('/templates/:id', authenticate, templateController.getTemplate);
router.put('/templates/:id', authenticate, templateController.updateTemplate);
router.delete('/templates/:id', authenticate, templateController.deleteTemplate);

// ─── SETTINGS ─────────────────────────────────────────────────────────────
router.get('/settings/sender-ids', authenticate, settingsController.getSenderIds);
router.post('/settings/sender-ids', authenticate, requireTenantAdmin, settingsController.createSenderId);
router.put('/settings/sender-ids/:id', authenticate, requireTenantAdmin, settingsController.updateSenderId);
router.delete('/settings/sender-ids/:id', authenticate, requireTenantAdmin, settingsController.deleteSenderId);

router.get('/settings/users', authenticate, requireTenantAdmin, settingsController.getUsers);
router.post('/settings/users', authenticate, requireTenantAdmin, settingsController.createUser);
router.put('/settings/users/:id', authenticate, requireTenantAdmin, settingsController.updateUser);
router.delete('/settings/users/:id', authenticate, requireTenantAdmin, settingsController.deleteUser);

// ─── PAIEMENTS ────────────────────────────────────────────────────────────
// Client
router.get('/payments/packages', authenticate, paymentController.getPackages);
router.post('/payments/initiate', authenticate, paymentLimiter, validateInitiatePayment, paymentController.initiatePayment);
router.get('/payments/:id/check', authenticate, paymentController.checkPayment);
router.get('/payments/history', authenticate, paymentController.getPaymentHistory);
router.get('/payments/:id/invoice', authenticate, paymentController.downloadInvoice);

// Admin
router.get('/admin/payments', authenticate, requireSuperAdmin, paymentController.getAllPayments);
router.post('/admin/payments/:id/approve', authenticate, requireSuperAdmin, paymentController.approvePayment);

// ─── BANQUE PLATEFORME ────────────────────────────────────
router.get('/admin/bank', authenticate, requireSuperAdmin, bankController.getBank);
router.post('/admin/bank/add', authenticate, requireSuperAdmin, bankController.addCredits);
router.put('/admin/bank/settings', authenticate, requireSuperAdmin, bankController.updateSettings);
router.get('/admin/bank/logs', authenticate, requireSuperAdmin, bankController.getLogs);

module.exports = router;
