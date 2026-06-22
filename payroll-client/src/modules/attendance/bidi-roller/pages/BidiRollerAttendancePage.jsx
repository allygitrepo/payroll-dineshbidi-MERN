import React from 'react';
import { User } from 'lucide-react';

const BidiRollerAttendancePage = () => {
  return (
    <div style={{ padding: '30px', backgroundColor: 'var(--card-bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ color: 'var(--primary)', backgroundColor: 'var(--primary-light)', padding: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center' }}>
          <User size={24} />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Bidi Roller Attendance</h2>
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
        Track daily raw material distribution and rolled bidi collections. Map quantity calculations to employee attendance.
      </p>
    </div>
  );
};

export default BidiRollerAttendancePage;
