import apiClient from "../../../shared/services/apiClient";

const dashboardService = {
  getDashboardSummary: async (companyId) => {
    try {
      const response = await apiClient.get(`dashboard/${companyId}/summary`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default dashboardService;
