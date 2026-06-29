import apiClient from '../../shared/services/apiClient';

export const getCompanyAttendance = async (companyId) => {
  if (!companyId) return [];
  const response = await apiClient.get(`attendance/company/${companyId}`);
  if ((response.data?.status || response.data?.success) && response.data?.data) {
    return response.data.data;
  }
  return [];
};

export const signInEmployee = async (employeeId, locationStr, photoBase64) => {
  const payload = {
    employee_id: employeeId,
    location: locationStr,
    photo: photoBase64
  };
  const response = await apiClient.post('attendance/sign-in', payload);
  return response.data;
};

export const signOutEmployee = async (employeeId, locationStr, photoBase64) => {
  const payload = {
    employee_id: employeeId,
    location: locationStr,
    photo: photoBase64
  };
  const response = await apiClient.post('attendance/sign-out', payload);
  return response.data;
};

export const clockToggleEmployee = async (employeeId, locationStr, photoBase64) => {
  const payload = {
    employee_id: employeeId,
    location: locationStr,
    photo: photoBase64
  };
  const response = await apiClient.post('attendance/clock', payload);
  return response.data;
};

export const getAttendanceSummary = async (companyId, monthYear) => {
  if (!companyId || !monthYear) return {};
  try {
    const response = await apiClient.get(`attendance/summary/company/${companyId}?month_year=${monthYear}`);
    if (response.data?.status || response.data?.success) {
      return response.data.data || {};
    }
    return {};
  } catch (error) {
    console.error("Failed to fetch attendance summary:", error);
    return {};
  }
};
