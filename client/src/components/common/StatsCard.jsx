import React from 'react';

const StatsCard = ({ title, value, icon, color = 'primary', subtitle, trend }) => {
  const colorMap = {
    primary: { bg: 'rgba(79,70,229,0.1)', icon: '#4F46E5', border: '#4F46E5' },
    success: { bg: 'rgba(16,185,129,0.1)', icon: '#10B981', border: '#10B981' },
    warning: { bg: 'rgba(245,158,11,0.1)', icon: '#F59E0B', border: '#F59E0B' },
    danger: { bg: 'rgba(239,68,68,0.1)', icon: '#EF4444', border: '#EF4444' },
    info: { bg: 'rgba(6,182,212,0.1)', icon: '#06B6D4', border: '#06B6D4' },
    purple: { bg: 'rgba(139,92,246,0.1)', icon: '#8B5CF6', border: '#8B5CF6' },
  };

  const colors = colorMap[color] || colorMap.primary;

  return (
    <div className="stats-card">
      <div className="stats-card-body">
        <div className="stats-icon-wrap" style={{ background: colors.bg }}>
          <i className={`bi ${icon}`} style={{ color: colors.icon }} />
        </div>
        <div className="stats-content">
          <div className="stats-value">{value}</div>
          <div className="stats-title">{title}</div>
          {subtitle && <div className="stats-subtitle">{subtitle}</div>}
        </div>
      </div>
      {trend !== undefined && (
        <div className={`stats-trend ${trend >= 0 ? 'trend-up' : 'trend-down'}`}>
          <i className={`bi ${trend >= 0 ? 'bi-arrow-up' : 'bi-arrow-down'}`} />
          {Math.abs(trend)}%
        </div>
      )}
      <div className="stats-card-accent" style={{ background: colors.border }} />
    </div>
  );
};

export default StatsCard;
