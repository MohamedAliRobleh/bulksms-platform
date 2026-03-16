import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

const Login = () => {
  const { t, i18n } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      toast.success(`Bienvenue, ${data.user.first_name} !`);
      navigate(data.user.role === 'super_admin' ? '/admin' : '/dashboard');
    } catch (err) {
      // Error handled by api interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      {/* Left panel */}
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-brand">
            <div className="auth-brand-icon">
              <i className="bi bi-chat-dots-fill" />
            </div>
            <div>
              <h2>BulkSMS</h2>
              <p>Platform</p>
            </div>
          </div>
          <div className="auth-illustration">
            <div className="illustration-circles">
              <div className="circle c1" />
              <div className="circle c2" />
              <div className="circle c3" />
            </div>
            <div className="illustration-card">
              <div className="illus-stat">
                <i className="bi bi-send-check-fill" />
                <div>
                  <div className="illus-value">98.7%</div>
                  <div className="illus-label">Taux de livraison</div>
                </div>
              </div>
            </div>
            <div className="illustration-card illustration-card--2">
              <div className="illus-stat">
                <i className="bi bi-lightning-charge-fill text-warning" />
                <div>
                  <div className="illus-value">{'<'} 3s</div>
                  <div className="illus-label">Délai d'envoi</div>
                </div>
              </div>
            </div>
          </div>
          <div className="auth-left-footer">
            <p>Plateforme SMS professionnelle pour Djibouti et l'Afrique de l'Est</p>
            <div className="auth-features">
              <div className="auth-feature"><i className="bi bi-check-circle-fill" /> Envoi en masse</div>
              <div className="auth-feature"><i className="bi bi-check-circle-fill" /> Planification</div>
              <div className="auth-feature"><i className="bi bi-check-circle-fill" /> Rapports détaillés</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-right">
        <div className="auth-form-container">
          {/* Language switcher */}
          <div className="auth-lang">
            <button
              className="btn-lang"
              onClick={() => i18n.changeLanguage(i18n.language === 'fr' ? 'en' : 'fr')}
            >
              {i18n.language === 'fr' ? '🇬🇧 EN' : '🇫🇷 FR'}
            </button>
          </div>

          <div className="auth-form-header">
            <h1>{t('auth.welcome_back')}</h1>
            <p>{t('auth.login_subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group-auth">
              <label className="form-label-auth">{t('auth.email')}</label>
              <div className="input-icon-wrap">
                <i className="bi bi-envelope input-icon" />
                <input
                  type="email"
                  className="form-control form-control-auth"
                  placeholder="exemple@email.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="form-group-auth">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label-auth mb-0">{t('auth.password')}</label>
                <Link to="/forgot-password" className="auth-link-small">{t('auth.forgot_password')}</Link>
              </div>
              <div className="input-icon-wrap">
                <i className="bi bi-lock input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control form-control-auth"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="input-icon-right"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
              </div>
            </div>

            <button type="submit" className="btn-auth-submit" disabled={loading}>
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-2" /> Connexion...</>
              ) : (
                <><i className="bi bi-box-arrow-in-right me-2" />{t('auth.login_btn')}</>
              )}
            </button>
          </form>

          <div className="auth-form-footer">
            <p>© 2024 BulkSMS Platform. Tous droits réservés.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
