const { Template } = require('../models');

const extractVariables = (content) => {
  const matches = content.match(/\{(\w+)\}/g) || [];
  return [...new Set(matches.map(m => m.slice(1, -1)))];
};

const countSms = (text) => {
  const len = text.length;
  if (len <= 160) return 1;
  return Math.ceil(len / 153);
};

exports.getTemplates = async (req, res, next) => {
  try {
    const templates = await Template.findAll({
      where: { tenant_id: req.tenantId },
      order: [['created_at', 'DESC']],
    });
    res.json(templates);
  } catch (error) {
    next(error);
  }
};

exports.getTemplate = async (req, res, next) => {
  try {
    const template = await Template.findOne({ where: { id: req.params.id, tenant_id: req.tenantId } });
    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.json(template);
  } catch (error) {
    next(error);
  }
};

exports.createTemplate = async (req, res, next) => {
  try {
    const { name, content, category } = req.body;
    const variables = extractVariables(content);
    const template = await Template.create({
      tenant_id: req.tenantId,
      name, content, category,
      variables,
      char_count: content.length,
      sms_count: countSms(content),
    });
    res.status(201).json(template);
  } catch (error) {
    next(error);
  }
};

exports.updateTemplate = async (req, res, next) => {
  try {
    const template = await Template.findOne({ where: { id: req.params.id, tenant_id: req.tenantId } });
    if (!template) return res.status(404).json({ error: 'Template not found' });

    const { name, content, category } = req.body;
    await template.update({
      name, content, category,
      variables: extractVariables(content),
      char_count: content.length,
      sms_count: countSms(content),
    });
    res.json(template);
  } catch (error) {
    next(error);
  }
};

exports.deleteTemplate = async (req, res, next) => {
  try {
    const template = await Template.findOne({ where: { id: req.params.id, tenant_id: req.tenantId } });
    if (!template) return res.status(404).json({ error: 'Template not found' });
    await template.destroy();
    res.json({ message: 'Template deleted' });
  } catch (error) {
    next(error);
  }
};
