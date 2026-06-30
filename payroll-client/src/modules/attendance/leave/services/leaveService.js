import apiClient from '../../../../shared/services/apiClient';

const mapToFrontend = (req) => {
  return {
    id: req.id,
    employeeId: req.employee_id,
    companyId: req.company_id,
    employeeName: req.employee?.name || 'N/A',
    category: req.employee?.employee_type || 'N/A',
    uan: req.employee?.uan || 'N/A',
    mobile: req.employee?.mobile || 'N/A',
    imagePath: req.employee?.image_path || null,
    leaveTypeId: req.leave_type_id,
    leaveType: req.leaveType?.name || req.leave_type || 'N/A',
    leaveCode: req.leaveType?.code || 'N/A',
    numberOfDays: req.number_of_days !== undefined ? parseFloat(req.number_of_days) : 1.0,
    remainingLeaves: req.remaining_leaves !== undefined && req.remaining_leaves !== null ? parseFloat(req.remaining_leaves) : 0.0,
    reason: req.reason || req.description || '',
    dayType: req.day_type || 'Full Day',
    attachmentPath: req.attachment_path || null,
    status: req.status || 'Draft',
    appliedDate: req.applied_date || req.request_date || '',
    fromDate: req.from_date,
    toDate: req.to_date
  };
};

export const getLeaveRequests = async (companyId) => {
  if (!companyId) return [];
  const response = await apiClient.get(`leaves/company/${companyId}`);
  if ((response.data?.status || response.data?.success) && response.data?.data) {
    return response.data.data.map(mapToFrontend);
  }
  return [];
};

export const createLeaveRequest = async (data) => {
  const payload = {
    employeeId: data.employeeId,
    companyId: data.companyId,
    leaveTypeId: data.leaveTypeId,
    fromDate: data.fromDate,
    toDate: data.toDate,
    dayType: data.dayType || 'Full Day',
    reason: data.reason,
    status: data.status || 'Submitted',
    attachmentPath: data.attachmentPath || null
  };
  const response = await apiClient.post('leaves', payload);
  if ((response.data?.status || response.data?.success) && response.data?.data) {
    return mapToFrontend(response.data.data);
  }
  throw new Error(response.data?.messageToShow || 'Failed to submit leave request');
};

export const approveLeaveRequest = async (id) => {
  const response = await apiClient.put(`leaves/${id}/approve`);
  if ((response.data?.status || response.data?.success) && response.data?.data) {
    return mapToFrontend(response.data.data);
  }
  throw new Error(response.data?.messageToShow || 'Failed to approve leave request');
};

export const rejectLeaveRequest = async (id) => {
  const response = await apiClient.put(`leaves/${id}/reject`);
  if ((response.data?.status || response.data?.success) && response.data?.data) {
    return mapToFrontend(response.data.data);
  }
  throw new Error(response.data?.messageToShow || 'Failed to reject leave request');
};

export const cancelLeaveRequest = async (id) => {
  const response = await apiClient.put(`leaves/${id}/cancel`);
  if ((response.data?.status || response.data?.success) && response.data?.data) {
    return mapToFrontend(response.data.data);
  }
  throw new Error(response.data?.messageToShow || 'Failed to cancel leave request');
};

export const calculateLeaveDays = async (companyId, fromDate, toDate, dayType) => {
  const response = await apiClient.post('leaves/calculate-days', {
    companyId,
    fromDate,
    toDate,
    dayType
  });
  if ((response.data?.status || response.data?.success) && response.data?.data) {
    return parseFloat(response.data.data.days);
  }
  throw new Error(response.data?.messageToShow || 'Failed to calculate leave days');
};
