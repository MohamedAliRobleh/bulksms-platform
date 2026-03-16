import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import api from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import ConfirmModal from '../../components/common/ConfirmModal';

const PackageModal = ({ pkg, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    name: pkg?.name || '',
    description: pkg?.description || '',
    sms_count: pkg?.sms_count || '',
    price: pkg?.price || '',
    currency: pkg?.currency || 'DJF',
    validity_days: pkg?.validity_days || 365,
    is_featured: pkg?.is_featured || false,
    sort_order: pkg?.sort_order || 0,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (pkg?.id) {
        await api.put(`/admin/packages/${pkg.id}`, form);
        toast.success('Package mis à jour');
      } else {
        await api.post('/admin/packages', form);
        toast.success('Package créé');
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
      <div className="modal-dialog-custom" onClick={e => e.stopPropagation()}>
        <div className="modal-header-custom">
          <h5><i className="bi bi-box-seam-fill text-primary me-2" />
            {pkg?.id ? 'Modifier le package' : 'Nouveau package'}
          </h5>
          <button className="btn-close" onClick={onClose} />
        </div>
        <div className="modal-body-custom">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-8">
                <label className="form-label">Nom du package *</label>
                <input type="text" className="form-control" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="col-md-4">
                <label className="form-label">Ordre</label>
                <input type="number" className="form-control" value={form.sort_order}
                  onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} />
              </div>
              <div className="col-12">
                <label className="form-label">Description</label>
                <input type="text" className="form-control" value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Nombre de SMS *</label>
                <input type="number" className="form-control" value={form.sms_count}
                  onChange={e => setForm(f => ({ ...f, sms_count: parseInt(e.target.value) || 0 }))} required min="1" />
              </div>
              <div className="col-md-4">
                <label className="form-label">Prix *</label>
                <input type="number" className="form-control" value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required min="0" step="0.01" />
              </div>
              <div className="col-md-4">
                <label className="form-label">Devise</label>
                <select className="form-select" value={form.currency}
                  onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                  <option value="DJF">DJF (Franc Djiboutien)</option>
                  <option value="USD">USD (Dollar)</option>
                  <option value="EUR">EUR (Euro)</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Validité (jours)</label>
                <input type="number" className="form-control" value={form.validity_days}
                  onChange={e => setForm(f => ({ ...f, validity_days: parseInt(e.target.value) || 365 }))} min="1" />
              </div>
              <div className="col-md-6 d-flex align-items-end">
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" checked={form.is_featured}
                    onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} id="featuredCheck" />
                  <label className="form-check-label fw-semibold" htmlFor="featuredCheck">
                    Mettre en avant <span className="text-warning">★</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="d-flex gap-2 mt-4">
              <button type="button" className="btn btn-light flex-fill" onClick={onClose}>Annuler</button>
              <button type="submit" className="btn btn-primary flex-fill" disabled={loading}>
                {loading ? <span className="spinner-border spinner-border-sm" /> : (pkg?.id ? 'Mettre à jour' : 'Créer')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const Packages = () => {
  const { t } = useTranslation();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);

  const loadPackages = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/packages');
      setPackages(data);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPackages(); }, [loadPackages]);

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/packages/${deleteModal.id}`);
      toast.success('Package supprimé');
      setDeleteModal(null);
      loadPackages();
    } catch {
      // handled
    }
  };

  const fmt = (n) => Number(n).toLocaleString('fr-FR');

  return (
    <div className="page-content">
      <PageHeader title={t('admin.packages')} subtitle="Gérer les offres SMS disponibles">
        <button className="btn btn-primary" onClick={() => setModal({})}>
          <i className="bi bi-plus-lg me-2" />{t('admin.add_package')}
        </button>
      </PageHeader>

      {loading ? (
        <div className="d-flex justify-content-center py-5"><div className="spinner-border text-primary" /></div>
      ) : (
        <div className="row g-4">
          {packages.map(pkg => (
            <div className="col-sm-6 col-xl-3" key={pkg.id}>
              <div className={`package-card ${pkg.is_featured ? 'package-card--featured' : ''}`}>
                {pkg.is_featured && <div className="package-badge">Populaire</div>}
                <div className="package-header">
                  <div className="package-icon">
                    <i className="bi bi-box-seam-fill" />
                  </div>
                  <h5 className="package-name">{pkg.name}</h5>
                  {pkg.description && <p className="package-desc">{pkg.description}</p>}
                </div>
                <div className="package-body">
                  <div className="package-sms">
                    <span className="package-sms-count">{fmt(pkg.sms_count)}</span>
                    <span className="package-sms-label">SMS</span>
                  </div>
                  <div className="package-price">
                    <span className="package-price-amount">{fmt(pkg.price)}</span>
                    <span className="package-price-currency"> {pkg.currency}</span>
                  </div>
                  <div className="package-validity">
                    <i className="bi bi-calendar3 me-1" />
                    Valable {pkg.validity_days} jours
                  </div>
                </div>
                <div className="package-footer">
                  <button className="btn btn-sm btn-light flex-fill" onClick={() => setModal(pkg)}>
                    <i className="bi bi-pencil me-1" />Modifier
                  </button>
                  <button className="btn btn-sm btn-danger-soft" onClick={() => setDeleteModal(pkg)}>
                    <i className="bi bi-trash" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {packages.length === 0 && (
            <div className="col-12">
              <div className="empty-state">
                <i className="bi bi-box-seam" />
                <h5>Aucun package créé</h5>
                <p>Créez vos premières offres SMS pour vos clients</p>
                <button className="btn btn-primary" onClick={() => setModal({})}>
                  <i className="bi bi-plus-lg me-2" />Créer un package
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {modal !== null && (
        <PackageModal pkg={modal} onClose={() => setModal(null)} onSuccess={loadPackages} />
      )}

      <ConfirmModal
        show={!!deleteModal}
        title="Supprimer le package"
        message={`Supprimer le package "${deleteModal?.name}" ?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal(null)}
      />
    </div>
  );
};

export default Packages;
