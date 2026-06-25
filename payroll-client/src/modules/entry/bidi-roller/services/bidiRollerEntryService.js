import apiClient from '../../../../shared/services/apiClient';

/**
 * Fetch entry data for a given month (YYYY-MM).
 */
export const getBidiRollerEntry = async (monthYear, companyId) => {
  try {
    const cid = companyId || localStorage.getItem('selectedCompany');
    const response = await apiClient.get('/bidi-roller-entries/company', {
      params: { month_year: monthYear, company_id: cid }
    });
    return response.data; // Expected { status, data: [], config: {} }
  } catch (error) {
    console.error('Error fetching bidi roller entries:', error);
    throw error;
  }
};

/**
 * Save entry data for a given month
 */
export const saveBidiRollerEntry = async (monthYear, rows, companyId) => {
  try {
    const cid = companyId || localStorage.getItem('selectedCompany');
    const response = await apiClient.post('/bidi-roller-entries/company', {
      month_year: monthYear,
      company_id: cid,
      entries: rows
    });
    return response.data;
  } catch (error) {
    console.error('Error saving bidi roller entries:', error);
    throw error;
  }
};

/**
 * Helper function to calculate PT based on slabs
 */
const calculatePT = (grossSalary, slabs) => {
  if (!slabs || slabs.length === 0) return 0;
  
  const applicableSlab = slabs.find(slab => {
    return grossSalary >= parseFloat(slab.from) && grossSalary <= parseFloat(slab.to);
  });

  return applicableSlab ? parseFloat(applicableSlab.taxRate) : 0;
};

/**
 * Recalculate a single row when inputs change (done locally).
 * Requires the config object returned from getBidiRollerEntry.
 */
export const recalculateBidiRollerRow = (row, config) => {
  const { rate1, rate2, bonus1, bonus2, ptSlabs, pfRateMale, pfRateFemale, esicShare, esicWageLimit } = config;
  
  const unit1 = parseFloat(row.unit1) || 0;
  const unit2 = parseFloat(row.unit2) || 0;
  const daysNum = parseFloat(row.daysWorked) || 0;
  const leaveNum = parseFloat(row.leaveWithPay) || 0;

  // Determine pfRate based on employee gender
  const isMale = row.gender === 'MALE' || row.gender === 'Male' || row.gender === 'M';
  const pfRate = isMale ? (pfRateMale || 0.12) : (pfRateFemale || 0.12);

  // Piece Wages Calculation
  const wages1 = (unit1 * rate1) + (unit2 * rate2);
  
  // Leave Wages Calculation
  // wages2 = (wages1 / no_of_days_worked) * leave_with_pay
  let wages2 = 0;
  if (daysNum > 0) {
      wages2 = (wages1 / daysNum) * leaveNum;
  }

  // Total Wages
  const wages = Math.round(wages1 + wages2);

  // Bonus Calculation
  const bonus = Math.round((unit1 * bonus1) + (unit2 * bonus2));

  // Total Gross
  const gross = Math.round(wages + bonus);

  // PF Calculation - NOTE: Excludes Bonus
  const pfAmount = Math.round(wages * pfRate);

  // PT Calculation - Uses Gross (Total)
  const ptAmount = calculatePT(gross, ptSlabs);

  // ESIC Calculation
  let esicAmount = 0;
  const divisor = daysNum + leaveNum;
  const dailyWage = divisor > 0 ? gross / divisor : 0;
  
  // Exempted if daily wage <= 176
  if (dailyWage > esicWageLimit) {
    esicAmount = Math.ceil(gross * esicShare);
  }

  // Net Wages
  const netWages = Math.max(0, gross - pfAmount - ptAmount - esicAmount);

  return { 
    ...row, 
    unit1, 
    unit2, 
    daysWorked: daysNum || '', 
    leaveWithPay: leaveNum || '',
    wages, 
    bonus, 
    gross, 
    pf: pfAmount, 
    pt: ptAmount, 
    esic: esicAmount, 
    netWages 
  };
};
