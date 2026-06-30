import apiClient from '../../shared/services/apiClient';
import { API_ENDPOINTS } from '../../shared/services/endpoints';

export const getCompanyAttendance = async (companyId) => {
  if (!companyId) return [];
  const response = await apiClient.get(API_ENDPOINTS.ATTENDANCE.COMPANY(companyId));
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
  const response = await apiClient.post(API_ENDPOINTS.ATTENDANCE.SIGN_IN, payload);
  return response.data;
};

export const signOutEmployee = async (employeeId, locationStr, photoBase64) => {
  const payload = {
    employee_id: employeeId,
    location: locationStr,
    photo: photoBase64
  };
  const response = await apiClient.post(API_ENDPOINTS.ATTENDANCE.SIGN_OUT, payload);
  return response.data;
};

export const clockToggleEmployee = async (employeeId, locationStr, photoBase64) => {
  const payload = {
    employee_id: employeeId,
    location: locationStr,
    photo: photoBase64
  };
  const response = await apiClient.post(API_ENDPOINTS.ATTENDANCE.CLOCK, payload);
  return response.data;
};

export const getAttendanceSummary = async (companyId, monthYear) => {
  if (!companyId || !monthYear) return {};
  try {
    const response = await apiClient.get(API_ENDPOINTS.ATTENDANCE.SUMMARY(companyId, monthYear));
    if (response.data?.status || response.data?.success) {
      return response.data.data || {};
    }
    return {};
  } catch (error) {
    console.error("Failed to fetch attendance summary:", error);
    return {};
  }
};
