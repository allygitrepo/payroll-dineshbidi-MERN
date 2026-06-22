import apiClient from '../../../../shared/services/apiClient';

const mapToFrontend = (c) => ({
  id: c.id,
  startDate: c.start_date,
  endDate: c.end_date,
  salaryLimit: c.salary_limit ? String(c.salary_limit) : '0.00',
  edliWages: c.edli_wages ? String(c.edli_wages) : '0.00',
  accNo1EEMale: c.ac1_ee_male ? String(c.ac1_ee_male) : '0.00',
  accNo1EEFemale: c.ac1_ee_female ? String(c.ac1_ee_female) : '0.00',
  accNo1ER: c.ac1_er ? String(c.ac1_er) : '0.00',
  accNo2: c.ac2 ? String(c.ac2) : '0.00',
  accNo10: c.ac10 ? String(c.ac10) : '0.00',
  accNo21: c.ac21 ? String(c.ac21) : '0.00',
  accNo22: c.ac22 ? String(c.ac22) : '0.00',
  accNo2Min: c.ac2_min ? String(c.ac2_min) : '0.00',
  accNo22Min: c.ac22_min ? String(c.ac22_min) : '0.00',
  pmrpy: c.pmrpy ? String(c.pmrpy) : '0.00',
  esicWages: c.esic_wages ? String(c.esic_wages) : '0.00',
  employeeShare: c.employee_share ? String(c.employee_share) : '0.00',
  employerShare: c.employer_share ? String(c.employer_share) : '0.00'
});

const mapToBackend = (c, companyId) => ({
  company_id: companyId,
  start_date: c.startDate,
  end_date: c.endDate,
  salary_limit: parseFloat(c.salaryLimit) || 0.00,
  edli_wages: parseFloat(c.edliWages) || 0.00,
  ac1_ee_male: parseFloat(c.accNo1EEMale) || 0.00,
  ac1_ee_female: parseFloat(c.accNo1EEFemale) || 0.00,
  ac1_er: parseFloat(c.accNo1ER) || 0.00,
  ac2: parseFloat(c.accNo2) || 0.00,
  ac10: parseFloat(c.accNo10) || 0.00,
  ac21: parseFloat(c.accNo21) || 0.00,
  ac22: parseFloat(c.accNo22) || 0.00,
  ac2_min: parseFloat(c.accNo2Min) || 0.00,
  ac22_min: parseFloat(c.accNo22Min) || 0.00,
  pmrpy: parseFloat(c.pmrpy) || 0.00,
  esic_wages: parseFloat(c.esicWages) || 0.00,
  employee_share: parseFloat(c.employeeShare) || 0.00,
  employer_share: parseFloat(c.employerShare) || 0.00
});

export const getChallanSetup = async (companyId) => {
  if (!companyId) return [];
  const response = await apiClient.get(`challan-setups/company/${companyId}`);
  if ((response.data?.status || response.data?.success) && response.data?.data) {
    return response.data.data.map(mapToFrontend);
  }
  return [];
};

export const saveChallanSetup = async (challan, companyId) => {
  const payload = mapToBackend(challan, companyId);
  if (challan.id) {
    // Update
    await apiClient.put(`challan-setups/${challan.id}`, payload);
  } else {
    // Create
    await apiClient.post('challan-setups', payload);
  }
  return await getChallanSetup(companyId);
};

export const deleteChallanSetup = async (id, companyId) => {
  await apiClient.delete(`challan-setups/${id}`);
  return await getChallanSetup(companyId);
};
