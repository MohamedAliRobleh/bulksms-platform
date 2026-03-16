import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import api from '../../services/api';
import PageHeader from '../../components/common/PageHeader';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const Analytics = () => {
  const { t } = useTranslation();
  const [dashboard, setDashboard] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [credits, setCredits] = useState([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [dash, chart, cred] = await Promise.all([
          api.get('/analytics/dashboard'),
          api.get('/analytics/campaigns', { params: { days } }),
          api.get('/analytics/credits', { params: { limit: 10 } }),
        ]);
        setDashboard(dash.data);
        setChartData(chart.data);
        setCredits(cred.data.transactions);
      } catch {
        // handled
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [days]);

  const fmt = (n) => Number(n || 0).toLocaleString('fr-FR');

  const lineData = chartData ? {
    labels: chartData.daily.map(d => d.date),
    datasets: [
      {
        label: 'Total envoyés',
        data: chartData.daily.map(d => parseInt(d.total)),
        borderColor: '#4F46E5',
        backgroundColor: 'rgba(79,70,229,0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#4F46E5',
      },
      {
        label: 'Livrés',
        data: chartData.daily.map(d => parseInt(d.delivered)),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16,185,129,0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#10B981',
      },
    ],
  } : null;

  const doughnutData = chartData ? {
    labels: chartData.status_breakdown.map(s => ({
      sent: 'Envoyés', delivered: 'Livrés', failed: 'Échoués',
      pending: 'En attente', undelivered: 'Non livrés',
    }[s.status] || s.status)),
    datasets: [{
      data: chartData.status_breakdown.map(s => parseInt(s.count)),
      backgroundColor: ['#4F46E5', '#10B981', '#EF4444', '#F59E0B', '#94A3B8'],
      borderWidth: 0,
    }],
  } : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: '#F1F5F9' } },
      x: { grid: { display: false } },
    },
  };

  return (
    <div className="page-content">
      <PageHeader title={t('analytics.title')} subtitle="Analysez les performances de vos campagnes">
        <div className="btn-group">
          {[7, 30, 90].map(d => (
            <button key={d} className={`btn btn-sm ${days === d ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setDays(d)}>
              {d}j
            </button>
          ))}
        </div>
      </PageHeader>

      {loading ? (
        <div className="d-flex justify-content-center py-5"><div className="spinner-border text-primary" /></div>
      ) : (
        <>
          {/* Stats row */}
          <div className="stats-grid mb-4">
            <div className="stats-card">
              <div className="stats-card-body">
                <div className="stats-icon-wrap" style={{ background: 'rgba(79,70,229,0.1)' }}>
                  <i className="bi bi-send-fill" style={{ color: '#4F46E5' }} />
                </div>
                <div className="stats-content">
                  <div className="stats-value">{fmt(dashboard?.stats?.total_messages)}</div>
                  <div className="stats-title">Total envoyés</div>
                </div>
              </div>
            </div>
            <div className="stats-card">
              <div className="stats-card-body">
                <div className="stats-icon-wrap" style={{ background: 'rgba(16,185,129,0.1)' }}>
                  <i className="bi bi-check-circle-fill" style={{ color: '#10B981' }} />
                </div>
                <div className="stats-content">
                  <div className="stats-value">{fmt(dashboard?.stats?.delivered_messages)}</div>
                  <div className="stats-title">Livrés</div>
                </div>
              </div>
            </div>
            <div className="stats-card">
              <div className="stats-card-body">
                <div className="stats-icon-wrap" style={{ background: 'rgba(16,185,129,0.1)' }}>
                  <i className="bi bi-percent" style={{ color: '#10B981' }} />
                </div>
                <div className="stats-content">
                  <div className="stats-value">{dashboard?.stats?.delivery_rate || 0}%</div>
                  <div className="stats-title">Taux de livraison</div>
                </div>
              </div>
            </div>
            <div className="stats-card">
              <div className="stats-card-body">
                <div className="stats-icon-wrap" style={{ background: 'rgba(245,158,11,0.1)' }}>
                  <i className="bi bi-lightning-charge-fill" style={{ color: '#F59E0B' }} />
                </div>
                <div className="stats-content">
                  <div className="stats-value">{fmt(dashboard?.stats?.sms_balance)}</div>
                  <div className="stats-title">Crédits restants</div>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4">
            {/* Line chart */}
            <div className="col-lg-8">
              <div className="card-custom">
                <div className="card-custom-header">
                  <h5><i className="bi bi-graph-up text-primary me-2" />Évolution des envois ({days} derniers jours)</h5>
                </div>
                <div className="card-custom-body">
                  {lineData && lineData.labels.length > 0 ? (
                    <Line data={lineData} options={chartOptions} height={100} />
                  ) : (
                    <div className="empty-chart">
                      <i className="bi bi-graph-up" />
                      <p>Aucune donnée pour cette période</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Doughnut */}
            <div className="col-lg-4">
              <div className="card-custom">
                <div className="card-custom-header">
                  <h5><i className="bi bi-pie-chart-fill text-primary me-2" />Répartition par statut</h5>
                </div>
                <div className="card-custom-body">
                  {doughnutData && doughnutData.labels.length > 0 ? (
                    <Doughnut data={doughnutData} options={{
                      responsive: true,
                      plugins: { legend: { position: 'bottom' } },
                      cutout: '70%',
                    }} />
                  ) : (
                    <div className="empty-chart">
                      <i className="bi bi-pie-chart" />
                      <p>Aucune donnée</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Credit history */}
          <div className="card-custom mt-4">
            <div className="card-custom-header">
              <h5><i className="bi bi-clock-history text-warning me-2" />Historique des crédits (10 derniers)</h5>
            </div>
            <div className="table-responsive">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Montant</th>
                    <th>Solde après</th>
                    <th>Description</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {credits.length === 0 ? (
                    <tr><td colSpan={5} className="empty-table-row">
                      <i className="bi bi-clock-history" /><p>Aucun historique</p>
                    </td></tr>
                  ) : credits.map(tx => (
                    <tr key={tx.id}>
                      <td>
                        <span className={`badge-campaign ${tx.type === 'credit' ? 'badge-success' : 'badge-danger'}`}>
                          <i className={`bi ${tx.type === 'credit' ? 'bi-plus-circle-fill' : 'bi-dash-circle-fill'} me-1`} />
                          {tx.type === 'credit' ? 'Crédit' : 'Débit'}
                        </span>
                      </td>
                      <td>
                        <span className={`fw-bold ${tx.type === 'credit' ? 'text-success' : 'text-danger'}`}>
                          {tx.type === 'credit' ? '+' : '-'}{fmt(tx.amount)} SMS
                        </span>
                      </td>
                      <td>{fmt(tx.balance_after)} SMS</td>
                      <td className="text-muted">{tx.description || '—'}</td>
                      <td className="text-muted">{new Date(tx.created_at).toLocaleString('fr-FR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
