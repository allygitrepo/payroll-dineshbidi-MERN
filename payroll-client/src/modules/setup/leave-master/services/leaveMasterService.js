import apiClient from '../../../../shared/services/apiClient';

/**
 * Tab 1: Leave Types
 */
export const getLeaveTypes = async (companyId) => {
  if (!companyId) return [];
  const response = await apiClient.get(`leave-masters/types/company/${companyId}`);
  if ((response.data?.status || response.data?.success) && response.data?.data) {
    return response.data.data;
  }
  return [];
};

export const saveLeaveType = async (companyId, typeData) => {
  const response = await apiClient.post(`leave-masters/types/company/${companyId}`, typeData);
  if ((response.data?.status || response.data?.success) && response.data?.data) {
    return response.data.data;
  }
  return null;
};

export const deleteLeaveType = async (companyId, id) => {
  const response = await apiClient.delete(`leave-masters/types/company/${companyId}/${id}`);
  return response.data;
};

/**
 * Tab 2: Leave Policies Matrix
 */
export const getLeavePolicies = async (companyId) => {
  if (!companyId) return [];
  const response = await apiClient.get(`leave-masters/policies/company/${companyId}`);
  if ((response.data?.status || response.data?.success) && response.data?.data) {
    return response.data.data;
  }
  return [];
};

export const saveLeavePolicy = async (companyId, policyData) => {
  const response = await apiClient.post(`leave-masters/policies/company/${companyId}`, policyData);
  if ((response.data?.status || response.data?.success) && response.data?.data) {
    return response.data.data;
  }
  return null;
};

/**
 * Tab 3: Global Leave Settings
 */
export const getGlobalSettings = async (companyId) => {
  if (!companyId) return { leave_year_type: 'Calendar Year', sandwich_policy_enabled: false, comp_off_expiry_days: 90 };
  const response = await apiClient.get(`leave-masters/settings/company/${companyId}`);
  if ((response.data?.status || response.data?.success) && response.data?.data) {
    return response.data.data;
  }
  return { leave_year_type: 'Calendar Year', sandwich_policy_enabled: false, comp_off_expiry_days: 90 };
};

export const saveGlobalSettings = async (companyId, settingsData) => {
  const response = await apiClient.post(`leave-masters/settings/company/${companyId}`, settingsData);
  if ((response.data?.status || response.data?.success) && response.data?.data) {
    return response.data.data;
  }
  return null;
};

/**
 * Dynamic Employee Type list
 */
export const getEmployeeTypes = async () => {
  const response = await apiClient.get('leave-masters/employee-types');
  if ((response.data?.status || response.data?.success) && response.data?.data) {
    return response.data.data;
  }
  return [];
};

/**
 * Live Balances
 */
export const getEmployeeBalances = async (employeeId, companyId, leaveYear) => {
  if (!employeeId || !companyId) return [];
  const response = await apiClient.get(`leave-masters/balances/${employeeId}?companyId=${companyId}&leaveYear=${leaveYear}`);
  if ((response.data?.status || response.data?.success) && response.data?.data) {
    return response.data.data;
  }
  return [];
};

/**
 * Manual Balance Adjustment
 */
export const adjustBalance = async (companyId, adjustData) => {
  const response = await apiClient.post('leave-masters/balances/adjust', { companyId, ...adjustData });
  if ((response.data?.status || response.data?.success) && response.data?.data) {
    return response.data.data;
  }
  return null;
};

/**
 * Manual Accrual trigger
 */
export const runAccrual = async (companyId) => {
  const response = await apiClient.post(`leave-masters/accrual/company/${companyId}`);
  return response.data;
};


