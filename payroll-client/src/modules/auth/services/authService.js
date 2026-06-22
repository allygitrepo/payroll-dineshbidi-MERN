import apiClient from '../../../shared/services/apiClient';

const authService = {
  /**
   * Fetch active companies for the login page dropdown.
   */
  async getPublicCompanies() {
    const response = await apiClient.get('companies/public');
    return response.data;
  },

  /**
   * Log in user with user ID and password.
   */
  async login(userId, password, companyId) {
    const response = await apiClient.post('users/login', {
      user_id: userId,
      password: password,
      company_id: companyId,
    });
    return response.data;
  },

  /**
   * Log out user from system.
   */
  async logout() {
    const response = await apiClient.post('users/logout');
    return response.data;
  },
};

export default authService;
