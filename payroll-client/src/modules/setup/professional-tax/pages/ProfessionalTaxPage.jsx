import React from 'react';
import { Percent } from 'lucide-react';

const ProfessionalTaxPage = () => {
  return (
    <div style={{ padding: '30px', backgroundColor: 'var(--card-bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ color: 'var(--primary)', backgroundColor: 'var(--primary-light)', padding: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center' }}>
          <Percent size={24} />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Professional Tax Setup</h2>
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
        Configure state-wise Professional Tax slab rates, exceptions, and deduction frequencies according to current regional regulations.
      </p>
    </div>
  );
};

export default ProfessionalTaxPage;
