import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const AdminMenu = () => {
  const { t } = useTranslation();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(r => setPendingCount(r.data.pending_payments_count || 0))
      .catch(() => {});
  }, []);

  return (
    <>
      <li className="nav-section-title">Administration</li>
      <li>
        <NavLink to="/admin" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <i className="bi bi-grid-1x2-fill" />
          <span>{t('nav.dashboard')}</span>
        </NavLink>
      </li>

      <li className="nav-section-title">Clients</li>
      <li>
        <NavLink to="/admin/clients" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <i className="bi bi-people-fill" />
          <span>{t('nav.clients')}</span>
        </NavLink>
      </li>
      <li>
        <NavLink to="/admin/credits" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <i className="bi bi-wallet2" />
          <span>Crédits clients</span>
        </NavLink>
      </li>

      <li className="nav-section-title">Finance</li>
      <li>
        <NavLink to="/admin/payments" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <i className="bi bi-credit-card-2-front-fill" />
          <span>Paiements</span>
          {pendingCount > 0 && (
            <span className="sidebar-badge">{pendingCount}</span>
          )}
        </NavLink>
      </li>
      <li>
        <NavLink to="/admin/bank" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <i className="bi bi-bank" />
          <span>Banque SMS</span>
        </NavLink>
      </li>
      <li>
        <NavLink to="/admin/packages" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <i className="bi bi-box-seam-fill" />
          <span>{t('nav.packages')}</span>
        </NavLink>
      </li>
    </>
  );
};

const ClientMenu = () => {
  const { t } = useTranslation();
  return (
    <>
      <li className="nav-section-title">Menu principal</li>
      <li>
        <NavLink to="/dashboard" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <i className="bi bi-grid-1x2-fill" />
          <span>{t('nav.dashboard')}</span>
        </NavLink>
      </li>
      <li className="nav-section-title">SMS</li>
      <li>
        <NavLink to="/dashboard/campaigns" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <i className="bi bi-send-fill" />
          <span>{t('nav.campaigns')}</span>
        </NavLink>
      </li>
      <li>
        <NavLink to="/dashboard/templates" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <i className="bi bi-file-text-fill" />
          <span>{t('nav.templates')}</span>
        </NavLink>
      </li>
      <li className="nav-section-title">Contacts</li>
      <li>
        <NavLink to="/dashboard/contacts" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <i className="bi bi-person-lines-fill" />
          <span>{t('nav.contacts')}</span>
        </NavLink>
      </li>
      <li>
        <NavLink to="/dashboard/groups" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <i className="bi bi-collection-fill" />
          <span>{t('nav.groups')}</span>
        </NavLink>
      </li>
      <li className="nav-section-title">Rapports</li>
      <li>
        <NavLink to="/dashboard/analytics" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <i className="bi bi-bar-chart-fill" />
          <span>{t('nav.analytics')}</span>
        </NavLink>
      </li>
      <li className="nav-section-title">Compte</li>
      <li>
        <NavLink to="/dashboard/buy-credits" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <i className="bi bi-wallet2" />
          <span>Acheter des crédits</span>
        </NavLink>
      </li>
      <li>
        <NavLink to="/dashboard/settings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <i className="bi bi-gear-fill" />
          <span>{t('nav.settings')}</span>
        </NavLink>
      </li>
    </>
  );
};

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout, isSuperAdmin } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar--open' : 'sidebar--closed'}`}>
      {/* Logo */}
      <div className="sidebar-brand">
        <div className="brand-logo">
          <i className="bi bi-chat-dots-fill" />
        </div>
        <div className="brand-text">
          <span className="brand-name">BulkSMS</span>
          <span className="brand-tagline">Platform</span>
        </div>
        <button className="sidebar-close-btn d-lg-none" onClick={onClose}>
          <i className="bi bi-x-lg" />
        </button>
      </div>

      {/* User info */}
      <div className="sidebar-user">
        <div className="user-avatar">
          {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
        </div>
        <div className="user-info">
          <div className="user-name">{user?.first_name} {user?.last_name}</div>
          <div className="user-role">
            {isSuperAdmin ? (
              <span className="badge-role badge-admin">Super Admin</span>
            ) : (
              <span className="badge-role badge-client">{user?.tenant?.name || 'Client'}</span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <ul className="sidebar-menu">
          {isSuperAdmin ? <AdminMenu /> : <ClientMenu />}
        </ul>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <button className="sidebar-link sidebar-logout" onClick={handleLogout}>
          <i className="bi bi-box-arrow-left" />
          <span>{t('nav.logout')}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
