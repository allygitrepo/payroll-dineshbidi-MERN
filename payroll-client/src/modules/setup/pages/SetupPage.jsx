import React from 'react';
import PackingWagesPage from '../packing-wages/pages/PackingWagesPage';
import BidiRollerWagesPage from '../bidi-roller-wages/pages/BidiRollerWagesPage';
import ProfessionalTaxPage from '../professional-tax/pages/ProfessionalTaxPage';
import OfficeStaffSalaryPage from '../office-staff-salary/pages/OfficeStaffSalaryPage';
import ChallanSetupPage from '../challan-setup/pages/ChallanSetupPage';

const SetupPage = ({ activeSubMenu }) => {
  switch (activeSubMenu) {
    case 'Packing Wages':
      return <PackingWagesPage />;
    case 'Bidi Roller Wages':
      return <BidiRollerWagesPage />;
    case 'Professional Tax':
      return <ProfessionalTaxPage />;
    case 'Office Staff Salary':
      return <OfficeStaffSalaryPage />;
    case 'Challan Setup':
      return <ChallanSetupPage />;
    default:
      return (
        <div style={{ padding: '30px', backgroundColor: 'var(--card-bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>Setup Configuration</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Please select a setup sub-menu option from the sidebar.
          </p>
        </div>
      );
  }
};

export default SetupPage;
