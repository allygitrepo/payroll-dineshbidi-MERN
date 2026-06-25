import apiClient from '../../../../../shared/services/apiClient';

export const fetchContractorSalarySheet = async (companyId, monthYear) => {
  try {
    const response = await apiClient.get('reports/contractor-salary-sheet', {
      params: { company_id: companyId, month_year: monthYear }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching contractor salary sheet:', error);
    throw error;
  }
};
