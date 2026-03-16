import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import api from '../../services/api';
import PageHeader from '../../components/common/PageHeader';

const BuyCredits = () => {
  const { t } = useTranslation();
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paymentState, setPaymentState] = useState(null); // null | 'pending' | 'completed' | 'failed'
  const [currentPaymentId, setCurrentPaymentId] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [polling, setPolling] = useState(false);

  const fetchPackages = async () => {
    try {
      const res = await api.get('/payments/packages');
      setPackages(res.data);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get('/payments/history?limit=10');
      setHistory(res.data.payments || []);
    } catch {
      // silent
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
    fetchHistory();
  }, []);

  const checkPaymentStatus = useCallback(async (paymentId) => {
    try {
      const res = await api.get(`/payments/${paymentId}/check`);
      if (res.data.status === 'completed') {
        setPaymentState('completed');
        setPolling(false);
        fetchHistory();
        toast.success(res.data.message || 'Crédits ajoutés avec succès !');
        return true;
      }
    } catch {
      // silent
    }
    return false;
  }, []);

  useEffect(() => {
    if (!polling || !currentPaymentId) return;
    const interval = setInterval(async () => {
      const done = await checkPaymentStatus(currentPaymentId);
      if (done) clearInterval(interval);
    }, 5000);
    // Stop polling after 3 minutes
    const timeout = setTimeout(() => {
      clearInterval(interval);
      setPolling(false);
      if (paymentState === 'pending') {
        setPaymentState('failed');
        toast.error('Le paiement n\'a pas été confirmé dans le délai imparti.');
      }
    }, 180000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [polling, currentPaymentId, checkPaymentStatus, paymentState]);

  const handlePay = async () => {
    if (!selectedPackage) {
      toast.warning('Veuillez sélectionner un package');
      return;
    }
    if (!phoneNumber || phoneNumber.replace(/\D/g, '').length < 8) {
      toast.warning('Veuillez entrer un numéro de téléphone Waafi valide');
      return;
    }
    setPaying(true);
    // Normalise : ajoute 253 si le numéro ne commence pas déjà par 253
    const digits = phoneNumber.replace(/\D/g, '');
    const fullPhone = digits.startsWith('253') ? digits : `253${digits}`;
    try {
      const res = await api.post('/payments/initiate', {
        package_id: selectedPackage.id,
        phone_number: fullPhone,
      });
      setCurrentPaymentId(res.data.payment_id);
      if (res.data.status === 'completed') {
        setPaymentState('completed');
        fetchHistory();
        toast.success(res.data.message);
      } else {
        setPaymentState('pending');
        setPolling(true);
        toast.info('Confirmez le paiement sur votre téléphone Waafi');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || t('common.error'));
    } finally {
      setPaying(false);
    }
  };

  const handleReset = () => {
    setPaymentState(null);
    setCurrentPaymentId(null);
    setSelectedPackage(null);
    setPhoneNumber('');
    setPolling(false);
  };

  const formatPrice = (amount, currency) => {
    return `${Number(amount).toLocaleString('fr-DJ')} ${currency || 'DJF'}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const downloadInvoice = async (paymentId) => {
    try {
      const res = await api.get(`/payments/${paymentId}/invoice`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `facture-${paymentId.slice(0, 8).toUpperCase()}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Erreur lors du téléchargement de la facture');
    }
  };

  const statusBadge = (status) => {
    const map = {
      completed: { cls: 'bg-success', label: 'Payé' },
      pending: { cls: 'bg-warning text-dark', label: 'En attente' },
      failed: { cls: 'bg-danger', label: 'Échoué' },
      cancelled: { cls: 'bg-secondary', label: 'Annulé' },
    };
    const s = map[status] || { cls: 'bg-secondary', label: status };
    return <span className={`badge ${s.cls}`}>{s.label}</span>;
  };

  return (
    <div className="page-content">
      <PageHeader
        title="Acheter des crédits SMS"
        subtitle="Rechargez votre wallet via Waafi Pay"
        icon="bi-wallet2"
      />

      {/* Payment flow */}
      {paymentState === null && (
        <>
          {/* Step 1 – Choose package */}
          <div className="card mb-4">
            <div className="card-header">
              <h6 className="mb-0"><i className="bi bi-1-circle-fill me-2 text-primary" />Choisissez un package</h6>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" />
                </div>
              ) : packages.length === 0 ? (
                <p className="text-muted">Aucun package disponible pour le moment.</p>
              ) : (
                <div className="row g-3">
                  {packages.map((pkg) => (
                    <div key={pkg.id} className="col-12 col-sm-6 col-lg-3">
                      <div
                        className={`package-card ${selectedPackage?.id === pkg.id ? 'package-card--selected' : ''} ${pkg.is_featured ? 'package-card--featured' : ''}`}
                        onClick={() => setSelectedPackage(pkg)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && setSelectedPackage(pkg)}
                      >
                        {pkg.is_featured && (
                          <div className="package-badge">Populaire</div>
                        )}
                        <div className="package-name">{pkg.name}</div>
                        <div className="package-sms">
                          <span className="package-sms-count">{Number(pkg.sms_count).toLocaleString()}</span>
                          <span className="package-sms-label"> SMS</span>
                        </div>
                        <div className="package-price">{formatPrice(pkg.price, pkg.currency)}</div>
                        {pkg.validity_days && (
                          <div className="package-validity">Valide {pkg.validity_days} jours</div>
                        )}
                        {selectedPackage?.id === pkg.id && (
                          <div className="package-check">
                            <i className="bi bi-check-circle-fill text-primary" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Step 2 – Phone number */}
          <div className={`card mb-4 ${!selectedPackage ? 'opacity-50' : ''}`}>
            <div className="card-header">
              <h6 className="mb-0"><i className="bi bi-2-circle-fill me-2 text-primary" />Entrez votre numéro Waafi</h6>
            </div>
            <div className="card-body">
              <div className="row align-items-end g-3">
                <div className="col-12 col-md-5">
                  <label className="form-label">Numéro de téléphone Waafi</label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <img src="https://flagcdn.com/16x12/dj.png" alt="DJ" className="me-1" />
                      +253
                    </span>
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="77 XX XX XX"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\s/g, ''))}
                      disabled={!selectedPackage}
                    />
                  </div>
                  <div className="form-text">Entrez votre numéro local, ex : 77 XX XX XX</div>
                </div>
                {selectedPackage && (
                  <div className="col-12 col-md-4">
                    <div className="alert alert-info mb-0 py-2">
                      <small>
                        <strong>{selectedPackage.name}</strong><br />
                        {Number(selectedPackage.sms_count).toLocaleString()} SMS —{' '}
                        <strong>{formatPrice(selectedPackage.price, selectedPackage.currency)}</strong>
                      </small>
                    </div>
                  </div>
                )}
                <div className="col-12 col-md-3">
                  <button
                    className="btn btn-primary w-100"
                    onClick={handlePay}
                    disabled={!selectedPackage || !phoneNumber || paying}
                  >
                    {paying ? (
                      <><span className="spinner-border spinner-border-sm me-2" />Traitement...</>
                    ) : (
                      <><i className="bi bi-phone-fill me-2" />Payer avec Waafi</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Pending state */}
      {paymentState === 'pending' && (
        <div className="card mb-4">
          <div className="card-body text-center py-5">
            <div className="mb-3">
              <span style={{ fontSize: '3rem' }}>📱</span>
            </div>
            <h5 className="fw-bold">En attente de confirmation</h5>
            <p className="text-muted mb-4">
              Une notification a été envoyée sur le numéro <strong>{phoneNumber}</strong>.<br />
              Confirmez le paiement de <strong>{formatPrice(selectedPackage?.price, selectedPackage?.currency)}</strong> sur votre application Waafi.
            </p>
            <div className="d-flex align-items-center justify-content-center gap-2 mb-4">
              <div className="spinner-border spinner-border-sm text-primary" />
              <span className="text-muted small">Vérification en cours (toutes les 5 secondes)...</span>
            </div>
            <div className="d-flex gap-2 justify-content-center">
              <button
                className="btn btn-outline-primary"
                onClick={() => checkPaymentStatus(currentPaymentId)}
              >
                <i className="bi bi-arrow-clockwise me-2" />Vérifier maintenant
              </button>
              <button className="btn btn-outline-secondary" onClick={handleReset}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completed state */}
      {paymentState === 'completed' && (
        <div className="card mb-4 border-success">
          <div className="card-body text-center py-5">
            <div className="mb-3">
              <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '3rem' }} />
            </div>
            <h5 className="fw-bold text-success">Paiement confirmé !</h5>
            <p className="text-muted mb-4">
              <strong>{Number(selectedPackage?.sms_count).toLocaleString()} crédits SMS</strong> ont été ajoutés à votre compte.
            </p>
            <button className="btn btn-primary" onClick={handleReset}>
              <i className="bi bi-plus-circle me-2" />Acheter d'autres crédits
            </button>
          </div>
        </div>
      )}

      {/* Failed state */}
      {paymentState === 'failed' && (
        <div className="card mb-4 border-danger">
          <div className="card-body text-center py-5">
            <div className="mb-3">
              <i className="bi bi-x-circle-fill text-danger" style={{ fontSize: '3rem' }} />
            </div>
            <h5 className="fw-bold text-danger">Paiement non confirmé</h5>
            <p className="text-muted mb-4">
              Le paiement n'a pas été confirmé. Vérifiez votre solde Waafi et réessayez.
            </p>
            <button className="btn btn-primary" onClick={handleReset}>
              <i className="bi bi-arrow-counterclockwise me-2" />Réessayer
            </button>
          </div>
        </div>
      )}

      {/* Payment history */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h6 className="mb-0"><i className="bi bi-clock-history me-2" />Historique des paiements</h6>
        </div>
        <div className="card-body p-0">
          {historyLoading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary spinner-border-sm" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <i className="bi bi-inbox fs-3 d-block mb-2" />
              Aucun paiement effectué
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Package</th>
                    <th>Crédits</th>
                    <th>Montant</th>
                    <th>Statut</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((p) => (
                    <tr key={p.id}>
                      <td className="text-muted small">{formatDate(p.createdAt)}</td>
                      <td>{p.package?.name || '—'}</td>
                      <td><strong>{Number(p.sms_count).toLocaleString()}</strong> SMS</td>
                      <td>{formatPrice(p.amount, p.currency)}</td>
                      <td>{statusBadge(p.status)}</td>
                      <td>
                        {p.status === 'completed' && (
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => downloadInvoice(p.id)}
                            title="Télécharger la facture PDF"
                          >
                            <i className="bi bi-download me-1" />PDF
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuyCredits;
