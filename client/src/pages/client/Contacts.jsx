import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import api from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import ConfirmModal from '../../components/common/ConfirmModal';

const ContactModal = ({ contact, groups, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    phone: contact?.phone || '',
    first_name: contact?.first_name || '',
    last_name: contact?.last_name || '',
    email: contact?.email || '',
    group_id: contact?.group_id || '',
    is_subscribed: contact?.is_subscribed !== false,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (contact?.id) {
        await api.put(`/contacts/${contact.id}`, form);
        toast.success('Contact mis à jour');
      } else {
        await api.post('/contacts', form);
        toast.success('Contact ajouté');
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
          <h5><i className="bi bi-person-fill text-primary me-2" />
            {contact?.id ? 'Modifier le contact' : 'Ajouter un contact'}
          </h5>
          <button className="btn-close" onClick={onClose} />
        </div>
        <div className="modal-body-custom">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label">Numéro de téléphone *</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="bi bi-phone" /></span>
                  <input type="text" className="form-control" value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+253 77 XX XX XX" required />
                </div>
              </div>
              <div className="col-md-6">
                <label className="form-label">Prénom</label>
                <input type="text" className="form-control" value={form.first_name}
                  onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Nom</label>
                <input type="text" className="form-control" value={form.last_name}
                  onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Groupe</label>
                <select className="form-select" value={form.group_id}
                  onChange={e => setForm(f => ({ ...f, group_id: e.target.value }))}>
                  <option value="">Sans groupe</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div className="col-12">
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" checked={form.is_subscribed}
                    onChange={e => setForm(f => ({ ...f, is_subscribed: e.target.checked }))} id="subCheck" />
                  <label className="form-check-label" htmlFor="subCheck">Abonné (peut recevoir des SMS)</label>
                </div>
              </div>
            </div>
            <div className="d-flex gap-2 mt-4">
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

const ImportModal = ({ groups, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [groupId, setGroupId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleImport = async (e) => {
    e.preventDefault();
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    if (groupId) fd.append('group_id', groupId);
    setLoading(true);
    try {
      const { data } = await api.post('/contacts/import', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data);
      toast.success(`${data.imported} contacts importés`);
      onSuccess();
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
          <h5><i className="bi bi-upload text-success me-2" />Importer des contacts</h5>
          <button className="btn-close" onClick={onClose} />
        </div>
        <div className="modal-body-custom">
          {result ? (
            <div className="import-result">
              <div className="import-result-icon"><i className="bi bi-check-circle-fill text-success" /></div>
              <h5>Importation terminée !</h5>
              <div className="import-stats">
                <div className="import-stat import-stat--success">
                  <div className="import-stat-value">{result.imported}</div>
                  <div className="import-stat-label">Importés</div>
                </div>
                <div className="import-stat import-stat--warning">
                  <div className="import-stat-value">{result.skipped}</div>
                  <div className="import-stat-label">Ignorés</div>
                </div>
                <div className="import-stat">
                  <div className="import-stat-value">{result.total}</div>
                  <div className="import-stat-label">Total</div>
                </div>
              </div>
              <button className="btn btn-primary mt-3 w-100" onClick={onClose}>Fermer</button>
            </div>
          ) : (
            <>
              <div className="import-template-hint">
                <i className="bi bi-info-circle text-info me-2" />
                Colonnes acceptées : <code>phone</code>, <code>first_name</code>, <code>last_name</code>, <code>email</code>
              </div>
              <form onSubmit={handleImport}>
                <div className="mb-3">
                  <label className="form-label">Fichier Excel ou CSV *</label>
                  <div className={`file-drop-zone ${file ? 'file-drop-zone--active' : ''}`}>
                    <input type="file" accept=".xlsx,.xls,.csv" className="file-input"
                      onChange={e => setFile(e.target.files[0])} required />
                    <div className="file-drop-content">
                      {file ? (
                        <><i className="bi bi-file-earmark-check-fill text-success" />
                        <span>{file.name}</span></>
                      ) : (
                        <><i className="bi bi-cloud-upload" />
                        <span>Glissez votre fichier ici ou cliquez</span>
                        <small>.xlsx, .xls, .csv</small></>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="form-label">Assigner à un groupe (optionnel)</label>
                  <select className="form-select" value={groupId} onChange={e => setGroupId(e.target.value)}>
                    <option value="">Sans groupe</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.contact_count})</option>)}
                  </select>
                </div>
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-light flex-fill" onClick={onClose}>Annuler</button>
                  <button type="submit" className="btn btn-success flex-fill" disabled={loading}>
                    {loading ? <><span className="spinner-border spinner-border-sm me-2" />Import en cours...</> : 'Importer'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const Contacts = () => {
  const { t } = useTranslation();
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [contactModal, setContactModal] = useState(null);
  const [importModal, setImportModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const limit = 50;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [contactsRes, groupsRes] = await Promise.all([
        api.get('/contacts', { params: { page, limit, search, group_id: groupFilter } }),
        api.get('/groups'),
      ]);
      setContacts(contactsRes.data.contacts);
      setTotal(contactsRes.data.total);
      setGroups(groupsRes.data);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [page, search, groupFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDeleteSelected = async () => {
    try {
      await api.post('/contacts/delete-bulk', { ids: selected });
      toast.success(`${selected.length} contacts supprimés`);
      setSelected([]);
      setDeleteModal(null);
      loadData();
    } catch {
      // handled
    }
  };

  const toggleSelect = (id) => {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  };

  const toggleAll = () => {
    setSelected(selected.length === contacts.length ? [] : contacts.map(c => c.id));
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="page-content">
      <PageHeader title={t('contacts.title')} subtitle={`${total.toLocaleString()} contacts`}>
        <div className="d-flex gap-2">
          <button className="btn btn-light" onClick={() => setImportModal(true)}>
            <i className="bi bi-upload me-2" />{t('contacts.import_contacts')}
          </button>
          <button className="btn btn-primary" onClick={() => setContactModal({})}>
            <i className="bi bi-plus-lg me-2" />{t('contacts.add_contact')}
          </button>
        </div>
      </PageHeader>

      <div className="card-custom">
        <div className="card-custom-header">
          <div className="table-toolbar">
            <div className="search-input-wrap">
              <i className="bi bi-search search-icon" />
              <input type="text" className="form-control search-input" placeholder="Rechercher..."
                value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <select className="form-select filter-select" value={groupFilter}
              onChange={e => { setGroupFilter(e.target.value); setPage(1); }}>
              <option value="">Tous les groupes</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            {selected.length > 0 && (
              <button className="btn btn-danger btn-sm" onClick={() => setDeleteModal('bulk')}>
                <i className="bi bi-trash me-1" />Supprimer ({selected.length})
              </button>
            )}
          </div>
        </div>

        <div className="table-responsive">
          <table className="table-custom">
            <thead>
              <tr>
                <th width="40">
                  <input type="checkbox" className="form-check-input" checked={selected.length === contacts.length && contacts.length > 0}
                    onChange={toggleAll} />
                </th>
                <th>Contact</th>
                <th>Téléphone</th>
                <th>Groupe</th>
                <th>Statut</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-5"><div className="spinner-border text-primary" /></td></tr>
              ) : contacts.length === 0 ? (
                <tr><td colSpan={6} className="empty-table-row">
                  <i className="bi bi-person-lines-fill" />
                  <p>{t('contacts.no_contacts')}</p>
                  <button className="btn btn-primary btn-sm" onClick={() => setImportModal(true)}>
                    Importer des contacts
                  </button>
                </td></tr>
              ) : contacts.map(c => (
                <tr key={c.id} className={selected.includes(c.id) ? 'row-selected' : ''}>
                  <td>
                    <input type="checkbox" className="form-check-input"
                      checked={selected.includes(c.id)} onChange={() => toggleSelect(c.id)} />
                  </td>
                  <td>
                    <div className="contact-cell">
                      <div className="contact-avatar">
                        {(c.first_name?.[0] || c.phone[0]).toUpperCase()}
                      </div>
                      <div>
                        <div className="fw-semibold">
                          {c.first_name || c.last_name ? `${c.first_name || ''} ${c.last_name || ''}`.trim() : '—'}
                        </div>
                        {c.email && <div className="text-muted small">{c.email}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="font-mono">{c.phone}</td>
                  <td>
                    {c.group ? (
                      <span className="group-badge"><i className="bi bi-collection me-1" />{c.group.name}</span>
                    ) : <span className="text-muted">—</span>}
                  </td>
                  <td>
                    <span className={`badge-status ${c.is_subscribed ? 'badge-status--active' : 'badge-status--inactive'}`}>
                      <span className="badge-dot" />
                      {c.is_subscribed ? 'Abonné' : 'Désabonné'}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-table-action btn-table-action--info" onClick={() => setContactModal(c)}>
                        <i className="bi bi-pencil-fill" />
                      </button>
                      <button className="btn-table-action btn-table-action--danger" onClick={() => setDeleteModal(c)}>
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

      {contactModal !== null && (
        <ContactModal contact={contactModal} groups={groups} onClose={() => setContactModal(null)} onSuccess={loadData} />
      )}
      {importModal && (
        <ImportModal groups={groups} onClose={() => setImportModal(false)} onSuccess={loadData} />
      )}
      <ConfirmModal
        show={!!deleteModal}
        title={deleteModal === 'bulk' ? `Supprimer ${selected.length} contacts` : 'Supprimer le contact'}
        message="Cette action est irréversible."
        onConfirm={deleteModal === 'bulk' ? handleDeleteSelected : async () => {
          await api.delete(`/contacts/${deleteModal.id}`);
          toast.success('Contact supprimé');
          setDeleteModal(null);
          loadData();
        }}
        onCancel={() => setDeleteModal(null)}
      />
    </div>
  );
};

export default Contacts;
