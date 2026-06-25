import apiClient from '../../../../shared/services/apiClient';

/**
 * Fetch entry data for a given month (YYYY-MM).
 * @param {string} monthYear  - e.g. "2026-01"
 */
export const getOfficeStaffEntry = async (monthYear, companyId) => {
  try {
    const cid = companyId || localStorage.getItem('selectedCompany');
    const response = await apiClient.get('/office-staff-entries', {
      params: { month_year: monthYear, company_id: cid }
    });
    return response.data; // Expected { status, data: [], config: {} }
  } catch (error) {
    console.error('Error fetching office staff entries:', error);
    throw error;
  }
};

/**
 * Save entry data for a given month
 */
export const saveOfficeStaffEntry = async (monthYear, rows, companyId) => {
  try {
    const cid = companyId || localStorage.getItem('selectedCompany');
    const response = await apiClient.post('/office-staff-entries', {
      month_year: monthYear,
      company_id: cid,
      entries: rows
    });
    return response.data;
  } catch (error) {
    console.error('Error saving office staff entries:', error);
    throw error;
  }
};

/**
 * Recalculate a single row when inputs change (done locally).
 * Requires the config object returned from getOfficeStaffEntry.
 */
export const recalculateRow = (row, config) => {
  const { totalDaysInMonth, ptSlabs, pfRateMale, pfRateFemale, esicShare, esicWageLimit } = config;
  
  const basicSalary = parseFloat(row.basicSalary) || 0;
  const daysNum = parseFloat(row.daysWorked) || 0;
  const additionNum = parseFloat(row.addition) || 0;
  const leaveWithPay = parseInt(row.leaveWithPay) || 0;
  
  // Determine pfRate based on employee gender
  const isMale = row.gender === 'MALE' || row.gender === 'Male' || row.gender === 'M';
  const pfRate = isMale ? (pfRateMale || 0.12) : (pfRateFemale || 0.12);

  // Calculate Leave Without Pay
  const leaveWithoutPay = Math.max(0, totalDaysInMonth - leaveWithPay - daysNum);

  // New logic based on spec:
  // Per-day Salary = Basic Salary / (Total Days in Month - Leave with Pay)
  // Cut Salary = Per-day Salary * Leave without Pay
  const divisorForDailyRate = totalDaysInMonth - leaveWithPay;
  const dailyRate = divisorForDailyRate > 0 ? basicSalary / divisorForDailyRate : 0;
  
  const cutSalary = dailyRate * leaveWithoutPay;
  const earned = Math.round(basicSalary - cutSalary);
  const gross = earned + additionNum;

  // PF: 12% of Total (gross) (capped at 15000)
  const pfWage = Math.min(gross, 15000);
  const pfAmount = Math.round(pfWage * pfRate);

  // PT: from slab
  const ptAmount = calculatePT(gross, ptSlabs);

  // ESIC
  let esicAmount = 0;
  const divisor = daysNum + leaveWithPay;
  const dailyWage = divisor > 0 ? gross / divisor : 0;
  
  // Exempted if daily wage <= 176
  if (dailyWage > esicWageLimit) {
    esicAmount = Math.ceil(gross * esicShare);
  }

  const netWages = Math.max(0, gross - pfAmount - ptAmount - esicAmount);

  // Logging reasoning to console
  console.group(`--- Recalculating: ${row.employeeName || 'Employee'} ---`);
  console.log(`[Inputs] Days: ${totalDaysInMonth}, Worked: ${daysNum}, LWP: ${leaveWithPay}, Basic: ${basicSalary}`);
  console.log(`[Leave Without Pay] = Total Days (${totalDaysInMonth}) - LWP (${leaveWithPay}) - Worked (${daysNum}) = ${leaveWithoutPay}`);
  console.log(`[Daily Rate] = Basic (${basicSalary}) / (Total (${totalDaysInMonth}) - LWP (${leaveWithPay})) = ${dailyRate.toFixed(2)}`);
  console.log(`[Cut Salary] = Daily Rate (${dailyRate.toFixed(2)}) * Leave Without Pay (${leaveWithoutPay}) = ${cutSalary.toFixed(2)}`);
  console.log(`[Total Earned Basic] = Basic (${basicSalary}) - Cut Salary (${cutSalary.toFixed(2)}) = ${earned}`);
  console.log(`[Total Gross] = Earned (${earned}) + Addition (${additionNum}) = ${gross}`);
  console.log(`[PF] = Capped Wage (${pfWage}) * PF Rate (${(pfRate*100).toFixed(2)}%) = ${pfAmount}`);
  console.log(`[PT] = Calculated from tax slab for gross ${gross} = ${ptAmount}`);
  console.log(`[ESIC Daily Wage] = Gross (${gross}) / Paid Days (${divisor}) = ${dailyWage.toFixed(2)}`);
  if (dailyWage > esicWageLimit) {
    console.log(`[ESIC Deduction] = ${dailyWage.toFixed(2)} > ${esicWageLimit} (Limit). Deducting ${esicShare*100}% of ${gross} = Math.ceil(${gross * esicShare}) = ${esicAmount}`);
  } else {
    console.log(`[ESIC Deduction] = ${dailyWage.toFixed(2)} <= ${esicWageLimit} (Limit). Employee is Exempted = 0`);
  }
  console.log(`[Net Wages] = Gross (${gross}) - PF (${pfAmount}) - PT (${ptAmount}) - ESIC (${esicAmount}) = ${netWages}`);
  console.groupEnd();

  return {
    ...row,
    leaveWithoutPay,
    gross,
    pf: pfAmount,
    pt: ptAmount,
    esic: esicAmount,
    netWages
  };
};

/**
 * Calculate Professional Tax based on slabs locally
 */
const calculatePT = (grossSalary, slabs) => {
  if (!slabs || slabs.length === 0) return 0;
  
  const applicableSlab = slabs.find(slab => {
    return grossSalary >= parseFloat(slab.from) && grossSalary <= parseFloat(slab.to);
  });

  return applicableSlab ? parseFloat(applicableSlab.taxRate) : 0;
};
