import { getOfficeStaffSalaries } from '../../../setup/office-staff-salary/services/officeStaffSalaryService';
import { getProfessionalTax } from '../../../setup/professional-tax/services/professionalTaxService';
import { getChallanSetup } from '../../../setup/challan-setup/services/challanSetupService';

const STORAGE_KEY = 'payroll_office_staff_entry';

// Sample employee codes and account numbers
const employeeMeta = {
  mock1: { code: '0004463', accountNo: '100276765722' },
  mock2: { code: '0004464', accountNo: '100276765723' },
  mock3: { code: '0004465', accountNo: '100276765724' },
  mock4: { code: '0004466', accountNo: '100276765725' },
  mock5: { code: '0005868', accountNo: '100362255467' },
  mock6: { code: '0005870', accountNo: '100247084817' },
  mock7: { code: '0010056', accountNo: '100247084818' },
  mock8: { code: '0016058', accountNo: '101002763152' },
  mock9: { code: '0016060', accountNo: '101002763175' },
  mock10: { code: '0016061', accountNo: '101002763176' },
};

/**
 * Calculate Professional Tax based on slabs
 */
const calculatePT = (grossSalary, monthStr) => {
  const ptSlabs = getProfessionalTax();
  if (!ptSlabs || ptSlabs.length === 0) return 0;

  // Find applicable slab for the month
  const [year, month] = (monthStr || '').split('-');
  const dateStr = `${year}-${month}-01`;

  const activeSlab = ptSlabs.find(slab => {
    return slab.startDate <= dateStr && slab.endDate >= dateStr;
  });

  if (!activeSlab) {
    // Find last available slab set
    const sorted = [...ptSlabs].sort((a, b) => b.startDate.localeCompare(a.startDate));
    const applicable = sorted.filter(s => {
      return grossSalary >= parseFloat(s.from) && grossSalary <= parseFloat(s.to);
    });
    return applicable.length > 0 ? parseFloat(applicable[0].taxRate) : 0;
  }

  // Find the matching range
  const applicableSlab = ptSlabs.find(slab => {
    return (
      slab.startDate <= dateStr &&
      slab.endDate >= dateStr &&
      grossSalary >= parseFloat(slab.from) &&
      grossSalary <= parseFloat(slab.to)
    );
  });

  return applicableSlab ? parseFloat(applicableSlab.taxRate) : 0;
};

/**
 * Calculate all deductions and net wages for a row
 */
const calculateRow = (employee, daysWorked, addition, monthStr) => {
  const totalDays = 31; // standard month days
  const basicSalary = parseFloat(employee.salary) || 0;
  const daysNum = parseInt(daysWorked) || 0;
  const additionNum = parseFloat(addition) || 0;

  // Pro-rated daily wage calculation
  const dailyRate = basicSalary / totalDays;
  const earned = Math.round(dailyRate * daysNum);
  const gross = earned + additionNum;

  // PF: 12% of basic (capped at 15000)
  const pfWage = Math.min(basicSalary, 15000);
  const pfAmount = Math.round(pfWage * 0.12);

  // PT: from slab
  const ptAmount = calculatePT(gross, monthStr);

  // ESIC: 0.75% of gross (if gross <= 21000)
  const esicWageLimit = 21000;
  const esicAmount = gross <= esicWageLimit ? Math.round(gross * 0.0075) : 0;

  const netWages = gross - pfAmount - ptAmount - esicAmount;

  return {
    basicSalary,
    earned,
    gross,
    pf: pfAmount,
    pt: ptAmount,
    esic: esicAmount,
    netWages: Math.max(0, netWages)
  };
};

/**
 * Get office staff employees active for a given month (YYYY-MM).
 * Filters salary records so only employees whose startDate <= selected month <= endDate
 * are included in the payroll entry for that month.
 *
 * @param {string} monthYear - format "YYYY-MM", e.g. "2026-01"
 */
export const getOfficeStaffEmployees = (monthYear) => {
  const salaries = getOfficeStaffSalaries();

  // Convert "YYYY-MM" → first day of that month for comparison
  const selectedDate = monthYear ? `${monthYear}-01` : null;

  const filtered = salaries.filter(s => {
    if (!selectedDate) return true; // no filter if no month given
    const start = s.startDate || '0000-01-01';
    const end   = s.endDate   || '9999-12-31';
    // Employee is active if: startDate <= selectedDate <= endDate
    return start <= selectedDate && selectedDate <= end;
  });

  return filtered.map(s => ({
    id: s.id,
    employeeId: s.employeeId,
    employeeName: s.employeeName,
    salary: s.salary,
    startDate: s.startDate,
    endDate: s.endDate,
    employeeCode: employeeMeta[s.employeeId]?.code || s.employeeId,
    accountNo: employeeMeta[s.employeeId]?.accountNo || 'N/A',
  }));
};

/**
 * Get entry data for a given month (YYYY-MM).
 * @param {string} monthYear  - e.g. "2026-01"
 * @param {boolean} showAll   - if true, skips date filter and loads ALL employees
 */
export const getOfficeStaffEntry = (monthYear, showAll = false) => {
  const key = `${STORAGE_KEY}_${monthYear}`;
  const data = localStorage.getItem(key);

  // showAll=true → pass null so getOfficeStaffEmployees skips date filter
  const employees = getOfficeStaffEmployees(showAll ? null : monthYear);

  if (!data) {
    // Return fresh rows for all active employees
    return employees.map(emp => ({
      employeeId: emp.employeeId,
      employeeName: emp.employeeName,
      employeeCode: emp.employeeCode,
      accountNo: emp.accountNo,
      basicSalary: emp.salary,
      daysWorked: '26',
      leaveWithPay: '4',
      leaveWithoutPay: '0',
      addition: '0',
      ...calculateRow(emp, 26, 0, monthYear)
    }));
  }

  const saved = JSON.parse(data);
  // Merge: only include active employees, pick saved data if it exists
  return employees.map(emp => {
    const existing = saved.find(s => s.employeeId === emp.employeeId);
    if (existing) return existing;
    return {
      employeeId: emp.employeeId,
      employeeName: emp.employeeName,
      employeeCode: emp.employeeCode,
      accountNo: emp.accountNo,
      basicSalary: emp.salary,
      daysWorked: '26',
      leaveWithPay: '4',
      leaveWithoutPay: '0',
      addition: '0',
      ...calculateRow(emp, 26, 0, monthYear)
    };
  });
};

/**
 * Save entry data for a given month
 */
export const saveOfficeStaffEntry = (monthYear, rows) => {
  const key = `${STORAGE_KEY}_${monthYear}`;
  localStorage.setItem(key, JSON.stringify(rows));
  return rows;
};

/**
 * Recalculate a single row when inputs change.
 * Passes monthYear so it fetches salary from the correct period.
 */
export const recalculateRow = (row, monthYear) => {
  const employees = getOfficeStaffEmployees(monthYear);
  const emp = employees.find(e => e.employeeId === row.employeeId);
  if (!emp) return row;

  const calculated = calculateRow(emp, row.daysWorked, row.addition, monthYear);
  return { ...row, ...calculated };
};
