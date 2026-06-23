import apiClient from '../../../../shared/services/apiClient';

const mapToFrontend = (req) => {
  return {
    id: req.id,
    employeeId: req.employee_id,
    companyId: req.company_id,
    employeeName: req.employee?.name || 'N/A',
    category: req.employee?.employee_type || 'Office Staff',
    uan: req.employee?.uan || 'N/A',
    mobile: req.employee?.mobile || 'N/A',
    imagePath: req.employee?.image_path || null,
    leaveType: req.leave_type,
    totalLeaves: req.total_leaves || 12,
    remainingLeaves: req.remaining_leaves !== undefined && req.remaining_leaves !== null ? parseFloat(req.remaining_leaves) : 12.0,
    description: req.description || '',
    status: req.status || 'Pending',
    requestDate: req.request_date,
    fromDate: req.from_date,
    toDate: req.to_date
  };
};

export const getLeaveRequests = async (companyId) => {
  if (!companyId) return [];
  const response = await apiClient.get(`leaves/company/${companyId}`);
  if (response.data?.status && response.data?.data) {
    return response.data.data.map(mapToFrontend);
  }
  return [];
};

export const createLeaveRequest = async (data) => {
  const payload = {
    employeeId: data.employeeId,
    companyId: data.companyId,
    leaveType: data.leaveType,
    fromDate: data.fromDate,
    toDate: data.toDate,
    description: data.description
  };
  const response = await apiClient.post('leaves', payload);
  if (response.data?.status && response.data?.data) {
    return mapToFrontend(response.data.data);
  }
  throw new Error(response.data?.messageToShow || 'Failed to submit leave request');
};

export const approveLeaveRequest = async (id) => {
  const response = await apiClient.put(`leaves/${id}/approve`);
  if (response.data?.status && response.data?.data) {
    return mapToFrontend(response.data.data);
  }
  throw new Error(response.data?.messageToShow || 'Failed to approve leave request');
};

export const rejectLeaveRequest = async (id) => {
  const response = await apiClient.put(`leaves/${id}/reject`);
  if (response.data?.status && response.data?.data) {
    return mapToFrontend(response.data.data);
  }
  throw new Error(response.data?.messageToShow || 'Failed to reject leave request');
};
