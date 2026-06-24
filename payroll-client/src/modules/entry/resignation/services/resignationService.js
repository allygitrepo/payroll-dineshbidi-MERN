import apiClient from '../../../../shared/services/apiClient';

const REASON_MAP_FROM_DB = {
  'C': 'CESSATION (SHORT SERVICE)',
  'S': 'SUPERANNUATION',
  'R': 'RETIREMENT',
  'D': 'DEATH IN SERVICE',
  'P': 'PERMANENT DISABLEMENT'
};

const REASON_MAP_TO_DB = {
  'CESSATION (SHORT SERVICE)': 'C',
  'SUPERANNUATION': 'S',
  'RETIREMENT': 'R',
  'DEATH IN SERVICE': 'D',
  'PERMANENT DISABLEMENT': 'P'
};

const mapToFrontend = (data) => {
  return {
    id: data.id,
    accountNo: data.account_no,
    uan: data.uan,
    nameOfMember: data.name_of_member,
    nameOfParents: data.name_of_parents,
    dateOfLeaving: data.date_of_leaving,
    reasonOfLeaving: REASON_MAP_FROM_DB[data.reason_of_leaving] || data.reason_of_leaving
  };
};

const mapToBackend = (data) => {
  const company_id = localStorage.getItem('company_id');
  return {
    id: data.id,
    account_no: data.accountNo,
    uan: data.uan,
    name_of_member: data.nameOfMember,
    name_of_parents: data.nameOfParents,
    date_of_leaving: data.dateOfLeaving,
    reason_of_leaving: REASON_MAP_TO_DB[data.reasonOfLeaving] || data.reasonOfLeaving,
    company_id: company_id || null
  };
};

export const getResignations = async () => {
  try {
    const response = await apiClient.get('/resignations');
    const data = response.data?.data || [];
    return data.map(mapToFrontend);
  } catch (error) {
    console.error('Error fetching resignations:', error);
    throw error;
  }
};

export const saveResignation = async (resignationData) => {
  try {
    const payload = mapToBackend(resignationData);
    const response = await apiClient.post('/resignations', payload);
    return mapToFrontend(response.data?.data || {});
  } catch (error) {
    console.error('Error saving resignation:', error);
    throw error;
  }
};

export const deleteResignation = async (id) => {
  try {
    const response = await apiClient.delete(`/resignations/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting resignation:', error);
    throw error;
  }
};

export const fetchEmployeeByUan = async (uan) => {
  try {
    const response = await apiClient.get(`/resignations/employee/${uan}`);
    if (response.data && response.data.status) {
      return response.data.data; // { uan, name_of_member, name_of_parents, account_no }
    }
    return null;
  } catch (error) {
    console.error('Error fetching employee by UAN:', error);
    throw error;
  }
};
