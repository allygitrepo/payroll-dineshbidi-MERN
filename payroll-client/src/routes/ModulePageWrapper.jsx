import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import MasterPage from '../modules/master/pages/MasterPage';
import SetupPage from '../modules/setup/pages/SetupPage';
import AttendancePage from '../modules/attendance/pages/AttendancePage';
import EntryPage from '../modules/entry/pages/EntryPage';
import ReportPage from '../modules/report/pages/ReportPage';
import UtilityPage from '../modules/utility/pages/UtilityPage';
import TodoListPage from '../modules/todo-list/pages/TodoListPage';
import ConvertExcelToTextPage from '../modules/convert-excel-to-text/pages/ConvertExcelToTextPage';

const slugToSubmenuMap = {
  company: 'Company',
  employee: 'Employee',
  'kyc-update': 'KYC Update',
  contractor: 'Contractor',
  address: 'Address',
  
  'packing-wages': 'Packing Wages',
  'bidi-roller-wages': 'Bidi Roller Wages',
  'professional-tax': 'Professional Tax',
  'office-staff-salary': 'Office Staff Salary',
  'challan-setup': 'Challan Setup',
  
  'attendence-list': 'Attendence List',
  'leave-management': 'Leave Management',
  'face-attendance-self': 'Face Attendance (Self)',
  
  'office-staff': 'Office Staff',
  packers: 'Packers',
  'bidi-roller': 'Bidi Roller',
  'epf-challan-date': 'EPF Challan Date',
  resignation: 'Resignation',
  
  'office-salary': 'Office Salary',
  'packing-salary': 'Packing Salary',
  'contractor-salary': 'Contractor Salary',
  'form-2': 'Form 2',
  'form-3a': 'Form 3A',
  'form-5': 'Form 5',
  'form-10': 'Form 10',
  'form-11': 'Form 11',
  'pf-claim-form': 'PF Claim Form',
  'ecr-report': 'ECR Report',
  'esic-report': 'ESIC Report',
  'pmrpy-report': 'PMRPY Report',
  'pf-challan-yearly': 'PF Challan Yearly',
  'esic-challan-yearly': 'ESIC Challan Yearly',
  'epf-challan': 'EPF Challan',
  'pf-summary': 'PF Summary',
  'payment-advice': 'Payment Advice',
  'bonus-sheet': 'Bonus Sheet',
  'gratuity-calculation': 'Gratuity Calculation',
  
  calender: 'Calender',
  'user-management': 'User Management',
  'employee-data-import': 'Employee Data Import',
  'employee-data-export': 'Employee Data Export',
  'kyc-export': 'KYC Export',
  'attandance-printing': 'Attandance Printing',
  'missing-information': 'Missing Information',
  'delete-month-entry': 'Delete Month Entry',
  backup: 'Backup',
  restore: 'Restore',
  'uan-to-ip-mapping': 'UAN to IP Mapping',
  
  '3-month-absent-list': '3 Month Absent List',
  '58-years-of-age': '58 Years of age',
  notes: 'Notes',
  
  'excel-to-text': 'Excel To Text'
};

const ModulePageWrapper = () => {
  const { moduleName, subMenuSlug } = useParams();
  const activeSubMenu = slugToSubmenuMap[subMenuSlug] || '';

  switch (moduleName) {
    case 'master':
      return <MasterPage activeSubMenu={activeSubMenu} />;
    case 'setup':
      return <SetupPage activeSubMenu={activeSubMenu} />;
    case 'attendance':
      return <AttendancePage activeSubMenu={activeSubMenu} />;
    case 'entry':
      return <EntryPage activeSubMenu={activeSubMenu} />;
    case 'report':
      return <ReportPage activeSubMenu={activeSubMenu} />;
    case 'utility':
      return <UtilityPage activeSubMenu={activeSubMenu} />;
    case 'todo-list':
      return <TodoListPage activeSubMenu={activeSubMenu} />;
    case 'convert-excel-to-text':
      return <ConvertExcelToTextPage activeSubMenu={activeSubMenu} />;
    default:
      return <Navigate to="/dashboard" replace />;
  }
};

export default ModulePageWrapper;
