import React from 'react';
import OfficeSalaryPage from '../salary-sheet/office-salary/pages/OfficeSalaryPage';
import PackingSalaryPage from '../salary-sheet/packing-salary/pages/PackingSalaryPage';
import ContractorSalaryPage from '../salary-sheet/contractor-salary/pages/ContractorSalaryPage';
import Form2Page from '../forms/form-2/pages/Form2Page';
import Form3APage from '../forms/form-3a/pages/Form3APage';
import Form5Page from '../forms/form-5/pages/Form5Page';
import Form10Page from '../forms/form-10/pages/Form10Page';
import Form11Page from '../forms/form-11/pages/Form11Page';
import PfClaimFormPage from '../forms/pf-claim-form/pages/PfClaimFormPage';
import EcrReportPage from '../ecr-report/pages/EcrReportPage';
import EsicReportPage from '../esic-report/pages/EsicReportPage';
import PmrpyReportPage from '../pmrpy-report/pages/PmrpyReportPage';
import PfChallanYearlyPage from '../pf-challan-yearly/pages/PfChallanYearlyPage';
import EsicChallanYearlyPage from '../esic-challan-yearly/pages/EsicChallanYearlyPage';
import EpfChallanPage from '../epf-challan/pages/EpfChallanPage';
import PfSummaryPage from '../pf-summary/pages/PfSummaryPage';
import PaymentAdvicePage from '../payment-advice/pages/PaymentAdvicePage';
import BonusSheetPage from '../bonus-sheet/pages/BonusSheetPage';
import GratuityCalculationPage from '../gratuity-calculation/pages/GratuityCalculationPage';
import ProfessionalTaxReportPage from '../professional-tax/pages/ProfessionalTaxReportPage';

const ReportPage = ({ activeSubMenu }) => {
  switch (activeSubMenu) {
    case 'Office Salary':
      return <OfficeSalaryPage />;
    case 'Packing Salary':
      return <PackingSalaryPage />;
    case 'Contractor Salary':
      return <ContractorSalaryPage />;
    case 'Form 2':
      return <Form2Page />;
    case 'Form 3A':
      return <Form3APage />;
    case 'Form 5':
      return <Form5Page />;
    case 'Form 10':
      return <Form10Page />;
    case 'Form 11':
      return <Form11Page />;
    case 'PF Claim Form':
      return <PfClaimFormPage />;
    case 'ECR Report':
      return <EcrReportPage />;
    case 'ESIC Report':
      return <EsicReportPage />;
    case 'PMRPY Report':
      return <PmrpyReportPage />;
    case 'PF Challan Yearly':
      return <PfChallanYearlyPage />;
    case 'ESIC Challan Yearly':
      return <EsicChallanYearlyPage />;
    case 'EPF Challan':
      return <EpfChallanPage />;
    case 'PF Summary':
      return <PfSummaryPage />;
    case 'Payment Advice':
      return <PaymentAdvicePage />;
    case 'Bonus Sheet':
      return <BonusSheetPage />;
    case 'Gratuity Calculation':
      return <GratuityCalculationPage />;
    case 'Professional Tax':
      return <ProfessionalTaxReportPage />;
    default:
      return (
        <div style={{ padding: '30px', backgroundColor: 'var(--card-bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>Report</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Please select a report option from the sidebar.
          </p>
        </div>
      );
  }
};

export default ReportPage;
