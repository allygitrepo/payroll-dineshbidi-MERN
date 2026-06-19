import React from 'react';
import ExcelToTextPage from '../excel-to-text/pages/ExcelToTextPage';

const ConvertExcelToTextPage = ({ activeSubMenu }) => {
  switch (activeSubMenu) {
    case 'Excel To Text':
      return <ExcelToTextPage />;
    default:
      return (
        <div style={{ padding: '30px', backgroundColor: 'var(--card-bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>Convert Excel To Text</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Please select an option from the sidebar.
          </p>
        </div>
      );
  }
};

export default ConvertExcelToTextPage;
