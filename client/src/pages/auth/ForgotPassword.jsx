import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

const ForgotPassword = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch {
      // Error handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper auth-wrapper--simple">
      <div className="auth-simple-card">
        <div className="auth-simple-logo">
          <i className="bi bi-chat-dots-fill" />
          <span>BulkSMS</span>
        </div>

        {sent ? (
          <div className="text-center py-4">
            <div className="auth-success-icon">
              <i className="bi bi-envelope-check-fill" />
            </div>
            <h3>Email envoyé !</h3>
            <p className="text-muted">Vérifiez votre boîte email pour le lien de réinitialisation.</p>
            <Link to="/login" className="btn btn-primary mt-3">
              <i className="bi bi-arrow-left me-2" />{t('auth.back_to_login')}
            </Link>
          </div>
        ) : (
          <>
            <div className="auth-simple-header">
              <h2>{t('auth.reset_password')}</h2>
              <p>Entrez votre email pour recevoir un lien de réinitialisation</p>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group-auth">
                <label className="form-label-auth">{t('auth.email')}</label>
                <div className="input-icon-wrap">
                  <i className="bi bi-envelope input-icon" />
                  <input
                    type="email"
                    className="form-control form-control-auth"
                    placeholder="exemple@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="btn-auth-submit" disabled={loading}>
                {loading ? <span className="spinner-border spinner-border-sm" /> : t('auth.send_reset')}
              </button>
            </form>
            <div className="text-center mt-3">
              <Link to="/login" className="auth-link-small">
                <i className="bi bi-arrow-left me-1" />{t('auth.back_to_login')}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
