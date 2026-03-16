import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import api from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import ConfirmModal from '../../components/common/ConfirmModal';

const GroupModal = ({ group, onClose, onSuccess }) => {
  const [form, setForm] = useState({ name: group?.name || '', description: group?.description || '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (group?.id) {
        await api.put(`/groups/${group.id}`, form);
        toast.success('Groupe mis à jour');
      } else {
        await api.post('/groups', form);
        toast.success('Groupe créé');
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
      <div className="modal-dialog-custom modal-dialog-custom--sm" onClick={e => e.stopPropagation()}>
        <div className="modal-header-custom">
          <h5><i className="bi bi-collection-fill text-primary me-2" />
            {group?.id ? 'Modifier le groupe' : 'Créer un groupe'}
          </h5>
          <button className="btn-close" onClick={onClose} />
        </div>
        <div className="modal-body-custom">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Nom du groupe *</label>
              <input type="text" className="form-control" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Clients VIP, Abonnés newsletter..." required />
            </div>
            <div className="mb-4">
              <label className="form-label">Description (optionnel)</label>
              <textarea className="form-control" rows={3} value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Description du groupe..." />
            </div>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-light flex-fill" onClick={onClose}>Annuler</button>
              <button type="submit" className="btn btn-primary flex-fill" disabled={loading}>
                {loading ? <span className="spinner-border spinner-border-sm" /> : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const Groups = () => {
  const { t } = useTranslation();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);

  const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#8B5CF6', '#EC4899', '#14B8A6'];

  const loadGroups = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/groups');
      setGroups(data);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  const handleDelete = async () => {
    try {
      await api.delete(`/groups/${deleteModal.id}`);
      toast.success('Groupe supprimé');
      setDeleteModal(null);
      loadGroups();
    } catch {
      // handled
    }
  };

  return (
    <div className="page-content">
      <PageHeader title={t('groups.title')} subtitle={`${groups.length} groupes`}>
        <button className="btn btn-primary" onClick={() => setModal({})}>
          <i className="bi bi-plus-lg me-2" />{t('groups.add_group')}
        </button>
      </PageHeader>

      {loading ? (
        <div className="d-flex justify-content-center py-5"><div className="spinner-border text-primary" /></div>
      ) : (
        <div className="row g-3">
          {groups.length === 0 ? (
            <div className="col-12">
              <div className="empty-state">
                <i className="bi bi-collection" />
                <h5>{t('groups.no_groups')}</h5>
                <p>Organisez vos contacts en groupes pour cibler vos campagnes</p>
                <button className="btn btn-primary" onClick={() => setModal({})}>
                  <i className="bi bi-plus-lg me-2" />Créer un groupe
                </button>
              </div>
            </div>
          ) : (
            groups.map((group, idx) => (
              <div className="col-sm-6 col-lg-4 col-xl-3" key={group.id}>
                <div className="group-card">
                  <div className="group-card-color" style={{ background: colors[idx % colors.length] }} />
                  <div className="group-card-body">
                    <div className="group-icon" style={{ background: `${colors[idx % colors.length]}20`, color: colors[idx % colors.length] }}>
                      <i className="bi bi-collection-fill" />
                    </div>
                    <div className="group-info">
                      <h6 className="group-name">{group.name}</h6>
                      {group.description && <p className="group-desc">{group.description}</p>}
                      <div className="group-count">
                        <i className="bi bi-person-fill me-1" />
                        <strong>{(group.contact_count || 0).toLocaleString()}</strong> contacts
                      </div>
                    </div>
                    <div className="group-card-actions">
                      <button className="btn-table-action btn-table-action--info" onClick={() => setModal(group)}>
                        <i className="bi bi-pencil-fill" />
                      </button>
                      <button className="btn-table-action btn-table-action--danger" onClick={() => setDeleteModal(group)}>
                        <i className="bi bi-trash-fill" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {modal !== null && (
        <GroupModal group={modal} onClose={() => setModal(null)} onSuccess={loadGroups} />
      )}
      <ConfirmModal
        show={!!deleteModal}
        title="Supprimer le groupe"
        message={`Supprimer "${deleteModal?.name}" ? Les contacts ne seront pas supprimés.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal(null)}
      />
    </div>
  );
};

export default Groups;
