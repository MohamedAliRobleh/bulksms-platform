import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import PageHeader from '../../components/common/PageHeader';

const Credits = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(null); // tenant object
  const [form, setForm] = useState({ amount: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/tenants?limit=100');
      setTenants(res.data.tenants || []);
    } catch {
      toast.error('Erreur chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTenants(); }, []);

  const handleAddCredits = async () => {
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) {
      toast.warning('Entrez un montant valide');
      return;
    }
    setSaving(true);
    try {
      await api.post('/admin/credits/add', {
        tenant_id: addModal.id,
        amount: Number(form.amount),
        description: form.description || `Ajout manuel de crédits`,
      });
      toast.success(`${Number(form.amount).toLocaleString()} crédits ajoutés à ${addModal.name}`);
      setAddModal(null);
      setForm({ amount: '', description: '' });
      fetchTenants();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const filtered = tenants.filter(t =>
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.email?.toLowerCase().includes(search.toLowerCase())
  );

  const fmt = (n) => Number(n || 0).toLocaleString('fr-FR');

  const balanceColor = (balance) => {
    if (balance <= 0) return 'text-danger';
    if (balance < 100) return 'text-warning';
    return 'text-success';
  };

  return (
    <div className="page-content">
      <PageHeader
        title="Crédits clients"
        subtitle="Gérez les wallets SMS de chaque client"
        icon="bi-wallet2"
      />

      {/* Summary bar */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <div className="stats-card stats-card--blue">
            <div className="stats-icon"><i className="bi bi-people-fill" /></div>
            <div className="stats-value">{tenants.length}</div>
            <div className="stats-label">Clients total</div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="stats-card stats-card--green">
            <div className="stats-icon"><i className="bi bi-lightning-charge-fill" /></div>
            <div className="stats-value">{fmt(tenants.reduce((s, t) => s + Number(t.credit?.balance || 0), 0))}</div>
            <div className="stats-label">Crédits en circulation</div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="stats-card stats-card--yellow">
            <div className="stats-icon"><i className="bi bi-exclamation-triangle-fill" /></div>
            <div className="stats-value">{tenants.filter(t => Number(t.credit?.balance || 0) < 100).length}</div>
            <div className="stats-label">Solde faible (&lt; 100)</div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="stats-card stats-card--purple">
            <div className="stats-icon"><i className="bi bi-graph-up" /></div>
            <div className="stats-value">{fmt(tenants.reduce((s, t) => s + Number(t.credit?.total_used || 0), 0))}</div>
            <div className="stats-label">SMS consommés total</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex align-items-center gap-3">
          <h6 className="mb-0 flex-grow-1">Wallets clients</h6>
          <div className="input-group" style={{ maxWidth: 260 }}>
            <span className="input-group-text"><i className="bi bi-search" /></span>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Rechercher un client..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-5 text-muted">Aucun client trouvé</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0 align-middle">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Solde actuel</th>
                    <th>Total acheté</th>
                    <th>Total utilisé</th>
                    <th>Utilisation</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((tenant) => {
                    const balance = Number(tenant.credit?.balance || 0);
                    const purchased = Number(tenant.credit?.total_purchased || 0);
                    const used = Number(tenant.credit?.total_used || 0);
                    const usagePct = purchased > 0 ? Math.round((used / purchased) * 100) : 0;

                    return (
                      <tr key={tenant.id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="avatar-circle avatar-sm bg-primary-subtle text-primary fw-bold">
                              {tenant.name?.charAt(0)}
                            </div>
                            <div>
                              <div className="fw-semibold">{tenant.name}</div>
                              <small className="text-muted">{tenant.email}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`fw-bold ${balanceColor(balance)}`}>
                            {fmt(balance)}
                          </span>
                          {balance < 100 && balance > 0 && (
                            <span className="badge bg-warning text-dark ms-2 small">Faible</span>
                          )}
                          {balance <= 0 && (
                            <span className="badge bg-danger ms-2 small">Vide</span>
                          )}
                        </td>
                        <td className="text-muted">{fmt(purchased)}</td>
                        <td className="text-muted">{fmt(used)}</td>
                        <td style={{ minWidth: 120 }}>
                          <div className="d-flex align-items-center gap-2">
                            <div className="progress flex-grow-1" style={{ height: 6 }}>
                              <div
                                className={`progress-bar ${usagePct > 80 ? 'bg-danger' : usagePct > 50 ? 'bg-warning' : 'bg-success'}`}
                                style={{ width: `${usagePct}%` }}
                              />
                            </div>
                            <small className="text-muted">{usagePct}%</small>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${tenant.is_active ? 'bg-success' : 'bg-secondary'}`}>
                            {tenant.is_active ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => { setAddModal(tenant); setForm({ amount: '', description: '' }); }}
                          >
                            <i className="bi bi-plus-lg me-1" />Créditer
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal ajout crédits */}
      {addModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-wallet2 me-2 text-primary" />
                  Ajouter des crédits — {addModal.name}
                </h5>
                <button className="btn-close" onClick={() => setAddModal(null)} />
              </div>
              <div className="modal-body">
                <div className="alert alert-info py-2 mb-3">
                  <small>Solde actuel : <strong>{fmt(addModal.credit?.balance || 0)} crédits</strong></small>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Nombre de crédits SMS *</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="ex: 5000"
                    min="1"
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Description (optionnel)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="ex: Recharge mensuelle, bonus..."
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  />
                </div>
                {form.amount && !isNaN(form.amount) && Number(form.amount) > 0 && (
                  <div className="alert alert-success py-2">
                    <small>
                      Nouveau solde après ajout : <strong>{fmt(Number(addModal.credit?.balance || 0) + Number(form.amount))} crédits</strong>
                    </small>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={() => setAddModal(null)}>Annuler</button>
                <button className="btn btn-primary" onClick={handleAddCredits} disabled={saving}>
                  {saving ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="bi bi-plus-lg me-2" />}
                  Ajouter les crédits
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Credits;
