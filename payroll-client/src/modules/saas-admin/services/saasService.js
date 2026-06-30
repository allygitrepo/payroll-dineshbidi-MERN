import apiClient from '../../../shared/services/apiClient';

export const getSaasClients = async () => {
  try {
    const response = await apiClient.get('/saas/clients');
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const createSaasClient = async (clientData) => {
  try {
    const response = await apiClient.post('/saas/clients', clientData);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const getDashboardStats = async () => {
  try {
    const response = await apiClient.get('/saas/dashboard-stats');
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const getCoAdmins = async () => {
  try {
    const response = await apiClient.get('/saas/co-admins');
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const createCoAdmin = async (adminData) => {
  try {
    const response = await apiClient.post('/saas/co-admins', adminData);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};
