import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import PageHeader from '../../components/common/PageHeader';

const Bank = () => {
  const [data, setData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [logsPage, setLogsPage] = useState(1);
  const [logsFilter, setLogsFilter] = useState('');
  const [saving, setSaving] = useState(false);

  // Formulaire ajout crédits
  const [addForm, setAddForm] = useState({ quantity: '', unit_cost: '', description: '' });
  // Paramètres
  const [settings, setSettings] = useState({
    cost_per_sms: '', auto_recharge_enabled: false,
    auto_recharge_threshold: 10000, auto_recharge_target: 100000,
  });

  const fetchBank = async () => {
    try {
      const res = await api.get('/admin/bank');
      setData(res.data);
      const bank = res.data.bank;
      setSettings({
        cost_per_sms: bank.cost_per_sms || '',
        auto_recharge_enabled: bank.auto_recharge_enabled || false,
        auto_recharge_threshold: bank.auto_recharge_threshold || 10000,
        auto_recharge_target: bank.auto_recharge_target || 100000,
      });
    } catch { toast.error('Erreur chargement banque'); }
    finally { setLoading(false); }
  };

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams({ page: logsPage, limit: 20 });
      if (logsFilter) params.set('type', logsFilter);
      const res = await api.get(`/admin/bank/logs?${params}`);
      setLogs(res.data.logs || []);
      setLogsTotal(res.data.total || 0);
    } catch { }
  };

  useEffect(() => { fetchBank(); }, []);
  useEffect(() => { fetchLogs(); }, [logsPage, logsFilter]);

  const handleAddCredits = async () => {
    if (!addForm.quantity || Number(addForm.quantity) <= 0) {
      return toast.warning('Quantité invalide');
    }
    setSaving(true);
    try {
      const res = await api.post('/admin/bank/add', {
        quantity: Number(addForm.quantity),
        unit_cost: addForm.unit_cost ? Number(addForm.unit_cost) : undefined,
        description: addForm.description || undefined,
      });
      toast.success(res.data.message);
      setAddForm({ quantity: '', unit_cost: '', description: '' });
      fetchBank();
      fetchLogs();
    } catch (err) { toast.error(err.response?.data?.error || 'Erreur'); }
    finally { setSaving(false); }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await api.put('/admin/bank/settings', {
        cost_per_sms: settings.cost_per_sms !== '' ? Number(settings.cost_per_sms) : undefined,
        auto_recharge_enabled: settings.auto_recharge_enabled,
        auto_recharge_threshold: Number(settings.auto_recharge_threshold),
        auto_recharge_target: Number(settings.auto_recharge_target),
      });
      toast.success('Paramètres enregistrés');
      fetchBank();
    } catch (err) { toast.error(err.response?.data?.error || 'Erreur'); }
    finally { setSaving(false); }
  };

  const fmt = (n) => Number(n || 0).toLocaleString('fr-FR');
  const fmtPrice = (n) => `${Number(n || 0).toLocaleString('fr-DJ')} DJF`;

  const logTypeBadge = (type) => {
    const map = {
      purchase: { cls: 'bg-primary', label: 'Achat Infobip', icon: 'bi-arrow-down-circle-fill' },
      sale: { cls: 'bg-success', label: 'Vente client', icon: 'bi-arrow-up-circle-fill' },
      auto_recharge: { cls: 'bg-purple', label: 'Auto-recharge', icon: 'bi-lightning-fill' },
      adjustment: { cls: 'bg-secondary', label: 'Ajustement', icon: 'bi-pencil-fill' },
    };
    const s = map[type] || { cls: 'bg-secondary', label: type, icon: 'bi-circle' };
    return <span className={`badge ${s.cls} d-inline-flex align-items-center gap-1`}><i className={`bi ${s.icon}`} />{s.label}</span>;
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  if (loading) return (
    <div className="page-content d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
      <div className="spinner-border text-primary" />
    </div>
  );

  const bank = data?.bank;
  const packages = data?.packages || [];
  const usedPct = bank?.total_purchased > 0
    ? Math.round((Number(bank.total_sold) / Number(bank.total_purchased)) * 100) : 0;
  const balancePct = bank?.auto_recharge_target > 0
    ? Math.min(100, Math.round((Number(bank.balance) / Number(bank.auto_recharge_target)) * 100)) : 0;

  return (
    <div className="page-content">
      <PageHeader
        title="Banque de crédits SMS"
        subtitle="Votre stock Infobip, marges et auto-recharge"
        icon="bi-bank"
      />

      {/* Alerte stock bas */}
      {bank?.auto_recharge_enabled && Number(bank.balance) <= Number(bank.auto_recharge_threshold) && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-4">
          <i className="bi bi-exclamation-triangle-fill fs-5" />
          <span>Solde banque critique ({fmt(bank.balance)} SMS). L'auto-recharge devrait se déclencher prochainement.</span>
        </div>
      )}

      {/* Stats principales */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-xl-3">
          <div className={`stats-card ${Number(bank?.balance) <= Number(bank?.auto_recharge_threshold) ? 'stats-card--yellow' : 'stats-card--blue'}`}>
            <div className="stats-icon"><i className="bi bi-bank" /></div>
            <div className="stats-value">{fmt(bank?.balance)}</div>
            <div className="stats-label">Stock disponible</div>
            <div className="stats-sub">Prêts à vendre</div>
          </div>
        </div>
        <div className="col-6 col-xl-3">
          <div className="stats-card stats-card--green">
            <div className="stats-icon"><i className="bi bi-arrow-down-circle" /></div>
            <div className="stats-value">{fmt(bank?.total_purchased)}</div>
            <div className="stats-label">Total acheté</div>
            <div className="stats-sub">Depuis le début</div>
          </div>
        </div>
        <div className="col-6 col-xl-3">
          <div className="stats-card stats-card--purple">
            <div className="stats-icon"><i className="bi bi-arrow-up-circle" /></div>
            <div className="stats-value">{fmt(bank?.total_sold)}</div>
            <div className="stats-label">Total vendu</div>
            <div className="stats-sub">{usedPct}% du stock écoulé</div>
          </div>
        </div>
        <div className="col-6 col-xl-3">
          <div className="stats-card stats-card--green">
            <div className="stats-icon"><i className="bi bi-currency-exchange" /></div>
            <div className="stats-value" style={{ fontSize: '1rem' }}>
              {bank?.cost_per_sms > 0 ? `${Number(bank.cost_per_sms).toFixed(2)} DJF` : '—'}
            </div>
            <div className="stats-label">Coût/SMS (Infobip)</div>
            <div className="stats-sub">Votre prix d'achat</div>
          </div>
        </div>
      </div>

      {/* Jauge solde */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="fw-semibold">Niveau du stock</span>
            <span className="small text-muted">
              {fmt(bank?.balance)} / {fmt(bank?.auto_recharge_target)} SMS max
            </span>
          </div>
          <div className="progress" style={{ height: 16, borderRadius: 8 }}>
            <div
              className={`progress-bar ${balancePct < 20 ? 'bg-danger' : balancePct < 50 ? 'bg-warning' : 'bg-success'}`}
              style={{ width: `${balancePct}%`, borderRadius: 8, transition: 'width 0.6s ease' }}
            />
          </div>
          <div className="d-flex justify-content-between mt-1">
            <small className="text-muted">0</small>
            <small className="text-warning">Seuil auto-recharge : {fmt(bank?.auto_recharge_threshold)}</small>
            <small className="text-muted">Max : {fmt(bank?.auto_recharge_target)}</small>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Colonne gauche */}
        <div className="col-12 col-xl-4 d-flex flex-column gap-4">

          {/* Ajouter des crédits */}
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0"><i className="bi bi-plus-circle-fill text-primary me-2" />Approvisionner (Infobip)</h6>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label fw-semibold">Nombre de SMS achetés *</label>
                <input type="number" className="form-control" placeholder="ex: 100000"
                  min="1" value={addForm.quantity}
                  onChange={e => setAddForm(f => ({ ...f, quantity: e.target.value }))} />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">Prix unitaire (DJF/SMS)</label>
                <input type="number" className="form-control" placeholder={`ex: ${bank?.cost_per_sms || '8'}`}
                  step="0.01" value={addForm.unit_cost}
                  onChange={e => setAddForm(f => ({ ...f, unit_cost: e.target.value }))} />
                <div className="form-text">Laissez vide pour utiliser le prix configuré</div>
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">Description</label>
                <input type="text" className="form-control" placeholder="ex: Achat Infobip mars 2025"
                  value={addForm.description}
                  onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              {addForm.quantity && addForm.unit_cost && (
                <div className="alert alert-info py-2 mb-3">
                  <small>Coût total : <strong>{fmtPrice(Number(addForm.quantity) * Number(addForm.unit_cost))}</strong></small>
                </div>
              )}
              <button className="btn btn-primary w-100" onClick={handleAddCredits} disabled={saving}>
                {saving ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="bi bi-plus-lg me-2" />}
                Ajouter au stock
              </button>
            </div>
          </div>

          {/* Paramètres auto-recharge */}
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0"><i className="bi bi-lightning-fill text-warning me-2" />Auto-recharge</h6>
            </div>
            <div className="card-body">
              <div className="form-check form-switch mb-3">
                <input className="form-check-input" type="checkbox" id="autoRecharge"
                  checked={settings.auto_recharge_enabled}
                  onChange={e => setSettings(s => ({ ...s, auto_recharge_enabled: e.target.checked }))} />
                <label className="form-check-label fw-semibold" htmlFor="autoRecharge">
                  {settings.auto_recharge_enabled ? 'Activée' : 'Désactivée'}
                </label>
              </div>
              <div className="mb-3">
                <label className="form-label">Déclencher quand solde ≤</label>
                <div className="input-group">
                  <input type="number" className="form-control" min="0"
                    value={settings.auto_recharge_threshold}
                    onChange={e => setSettings(s => ({ ...s, auto_recharge_threshold: e.target.value }))} />
                  <span className="input-group-text">SMS</span>
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Recharger jusqu'à</label>
                <div className="input-group">
                  <input type="number" className="form-control" min="0"
                    value={settings.auto_recharge_target}
                    onChange={e => setSettings(s => ({ ...s, auto_recharge_target: e.target.value }))} />
                  <span className="input-group-text">SMS</span>
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Prix d'achat (DJF/SMS)</label>
                <div className="input-group">
                  <input type="number" className="form-control" step="0.01" min="0"
                    placeholder="ex: 8.50"
                    value={settings.cost_per_sms}
                    onChange={e => setSettings(s => ({ ...s, cost_per_sms: e.target.value }))} />
                  <span className="input-group-text">DJF/SMS</span>
                </div>
              </div>
              <button className="btn btn-success w-100" onClick={handleSaveSettings} disabled={saving}>
                {saving ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="bi bi-check-lg me-2" />}
                Enregistrer
              </button>
            </div>
          </div>
        </div>

        {/* Colonne droite */}
        <div className="col-12 col-xl-8 d-flex flex-column gap-4">

          {/* Marges par package */}
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0"><i className="bi bi-graph-up-arrow text-success me-2" />Marges par package</h6>
            </div>
            {bank?.cost_per_sms > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover mb-0 align-middle">
                  <thead>
                    <tr>
                      <th>Package</th>
                      <th>SMS</th>
                      <th>Prix vente</th>
                      <th>Coût Infobip</th>
                      <th>Marge</th>
                      <th>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {packages.map(pkg => (
                      <tr key={pkg.id}>
                        <td className="fw-semibold">{pkg.name}</td>
                        <td>{fmt(pkg.sms_count)}</td>
                        <td className="text-primary fw-semibold">{fmtPrice(pkg.price)}</td>
                        <td className="text-muted">{fmtPrice(pkg.cost_total)}</td>
                        <td className={pkg.margin > 0 ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                          {fmtPrice(pkg.margin)}
                        </td>
                        <td>
                          <span className={`badge ${pkg.margin_pct >= 30 ? 'bg-success' : pkg.margin_pct >= 10 ? 'bg-warning text-dark' : 'bg-danger'}`}>
                            {pkg.margin_pct}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="card-body text-center text-muted py-4">
                <i className="bi bi-info-circle fs-4 d-block mb-2" />
                Configurez votre prix d'achat (DJF/SMS) pour voir les marges
              </div>
            )}
          </div>

          {/* Historique des transactions banque */}
          <div className="card">
            <div className="card-header d-flex align-items-center gap-2 flex-wrap">
              <h6 className="mb-0 flex-grow-1"><i className="bi bi-clock-history me-2" />Historique banque</h6>
              {['', 'purchase', 'sale', 'auto_recharge'].map(t => (
                <button key={t} className={`btn btn-sm ${logsFilter === t ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => { setLogsFilter(t); setLogsPage(1); }}>
                  {t === '' ? 'Tout' : t === 'purchase' ? 'Achats' : t === 'sale' ? 'Ventes' : 'Auto'}
                </button>
              ))}
            </div>
            <div className="card-body p-0">
              {logs.length === 0 ? (
                <div className="text-center py-5 text-muted">Aucune transaction</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0 align-middle">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Quantité</th>
                        <th>Coût unitaire</th>
                        <th>Total</th>
                        <th>Solde après</th>
                        <th>Détail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map(log => (
                        <tr key={log.id}>
                          <td className="text-muted small">{formatDate(log.createdAt)}</td>
                          <td>{logTypeBadge(log.type)}</td>
                          <td className={log.quantity > 0 ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                            {log.quantity > 0 ? '+' : ''}{fmt(log.quantity)}
                          </td>
                          <td className="text-muted small">
                            {Number(log.unit_cost) > 0 ? `${Number(log.unit_cost).toFixed(2)} DJF` : '—'}
                          </td>
                          <td className="small">
                            {Number(log.total_cost) > 0 ? fmtPrice(log.total_cost) : '—'}
                          </td>
                          <td className="fw-semibold">{fmt(log.balance_after)}</td>
                          <td className="text-muted small text-truncate" style={{ maxWidth: 180 }}>
                            {log.tenant_name || log.description || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            {Math.ceil(logsTotal / 20) > 1 && (
              <div className="card-footer d-flex justify-content-between align-items-center">
                <small className="text-muted">{logsTotal} entrées</small>
                <div className="d-flex gap-1">
                  <button className="btn btn-sm btn-outline-secondary" disabled={logsPage === 1}
                    onClick={() => setLogsPage(p => p - 1)}><i className="bi bi-chevron-left" /></button>
                  <button className="btn btn-sm btn-outline-secondary" disabled={logsPage >= Math.ceil(logsTotal / 20)}
                    onClick={() => setLogsPage(p => p + 1)}><i className="bi bi-chevron-right" /></button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bank;
