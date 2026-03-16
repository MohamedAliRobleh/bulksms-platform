const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendMail = exports.sendMail = async ({ to, subject, html }) => {
  const transporter = createTransporter();
  return transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME || 'BulkSMS'}" <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    html,
  });
};

exports.sendWelcome = async (to, firstName, { platform_url, email, password, tenant_name }) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><style>
      body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f7fa; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
      .header { background: linear-gradient(135deg, #4F46E5, #7C3AED); padding: 40px; text-align: center; }
      .header h1 { color: #fff; margin: 0; font-size: 28px; }
      .header p { color: rgba(255,255,255,0.8); margin: 8px 0 0; }
      .body { padding: 40px; }
      .body h2 { color: #1e293b; margin-top: 0; }
      .credentials { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0; }
      .credentials p { margin: 8px 0; color: #475569; }
      .credentials strong { color: #1e293b; }
      .btn { display: inline-block; background: #4F46E5; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
      .footer { text-align: center; padding: 24px; background: #f8fafc; color: #94a3b8; font-size: 13px; }
    </style></head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Bienvenue sur BulkSMS</h1>
          <p>Votre plateforme de communication SMS</p>
        </div>
        <div class="body">
          <h2>Bonjour ${firstName},</h2>
          <p>Votre compte sur <strong>${tenant_name}</strong> a été créé avec succès. Vous pouvez maintenant vous connecter et commencer à envoyer vos campagnes SMS.</p>
          <div class="credentials">
            <p><strong>URL de connexion :</strong> ${platform_url}</p>
            <p><strong>Email :</strong> ${email}</p>
            <p><strong>Mot de passe temporaire :</strong> <code>${password}</code></p>
          </div>
          <p style="color:#ef4444;"><strong>Important :</strong> Changez votre mot de passe dès votre première connexion.</p>
          <a href="${platform_url}" class="btn">Se connecter maintenant</a>
        </div>
        <div class="footer">
          <p>BulkSMS Platform &bull; Djibouti &bull; support@bulksms.dj</p>
          <p>Si vous n'avez pas demandé ce compte, ignorez cet email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendMail({ to, subject: `Bienvenue sur BulkSMS - Vos identifiants de connexion`, html });
};

exports.sendPaymentConfirmation = async (to, firstName, { packageName, smsCount, amount, currency, paymentId, date }) => {
  const formattedAmount = `${Number(amount).toLocaleString('fr-DJ')} ${currency || 'DJF'}`;
  const formattedSms = Number(smsCount).toLocaleString('fr-FR');
  const formattedDate = new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><style>
      body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f7fa; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
      .header { background: linear-gradient(135deg, #059669, #10b981); padding: 40px; text-align: center; }
      .header h1 { color: #fff; margin: 0; font-size: 26px; }
      .header p { color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 15px; }
      .body { padding: 40px; }
      .body h2 { color: #1e293b; margin-top: 0; }
      .summary { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 24px; margin: 24px 0; }
      .summary-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #d1fae5; color: #374151; }
      .summary-row:last-child { border-bottom: none; font-weight: 700; font-size: 16px; color: #065f46; }
      .badge { display: inline-block; background: #dcfce7; color: #166534; padding: 4px 14px; border-radius: 999px; font-size: 13px; font-weight: 600; margin-bottom: 16px; }
      .credits-highlight { text-align: center; padding: 20px; background: #eff6ff; border-radius: 10px; margin: 20px 0; }
      .credits-highlight .number { font-size: 42px; font-weight: 900; color: #1d4ed8; line-height: 1; }
      .credits-highlight .label { color: #3b82f6; font-weight: 600; margin-top: 4px; }
      .footer { text-align: center; padding: 24px; background: #f8fafc; color: #94a3b8; font-size: 13px; }
      .ref { color: #94a3b8; font-size: 12px; margin-top: 20px; }
    </style></head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Paiement confirmé !</h1>
          <p>Votre recharge de crédits SMS a été effectuée avec succès</p>
        </div>
        <div class="body">
          <span class="badge">Paiement via Waafi Pay</span>
          <h2>Bonjour ${firstName},</h2>
          <p>Votre paiement a été traité et vos crédits SMS ont été ajoutés à votre compte.</p>

          <div class="credits-highlight">
            <div class="number">${formattedSms}</div>
            <div class="label">crédits SMS ajoutés à votre compte</div>
          </div>

          <div class="summary">
            <div class="summary-row">
              <span>Package</span>
              <span><strong>${packageName}</strong></span>
            </div>
            <div class="summary-row">
              <span>Crédits SMS</span>
              <span>${formattedSms} SMS</span>
            </div>
            <div class="summary-row">
              <span>Date</span>
              <span>${formattedDate}</span>
            </div>
            <div class="summary-row">
              <span>Montant payé</span>
              <span>${formattedAmount}</span>
            </div>
          </div>

          <p>Vous pouvez maintenant utiliser ces crédits pour envoyer vos campagnes SMS.</p>
          <p class="ref">Référence de paiement : <code>${paymentId}</code></p>
        </div>
        <div class="footer">
          <p>BulkSMS Platform &bull; Djibouti &bull; support@bulksms.dj</p>
          <p>Conservez cet email comme reçu de votre transaction.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendMail({ to, subject: `Confirmation de paiement — ${formattedSms} crédits SMS ajoutés`, html });
};

exports.sendLowBalanceAlert = async (to, firstName, { balance, threshold, tenantName }) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><style>
      body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f7fa; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
      .header { background: linear-gradient(135deg, #d97706, #f59e0b); padding: 40px; text-align: center; }
      .header h1 { color: #fff; margin: 0; font-size: 24px; }
      .header p { color: rgba(255,255,255,0.9); margin: 8px 0 0; }
      .body { padding: 40px; }
      .alert-box { background: #fffbeb; border: 2px solid #fcd34d; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0; }
      .balance-number { font-size: 48px; font-weight: 900; color: #d97706; line-height: 1; }
      .balance-label { color: #92400e; font-weight: 600; margin-top: 4px; }
      .btn { display: inline-block; background: #4F46E5; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
      .footer { text-align: center; padding: 24px; background: #f8fafc; color: #94a3b8; font-size: 13px; }
    </style></head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚠️ Solde SMS faible</h1>
          <p>Votre compte ${tenantName} nécessite une recharge</p>
        </div>
        <div class="body">
          <h2>Bonjour ${firstName},</h2>
          <p>Votre solde de crédits SMS est passé en dessous du seuil d'alerte de <strong>${threshold} crédits</strong>.</p>
          <div class="alert-box">
            <div class="balance-number">${balance}</div>
            <div class="balance-label">crédits restants</div>
          </div>
          <p>Pour éviter toute interruption de vos campagnes SMS, nous vous recommandons de recharger votre compte dès que possible.</p>
          <a href="${process.env.CLIENT_URL}/dashboard/buy-credits" class="btn">Recharger mes crédits</a>
        </div>
        <div class="footer">
          <p>BulkSMS Platform &bull; Djibouti &bull; support@bulksms.dj</p>
          <p>Vous recevez cet email car votre solde est inférieur à ${threshold} crédits.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendMail({ to, subject: `⚠️ Solde SMS faible — ${balance} crédits restants`, html });
};

exports.sendPasswordReset = async (to, firstName, resetUrl) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><style>
      body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f7fa; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
      .header { background: linear-gradient(135deg, #4F46E5, #7C3AED); padding: 40px; text-align: center; }
      .header h1 { color: #fff; margin: 0; font-size: 24px; }
      .body { padding: 40px; }
      .btn { display: inline-block; background: #4F46E5; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
      .footer { text-align: center; padding: 24px; background: #f8fafc; color: #94a3b8; font-size: 13px; }
    </style></head>
    <body>
      <div class="container">
        <div class="header"><h1>Réinitialisation du mot de passe</h1></div>
        <div class="body">
          <h2>Bonjour ${firstName},</h2>
          <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous.</p>
          <p>Ce lien expire dans <strong>1 heure</strong>.</p>
          <a href="${resetUrl}" class="btn">Réinitialiser mon mot de passe</a>
          <p style="color:#94a3b8;font-size:13px;">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
        </div>
        <div class="footer"><p>BulkSMS Platform &bull; support@bulksms.dj</p></div>
      </div>
    </body>
    </html>
  `;

  return sendMail({ to, subject: `Réinitialisation de votre mot de passe BulkSMS`, html });
};
