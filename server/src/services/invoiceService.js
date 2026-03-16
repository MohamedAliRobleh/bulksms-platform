const PDFDocument = require('pdfkit');

/**
 * Génère un PDF de facture et le pipe dans le stream de réponse Express
 */
exports.generateInvoice = (res, { payment, pkg, tenant, user }) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  // Headers HTTP pour téléchargement
  const invoiceNumber = `INV-${payment.id.slice(0, 8).toUpperCase()}`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${invoiceNumber}.pdf"`);
  doc.pipe(res);

  const PRIMARY = '#4F46E5';
  const DARK    = '#1e293b';
  const MUTED   = '#64748b';
  const LIGHT   = '#f8fafc';
  const GREEN   = '#059669';

  const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  const formatAmount = (a, c) => `${Number(a).toLocaleString('fr-DJ')} ${c || 'DJF'}`;

  // ─── En-tête ────────────────────────────────────────────
  doc.rect(0, 0, doc.page.width, 100).fill(PRIMARY);

  doc.fontSize(28).fillColor('#ffffff').font('Helvetica-Bold')
    .text('BulkSMS', 50, 30);
  doc.fontSize(11).fillColor('rgba(255,255,255,0.8)').font('Helvetica')
    .text('Plateforme de communication SMS', 50, 62);

  doc.fontSize(22).fillColor('#ffffff').font('Helvetica-Bold')
    .text('FACTURE', 0, 38, { align: 'right', width: doc.page.width - 50 });
  doc.fontSize(11).fillColor('rgba(255,255,255,0.8)').font('Helvetica')
    .text(invoiceNumber, 0, 65, { align: 'right', width: doc.page.width - 50 });

  // ─── Infos facture ──────────────────────────────────────
  doc.y = 120;

  // Colonne gauche — infos émetteur
  doc.fontSize(9).fillColor(MUTED).font('Helvetica-Bold')
    .text('ÉMETTEUR', 50, 120);
  doc.fontSize(10).fillColor(DARK).font('Helvetica-Bold')
    .text('BulkSMS Platform', 50, 132);
  doc.fontSize(9).fillColor(MUTED).font('Helvetica')
    .text('Djibouti, République de Djibouti', 50, 145)
    .text('support@bulksms.dj', 50, 157);

  // Colonne droite — infos client
  doc.fontSize(9).fillColor(MUTED).font('Helvetica-Bold')
    .text('FACTURÉ À', 320, 120);
  doc.fontSize(10).fillColor(DARK).font('Helvetica-Bold')
    .text(tenant?.name || '—', 320, 132);
  doc.fontSize(9).fillColor(MUTED).font('Helvetica')
    .text(tenant?.email || '', 320, 145)
    .text(`${user?.first_name || ''} ${user?.last_name || ''}`.trim(), 320, 157);

  // Dates
  doc.fontSize(9).fillColor(MUTED).font('Helvetica-Bold')
    .text('DATE', 440, 120);
  doc.fontSize(9).fillColor(DARK).font('Helvetica')
    .text(formatDate(payment.createdAt || payment.created_at), 440, 132);

  if (payment.completedAt || payment.completed_at) {
    doc.fontSize(9).fillColor(MUTED).font('Helvetica-Bold')
      .text('PAYÉ LE', 440, 145);
    doc.fontSize(9).fillColor(GREEN).font('Helvetica-Bold')
      .text(formatDate(payment.completedAt || payment.completed_at), 440, 157);
  }

  // ─── Séparateur ─────────────────────────────────────────
  doc.moveTo(50, 185).lineTo(doc.page.width - 50, 185).strokeColor('#e2e8f0').lineWidth(1).stroke();

  // ─── Tableau détail ─────────────────────────────────────
  const tableTop = 200;
  const col = { desc: 50, qty: 330, unit: 400, total: 470 };

  // Header tableau
  doc.rect(50, tableTop, doc.page.width - 100, 24).fill('#f1f5f9');
  doc.fontSize(9).fillColor(MUTED).font('Helvetica-Bold')
    .text('DESCRIPTION', col.desc + 8, tableTop + 8)
    .text('QTÉ', col.qty, tableTop + 8)
    .text('PRIX UNITAIRE', col.unit - 10, tableTop + 8)
    .text('TOTAL', col.total, tableTop + 8);

  // Ligne produit
  const rowY = tableTop + 32;
  doc.fontSize(10).fillColor(DARK).font('Helvetica-Bold')
    .text(pkg?.name || 'Package SMS', col.desc + 8, rowY);
  doc.fontSize(9).fillColor(MUTED).font('Helvetica')
    .text(`${Number(payment.sms_count).toLocaleString()} crédits SMS`, col.desc + 8, rowY + 14);

  doc.fontSize(10).fillColor(DARK).font('Helvetica')
    .text('1', col.qty, rowY)
    .text(formatAmount(payment.amount, payment.currency), col.unit - 10, rowY)
    .text(formatAmount(payment.amount, payment.currency), col.total, rowY);

  doc.moveTo(50, rowY + 32).lineTo(doc.page.width - 50, rowY + 32).strokeColor('#e2e8f0').lineWidth(0.5).stroke();

  // ─── Total ──────────────────────────────────────────────
  const totalY = rowY + 48;

  doc.rect(350, totalY, doc.page.width - 400, 36).fill(PRIMARY);
  doc.fontSize(11).fillColor('#ffffff').font('Helvetica-Bold')
    .text('TOTAL PAYÉ', 360, totalY + 12)
    .text(formatAmount(payment.amount, payment.currency), 360, totalY + 12, {
      align: 'right', width: doc.page.width - 410,
    });

  // ─── Statut & méthode ───────────────────────────────────
  const statusY = totalY + 60;

  doc.rect(50, statusY, 150, 50).fill('#f0fdf4');
  doc.fontSize(8).fillColor(MUTED).font('Helvetica-Bold')
    .text('STATUT', 65, statusY + 8);
  doc.fontSize(11).fillColor(GREEN).font('Helvetica-Bold')
    .text('✓ PAYÉ', 65, statusY + 20);

  doc.rect(220, statusY, 150, 50).fill(LIGHT);
  doc.fontSize(8).fillColor(MUTED).font('Helvetica-Bold')
    .text('MÉTHODE', 235, statusY + 8);
  doc.fontSize(10).fillColor(DARK).font('Helvetica')
    .text('Waafi Pay', 235, statusY + 20);

  doc.rect(390, statusY, 165, 50).fill(LIGHT);
  doc.fontSize(8).fillColor(MUTED).font('Helvetica-Bold')
    .text('RÉFÉRENCE', 405, statusY + 8);
  doc.fontSize(8).fillColor(DARK).font('Helvetica')
    .text(payment.waafi_transaction_id || invoiceNumber, 405, statusY + 20);

  // ─── Note de bas de page ─────────────────────────────────
  doc.fontSize(8).fillColor(MUTED).font('Helvetica')
    .text('Merci de votre confiance. Pour toute question : support@bulksms.dj', 50, 720, { align: 'center', width: doc.page.width - 100 });
  doc.moveTo(50, 715).lineTo(doc.page.width - 50, 715).strokeColor('#e2e8f0').lineWidth(0.5).stroke();

  doc.end();
};
