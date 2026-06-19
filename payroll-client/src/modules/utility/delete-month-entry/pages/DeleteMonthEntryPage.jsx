import React from 'react';
import { Trash2 } from 'lucide-react';

const DeleteMonthEntryPage = () => {
  return (
    <div style={{ padding: '30px', backgroundColor: 'var(--card-bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ color: 'var(--danger || #FF4D4D)', backgroundColor: 'var(--danger-light || #FFE5E5)', padding: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center' }}>
          <Trash2 size={24} />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Delete Month Entry</h2>
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
        Safely wipe, archive, or delete monthly entry locks, work logs, and transaction registers. This action requires high privileges.
      </p>
    </div>
  );
};

export default DeleteMonthEntryPage;
