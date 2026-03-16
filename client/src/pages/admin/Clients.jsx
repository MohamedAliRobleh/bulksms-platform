import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import api from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import ConfirmModal from '../../components/common/ConfirmModal';

const StatusBadge = ({ isActive }) => (
  <span className={`badge-status ${isActive ? 'badge-status--active' : 'badge-status--inactive'}`}>
    <span className="badge-dot" />
    {isActive ? 'Actif' : 'Inactif'}
  </span>
);

const AddCreditsModal = ({ tenant, onClose, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;
    setLoading(true);
    try {
      await api.post('/admin/credits/add', {
        tenant_id: tenant.id,
        amount: parseInt(amount),
        description,
      });
      toast.success(`${amount} crédits ajoutés à ${tenant.name}`);
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
      <div className="modal-dialog-custom modal-dialog-custom--sm" onClick={e => e.stopPropagation()}>
        <div className="modal-header-custom">
          <h5><i className="bi bi-lightning-fill text-warning me-2" />Ajouter des crédits</h5>
          <button className="btn-close" onClick={onClose} />
        </div>
        <div className="modal-body-custom">
          <div className="mb-3">
            <label className="form-label fw-semibold">Client</label>
            <div className="text-muted">{tenant.name}</div>
            <div className="small text-muted">Solde actuel : <strong>{tenant.credit?.balance || 0} crédits</strong></div>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Nombre de crédits *</label>
              <input
                type="number"
                className="form-control"
                placeholder="Ex: 1000"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                min="1"
                required
              />
            </div>
            <div className="mb-4">
              <label className="form-label">Description (optionnel)</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ex: Package Business - Mars 2024"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-light flex-fill" onClick={onClose}>Annuler</button>
              <button type="submit" className="btn btn-primary flex-fill" disabled={loading}>
                {loading ? <span className="spinner-border spinner-border-sm" /> : 'Ajouter'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const AdminClients = () => {
  const { t } = useTranslation();
  const [clients, setClients] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [creditModal, setCreditModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const limit = 20;

  const loadClients = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/tenants', { params: { page, limit, search } });
      setClients(data.tenants);
      setTotal(data.total);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { loadClients(); }, [loadClients]);

  const handleToggleStatus = async (client) => {
    try {
      await api.put(`/admin/tenants/${client.id}`, { is_active: !client.is_active });
      toast.success(`Client ${client.is_active ? 'désactivé' : 'activé'}`);
      loadClients();
    } catch {
      // handled
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/tenants/${deleteModal.id}`);
      toast.success('Client supprimé');
      setDeleteModal(null);
      loadClients();
    } catch {
      // handled
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="page-content">
      <PageHeader title={t('admin.clients')} subtitle={`${total} clients enregistrés`}>
        <Link to="/admin/clients/new" className="btn btn-primary">
          <i className="bi bi-plus-lg me-2" />{t('admin.add_client')}
        </Link>
      </PageHeader>

      <div className="card-custom">
        <div className="card-custom-header">
          <div className="table-toolbar">
            <div className="search-input-wrap">
              <i className="bi bi-search search-icon" />
              <input
                type="text"
                className="form-control search-input"
                placeholder="Rechercher un client..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table-custom">
            <thead>
              <tr>
                <th>Client</th>
                <th>Email</th>
                <th>Crédits</th>
                <th>Statut</th>
                <th>Créé le</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-5">
                  <div className="spinner-border text-primary" />
                </td></tr>
              ) : clients.length === 0 ? (
                <tr><td colSpan={6} className="empty-table-row">
                  <i className="bi bi-people" />
                  <p>{t('admin.no_clients')}</p>
                </td></tr>
              ) : clients.map(client => (
                <tr key={client.id}>
                  <td>
                    <div className="client-cell">
                      <div className="client-avatar">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="fw-semibold">{client.name}</div>
                        <div className="text-muted small">{client.phone || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-muted">{client.email}</td>
                  <td>
                    <div className="credits-cell">
                      <span className="fw-bold">{(client.credit?.balance || 0).toLocaleString()}</span>
                      <span className="text-muted small ms-1">SMS</span>
                    </div>
                  </td>
                  <td><StatusBadge isActive={client.is_active} /></td>
                  <td className="text-muted">{new Date(client.created_at).toLocaleDateString('fr-FR')}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="btn-table-action btn-table-action--success"
                        title="Ajouter des crédits"
                        onClick={() => setCreditModal(client)}
                      >
                        <i className="bi bi-lightning-charge-fill" />
                      </button>
                      <Link
                        to={`/admin/clients/${client.id}/edit`}
                        className="btn-table-action btn-table-action--info"
                        title="Modifier"
                      >
                        <i className="bi bi-pencil-fill" />
                      </Link>
                      <button
                        className={`btn-table-action ${client.is_active ? 'btn-table-action--warning' : 'btn-table-action--success'}`}
                        title={client.is_active ? 'Désactiver' : 'Activer'}
                        onClick={() => handleToggleStatus(client)}
                      >
                        <i className={`bi ${client.is_active ? 'bi-pause-fill' : 'bi-play-fill'}`} />
                      </button>
                      <button
                        className="btn-table-action btn-table-action--danger"
                        title="Supprimer"
                        onClick={() => setDeleteModal(client)}
                      >
                        <i className="bi bi-trash-fill" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="table-pagination">
            <div className="text-muted small">
              {(page - 1) * limit + 1}-{Math.min(page * limit, total)} sur {total}
            </div>
            <div className="pagination-controls">
              <button className="btn-page" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <i className="bi bi-chevron-left" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                <button key={p} className={`btn-page ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>
                  {p}
                </button>
              ))}
              <button className="btn-page" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                <i className="bi bi-chevron-right" />
              </button>
            </div>
          </div>
        )}
      </div>

      {creditModal && (
        <AddCreditsModal
          tenant={creditModal}
          onClose={() => setCreditModal(null)}
          onSuccess={loadClients}
        />
      )}

      <ConfirmModal
        show={!!deleteModal}
        title="Supprimer le client"
        message={`Êtes-vous sûr de vouloir supprimer "${deleteModal?.name}" ? Toutes ses données seront effacées.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal(null)}
      />
    </div>
  );
};

export default AdminClients;
