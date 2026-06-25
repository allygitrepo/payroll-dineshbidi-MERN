import apiClient from '../../../../../shared/services/apiClient';

export const fetchPackingSalarySheet = async (companyId, monthYear) => {
  try {
    const response = await apiClient.get('reports/packing-salary-sheet', {
      params: { company_id: companyId, month_year: monthYear }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching packing salary sheet:', error);
    throw error;
  }
};
