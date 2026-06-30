import apiClient from '../../../../shared/services/apiClient';
import { API_ENDPOINTS } from '../../../../shared/services/endpoints';

export const getUsers = async () => {
  const response = await apiClient.get(API_ENDPOINTS.USERS.GET_ALL);
  return response.data?.data || [];
};

export const saveUser = async (user) => {
  if (user.id) {
    const response = await apiClient.put(API_ENDPOINTS.USERS.UPDATE(user.id), user);
    return response.data?.data;
  } else {
    const response = await apiClient.post(API_ENDPOINTS.USERS.REGISTER, user);
    return response.data?.data;
  }
};

export const deleteUser = async (id) => {
  const response = await apiClient.delete(API_ENDPOINTS.USERS.DELETE(id));
  return response.data;
};

export const getRoles = async () => {
  const response = await apiClient.get(API_ENDPOINTS.ROLES.GET_ALL);
  return response.data?.data || [];
};

export const saveRole = async (role) => {
  if (role.id) {
    const response = await apiClient.put(API_ENDPOINTS.ROLES.UPDATE(role.id), role);
    return response.data?.data;
  } else {
    const response = await apiClient.post(API_ENDPOINTS.ROLES.CREATE, role);
    return response.data?.data;
  }
};
