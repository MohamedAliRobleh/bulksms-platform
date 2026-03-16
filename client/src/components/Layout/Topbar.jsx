import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

const Topbar = ({ onToggleSidebar, sidebarOpen }) => {
  const { t, i18n } = useTranslation();
  const { user, isSuperAdmin } = useAuth();

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'fr' ? 'en' : 'fr');
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="topbar-toggle" onClick={onToggleSidebar} title="Toggle sidebar">
          <i className={`bi ${sidebarOpen ? 'bi-layout-sidebar' : 'bi-layout-sidebar-reverse'}`} />
        </button>
      </div>

      <div className="topbar-right">
        {/* Language Toggle */}
        <button className="topbar-btn" onClick={toggleLang} title="Changer la langue">
          <span className="lang-badge">{i18n.language.toUpperCase()}</span>
        </button>

        {/* Credits badge (clients only) */}
        {!isSuperAdmin && (
          <Link
            to="/dashboard/analytics"
            className="topbar-credits"
            title={t('credits.balance')}
          >
            <i className="bi bi-lightning-charge-fill" />
            <span className="credits-loading">-</span>
          </Link>
        )}

        {/* Notifications */}
        <button className="topbar-btn">
          <i className="bi bi-bell" />
        </button>

        {/* User dropdown */}
        <div className="dropdown">
          <button className="topbar-user-btn dropdown-toggle" data-bs-toggle="dropdown">
            <div className="topbar-avatar">
              {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
            </div>
            <span className="d-none d-md-inline">{user?.first_name}</span>
          </button>
          <ul className="dropdown-menu dropdown-menu-end topbar-dropdown">
            <li>
              <div className="dropdown-header">
                <div className="fw-semibold">{user?.first_name} {user?.last_name}</div>
                <small className="text-muted">{user?.email}</small>
              </div>
            </li>
            <li><hr className="dropdown-divider" /></li>
            <li>
              <Link className="dropdown-item" to={isSuperAdmin ? '/admin' : '/dashboard/settings'}>
                <i className="bi bi-person me-2" />
                {t('nav.profile')}
              </Link>
            </li>
            {!isSuperAdmin && (
              <li>
                <Link className="dropdown-item" to="/dashboard/settings">
                  <i className="bi bi-gear me-2" />
                  {t('nav.settings')}
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
