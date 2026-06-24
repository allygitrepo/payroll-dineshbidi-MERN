import apiClient from '../../../../shared/services/apiClient';

const mapToFrontend = (s) => ({
  id: s.id,
  startDate: s.start_date,
  endDate: s.end_date,
  employeeId: s.employee_id,
  employeeName: s.employee ? s.employee.name : 'Unknown',
  salary: s.salary ? String(s.salary) : '0.00',
  standardBonus: s.standard_bonus ? String(s.standard_bonus) : '0.00',
  additionalBonus: s.additional_bonus ? String(s.additional_bonus) : '0.00'
});

const mapToBackend = (s, companyId) => ({
  company_id: companyId,
  employee_id: s.employeeId,
  start_date: s.startDate,
  end_date: s.endDate,
  salary: parseFloat(s.salary) || 0.00,
  standard_bonus: parseFloat(s.standardBonus) || 0.00,
  additional_bonus: parseFloat(s.additionalBonus) || 0.00
});

export const getOfficeStaffSalaries = async (companyId) => {
  if (!companyId) return [];
  const response = await apiClient.get(`office-staff-salaries/company/${companyId}`);
  if ((response.data?.status || response.data?.success) && response.data?.data) {
    return response.data.data.map(mapToFrontend);
  }
  return [];
};

export const saveOfficeStaffSalary = async (salary, companyId) => {
  const payload = mapToBackend(salary, companyId);
  if (salary.id) {
    // Update
    await apiClient.put(`office-staff-salaries/${salary.id}`, payload);
  } else {
    // Create
    await apiClient.post('office-staff-salaries', payload);
  }
  return await getOfficeStaffSalaries(companyId);
};

export const deleteOfficeStaffSalary = async (id, companyId) => {
  await apiClient.delete(`office-staff-salaries/${id}`);
  return await getOfficeStaffSalaries(companyId);
};
