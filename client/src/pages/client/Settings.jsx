import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import PageHeader from '../../components/common/PageHeader';

const Settings = () => {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState('profile');
  const [senderIds, setSenderIds] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [profile, setProfile] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    preferred_language: user?.preferred_language || 'fr',
  });

  const [passwords, setPasswords] = useState({ current_password: '', new_password: '', confirm: '' });
  const [newSender, setNewSender] = useState({ name: '', is_default: false });
  const [newUser, setNewUser] = useState({ first_name: '', last_name: '', email: '', password: '', role: 'tenant_user' });

  const loadSenderIds = useCallback(async () => {
    const { data } = await api.get('/settings/sender-ids');
    setSenderIds(data);
  }, []);

  const loadUsers = useCallback(async () => {
    const { data } = await api.get('/settings/users');
    setUsers(data);
  }, []);

  useEffect(() => {
    loadSenderIds();
    loadUsers();
  }, [loadSenderIds, loadUsers]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.put('/auth/profile', profile);
      updateUser(data);
      toast.success('Profil mis à jour');
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.new_password !== passwords.confirm) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    setLoading(true);
    try {
      await api.put('/auth/change-password', {
        current_password: passwords.current_password,
        new_password: passwords.new_password,
      });
      toast.success('Mot de passe modifié');
      setPasswords({ current_password: '', new_password: '', confirm: '' });
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  const handleAddSender = async (e) => {
    e.preventDefault();
    try {
      await api.post('/settings/sender-ids', newSender);
      toast.success('Sender ID ajouté');
      setNewSender({ name: '', is_default: false });
      loadSenderIds();
    } catch {
      // handled
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await api.put(`/settings/sender-ids/${id}`, { is_default: true });
      toast.success('Sender ID par défaut mis à jour');
      loadSenderIds();
    } catch {
      // handled
    }
  };

  const handleDeleteSender = async (id) => {
    try {
      await api.delete(`/settings/sender-ids/${id}`);
      toast.success('Sender ID supprimé');
      loadSenderIds();
    } catch {
      // handled
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/settings/users', newUser);
      toast.success('Utilisateur créé');
      setNewUser({ first_name: '', last_name: '', email: '', password: '', role: 'tenant_user' });
      loadUsers();
    } catch {
      // handled
    }
  };

  const tabs = [
    { id: 'profile', icon: 'bi-person-fill', label: t('settings.profile') },
    { id: 'senders', icon: 'bi-chat-dots-fill', label: t('settings.sender_ids') },
    { id: 'users', icon: 'bi-people-fill', label: t('settings.users') },
  ];

  return (
    <div className="page-content">
      <PageHeader title={t('settings.title')} subtitle="Gérer votre compte et préférences" />

      <div className="settings-layout">
        {/* Sidebar tabs */}
        <div className="settings-sidebar">
          {tabs.map(tab_ => (
            <button key={tab_.id}
              className={`settings-tab ${tab === tab_.id ? 'settings-tab--active' : ''}`}
              onClick={() => setTab(tab_.id)}>
              <i className={`bi ${tab_.icon} me-2`} />{tab_.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="settings-content">
          {/* Profile */}
          {tab === 'profile' && (
            <div className="card-custom mb-4">
              <div className="card-custom-header">
                <h5><i className="bi bi-person-fill text-primary me-2" />Informations personnelles</h5>
              </div>
              <div className="card-custom-body">
                <form onSubmit={handleSaveProfile}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Prénom</label>
                      <input type="text" className="form-control" value={profile.first_name}
                        onChange={e => setProfile(p => ({ ...p, first_name: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Nom</label>
                      <input type="text" className="form-control" value={profile.last_name}
                        onChange={e => setProfile(p => ({ ...p, last_name: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Email</label>
                      <input type="email" className="form-control" value={user?.email} disabled />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Langue préférée</label>
                      <select className="form-select" value={profile.preferred_language}
                        onChange={e => setProfile(p => ({ ...p, preferred_language: e.target.value }))}>
                        <option value="fr">Français</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary mt-4" disabled={loading}>
                    <i className="bi bi-check-lg me-2" />Enregistrer
                  </button>
                </form>
              </div>
            </div>
          )}

          {tab === 'profile' && (
            <div className="card-custom">
              <div className="card-custom-header">
                <h5><i className="bi bi-shield-lock-fill text-warning me-2" />Changer le mot de passe</h5>
              </div>
              <div className="card-custom-body">
                <form onSubmit={handleChangePassword}>
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label">{t('settings.current_password')}</label>
                      <input type="password" className="form-control" value={passwords.current_password}
                        onChange={e => setPasswords(p => ({ ...p, current_password: e.target.value }))} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">{t('settings.new_password')}</label>
                      <input type="password" className="form-control" value={passwords.new_password}
                        onChange={e => setPasswords(p => ({ ...p, new_password: e.target.value }))}
                        placeholder="Minimum 8 caractères" required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Confirmer</label>
                      <input type="password" className="form-control" value={passwords.confirm}
                        onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} required />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-warning mt-4" disabled={loading}>
                    <i className="bi bi-key-fill me-2" />Changer le mot de passe
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Sender IDs */}
          {tab === 'senders' && (
            <>
              <div className="card-custom mb-4">
                <div className="card-custom-header">
                  <h5><i className="bi bi-chat-dots-fill text-primary me-2" />Ajouter un Sender ID</h5>
                </div>
                <div className="card-custom-body">
                  <form onSubmit={handleAddSender}>
                    <div className="row g-3 align-items-end">
                      <div className="col-md-5">
                        <label className="form-label">Nom de l'expéditeur</label>
                        <input type="text" className="form-control" value={newSender.name}
                          onChange={e => setNewSender(s => ({ ...s, name: e.target.value.slice(0, 11) }))}
                          placeholder="Ex: MAENTREPRISE" maxLength={11} required />
                        <div className="form-text">{newSender.name.length}/11 caractères</div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-check mt-4">
                          <input className="form-check-input" type="checkbox" checked={newSender.is_default}
                            onChange={e => setNewSender(s => ({ ...s, is_default: e.target.checked }))} id="defCheck" />
                          <label className="form-check-label" htmlFor="defCheck">Définir comme défaut</label>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <button type="submit" className="btn btn-primary w-100">
                          <i className="bi bi-plus-lg me-1" />Ajouter
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>

              <div className="card-custom">
                <div className="card-custom-header">
                  <h5>Sender IDs configurés</h5>
                </div>
                <div className="table-responsive">
                  <table className="table-custom">
                    <thead>
                      <tr><th>Nom</th><th>Statut</th><th>{t('common.actions')}</th></tr>
                    </thead>
                    <tbody>
                      {senderIds.length === 0 ? (
                        <tr><td colSpan={3} className="empty-table-row">
                          <i className="bi bi-chat-dots" /><p>Aucun Sender ID configuré</p>
                        </td></tr>
                      ) : senderIds.map(s => (
                        <tr key={s.id}>
                          <td>
                            <div className="sender-id-cell">
                              <div className="sender-id-badge">{s.name}</div>
                              {s.is_default && <span className="badge bg-success ms-2">Par défaut</span>}
                            </div>
                          </td>
                          <td>
                            <span className={`badge-status ${s.is_active ? 'badge-status--active' : 'badge-status--inactive'}`}>
                              <span className="badge-dot" />{s.is_active ? 'Actif' : 'Inactif'}
                            </span>
                          </td>
                          <td>
                            <div className="table-actions">
                              {!s.is_default && (
                                <button className="btn-table-action btn-table-action--success"
                                  title="Définir par défaut" onClick={() => handleSetDefault(s.id)}>
                                  <i className="bi bi-star-fill" />
                                </button>
                              )}
                              {!s.is_default && (
                                <button className="btn-table-action btn-table-action--danger"
                                  onClick={() => handleDeleteSender(s.id)}>
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
              </div>
            </>
          )}

          {/* Users */}
          {tab === 'users' && (
            <>
              <div className="card-custom mb-4">
                <div className="card-custom-header">
                  <h5><i className="bi bi-person-plus-fill text-primary me-2" />{t('settings.add_user')}</h5>
                </div>
                <div className="card-custom-body">
                  <form onSubmit={handleAddUser}>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Prénom</label>
                        <input type="text" className="form-control" value={newUser.first_name}
                          onChange={e => setNewUser(u => ({ ...u, first_name: e.target.value }))} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Nom</label>
                        <input type="text" className="form-control" value={newUser.last_name}
                          onChange={e => setNewUser(u => ({ ...u, last_name: e.target.value }))} required />
                      </div>
                      <div className="col-md-5">
                        <label className="form-label">Email</label>
                        <input type="email" className="form-control" value={newUser.email}
                          onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))} required />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Mot de passe</label>
                        <input type="password" className="form-control" value={newUser.password}
                          onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))}
                          placeholder="Min. 8 caractères" required />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Rôle</label>
                        <select className="form-select" value={newUser.role}
                          onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))}>
                          <option value="tenant_user">Utilisateur</option>
                          <option value="tenant_admin">Administrateur</option>
                        </select>
                      </div>
                      <div className="col-12">
                        <button type="submit" className="btn btn-primary">
                          <i className="bi bi-plus-lg me-2" />Créer l'utilisateur
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>

              <div className="card-custom">
                <div className="card-custom-header"><h5>Utilisateurs du compte</h5></div>
                <div className="table-responsive">
                  <table className="table-custom">
                    <thead>
                      <tr><th>Utilisateur</th><th>Email</th><th>Rôle</th><th>Dernière connexion</th><th>Statut</th></tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id}>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div className="contact-avatar" style={{ width: 36, height: 36, fontSize: 14 }}>
                                {u.first_name?.[0]}{u.last_name?.[0]}
                              </div>
                              <div className="fw-semibold">{u.first_name} {u.last_name}</div>
                            </div>
                          </td>
                          <td className="text-muted">{u.email}</td>
                          <td>
                            <span className={`badge ${u.role === 'tenant_admin' ? 'bg-primary' : 'bg-secondary'} bg-opacity-10 text-${u.role === 'tenant_admin' ? 'primary' : 'secondary'} fw-semibold`}>
                              {u.role === 'tenant_admin' ? 'Admin' : 'Utilisateur'}
                            </span>
                          </td>
                          <td className="text-muted">
                            {u.last_login ? new Date(u.last_login).toLocaleDateString('fr-FR') : 'Jamais'}
                          </td>
                          <td>
                            <span className={`badge-status ${u.is_active ? 'badge-status--active' : 'badge-status--inactive'}`}>
                              <span className="badge-dot" />{u.is_active ? 'Actif' : 'Inactif'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
