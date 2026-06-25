import apiClient from '../../../../shared/services/apiClient';

/**
 * Fetch entry data for a given month (YYYY-MM).
 * @param {string} monthYear  - e.g. "2026-01"
 */
export const getPackersEntry = async (monthYear, companyId) => {
  try {
    const cid = companyId || localStorage.getItem('selectedCompany');
    const response = await apiClient.get('/packers-entries/company', {
      params: { month_year: monthYear, company_id: cid }
    });
    return response.data; // Expected { status, data: [], config: {} }
  } catch (error) {
    console.error('Error fetching packers entries:', error);
    throw error;
  }
};

/**
 * Save entry data for a given month
 */
export const savePackersEntry = async (monthYear, rows, companyId) => {
  try {
    const cid = companyId || localStorage.getItem('selectedCompany');
    const response = await apiClient.post('/packers-entries/company', {
      month_year: monthYear,
      company_id: cid,
      entries: rows
    });
    return response.data;
  } catch (error) {
    console.error('Error saving packers entries:', error);
    throw error;
  }
};

// Helper function to calculate PT based on slabs
const calculatePT = (grossSalary, slabs) => {
  if (!slabs || slabs.length === 0) return 0;
  
  const applicableSlab = slabs.find(slab => {
    return grossSalary >= parseFloat(slab.from) && grossSalary <= parseFloat(slab.to);
  });

  return applicableSlab ? parseFloat(applicableSlab.taxRate) : 0;
};

/**
 * Recalculate a single row when inputs change (done locally).
 * Requires the config object returned from getPackersEntry.
 */
export const recalculateRow = (row, config) => {
  const { rate1, rate2, rate3, rate4, ptSlabs, pfRateMale, pfRateFemale, esicShare, esicWageLimit } = config;
  
  const unit1 = parseFloat(row.unit1) || 0;
  const unit2 = parseFloat(row.unit2) || 0;
  const unit3 = parseFloat(row.unit3) || 0;
  const unit4 = parseFloat(row.unit4) || 0;
  const additionNum = parseFloat(row.addition) || 0;
  const daysNum = parseFloat(row.daysWorked) || 0;

  // Determine pfRate based on employee gender
  const isMale = row.gender === 'MALE' || row.gender === 'Male' || row.gender === 'M';
  const pfRate = isMale ? (pfRateMale || 0.12) : (pfRateFemale || 0.12);

  // Wages Calculation
  const wages = (unit1 * rate1) + (unit2 * rate2) + (unit3 * rate3) + (unit4 * rate4);
  
  // Weekly Leave Calculation
  const weeklyLeave = Math.round(wages / 6);
  
  // Total Gross
  const gross = Math.round(wages + weeklyLeave + additionNum);

  // PF Calculation
  const pfAmount = Math.round(gross * pfRate);

  // PT Calculation
  const ptAmount = calculatePT(gross, ptSlabs);

  // ESIC Calculation
  let esicAmount = 0;
  const dailyWage = daysNum > 0 ? gross / daysNum : 0;
  
  // Exempted if daily wage <= 176
  if (dailyWage > esicWageLimit) {
    esicAmount = Math.ceil(gross * esicShare);
  }

  // Net Wages
  const netWages = Math.max(0, gross - pfAmount - ptAmount - esicAmount);

  console.group(`--- Recalculating: ${row.employeeName || 'Employee'} ---`);
  console.log(`[Inputs] Units: [${unit1}, ${unit2}, ${unit3}, ${unit4}], Rates: [${rate1}, ${rate2}, ${rate3}, ${rate4}]`);
  console.log(`[Wages] = ${wages}`);
  console.log(`[Weekly Leave] = Wages / 6 = ${weeklyLeave}`);
  console.log(`[Total Gross] = Wages + Weekly Leave + Addition = ${gross}`);
  console.log(`[PF] = Gross * PF Rate (${(pfRate * 100).toFixed(2)}%) = ${pfAmount}`);
  console.log(`[PT] = Calculated from tax slab for gross ${gross} = ${ptAmount}`);
  console.log(`[ESIC Daily Wage] = Gross (${gross}) / Worked Days (${daysNum}) = ${dailyWage.toFixed(2)}`);
  if (dailyWage > esicWageLimit) {
    console.log(`[ESIC Deduction] = ${dailyWage.toFixed(2)} > ${esicWageLimit} (Limit). Deducting = ${esicAmount}`);
  } else {
    console.log(`[ESIC Deduction] = Exempted (<= Limit) = 0`);
  }
  console.log(`[Net Wages] = Gross - PF - PT - ESIC = ${netWages}`);
  console.groupEnd();

  return {
    ...row,
    unit1,
    unit2,
    unit3,
    unit4,
    addition: additionNum,
    daysWorked: daysNum,
    wages,
    weeklyLeave,
    gross,
    pf: pfAmount,
    pt: ptAmount,
    esic: esicAmount,
    netWages
  };
};
