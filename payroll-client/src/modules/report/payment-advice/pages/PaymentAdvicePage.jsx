import React from 'react';

const PaymentAdvicePage = () => {
  return (
    <div style={{ padding: '30px', backgroundColor: 'var(--card-bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>Payment Advice</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Payment Advice report will be displayed here.</p>
    </div>
  );
};

export default PaymentAdvicePage;
