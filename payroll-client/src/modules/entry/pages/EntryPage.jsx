import React from 'react';
import OfficeStaffEntryPage from '../office-staff/pages/OfficeStaffEntryPage';
import PackersEntryPage from '../packers/pages/PackersEntryPage';
import BidiRollerEntryPage from '../bidi-roller/pages/BidiRollerEntryPage';
import EpfChallanDatePage from '../epf-challan-date/pages/EpfChallanDatePage';
import ResignationPage from '../resignation/pages/ResignationPage';

const EntryPage = ({ activeSubMenu }) => {
  switch (activeSubMenu) {
    case 'Office Staff':
      return <OfficeStaffEntryPage />;
    case 'Packers':
      return <PackersEntryPage />;
    case 'Bidi Roller':
      return <BidiRollerEntryPage />;
    case 'EPF Challan Date':
      return <EpfChallanDatePage />;
    case 'Resignation':
      return <ResignationPage />;
    default:
      return (
        <div style={{ padding: '30px', backgroundColor: 'var(--card-bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>Entry Management</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Please select an entry sub-menu option from the sidebar.
          </p>
        </div>
      );
  }
};

export default EntryPage;
