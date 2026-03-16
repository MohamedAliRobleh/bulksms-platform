const { Op } = require('sequelize');
const XLSX = require('xlsx');
const { Contact, ContactGroup, sequelize } = require('../models');

exports.getContacts = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search, group_id, is_subscribed } = req.query;
    const offset = (page - 1) * limit;
    const where = { tenant_id: req.tenantId };

    if (search) {
      where[Op.or] = [
        { phone: { [Op.iLike]: `%${search}%` } },
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (group_id) where.group_id = group_id;
    if (is_subscribed !== undefined) where.is_subscribed = is_subscribed === 'true';

    const { count, rows } = await Contact.findAndCountAll({
      where,
      include: [{ model: ContactGroup, as: 'group', attributes: ['id', 'name'] }],
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']],
    });

    res.json({ contacts: rows, total: count, page: parseInt(page), totalPages: Math.ceil(count / limit) });
  } catch (error) {
    next(error);
  }
};

exports.createContact = async (req, res, next) => {
  try {
    const { phone, first_name, last_name, email, group_id, custom_fields, tags } = req.body;
    const contact = await Contact.create({
      tenant_id: req.tenantId,
      phone, first_name, last_name, email, group_id, custom_fields, tags,
    });

    if (group_id) {
      await ContactGroup.increment('contact_count', { where: { id: group_id } });
    }

    res.status(201).json(contact);
  } catch (error) {
    next(error);
  }
};

exports.updateContact = async (req, res, next) => {
  try {
    const contact = await Contact.findOne({ where: { id: req.params.id, tenant_id: req.tenantId } });
    if (!contact) return res.status(404).json({ error: 'Contact not found' });

    const oldGroupId = contact.group_id;
    await contact.update(req.body);

    // Update group counts if group changed
    if (oldGroupId !== contact.group_id) {
      if (oldGroupId) await ContactGroup.decrement('contact_count', { where: { id: oldGroupId } });
      if (contact.group_id) await ContactGroup.increment('contact_count', { where: { id: contact.group_id } });
    }

    res.json(contact);
  } catch (error) {
    next(error);
  }
};

exports.deleteContact = async (req, res, next) => {
  try {
    const contact = await Contact.findOne({ where: { id: req.params.id, tenant_id: req.tenantId } });
    if (!contact) return res.status(404).json({ error: 'Contact not found' });

    if (contact.group_id) {
      await ContactGroup.decrement('contact_count', { where: { id: contact.group_id } });
    }

    await contact.destroy();
    res.json({ message: 'Contact deleted' });
  } catch (error) {
    next(error);
  }
};

exports.deleteContacts = async (req, res, next) => {
  try {
    const { ids } = req.body;
    const contacts = await Contact.findAll({ where: { id: { [Op.in]: ids }, tenant_id: req.tenantId } });

    // Decrement group counts
    const groupUpdates = {};
    contacts.forEach(c => { if (c.group_id) groupUpdates[c.group_id] = (groupUpdates[c.group_id] || 0) + 1; });
    for (const [gid, count] of Object.entries(groupUpdates)) {
      await ContactGroup.decrement('contact_count', { by: count, where: { id: gid } });
    }

    await Contact.destroy({ where: { id: { [Op.in]: ids }, tenant_id: req.tenantId } });
    res.json({ message: `${contacts.length} contacts deleted` });
  } catch (error) {
    next(error);
  }
};

exports.importContacts = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { group_id } = req.body;
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { raw: false });

    if (sheet.length === 0) return res.status(400).json({ error: 'File is empty' });

    let imported = 0;
    let skipped = 0;
    const errors = [];

    for (const row of sheet) {
      const phone = (row.phone || row.Phone || row.PHONE || row.telephone || row.numero || '').toString().trim();
      if (!phone) { skipped++; continue; }

      try {
        const [, created] = await Contact.findOrCreate({
          where: { phone, tenant_id: req.tenantId },
          defaults: {
            tenant_id: req.tenantId,
            phone,
            first_name: row.first_name || row.prenom || row.Prenom || '',
            last_name: row.last_name || row.nom || row.Nom || '',
            email: row.email || row.Email || '',
            group_id: group_id || null,
          },
        });

        if (created) imported++;
        else skipped++;
      } catch (err) {
        errors.push({ phone, error: err.message });
        skipped++;
      }
    }

    if (group_id && imported > 0) {
      await ContactGroup.increment('contact_count', { by: imported, where: { id: group_id } });
    }

    res.json({ imported, skipped, total: sheet.length, errors: errors.slice(0, 10) });
  } catch (error) {
    next(error);
  }
};

// ─── GROUPS ───────────────────────────────────────────────────────────────
exports.getGroups = async (req, res, next) => {
  try {
    const groups = await ContactGroup.findAll({
      where: { tenant_id: req.tenantId },
      order: [['created_at', 'DESC']],
    });
    res.json(groups);
  } catch (error) {
    next(error);
  }
};

exports.createGroup = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const group = await ContactGroup.create({ tenant_id: req.tenantId, name, description });
    res.status(201).json(group);
  } catch (error) {
    next(error);
  }
};

exports.updateGroup = async (req, res, next) => {
  try {
    const group = await ContactGroup.findOne({ where: { id: req.params.id, tenant_id: req.tenantId } });
    if (!group) return res.status(404).json({ error: 'Group not found' });
    await group.update(req.body);
    res.json(group);
  } catch (error) {
    next(error);
  }
};

exports.deleteGroup = async (req, res, next) => {
  try {
    const group = await ContactGroup.findOne({ where: { id: req.params.id, tenant_id: req.tenantId } });
    if (!group) return res.status(404).json({ error: 'Group not found' });
    await Contact.update({ group_id: null }, { where: { group_id: group.id } });
    await group.destroy();
    res.json({ message: 'Group deleted' });
  } catch (error) {
    next(error);
  }
};
