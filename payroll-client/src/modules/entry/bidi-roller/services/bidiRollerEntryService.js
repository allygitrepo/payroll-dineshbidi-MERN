import { getBidiRollerWages } from '../../../setup/bidi-roller-wages/services/bidiRollerWagesService';
import { getProfessionalTax } from '../../../setup/professional-tax/services/professionalTaxService';

const STORAGE_KEY = 'payroll_bidi_roller_entry';

// Sample bidi roller employees with A/C No, UAN, and Contractor mappings matching the screenshot
const defaultBidiRollerEmployees = [
  { employeeId: 'roller1', employeeName: 'NAGEN MAHATO', employeeCode: '0004648', accountNo: '100247939626', contractor: 'BISHNU PADA MAJHI - 176' },
  { employeeId: 'roller2', employeeName: 'MINU MAHATO', employeeCode: '0015218', accountNo: '101209083375', contractor: 'BABLU KUMAR - 139' },
  { employeeId: 'roller3', employeeName: 'KALABATI PRAMANIK', employeeCode: '0015219', accountNo: '101209083381', contractor: 'BHARAT KUMAR - 165' },
  { employeeId: 'roller4', employeeName: 'SUSHARI MAHATO', employeeCode: '0017462', accountNo: '102298686086', contractor: 'BISHNU PADA MAJHI - 176' },
  { employeeId: 'roller5', employeeName: 'BINATA PARAMANIK', employeeCode: '0017463', accountNo: '102298959039', contractor: 'BABLU KUMAR - 139' },
  { employeeId: 'roller6', employeeName: 'PABITA KUMAR', employeeCode: '0017289', accountNo: '102191635748', contractor: 'BHARAT KUMAR - 165' },
  { employeeId: 'roller7', employeeName: 'CHUMKI KUMAR', employeeCode: '0017290', accountNo: '102191636753', contractor: 'BISHNU PADA MAJHI - 176' },
  { employeeId: 'roller8', employeeName: 'DULALI KUMAR', employeeCode: '0017300', accountNo: '102258567578', contractor: 'BABLU KUMAR - 139' },
  { employeeId: 'roller9', employeeName: 'KANCHAN KUMAR', employeeCode: '0017358', accountNo: '101638629265', contractor: 'BHARAT KUMAR - 165' },
  { employeeId: 'roller10', employeeName: 'ACHALA MAJHI', employeeCode: '0017359', accountNo: '102258157938', contractor: 'BISHNU PADA MAJHI - 176' },
  { employeeId: 'roller11', employeeName: 'BANDANA KUMAR', employeeCode: '0017360', accountNo: '102258156615', contractor: 'BABLU KUMAR - 139' },
  { employeeId: 'roller12', employeeName: 'SITA KUMAR', employeeCode: '0017361', accountNo: '102258155311', contractor: 'BHARAT KUMAR - 165' },
  { employeeId: 'roller13', employeeName: 'RAHUL KUMAR', employeeCode: '0017449', accountNo: '102258159264', contractor: 'BISHNU PADA MAJHI - 176' }
];

/**
 * Get active bidi roller wages rates for a given month (YYYY-MM).
 */
const getActiveRates = (monthYear) => {
  const rates = getBidiRollerWages();
  if (!rates || rates.length === 0) return null;

  const selectedDate = monthYear ? `${monthYear}-01` : null;
  if (!selectedDate) return rates[rates.length - 1]; // latest fallback

  const active = rates.find(r => r.startDate <= selectedDate && selectedDate <= r.endDate);
  if (active) return active;

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
 * Calculate wages and deductions for a bidi roller row.
 *
 * wages       = (unit1 × rate1) + (unit2 × rate2)
 * bonus       = 0 (not paid monthly)
 * total       = wages + bonus
 * PF          = 10% of total (rounded to nearest rupee)
 * PT          = 0 (or calculated from slabs)
 * ESIC        = 0 (exempt for bidi rollers)
 * netWages    = total − PF − PT − ESIC
 */
const calculateRow = (row, rates, monthYear) => {
  const unit1 = parseFloat(row.unit1) || 0;
  const unit2 = parseFloat(row.unit2) || 0;

  // If user edited rates in setup, we dynamically use those rates, otherwise default to 0
  const rate1 = rates ? parseFloat(rates.rate1) || 0 : 0;
  const rate2 = rates ? parseFloat(rates.rate2) || 0 : 0;

  const wages = Math.round(unit1 * rate1 + unit2 * rate2);
  const bonus = 0;
  const total = wages + bonus;

  // PF: 10% of wages rounded
  const pf = Math.round(total * 0.10);

  // PT from slab
  const pt = calculatePT(total, monthYear);

  // ESIC: 0 for bidi rollers
  const esic = 0;

  const netWages = Math.max(0, total - pf - pt - esic);
  const daysWorked = Math.round(unit1) + Math.round(unit2);

  return { wages, bonus, total, pf, pt, esic, netWages, daysWorked };
};

/**
 * Get bidi roller employees list.
 */
export const getBidiRollerEmployees = () => defaultBidiRollerEmployees;

/**
 * Get entry rows for a given month (YYYY-MM).
 */
export const getBidiRollerEntry = (monthYear) => {
  const key = `${STORAGE_KEY}_${monthYear}`;
  const data = localStorage.getItem(key);
  const employees = getBidiRollerEmployees();
  const rates = getActiveRates(monthYear);

  const freshRow = (emp) => {
    const baseRow = {
      employeeId: emp.employeeId,
      employeeName: emp.employeeName,
      employeeCode: emp.employeeCode,
      accountNo: emp.accountNo,
      contractor: emp.contractor,
      unit1: '0',
      unit2: '0',
      daysWorked: 0,
      leaveWithPay: '0',
      // Active rates (for setup references)
      rate1: rates?.rate1 || '0.00',
      rate2: rates?.rate2 || '0.00',
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
      return {
        ...existing,
        rate1: rates?.rate1 || '0.00',
        rate2: rates?.rate2 || '0.00',
        ...calculateRow(existing, rates, monthYear)
      };
    }
    return freshRow(emp);
  });
};

/**
 * Recalculate a single row when inputs change.
 */
export const recalculateBidiRollerRow = (row, monthYear) => {
  const rates = getActiveRates(monthYear);
  return { ...row, ...calculateRow(row, rates, monthYear) };
};

/**
 * Save entry rows.
 */
export const saveBidiRollerEntry = (monthYear, rows) => {
  const key = `${STORAGE_KEY}_${monthYear}`;
  localStorage.setItem(key, JSON.stringify(rows));
  return rows;
};
