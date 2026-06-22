import React from 'react';
import CompanyPage from '../company/pages/CompanyPage';
import EmployeePage from '../employee/pages/EmployeePage';
import KycUpdatePage from '../kyc-update/pages/KycUpdatePage';
import ContractorPage from '../contractor/pages/ContractorPage';
import AddressPage from '../address/pages/AddressPage';

const MasterPage = ({ activeSubMenu }) => {
  switch (activeSubMenu) {
    case 'Company':
      return <CompanyPage />;
    case 'Employee':
      return <EmployeePage />;
    case 'KYC Update':
      return <KycUpdatePage />;
    case 'Contractor':
      return <ContractorPage />;
    case 'Address':
      return <AddressPage />;
    default:
      return (
        <div style={{ padding: '30px', backgroundColor: 'var(--card-bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>Master Management</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Please select a master sub-menu option from the sidebar.
          </p>
        </div>
      );
  }
};

export default MasterPage;
