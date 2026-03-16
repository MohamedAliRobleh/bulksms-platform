import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import PageHeader from '../../components/common/PageHeader';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(null);
  const navigate = useNavigate();

  const [bankBalance, setBankBalance] = useState(null);

  const fetchStats = () => {
    api.get('/admin/dashboard').then(r => { setStats(r.data); setLoading(false); });
    api.get('/admin/bank').then(r => setBankBalance(Number(r.data.bank?.balance || 0))).catch(() => {});
  };

  useEffect(() => { fetchStats(); }, []);

  const handleApprove = async (paymentId) => {
    setApproving(paymentId);
    try {
      const res = await api.post(`/admin/payments/${paymentId}/approve`);
      toast.success(res.data.message);
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally {
      setApproving(null);
    }
  };

  const fmt = (n) => Number(n || 0).toLocaleString('fr-FR');
  const fmtPrice = (n) => `${Number(n || 0).toLocaleString('fr-DJ')} DJF`;

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (m < 1) return 'À l\'instant';
    if (m < 60) return `Il y a ${m} min`;
    if (h < 24) return `Il y a ${h}h`;
    return `Il y a ${d}j`;
  };

  if (loading) {
    return (
      <div className="page-content d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  const pendingPayments = stats?.pending_payments || [];
  const recentPayments = stats?.recent_payments || [];

  return (
    <div className="page-content">
      <PageHeader title="Dashboard" subtitle="Vue globale de la plateforme">
        <Link to="/admin/clients/new" className="btn btn-primary">
          <i className="bi bi-plus-lg me-2" />Ajouter un client
        </Link>
      </PageHeader>

      {/* Alerte paiements en attente */}
      {pendingPayments.length > 0 && (
        <div className="alert alert-warning border-warning d-flex align-items-center gap-3 mb-4" role="alert">
          <i className="bi bi-hourglass-split fs-4 text-warning flex-shrink-0" />
          <div className="flex-grow-1">
            <strong>{pendingPayments.length} paiement{pendingPayments.length > 1 ? 's' : ''} en attente de validation</strong>
            <span className="ms-2 text-muted small">— Faites défiler pour les valider ou cliquez sur</span>
            <Link to="/admin/payments" className="ms-1 small fw-semibold">Gérer les paiements</Link>
          </div>
          <Link to="/admin/payments" className="btn btn-sm btn-warning">
            Voir tout <i className="bi bi-arrow-right ms-1" />
          </Link>
        </div>
      )}

      {/* Stats row */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-xl-3">
          <div className="stats-card stats-card--blue">
            <div className="stats-icon"><i className="bi bi-people-fill" /></div>
            <div className="stats-value">{fmt(stats?.total_tenants)}</div>
            <div className="stats-label">Total clients</div>
            <div className="stats-sub">{fmt(stats?.active_tenants)} actifs</div>
          </div>
        </div>
        <div className="col-6 col-xl-3">
          <div className="stats-card stats-card--green">
            <div className="stats-icon"><i className="bi bi-chat-dots-fill" /></div>
            <div className="stats-value">{fmt(stats?.total_messages)}</div>
            <div className="stats-label">SMS envoyés</div>
            <div className="stats-sub">{fmt(stats?.recent_messages)} cette semaine</div>
          </div>
        </div>
        <div className="col-6 col-xl-3">
          <div className="stats-card stats-card--purple">
            <div className="stats-icon"><i className="bi bi-cash-coin" /></div>
            <div className="stats-value" style={{ fontSize: '1.2rem' }}>{fmtPrice(stats?.revenue_30d)}</div>
            <div className="stats-label">Revenus (30 jours)</div>
            <div className="stats-sub">{fmt(stats?.credits?.total_purchased)} SMS vendus</div>
          </div>
        </div>
        <div className="col-6 col-xl-3">
          <div className={`stats-card ${stats?.pending_payments_count > 0 ? 'stats-card--yellow' : 'stats-card--blue'}`}>
            <div className="stats-icon"><i className="bi bi-hourglass-split" /></div>
            <div className="stats-value">{fmt(stats?.pending_payments_count)}</div>
            <div className="stats-label">Paiements en attente</div>
            {stats?.pending_payments_count > 0 && (
              <Link to="/admin/payments" className="stats-sub text-warning fw-semibold text-decoration-none">
                Valider maintenant →
              </Link>
            )}
          </div>
        </div>
        {bankBalance !== null && (
          <div className="col-6 col-xl-3">
            <Link to="/admin/bank" className="text-decoration-none">
              <div className={`stats-card ${bankBalance < 10000 ? 'stats-card--yellow' : 'stats-card--green'}`}>
                <div className="stats-icon"><i className="bi bi-bank" /></div>
                <div className="stats-value">{fmt(bankBalance)}</div>
                <div className="stats-label">Banque SMS</div>
                <div className="stats-sub">{bankBalance < 10000 ? '⚠️ Stock bas' : 'Crédits disponibles'}</div>
              </div>
            </Link>
          </div>
        )}
      </div>

      <div className="row g-4">
        {/* Paiements en attente */}
        <div className="col-12 col-xl-7">
          <div className="card h-100">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h6 className="mb-0 d-flex align-items-center gap-2">
                <span className="badge bg-warning text-dark rounded-pill">{pendingPayments.length}</span>
                Demandes de rechargement en attente
              </h6>
              <Link to="/admin/payments" className="btn btn-sm btn-outline-secondary">
                Tout voir
              </Link>
            </div>
            <div className="card-body p-0">
              {pendingPayments.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-check-circle fs-2 d-block mb-2 text-success" />
                  Aucun paiement en attente
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {pendingPayments.map((p) => (
                    <div key={p.id} className="list-group-item px-4 py-3">
                      <div className="d-flex align-items-center gap-3">
                        {/* Avatar */}
                        <div className="avatar-circle avatar-sm bg-warning-subtle text-warning fw-bold flex-shrink-0">
                          {p.tenant?.name?.charAt(0) || '?'}
                        </div>
                        {/* Info */}
                        <div className="flex-grow-1 min-w-0">
                          <div className="fw-semibold text-truncate">{p.tenant?.name || '—'}</div>
                          <div className="small text-muted">
                            {p.user?.first_name} {p.user?.last_name}
                            <span className="mx-1">·</span>
                            {p.phone_number}
                            <span className="mx-1">·</span>
                            {timeAgo(p.createdAt)}
                          </div>
                        </div>
                        {/* Package + montant */}
                        <div className="text-end flex-shrink-0">
                          <div className="fw-bold text-primary">{fmtPrice(p.amount)}</div>
                          <div className="small text-muted">{fmt(p.sms_count)} SMS</div>
                          <div className="small text-muted">{p.package?.name}</div>
                        </div>
                        {/* Bouton valider */}
                        <button
                          className="btn btn-sm btn-success flex-shrink-0"
                          onClick={() => handleApprove(p.id)}
                          disabled={approving === p.id}
                        >
                          {approving === p.id
                            ? <span className="spinner-border spinner-border-sm" />
                            : <><i className="bi bi-check-lg me-1" />Valider</>
                          }
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Colonne droite */}
        <div className="col-12 col-xl-5 d-flex flex-column gap-4">
          {/* Paiements récents */}
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h6 className="mb-0"><i className="bi bi-check-circle-fill text-success me-2" />Derniers paiements confirmés</h6>
            </div>
            <div className="card-body p-0">
              {recentPayments.length === 0 ? (
                <div className="text-center py-4 text-muted small">Aucun paiement ce mois</div>
              ) : (
                <div className="list-group list-group-flush">
                  {recentPayments.map((p) => (
                    <div key={p.id} className="list-group-item px-4 py-2 d-flex align-items-center gap-2">
                      <div className="avatar-circle avatar-xs bg-success-subtle text-success flex-shrink-0">
                        {p.tenant?.name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-grow-1 min-w-0">
                        <div className="small fw-semibold text-truncate">{p.tenant?.name}</div>
                        <div className="small text-muted">{p.package?.name} · {fmt(p.sms_count)} SMS</div>
                      </div>
                      <div className="text-end flex-shrink-0">
                        <div className="small fw-bold text-success">+{fmtPrice(p.amount)}</div>
                        <div className="small text-muted">{timeAgo(p.completedAt || p.createdAt)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions rapides */}
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0"><i className="bi bi-lightning-fill text-warning me-2" />Actions rapides</h6>
            </div>
            <div className="card-body p-0">
              {[
                { to: '/admin/clients/new', icon: 'bi-person-plus-fill', color: 'primary', label: 'Ajouter un client', desc: 'Créer un nouveau compte' },
                { to: '/admin/clients', icon: 'bi-people-fill', color: 'info', label: 'Gérer les clients', desc: `${fmt(stats?.total_tenants)} clients enregistrés` },
                { to: '/admin/packages', icon: 'bi-box-seam-fill', color: 'success', label: 'Gérer les packages', desc: 'Offres SMS disponibles' },
                { to: '/admin/payments', icon: 'bi-credit-card-2-front-fill', color: 'warning', label: 'Paiements', desc: `${fmt(stats?.pending_payments_count)} en attente` },
              ].map((item) => (
                <Link key={item.to} to={item.to} className="list-group-item list-group-item-action px-4 py-3 d-flex align-items-center gap-3 border-0 border-bottom">
                  <div className={`quick-action-icon bg-${item.color}-subtle rounded-2 p-2`}>
                    <i className={`bi ${item.icon} text-${item.color}`} />
                  </div>
                  <div className="flex-grow-1">
                    <div className="fw-semibold small">{item.label}</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>{item.desc}</div>
                  </div>
                  <i className="bi bi-chevron-right text-muted small" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
