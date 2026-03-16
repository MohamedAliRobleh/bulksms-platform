import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import api from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import ConfirmModal from '../../components/common/ConfirmModal';

const countSms = (text) => {
  if (!text) return { chars: 0, sms: 0 };
  const len = text.length;
  return { chars: len, sms: len === 0 ? 0 : len <= 160 ? 1 : Math.ceil(len / 153) };
};

const TemplateModal = ({ template, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    name: template?.name || '',
    content: template?.content || '',
    category: template?.category || 'general',
  });
  const [loading, setLoading] = useState(false);
  const smsInfo = countSms(form.content);
  const variables = [...(form.content.match(/\{(\w+)\}/g) || [])];

  const insertVar = (v) => {
    setForm(f => ({ ...f, content: f.content + v }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (template?.id) {
        await api.put(`/templates/${template.id}`, form);
        toast.success('Template mis à jour');
      } else {
        await api.post('/templates', form);
        toast.success('Template créé');
      }
      onSuccess();
      onClose();
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop-custom" onClick={onClose}>
      <div className="modal-dialog-custom modal-dialog-custom--lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header-custom">
          <h5><i className="bi bi-file-text-fill text-primary me-2" />
            {template?.id ? 'Modifier le template' : 'Nouveau template'}
          </h5>
          <button className="btn-close" onClick={onClose} />
        </div>
        <div className="modal-body-custom">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-8">
                <label className="form-label">Nom du template *</label>
                <input type="text" className="form-control" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Promo Ramadan, Rappel RDV..." required />
              </div>
              <div className="col-md-4">
                <label className="form-label">Catégorie</label>
                <select className="form-select" value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  <option value="general">Général</option>
                  <option value="promotion">Promotion</option>
                  <option value="transactional">Transactionnel</option>
                  <option value="notification">Notification</option>
                  <option value="reminder">Rappel</option>
                  <option value="event">Événement</option>
                </select>
              </div>
              <div className="col-12">
                <label className="form-label">Contenu du message *</label>
                <div className="template-variables-hint">
                  <span className="me-2">Insérer :</span>
                  {['{prenom}', '{nom}', '{email}', '{phone}'].map(v => (
                    <button key={v} type="button" className="var-tag" onClick={() => insertVar(v)}>{v}</button>
                  ))}
                </div>
                <textarea className="form-control sms-textarea" rows={5} value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="Bonjour {prenom}, votre code de confirmation est..." required />
                <div className="sms-counter">
                  <span className={smsInfo.chars > 160 * 3 ? 'text-danger' : 'text-muted'}>
                    {smsInfo.chars} caractères
                  </span>
                  <span className={`ms-2 fw-semibold ${smsInfo.sms > 1 ? 'text-warning' : 'text-success'}`}>
                    = {smsInfo.sms} SMS
                  </span>
                  {variables.length > 0 && (
                    <span className="ms-3 text-primary">
                      <i className="bi bi-braces me-1" />
                      {variables.join(', ')}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="d-flex gap-2 mt-4">
              <button type="button" className="btn btn-light flex-fill" onClick={onClose}>Annuler</button>
              <button type="submit" className="btn btn-primary flex-fill" disabled={loading}>
                {loading ? <span className="spinner-border spinner-border-sm" /> : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const categoryColors = {
  general: { bg: '#F1F5F9', text: '#475569', icon: 'bi-file-text' },
  promotion: { bg: '#FEF3C7', text: '#D97706', icon: 'bi-tag-fill' },
  transactional: { bg: '#DBEAFE', text: '#2563EB', icon: 'bi-arrow-repeat' },
  notification: { bg: '#EDE9FE', text: '#7C3AED', icon: 'bi-bell-fill' },
  reminder: { bg: '#FCE7F3', text: '#DB2777', icon: 'bi-alarm-fill' },
  event: { bg: '#D1FAE5', text: '#059669', icon: 'bi-calendar-event-fill' },
};

const Templates = () => {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [search, setSearch] = useState('');

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/templates');
      setTemplates(data);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const handleDelete = async () => {
    try {
      await api.delete(`/templates/${deleteModal.id}`);
      toast.success('Template supprimé');
      setDeleteModal(null);
      loadTemplates();
    } catch {
      // handled
    }
  };

  const filtered = templates.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-content">
      <PageHeader title={t('templates.title')} subtitle={`${templates.length} templates`}>
        <button className="btn btn-primary" onClick={() => setModal({})}>
          <i className="bi bi-plus-lg me-2" />{t('templates.new_template')}
        </button>
      </PageHeader>

      <div className="mb-4">
        <div className="search-input-wrap" style={{ maxWidth: 400 }}>
          <i className="bi bi-search search-icon" />
          <input type="text" className="form-control search-input" placeholder="Rechercher un template..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center py-5"><div className="spinner-border text-primary" /></div>
      ) : (
        <div className="row g-3">
          {filtered.length === 0 ? (
            <div className="col-12">
              <div className="empty-state">
                <i className="bi bi-file-text" />
                <h5>{t('templates.no_templates')}</h5>
                <p>Créez des modèles de messages réutilisables pour vos campagnes</p>
                <button className="btn btn-primary" onClick={() => setModal({})}>
                  <i className="bi bi-plus-lg me-2" />Créer un template
                </button>
              </div>
            </div>
          ) : filtered.map(tmpl => {
            const cat = categoryColors[tmpl.category] || categoryColors.general;
            const sms = countSms(tmpl.content);
            return (
              <div className="col-md-6 col-xl-4" key={tmpl.id}>
                <div className="template-card">
                  <div className="template-card-header">
                    <div className="template-category-badge" style={{ background: cat.bg, color: cat.text }}>
                      <i className={`bi ${cat.icon} me-1`} />{tmpl.category}
                    </div>
                    <div className="template-card-actions">
                      <button className="btn-table-action btn-table-action--info" onClick={() => setModal(tmpl)}>
                        <i className="bi bi-pencil-fill" />
                      </button>
                      <button className="btn-table-action btn-table-action--danger" onClick={() => setDeleteModal(tmpl)}>
                        <i className="bi bi-trash-fill" />
                      </button>
                    </div>
                  </div>
                  <h6 className="template-name">{tmpl.name}</h6>
                  <p className="template-content">{tmpl.content}</p>
                  <div className="template-card-footer">
                    <span className="template-meta"><i className="bi bi-chat-text me-1" />{sms.chars} chars</span>
                    <span className={`template-meta ${sms.sms > 1 ? 'text-warning' : 'text-success'}`}>
                      <i className="bi bi-envelope me-1" />{sms.sms} SMS
                    </span>
                    {tmpl.variables?.length > 0 && (
                      <span className="template-meta text-primary">
                        <i className="bi bi-braces me-1" />{tmpl.variables.length} var.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal !== null && (
        <TemplateModal template={modal} onClose={() => setModal(null)} onSuccess={loadTemplates} />
      )}
      <ConfirmModal
        show={!!deleteModal}
        title="Supprimer le template"
        message={`Supprimer "${deleteModal?.name}" ?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal(null)}
      />
    </div>
  );
};

export default Templates;
