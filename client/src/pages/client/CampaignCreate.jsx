import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import api from '../../services/api';
import PageHeader from '../../components/common/PageHeader';

const countSms = (text) => {
  if (!text) return { chars: 0, sms: 0 };
  const len = text.length;
  return { chars: len, sms: len <= 160 ? 1 : Math.ceil(len / 153) };
};

const steps = ['Contenu', 'Destinataires', 'Envoi'];

const CampaignCreate = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [senderIds, setSenderIds] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recipientsCount, setRecipientsCount] = useState(null);

  const [form, setForm] = useState({
    name: '',
    sender_id: '',
    content: '',
    template_id: '',
    target_type: 'all',
    target_ids: [],
    scheduled_at: '',
    sendNow: true,
  });

  useEffect(() => {
    Promise.all([
      api.get('/settings/sender-ids'),
      api.get('/templates'),
      api.get('/groups'),
    ]).then(([s, t, g]) => {
      setSenderIds(s.data);
      setTemplates(t.data);
      setGroups(g.data);
      if (s.data.length > 0) {
        const def = s.data.find(x => x.is_default) || s.data[0];
        setForm(f => ({ ...f, sender_id: def.name }));
      }
    });
  }, []);

  useEffect(() => {
    const calcRecipients = async () => {
      if (form.target_type === 'all') {
        try {
          const { data } = await api.get('/contacts', { params: { limit: 1 } });
          setRecipientsCount(data.total);
        } catch { setRecipientsCount(null); }
      } else if (form.target_type === 'group' && form.target_ids.length > 0) {
        const total = groups
          .filter(g => form.target_ids.includes(g.id))
          .reduce((s, g) => s + (g.contact_count || 0), 0);
        setRecipientsCount(total);
      } else {
        setRecipientsCount(null);
      }
    };
    calcRecipients();
  }, [form.target_type, form.target_ids, groups]);

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const applyTemplate = (tmpl) => {
    setForm(f => ({ ...f, content: tmpl.content, template_id: tmpl.id }));
  };

  const toggleGroup = (id) => {
    setForm(f => ({
      ...f,
      target_ids: f.target_ids.includes(id)
        ? f.target_ids.filter(x => x !== id)
        : [...f.target_ids, id],
    }));
  };

  const handleSubmit = async (isSendNow) => {
    if (!form.name || !form.sender_id || !form.content) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    if (form.target_type === 'group' && form.target_ids.length === 0) {
      toast.error('Veuillez sélectionner au moins un groupe');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        scheduled_at: !isSendNow && form.scheduled_at ? form.scheduled_at : null,
      };
      const { data } = await api.post('/campaigns', payload);

      if (isSendNow) {
        await api.post(`/campaigns/${data.campaign.id}/send`);
        toast.success('Campagne envoyée !');
      } else if (form.scheduled_at) {
        toast.success('Campagne planifiée !');
      } else {
        toast.success('Brouillon sauvegardé');
      }
      navigate('/dashboard/campaigns');
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  const smsInfo = countSms(form.content);

  return (
    <div className="page-content">
      <PageHeader title={t('campaigns.new_campaign')} subtitle="Créez et envoyez votre campagne SMS">
        <Link to="/dashboard/campaigns" className="btn btn-light">
          <i className="bi bi-arrow-left me-2" />{t('common.back')}
        </Link>
      </PageHeader>

      {/* Steps */}
      <div className="steps-bar mb-4">
        {steps.map((s, i) => (
          <div key={i} className={`step-item ${i === step ? 'step-active' : ''} ${i < step ? 'step-done' : ''}`}>
            <div className="step-number">{i < step ? <i className="bi bi-check-lg" /> : i + 1}</div>
            <div className="step-label">{s}</div>
            {i < steps.length - 1 && <div className="step-line" />}
          </div>
        ))}
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          {/* STEP 0: Content */}
          {step === 0 && (
            <div className="card-custom">
              <div className="card-custom-header">
                <h5><i className="bi bi-chat-dots text-primary me-2" />Composition du message</h5>
              </div>
              <div className="card-custom-body">
                <div className="row g-3">
                  <div className="col-md-8">
                    <label className="form-label">Nom de la campagne *</label>
                    <input type="text" className="form-control" value={form.name}
                      onChange={e => update('name', e.target.value)}
                      placeholder="Ex: Promo Ramadan 2024" required />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Expéditeur (Sender ID) *</label>
                    <select className="form-select" value={form.sender_id} onChange={e => update('sender_id', e.target.value)}>
                      <option value="">Sélectionner...</option>
                      {senderIds.map(s => (
                        <option key={s.id} value={s.name}>{s.name}{s.is_default ? ' (défaut)' : ''}</option>
                      ))}
                    </select>
                  </div>

                  {/* Template picker */}
                  {templates.length > 0 && (
                    <div className="col-12">
                      <label className="form-label">Utiliser un template (optionnel)</label>
                      <div className="template-picker">
                        {templates.slice(0, 6).map(tmpl => (
                          <button key={tmpl.id} type="button"
                            className={`template-pick-btn ${form.template_id === tmpl.id ? 'template-pick-btn--active' : ''}`}
                            onClick={() => applyTemplate(tmpl)}>
                            <i className="bi bi-file-text me-1" />{tmpl.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="col-12">
                    <label className="form-label">Message *</label>
                    <div className="template-variables-hint">
                      <span className="me-2">Variables :</span>
                      {['{prenom}', '{nom}', '{email}'].map(v => (
                        <button key={v} type="button" className="var-tag"
                          onClick={() => update('content', form.content + v)}>{v}</button>
                      ))}
                    </div>
                    <textarea className="form-control sms-textarea" rows={6} value={form.content}
                      onChange={e => update('content', e.target.value)}
                      placeholder="Cher(e) {prenom}, nous avons le plaisir de vous informer..." />
                    <div className="sms-counter">
                      <span className="text-muted">{smsInfo.chars} / 160 caractères</span>
                      <span className={`fw-semibold ms-3 ${smsInfo.sms > 1 ? 'text-warning' : 'text-success'}`}>
                        {smsInfo.sms} SMS par destinataire
                      </span>
                    </div>
                  </div>
                </div>
                <div className="d-flex justify-content-end mt-4">
                  <button className="btn btn-primary" onClick={() => setStep(1)}
                    disabled={!form.name || !form.sender_id || !form.content}>
                    Suivant <i className="bi bi-arrow-right ms-2" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 1: Recipients */}
          {step === 1 && (
            <div className="card-custom">
              <div className="card-custom-header">
                <h5><i className="bi bi-people-fill text-success me-2" />Choisir les destinataires</h5>
              </div>
              <div className="card-custom-body">
                <div className="target-options">
                  {[
                    { value: 'all', icon: 'bi-globe', label: 'Tous les contacts', desc: 'Envoyer à toute votre base de contacts' },
                    { value: 'group', icon: 'bi-collection-fill', label: 'Par groupe', desc: 'Sélectionnez un ou plusieurs groupes' },
                  ].map(opt => (
                    <div key={opt.value}
                      className={`target-option ${form.target_type === opt.value ? 'target-option--active' : ''}`}
                      onClick={() => update('target_type', opt.value)}>
                      <div className="target-option-radio">
                        <div className={`radio-dot ${form.target_type === opt.value ? 'radio-dot--active' : ''}`} />
                      </div>
                      <div className="target-option-icon">
                        <i className={`bi ${opt.icon}`} />
                      </div>
                      <div>
                        <div className="fw-semibold">{opt.label}</div>
                        <div className="text-muted small">{opt.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {form.target_type === 'group' && (
                  <div className="groups-selector mt-3">
                    <label className="form-label">Sélectionner les groupes</label>
                    {groups.length === 0 ? (
                      <div className="alert alert-info">Aucun groupe créé. <Link to="/dashboard/groups">Créer des groupes</Link></div>
                    ) : (
                      <div className="groups-checkboxes">
                        {groups.map(g => (
                          <div key={g.id} className={`group-checkbox-item ${form.target_ids.includes(g.id) ? 'selected' : ''}`}
                            onClick={() => toggleGroup(g.id)}>
                            <input type="checkbox" className="form-check-input me-2" checked={form.target_ids.includes(g.id)} readOnly />
                            <div>
                              <div className="fw-semibold">{g.name}</div>
                              <div className="text-muted small">{(g.contact_count || 0).toLocaleString()} contacts</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {recipientsCount !== null && (
                  <div className="recipients-count mt-3">
                    <i className="bi bi-people-fill text-primary me-2" />
                    <strong>{recipientsCount.toLocaleString()}</strong> destinataires sélectionnés
                  </div>
                )}

                <div className="d-flex gap-2 justify-content-between mt-4">
                  <button className="btn btn-light" onClick={() => setStep(0)}>
                    <i className="bi bi-arrow-left me-2" />Retour
                  </button>
                  <button className="btn btn-primary" onClick={() => setStep(2)}
                    disabled={form.target_type === 'group' && form.target_ids.length === 0}>
                    Suivant <i className="bi bi-arrow-right ms-2" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Send */}
          {step === 2 && (
            <div className="card-custom">
              <div className="card-custom-header">
                <h5><i className="bi bi-send-fill text-primary me-2" />Options d'envoi</h5>
              </div>
              <div className="card-custom-body">
                <div className="send-options">
                  <div className={`send-option ${form.sendNow ? 'send-option--active' : ''}`}
                    onClick={() => update('sendNow', true)}>
                    <div className="send-option-icon bg-primary-soft">
                      <i className="bi bi-lightning-fill text-primary" />
                    </div>
                    <div>
                      <div className="fw-semibold">Envoyer maintenant</div>
                      <div className="text-muted small">L'envoi démarre immédiatement</div>
                    </div>
                    <div className={`radio-dot ms-auto ${form.sendNow ? 'radio-dot--active' : ''}`} />
                  </div>
                  <div className={`send-option ${!form.sendNow ? 'send-option--active' : ''}`}
                    onClick={() => update('sendNow', false)}>
                    <div className="send-option-icon bg-info-soft">
                      <i className="bi bi-calendar-event text-info" />
                    </div>
                    <div>
                      <div className="fw-semibold">Planifier l'envoi</div>
                      <div className="text-muted small">Choisissez une date et heure précise</div>
                    </div>
                    <div className={`radio-dot ms-auto ${!form.sendNow ? 'radio-dot--active' : ''}`} />
                  </div>
                </div>

                {!form.sendNow && (
                  <div className="mt-3">
                    <label className="form-label">Date et heure d'envoi *</label>
                    <input type="datetime-local" className="form-control"
                      value={form.scheduled_at} onChange={e => update('scheduled_at', e.target.value)}
                      min={new Date().toISOString().slice(0, 16)} />
                  </div>
                )}

                <div className="d-flex gap-2 justify-content-between mt-4">
                  <button className="btn btn-light" onClick={() => setStep(1)}>
                    <i className="bi bi-arrow-left me-2" />Retour
                  </button>
                  <div className="d-flex gap-2">
                    <button className="btn btn-light" onClick={() => handleSubmit(false)} disabled={loading}>
                      <i className="bi bi-floppy me-1" />Brouillon
                    </button>
                    <button className="btn btn-success" onClick={() => handleSubmit(form.sendNow)} disabled={loading}>
                      {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                      {form.sendNow
                        ? <><i className="bi bi-send-fill me-2" />Envoyer maintenant</>
                        : <><i className="bi bi-calendar-check me-2" />Planifier</>
                      }
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Preview sidebar */}
        <div className="col-lg-4">
          <div className="card-custom sticky-top" style={{ top: '80px' }}>
            <div className="card-custom-header">
              <h5><i className="bi bi-phone text-primary me-2" />Aperçu</h5>
            </div>
            <div className="card-custom-body">
              <div className="sms-preview-wrap">
                <div className="sms-phone-frame">
                  <div className="sms-phone-notch" />
                  <div className="sms-phone-screen">
                    <div className="sms-sender-preview">{form.sender_id || 'SENDER'}</div>
                    <div className="sms-bubble">
                      {form.content || <span className="text-muted fst-italic">Votre message apparaîtra ici...</span>}
                    </div>
                    <div className="sms-time">{new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
              </div>
              <div className="preview-stats mt-3">
                <div className="preview-stat">
                  <span>Nom</span>
                  <strong className="text-truncate">{form.name || '—'}</strong>
                </div>
                <div className="preview-stat">
                  <span>Caractères</span>
                  <strong className={smsInfo.chars > 160 ? 'text-warning' : ''}>{smsInfo.chars}/160</strong>
                </div>
                <div className="preview-stat">
                  <span>SMS/destinataire</span>
                  <strong className={smsInfo.sms > 1 ? 'text-warning' : 'text-success'}>{smsInfo.sms}</strong>
                </div>
                <div className="preview-stat">
                  <span>Destinataires</span>
                  <strong>{recipientsCount !== null ? recipientsCount.toLocaleString() : '—'}</strong>
                </div>
                {recipientsCount && (
                  <div className="preview-stat">
                    <span>Crédits nécessaires</span>
                    <strong className="text-primary">{(recipientsCount * smsInfo.sms).toLocaleString()}</strong>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignCreate;
