import apiClient from '../../../../../shared/services/apiClient';

export const fetchOfficeSalarySheet = async (companyId, monthYear) => {
  try {
    const response = await apiClient.get('/reports/office-salary-sheet', {
      params: { company_id: companyId, month_year: monthYear }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching office salary sheet:", error);
    throw error;
  }
};
