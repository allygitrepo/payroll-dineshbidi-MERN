import { getPackingWages } from '../../../setup/packing-wages/services/packingWagesService';
import { getProfessionalTax } from '../../../setup/professional-tax/services/professionalTaxService';

const STORAGE_KEY = 'payroll_packers_entry';

// Sample packer employees with code and account number
const defaultPackerEmployees = [
  { employeeId: 'packer1', employeeName: 'SAMIR MACHHIJAR',  employeeCode: '0005872', accountNo: '100325662005' },
  { employeeId: 'packer2', employeeName: 'NAHLESH BAGUI',    employeeCode: '0005875', accountNo: '100251178836' },
  { employeeId: 'packer3', employeeName: 'RAJESH KUMAR',     employeeCode: '0005880', accountNo: '100251178837' },
  { employeeId: 'packer4', employeeName: 'SUNITA DEVI',      employeeCode: '0005883', accountNo: '100251178838' },
  { employeeId: 'packer5', employeeName: 'PRIYA SHARMA',     employeeCode: '0005886', accountNo: '100251178839' },
  { employeeId: 'packer6', employeeName: 'ANITA KUMARI',     employeeCode: '0005890', accountNo: '100251178840' },
];

/**
 * Get active packing wages rates for a given month (YYYY-MM).
 * Returns the rate record whose startDate <= selected month <= endDate.
 */
const getActiveRates = (monthYear) => {
  const rates = getPackingWages();
  if (!rates || rates.length === 0) return null;

  const selectedDate = monthYear ? `${monthYear}-01` : null;
  if (!selectedDate) return rates[rates.length - 1]; // fallback: latest

  const active = rates.find(r => r.startDate <= selectedDate && selectedDate <= r.endDate);
  if (active) return active;

  // Fallback: latest record
  return [...rates].sort((a, b) => b.startDate.localeCompare(a.startDate))[0];
};

/**
 * Calculate Professional Tax from slabs
 */
const calculatePT = (grossSalary, monthYear) => {
  const ptSlabs = getProfessionalTax();
  if (!ptSlabs || ptSlabs.length === 0) return 0;

  const selectedDate = monthYear ? `${monthYear}-01` : null;

  const applicable = ptSlabs.find(slab =>
    (!selectedDate || (slab.startDate <= selectedDate && selectedDate <= slab.endDate)) &&
    grossSalary >= parseFloat(slab.from) &&
    grossSalary <= parseFloat(slab.to)
  );

  return applicable ? parseFloat(applicable.taxRate) : 0;
};

/**
 * Calculate wages and deductions for a packer row.
 *
 * wages       = (unit1 × rate1) + (unit2 × rate2) + (unit3 × rate3) + (unit4 × rate4)
 * weeklyLeave = wages / daysWorked × 4  (1 day per week approx)
 * total       = wages + weeklyLeave + additionalPaidWages
 * PF          = 12% of total (capped at ₹15,000 wage)
 * PT          = from slab
 * ESIC        = 0.75% of total (if total ≤ ₹21,000)
 * netWages    = total − PF − PT − ESIC
 */
const calculateRow = (row, rates, monthYear) => {
  const unit1 = parseFloat(row.unit1) || 0;
  const unit2 = parseFloat(row.unit2) || 0;
  const unit3 = parseFloat(row.unit3) || 0;
  const unit4 = parseFloat(row.unit4) || 0;
  const daysWorked = parseInt(row.daysWorked) || 0;
  const additionalPaidWages = parseFloat(row.additionalPaidWages) || 0;

  const rate1 = rates ? parseFloat(rates.rate1) || 0 : 0;
  const rate2 = rates ? parseFloat(rates.rate2) || 0 : 0;
  const rate3 = rates ? parseFloat(rates.rate3) || 0 : 0;
  const rate4 = rates ? parseFloat(rates.rate4) || 0 : 0;

  const wages = Math.round(unit1 * rate1 + unit2 * rate2 + unit3 * rate3 + unit4 * rate4);

  // Weekly leave: 1 paid leave per 6 working days
  const weeklyLeave = daysWorked > 0 ? Math.round((wages / daysWorked) * 4) : 0;

  const total = wages + weeklyLeave + additionalPaidWages;

  // PF: 12% of wages capped at ₹15,000
  const pfWage = Math.min(total, 15000);
  const pf = Math.round(pfWage * 0.12);

  // PT from slab
  const pt = calculatePT(total, monthYear);

  // ESIC: 0.75% if total ≤ ₹21,000
  const esic = total <= 21000 ? Math.round(total * 0.0075) : 0;

  const netWages = Math.max(0, total - pf - pt - esic);

  return { wages, weeklyLeave, total, pf, pt, esic, netWages };
};

/**
 * Get packer employees list.
 * In future, this can be connected to an actual employee service filtered by category.
 */
export const getPackerEmployees = () => defaultPackerEmployees;

/**
 * Get entry rows for a given month (YYYY-MM).
 */
export const getPackersEntry = (monthYear) => {
  const key = `${STORAGE_KEY}_${monthYear}`;
  const data = localStorage.getItem(key);
  const employees = getPackerEmployees();
  const rates = getActiveRates(monthYear);

  const freshRow = (emp) => {
    const baseRow = {
      employeeId: emp.employeeId,
      employeeName: emp.employeeName,
      employeeCode: emp.employeeCode,
      accountNo: emp.accountNo,
      daysWorked: '0',
      unit1: '0',
      unit2: '0',
      unit3: '0',
      unit4: '0',
      additionalPaidWages: '0',
      // Active rates (read-only display)
      rate1: rates?.rate1 || '0.00',
      rate2: rates?.rate2 || '0.00',
      rate3: rates?.rate3 || '0.00',
      rate4: rates?.rate4 || '0.00',
    };
    return { ...baseRow, ...calculateRow(baseRow, rates, monthYear) };
  };

  if (!data) {
    return employees.map(emp => freshRow(emp));
  }

  const saved = JSON.parse(data);
  return employees.map(emp => {
    const existing = saved.find(s => s.employeeId === emp.employeeId);
    if (existing) {
      // Refresh rates from setup in case they changed
      return {
        ...existing,
        rate1: rates?.rate1 || '0.00',
        rate2: rates?.rate2 || '0.00',
        rate3: rates?.rate3 || '0.00',
        rate4: rates?.rate4 || '0.00',
        ...calculateRow(existing, rates, monthYear)
      };
    }
    return freshRow(emp);
  });
};

/**
 * Recalculate a single row when editable inputs change.
 */
export const recalculatePackerRow = (row, monthYear) => {
  const rates = getActiveRates(monthYear);
  return { ...row, ...calculateRow(row, rates, monthYear) };
};

/**
 * Save entry rows for a given month.
 */
export const savePackersEntry = (monthYear, rows) => {
  const key = `${STORAGE_KEY}_${monthYear}`;
  localStorage.setItem(key, JSON.stringify(rows));
  return rows;
};
