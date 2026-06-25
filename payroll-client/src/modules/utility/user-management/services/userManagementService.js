import apiClient from '../../../../shared/services/apiClient';

export const getUsers = async () => {
  const response = await apiClient.get('/users');
  return response.data?.data || [];
};

export const saveUser = async (user) => {
  if (user.id) {
    const response = await apiClient.put(`/users/${user.id}`, user);
    return response.data?.data;
  } else {
    const response = await apiClient.post('/users/register', user);
    return response.data?.data;
  }
};

export const deleteUser = async (id) => {
  const response = await apiClient.delete(`/users/${id}`);
  return response.data;
};

export const getRoles = async () => {
  const response = await apiClient.get('/roles');
  return response.data?.data || [];
};

export const saveRole = async (role) => {
  if (role.id) {
    const response = await apiClient.put(`/roles/${role.id}`, role);
    return response.data?.data;
  } else {
    const response = await apiClient.post('/roles', role);
    return response.data?.data;
  }
};
