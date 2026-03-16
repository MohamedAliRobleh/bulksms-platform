import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import api from '../../services/api';

const ResetPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password: form.password });
      toast.success('Mot de passe réinitialisé avec succès');
      navigate('/login');
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-wrapper auth-wrapper--simple">
        <div className="auth-simple-card text-center">
          <i className="bi bi-exclamation-triangle text-danger" style={{ fontSize: '3rem' }} />
          <h3 className="mt-3">Lien invalide</h3>
          <p className="text-muted">Ce lien de réinitialisation est invalide ou expiré.</p>
          <Link to="/forgot-password" className="btn btn-primary mt-3">Demander un nouveau lien</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrapper auth-wrapper--simple">
      <div className="auth-simple-card">
        <div className="auth-simple-logo">
          <i className="bi bi-chat-dots-fill" />
          <span>BulkSMS</span>
        </div>
        <div className="auth-simple-header">
          <h2>Nouveau mot de passe</h2>
          <p>Choisissez un nouveau mot de passe sécurisé</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group-auth">
            <label className="form-label-auth">{t('auth.new_password')}</label>
            <div className="input-icon-wrap">
              <i className="bi bi-lock input-icon" />
              <input
                type="password"
                className="form-control form-control-auth"
                placeholder="Minimum 8 caractères"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="form-group-auth">
            <label className="form-label-auth">{t('auth.confirm_password')}</label>
            <div className="input-icon-wrap">
              <i className="bi bi-lock-fill input-icon" />
              <input
                type="password"
                className="form-control form-control-auth"
                placeholder="Répéter le mot de passe"
                value={form.confirm}
                onChange={e => setForm({ ...form, confirm: e.target.value })}
                required
              />
            </div>
          </div>
          <button type="submit" className="btn-auth-submit" disabled={loading}>
            {loading ? <span className="spinner-border spinner-border-sm" /> : 'Réinitialiser le mot de passe'}
          </button>
        </form>
        <div className="text-center mt-3">
          <Link to="/login" className="auth-link-small">
            <i className="bi bi-arrow-left me-1" />{t('auth.back_to_login')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
