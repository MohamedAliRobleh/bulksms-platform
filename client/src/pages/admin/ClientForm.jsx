import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import api from '../../services/api';
import PageHeader from '../../components/common/PageHeader';

const ClientForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [form, setForm] = useState({
    name: '', email: '', phone: '', primary_color: '#4F46E5',
    admin_first_name: '', admin_last_name: '', admin_email: '',
    sender_name: '', initial_credits: 0, notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  useEffect(() => {
    if (isEdit) {
      api.get(`/admin/tenants/${id}`).then(({ data }) => {
        setForm({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          primary_color: data.primary_color || '#4F46E5',
          notes: data.notes || '',
          admin_first_name: data.users?.[0]?.first_name || '',
          admin_last_name: data.users?.[0]?.last_name || '',
          admin_email: data.users?.[0]?.email || '',
          sender_name: data.senderIds?.[0]?.name || '',
          initial_credits: 0,
        });
        setFetching(false);
      }).catch(() => setFetching(false));
    }
  }, [id, isEdit]);

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/admin/tenants/${id}`, {
          name: form.name, email: form.email, phone: form.phone,
          primary_color: form.primary_color, notes: form.notes,
        });
        toast.success('Client mis à jour');
      } else {
        await api.post('/admin/tenants', form);
        toast.success('Client créé avec succès ! Un email a été envoyé.');
      }
      navigate('/admin/clients');
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="d-flex justify-content-center py-5"><div className="spinner-border text-primary" /></div>;
  }

  return (
    <div className="page-content">
      <PageHeader
        title={isEdit ? 'Modifier le client' : t('admin.add_client')}
        subtitle={isEdit ? form.name : 'Créer un nouveau compte client'}
      >
        <Link to="/admin/clients" className="btn btn-light">
          <i className="bi bi-arrow-left me-2" />{t('common.back')}
        </Link>
      </PageHeader>

      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          {/* Company info */}
          <div className="col-lg-8">
            <div className="card-custom mb-4">
              <div className="card-custom-header">
                <h5><i className="bi bi-building me-2 text-primary" />Informations de l'entreprise</h5>
              </div>
              <div className="card-custom-body">
                <div className="row g-3">
                  <div className="col-md-8">
                    <label className="form-label">Nom de l'entreprise *</label>
                    <input type="text" className="form-control" value={form.name}
                      onChange={e => update('name', e.target.value)} placeholder="Ex: Banque de Djibouti" required />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Couleur principale</label>
                    <div className="d-flex align-items-center gap-2">
                      <input type="color" className="form-control form-control-color" value={form.primary_color}
                        onChange={e => update('primary_color', e.target.value)} style={{ width: '56px', height: '42px' }} />
                      <input type="text" className="form-control" value={form.primary_color}
                        onChange={e => update('primary_color', e.target.value)} placeholder="#4F46E5" />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Email de contact *</label>
                    <input type="email" className="form-control" value={form.email}
                      onChange={e => update('email', e.target.value)} placeholder="contact@entreprise.dj" required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Téléphone</label>
                    <input type="text" className="form-control" value={form.phone}
                      onChange={e => update('phone', e.target.value)} placeholder="+253 77 XX XX XX" />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Notes (interne)</label>
                    <textarea className="form-control" rows={3} value={form.notes}
                      onChange={e => update('notes', e.target.value)} placeholder="Notes internes sur ce client..." />
                  </div>
                </div>
              </div>
            </div>

            {!isEdit && (
              <>
                {/* Admin user */}
                <div className="card-custom mb-4">
                  <div className="card-custom-header">
                    <h5><i className="bi bi-person-gear me-2 text-success" />Compte administrateur</h5>
                    <small className="text-muted">Les identifiants seront envoyés par email</small>
                  </div>
                  <div className="card-custom-body">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Prénom *</label>
                        <input type="text" className="form-control" value={form.admin_first_name}
                          onChange={e => update('admin_first_name', e.target.value)} placeholder="Prénom" required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Nom *</label>
                        <input type="text" className="form-control" value={form.admin_last_name}
                          onChange={e => update('admin_last_name', e.target.value)} placeholder="Nom de famille" required />
                      </div>
                      <div className="col-12">
                        <label className="form-label">Email de connexion *</label>
                        <input type="email" className="form-control" value={form.admin_email}
                          onChange={e => update('admin_email', e.target.value)} placeholder="admin@entreprise.dj" required />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SMS Config */}
                <div className="card-custom">
                  <div className="card-custom-header">
                    <h5><i className="bi bi-chat-dots me-2 text-info" />Configuration SMS</h5>
                  </div>
                  <div className="card-custom-body">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Sender ID par défaut</label>
                        <input type="text" className="form-control" value={form.sender_name}
                          onChange={e => update('sender_name', e.target.value.slice(0, 11))}
                          placeholder="ENTREPRISE" maxLength={11} />
                        <div className="form-text">11 caractères max, sans espaces ni caractères spéciaux</div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Crédits initiaux</label>
                        <div className="input-group">
                          <span className="input-group-text"><i className="bi bi-lightning-charge-fill text-warning" /></span>
                          <input type="number" className="form-control" value={form.initial_credits}
                            onChange={e => update('initial_credits', parseInt(e.target.value) || 0)}
                            min={0} placeholder="0" />
                          <span className="input-group-text">SMS</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Sidebar info */}
          <div className="col-lg-4">
            <div className="card-custom mb-4">
              <div className="card-custom-header">
                <h5><i className="bi bi-info-circle me-2 text-info" />Résumé</h5>
              </div>
              <div className="card-custom-body">
                <div className="summary-items">
                  <div className="summary-item">
                    <span className="summary-label">Entreprise</span>
                    <span className="summary-value">{form.name || '—'}</span>
                  </div>
                  {!isEdit && (
                    <>
                      <div className="summary-item">
                        <span className="summary-label">Admin</span>
                        <span className="summary-value">{form.admin_email || '—'}</span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">Sender ID</span>
                        <span className="summary-value">{form.sender_name || '—'}</span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">Crédits offerts</span>
                        <span className="summary-value text-success fw-bold">
                          {(form.initial_credits || 0).toLocaleString()} SMS
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-100 btn-lg" disabled={loading}>
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-2" />Traitement...</>
              ) : (
                <><i className="bi bi-check-lg me-2" />{isEdit ? 'Enregistrer' : 'Créer le client'}</>
              )}
            </button>

            {!isEdit && (
              <div className="alert alert-info mt-3 small">
                <i className="bi bi-envelope me-2" />
                Un email avec les identifiants sera automatiquement envoyé au client.
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default ClientForm;
