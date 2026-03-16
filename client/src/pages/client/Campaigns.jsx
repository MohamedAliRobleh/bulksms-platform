import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import api from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import ConfirmModal from '../../components/common/ConfirmModal';

const StatusBadge = ({ status }) => {
  const map = {
    draft: { cls: 'badge-gray', icon: 'bi-pencil', label: 'Brouillon' },
    scheduled: { cls: 'badge-info', icon: 'bi-clock', label: 'Planifiée' },
    sending: { cls: 'badge-warning', icon: 'bi-arrow-repeat spin', label: 'En cours...' },
    sent: { cls: 'badge-success', icon: 'bi-check-circle-fill', label: 'Envoyée' },
    failed: { cls: 'badge-danger', icon: 'bi-x-circle-fill', label: 'Échouée' },
    paused: { cls: 'badge-warning', icon: 'bi-pause-circle', label: 'En pause' },
  };
  const s = map[status] || map.draft;
  return (
    <span className={`badge-campaign ${s.cls}`}>
      <i className={`bi ${s.icon} me-1`} />{s.label}
    </span>
  );
};

const Campaigns = () => {
  const { t } = useTranslation();
  const [campaigns, setCampaigns] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState(null);
  const [sendModal, setSendModal] = useState(null);
  const limit = 20;

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/campaigns', { params: { page, limit, status: filter || undefined } });
      setCampaigns(data.campaigns);
      setTotal(data.total);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => { loadCampaigns(); }, [loadCampaigns]);

  const handleSend = async () => {
    try {
      await api.post(`/campaigns/${sendModal.id}/send`);
      toast.success('Campagne en cours d\'envoi !');
      setSendModal(null);
      loadCampaigns();
    } catch {
      // handled
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await api.post(`/campaigns/${id}/duplicate`);
      toast.success('Campagne dupliquée');
      loadCampaigns();
    } catch {
      // handled
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/campaigns/${deleteModal.id}`);
      toast.success('Campagne supprimée');
      setDeleteModal(null);
      loadCampaigns();
    } catch {
      // handled
    }
  };

  const fmt = (n) => Number(n || 0).toLocaleString();
  const totalPages = Math.ceil(total / limit);
  const deliveryRate = (c) => c.sent_count > 0 ? Math.round((c.delivered_count / c.sent_count) * 100) : 0;

  const statusFilters = [
    { value: '', label: 'Toutes' },
    { value: 'draft', label: 'Brouillons' },
    { value: 'scheduled', label: 'Planifiées' },
    { value: 'sending', label: 'En cours' },
    { value: 'sent', label: 'Envoyées' },
    { value: 'failed', label: 'Échouées' },
  ];

  return (
    <div className="page-content">
      <PageHeader title={t('campaigns.title')} subtitle={`${total} campagnes`}>
        <Link to="/dashboard/campaigns/new" className="btn btn-primary">
          <i className="bi bi-plus-lg me-2" />{t('campaigns.new_campaign')}
        </Link>
      </PageHeader>

      <div className="card-custom">
        <div className="card-custom-header">
          <div className="filter-tabs">
            {statusFilters.map(f => (
              <button key={f.value} className={`filter-tab ${filter === f.value ? 'filter-tab--active' : ''}`}
                onClick={() => { setFilter(f.value); setPage(1); }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="table-responsive">
          <table className="table-custom">
            <thead>
              <tr>
                <th>Campagne</th>
                <th>Expéditeur</th>
                <th>Destinataires</th>
                <th>Taux livraison</th>
                <th>Statut</th>
                <th>Date</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-5"><div className="spinner-border text-primary" /></td></tr>
              ) : campaigns.length === 0 ? (
                <tr><td colSpan={7} className="empty-table-row">
                  <i className="bi bi-send" />
                  <p>{t('campaigns.no_campaigns')}</p>
                  <Link to="/dashboard/campaigns/new" className="btn btn-primary btn-sm">
                    <i className="bi bi-plus-lg me-1" />Créer une campagne
                  </Link>
                </td></tr>
              ) : campaigns.map(c => (
                <tr key={c.id}>
                  <td>
                    <div className="fw-semibold">{c.name}</div>
                    <div className="text-muted small text-truncate" style={{ maxWidth: 220 }}>{c.content}</div>
                  </td>
                  <td>
                    <span className="sender-badge"><i className="bi bi-person-circle me-1" />{c.sender_id}</span>
                  </td>
                  <td className="fw-semibold">{fmt(c.total_recipients)}</td>
                  <td>
                    {c.status === 'sent' ? (
                      <div className="delivery-rate">
                        <div className="delivery-bar">
                          <div className="delivery-bar-fill" style={{ width: `${deliveryRate(c)}%` }} />
                        </div>
                        <span className="delivery-pct">{deliveryRate(c)}%</span>
                      </div>
                    ) : <span className="text-muted">—</span>}
                  </td>
                  <td><StatusBadge status={c.status} /></td>
                  <td className="text-muted">
                    {c.scheduled_at
                      ? <><i className="bi bi-clock text-info me-1" />{new Date(c.scheduled_at).toLocaleDateString('fr-FR')}</>
                      : new Date(c.created_at).toLocaleDateString('fr-FR')
                    }
                  </td>
                  <td>
                    <div className="table-actions">
                      {['draft', 'scheduled'].includes(c.status) && (
                        <button className="btn-table-action btn-table-action--success" title="Envoyer maintenant"
                          onClick={() => setSendModal(c)}>
                          <i className="bi bi-send-fill" />
                        </button>
                      )}
                      <button className="btn-table-action btn-table-action--info" title="Dupliquer"
                        onClick={() => handleDuplicate(c.id)}>
                        <i className="bi bi-copy" />
                      </button>
                      {c.status !== 'sending' && (
                        <button className="btn-table-action btn-table-action--danger" title="Supprimer"
                          onClick={() => setDeleteModal(c)}>
                          <i className="bi bi-trash-fill" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="table-pagination">
            <div className="text-muted small">{(page - 1) * limit + 1}-{Math.min(page * limit, total)} sur {total}</div>
            <div className="pagination-controls">
              <button className="btn-page" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <i className="bi bi-chevron-left" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(p => (
                <button key={p} className={`btn-page ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className="btn-page" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                <i className="bi bi-chevron-right" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        show={!!sendModal}
        title="Envoyer la campagne"
        message={`Envoyer "${sendModal?.name}" à ${fmt(sendModal?.total_recipients)} destinataires ?`}
        confirmText="Envoyer"
        confirmVariant="success"
        onConfirm={handleSend}
        onCancel={() => setSendModal(null)}
      />
      <ConfirmModal
        show={!!deleteModal}
        title="Supprimer la campagne"
        message={`Supprimer "${deleteModal?.name}" ?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal(null)}
      />
    </div>
  );
};

export default Campaigns;
