import React from 'react';

const PageHeader = ({ title, subtitle, children }) => (
  <div className="page-header">
    <div className="page-header-left">
      <h1 className="page-title">{title}</h1>
      {subtitle && <p className="page-subtitle">{subtitle}</p>}
    </div>
    {children && <div className="page-header-right">{children}</div>}
  </div>
);

export default PageHeader;
