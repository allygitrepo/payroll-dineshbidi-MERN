import React from 'react';
import CalenderPage from '../calender/pages/CalenderPage';
import UserManagementPage from '../user-management/pages/UserManagementPage';
import WhatsAppGatewayPage from '../whatsapp/pages/WhatsAppGatewayPage';
import EmployeeDataImportPage from '../employee-data-import/pages/EmployeeDataImportPage';
import EmployeeDataExportPage from '../employee-data-export/pages/EmployeeDataExportPage';
import KycExportPage from '../kyc-export/pages/KycExportPage';
import AttandancePrintingPage from '../attandance-printing/pages/AttandancePrintingPage';
import MissingInformationPage from '../missing-information/pages/MissingInformationPage';
import DeleteMonthEntryPage from '../delete-month-entry/pages/DeleteMonthEntryPage';
import BackupPage from '../backup/pages/BackupPage';
import RestorePage from '../restore/pages/RestorePage';
import UanToIpMappingPage from '../uan-to-ip-mapping/pages/UanToIpMappingPage';

const UtilityPage = ({ activeSubMenu }) => {
  switch (activeSubMenu) {
    case 'Calender':
      return <CalenderPage />;
    case 'User Management':
      return <UserManagementPage />;
    case 'WhatsApp Gateway':
      return <WhatsAppGatewayPage />;
    case 'Employee Data Import':
      return <EmployeeDataImportPage />;
    case 'Employee Data Export':
      return <EmployeeDataExportPage />;
    case 'KYC Export':
      return <KycExportPage />;
    case 'Attandance Printing':
      return <AttandancePrintingPage />;
    case 'Missing Information':
      return <MissingInformationPage />;
    case 'Delete Month Entry':
      return <DeleteMonthEntryPage />;
    case 'Backup':
      return <BackupPage />;
    case 'Restore':
      return <RestorePage />;
    case 'UAN to IP Mapping':
      return <UanToIpMappingPage />;
    default:
      return (
        <div style={{ padding: '30px', backgroundColor: 'var(--card-bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>Utility Settings</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Please select a utility sub-menu option from the sidebar.
          </p>
        </div>
      );
  }
};

export default UtilityPage;
