import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import StatsCard from '../../components/common/StatsCard';
import PageHeader from '../../components/common/PageHeader';

const StatusBadge = ({ status }) => {
  const map = {
    draft: { cls: 'badge-gray', icon: 'bi-pencil', label: 'Brouillon' },
    scheduled: { cls: 'badge-info', icon: 'bi-clock', label: 'Planifiée' },
    sending: { cls: 'badge-warning', icon: 'bi-arrow-repeat', label: 'En cours' },
    sent: { cls: 'badge-success', icon: 'bi-check-circle', label: 'Envoyée' },
    failed: { cls: 'badge-danger', icon: 'bi-x-circle', label: 'Échouée' },
  };
  const s = map[status] || map.draft;
  return (
    <span className={`badge-campaign ${s.cls}`}>
      <i className={`bi ${s.icon} me-1`} />{s.label}
    </span>
  );
};

const ClientDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/dashboard').then(r => { setData(r.data); setLoading(false); });
  }, []);

  const fmt = (n) => Number(n || 0).toLocaleString('fr-FR');
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 17) return 'Bon après-midi';
    return 'Bonsoir';
  };

  return (
    <div className="page-content">
      <PageHeader
        title={`${greeting()}, ${user?.first_name} 👋`}
        subtitle="Bienvenue sur votre espace BulkSMS"
      >
        <Link to="/dashboard/campaigns/new" className="btn btn-primary">
          <i className="bi bi-send me-2" />Nouvelle campagne
        </Link>
      </PageHeader>

      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="stats-grid">
            <StatsCard
              title={t('credits.balance')}
              value={fmt(data?.stats?.sms_balance)}
              icon="bi-lightning-charge-fill"
              color="warning"
              subtitle="Crédits disponibles"
            />
            <StatsCard
              title={t('dashboard.total_contacts')}
              value={fmt(data?.stats?.total_contacts)}
              icon="bi-person-fill"
              color="primary"
            />
            <StatsCard
              title={t('dashboard.total_campaigns')}
              value={fmt(data?.stats?.total_campaigns)}
              icon="bi-send-fill"
              color="success"
              subtitle={`${fmt(data?.stats?.sent_campaigns)} envoyées`}
            />
            <StatsCard
              title={t('dashboard.delivery_rate')}
              value={`${data?.stats?.delivery_rate || 0}%`}
              icon="bi-check-circle-fill"
              color="info"
            />
          </div>

          <div className="row g-4 mt-1">
            {/* Recent campaigns */}
            <div className="col-lg-8">
              <div className="card-custom">
                <div className="card-custom-header">
                  <h5><i className="bi bi-send-fill text-primary me-2" />Campagnes récentes</h5>
                  <Link to="/dashboard/campaigns" className="btn btn-sm btn-light">Voir tout</Link>
                </div>
                <div className="table-responsive">
                  <table className="table-custom">
                    <thead>
                      <tr>
                        <th>Campagne</th>
                        <th>Destinataires</th>
                        <th>Livrés</th>
                        <th>Statut</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.recent_campaigns?.length === 0 ? (
                        <tr><td colSpan={5} className="empty-table-row">
                          <i className="bi bi-send" />
                          <p>Aucune campagne pour l'instant</p>
                        </td></tr>
                      ) : (
                        data?.recent_campaigns?.map(c => (
                          <tr key={c.id}>
                            <td className="fw-semibold">{c.name}</td>
                            <td>{fmt(c.total_recipients)}</td>
                            <td>
                              <span className="text-success fw-semibold">{fmt(c.delivered_count)}</span>
                            </td>
                            <td><StatusBadge status={c.status} /></td>
                            <td className="text-muted">{new Date(c.created_at).toLocaleDateString('fr-FR')}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Quick actions + balance */}
            <div className="col-lg-4">
              {/* Balance card */}
              <div className="balance-card mb-4">
                <div className="balance-header">
                  <span>Solde SMS</span>
                  <i className="bi bi-lightning-charge-fill" />
                </div>
                <div className="balance-amount">{fmt(data?.stats?.sms_balance)}</div>
                <div className="balance-subtitle">crédits disponibles</div>
                <div className="balance-bar">
                  <div className="balance-bar-fill" style={{
                    width: `${Math.min(100, (data?.stats?.sms_balance / 10000) * 100)}%`
                  }} />
                </div>
              </div>

              {/* Quick actions */}
              <div className="card-custom">
                <div className="card-custom-header">
                  <h5><i className="bi bi-lightning text-warning me-2" />Actions rapides</h5>
                </div>
                <div className="card-custom-body">
                  <div className="quick-actions">
                    <Link to="/dashboard/campaigns/new" className="quick-action-item">
                      <div className="quick-action-icon bg-primary-soft">
                        <i className="bi bi-send-fill text-primary" />
                      </div>
                      <div>
                        <div className="quick-action-title">Nouvelle campagne</div>
                        <div className="quick-action-desc">Envoyer des SMS en masse</div>
                      </div>
                      <i className="bi bi-chevron-right ms-auto text-muted" />
                    </Link>
                    <Link to="/dashboard/contacts" className="quick-action-item">
                      <div className="quick-action-icon bg-success-soft">
                        <i className="bi bi-person-plus-fill text-success" />
                      </div>
                      <div>
                        <div className="quick-action-title">Importer des contacts</div>
                        <div className="quick-action-desc">Depuis un fichier Excel/CSV</div>
                      </div>
                      <i className="bi bi-chevron-right ms-auto text-muted" />
                    </Link>
                    <Link to="/dashboard/templates" className="quick-action-item">
                      <div className="quick-action-icon bg-info-soft">
                        <i className="bi bi-file-text-fill text-info" />
                      </div>
                      <div>
                        <div className="quick-action-title">Créer un template</div>
                        <div className="quick-action-desc">Modèles de messages réutilisables</div>
                      </div>
                      <i className="bi bi-chevron-right ms-auto text-muted" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ClientDashboard;
