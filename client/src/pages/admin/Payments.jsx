import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import ConfirmModal from '../../components/common/ConfirmModal';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [approving, setApproving] = useState(null);
  const [confirmPayment, setConfirmPayment] = useState(null);
  const limit = 20;

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit });
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get(`/admin/payments?${params}`);
      setPayments(res.data.payments || []);
      setTotal(res.data.total || 0);
    } catch {
      toast.error('Erreur lors du chargement des paiements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, statusFilter]);

  const handleApprove = async () => {
    if (!confirmPayment) return;
    setApproving(confirmPayment.id);
    try {
      const res = await api.post(`/admin/payments/${confirmPayment.id}/approve`);
      toast.success(res.data.message);
      fetchPayments();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de l\'approbation');
    } finally {
      setApproving(null);
      setConfirmPayment(null);
    }
  };

  const formatPrice = (amount, currency) =>
    `${Number(amount).toLocaleString('fr-DJ')} ${currency || 'DJF'}`;

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const statusBadge = (status) => {
    const map = {
      completed: { cls: 'bg-success', label: 'Payé' },
      pending: { cls: 'bg-warning text-dark', label: 'En attente' },
      failed: { cls: 'bg-danger', label: 'Échoué' },
      cancelled: { cls: 'bg-secondary', label: 'Annulé' },
    };
    const s = map[status] || { cls: 'bg-secondary', label: status };
    return <span className={`badge ${s.cls}`}>{s.label}</span>;
  };

  const totalPages = Math.ceil(total / limit);

  const stats = {
    total: payments.length,
    completed: payments.filter(p => p.status === 'completed').length,
    pending: payments.filter(p => p.status === 'pending').length,
    revenue: payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + Number(p.amount), 0),
  };

  return (
    <div className="page-content">
      <PageHeader
        title="Gestion des paiements"
        subtitle="Suivi et validation des transactions Waafi"
        icon="bi-credit-card-2-front"
      />

      {/* Stats row */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <div className="stats-card stats-card--blue">
            <div className="stats-icon"><i className="bi bi-receipt" /></div>
            <div className="stats-value">{total}</div>
            <div className="stats-label">Total paiements</div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="stats-card stats-card--green">
            <div className="stats-icon"><i className="bi bi-check-circle" /></div>
            <div className="stats-value">{stats.completed}</div>
            <div className="stats-label">Confirmés</div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="stats-card stats-card--yellow">
            <div className="stats-icon"><i className="bi bi-hourglass-split" /></div>
            <div className="stats-value">{stats.pending}</div>
            <div className="stats-label">En attente</div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="stats-card stats-card--purple">
            <div className="stats-icon"><i className="bi bi-cash-coin" /></div>
            <div className="stats-value">{formatPrice(stats.revenue, 'DJF')}</div>
            <div className="stats-label">Revenus (page)</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body py-2">
          <div className="d-flex gap-2 flex-wrap align-items-center">
            <span className="text-muted small me-2">Filtrer :</span>
            {['', 'pending', 'completed', 'failed', 'cancelled'].map((s) => (
              <button
                key={s}
                className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => { setStatusFilter(s); setPage(1); }}
              >
                {s === '' ? 'Tous' : s === 'pending' ? 'En attente' : s === 'completed' ? 'Payés' : s === 'failed' ? 'Échoués' : 'Annulés'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h6 className="mb-0">Transactions ({total})</h6>
          <button className="btn btn-sm btn-outline-secondary" onClick={fetchPayments}>
            <i className="bi bi-arrow-clockwise me-1" />Actualiser
          </button>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" />
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-inbox fs-2 d-block mb-2" />
              Aucun paiement trouvé
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Client</th>
                    <th>Utilisateur</th>
                    <th>Package</th>
                    <th>Crédits</th>
                    <th>Montant</th>
                    <th>Tél. Waafi</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td className="text-muted small">{formatDate(p.createdAt)}</td>
                      <td>
                        <div className="fw-medium">{p.tenant?.name || '—'}</div>
                        <small className="text-muted">{p.tenant?.email}</small>
                      </td>
                      <td className="small">
                        {p.user ? `${p.user.first_name} ${p.user.last_name}` : '—'}
                      </td>
                      <td>{p.package?.name || '—'}</td>
                      <td><strong>{Number(p.sms_count).toLocaleString()}</strong></td>
                      <td className="fw-medium">{formatPrice(p.amount, p.currency)}</td>
                      <td className="small text-muted">{p.phone_number}</td>
                      <td>{statusBadge(p.status)}</td>
                      <td>
                        {p.status === 'pending' && (
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => setConfirmPayment(p)}
                            disabled={approving === p.id}
                          >
                            {approving === p.id ? (
                              <span className="spinner-border spinner-border-sm" />
                            ) : (
                              <><i className="bi bi-check-lg me-1" />Valider</>
                            )}
                          </button>
                        )}
                        {p.status === 'completed' && p.completedAt && (
                          <small className="text-muted">
                            {formatDate(p.completedAt)}
                          </small>
                        )}
                        {p.notes && (
                          <span
                            className="ms-1 text-muted"
                            title={p.notes}
                            style={{ cursor: 'help' }}
                          >
                            <i className="bi bi-info-circle" />
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="card-footer d-flex align-items-center justify-content-between">
            <small className="text-muted">
              Page {page} sur {totalPages} — {total} résultats
            </small>
            <div className="d-flex gap-1">
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                <i className="bi bi-chevron-left" />
              </button>
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                <i className="bi bi-chevron-right" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        show={!!confirmPayment}
        title="Valider le paiement"
        message={
          confirmPayment
            ? `Confirmer la validation manuelle du paiement de ${confirmPayment.tenant?.name} — ${formatPrice(confirmPayment.amount, confirmPayment.currency)} (${Number(confirmPayment.sms_count).toLocaleString()} crédits) ?`
            : ''
        }
        confirmText="Valider"
        confirmVariant="success"
        onConfirm={handleApprove}
        onCancel={() => setConfirmPayment(null)}
      />
    </div>
  );
};

export default Payments;
