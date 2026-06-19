import React from 'react';
import { UserX } from 'lucide-react';

const AbsentListPage = () => {
  return (
    <div style={{ padding: '30px', backgroundColor: 'var(--card-bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ color: 'var(--danger || #FF4D4D)', backgroundColor: 'var(--danger-light || #FFE5E5)', padding: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center' }}>
          <UserX size={24} />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>3 Month Absent List</h2>
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
        View, search, and audit employees who have been flagged as absent for three consecutive months.
      </p>
    </div>
  );
};

export default AbsentListPage;
