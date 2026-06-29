import apiClient from '../../../../shared/services/apiClient';

export const getLeaveMaster = async (companyId) => {
  if (!companyId) return { yearly_leave_cap: 12.0, leave_types: [] };
  const response = await apiClient.get(`leave-masters/company/${companyId}`);
  if ((response.data?.status || response.data?.success) && response.data?.data) {
    const rawData = response.data.data;
    
    // The yearly leave cap can be read from any entry (or defaults to 12.0)
    let yearlyLeaveCap = 12.0;
    const leaveTypes = [];

    rawData.forEach(item => {
      if (item.yearly_leave_cap !== null && item.yearly_leave_cap !== undefined) {
        yearlyLeaveCap = parseFloat(item.yearly_leave_cap);
      }
      if (item.leave_type) {
        leaveTypes.push({
          id: item.id,
          leave_type: item.leave_type,
          leave_days: item.leave_days !== null ? String(item.leave_days) : ''
        });
      }
    });

    return {
      yearly_leave_cap: yearlyLeaveCap,
      leave_types: leaveTypes
    };
  }
  return { yearly_leave_cap: 12.0, leave_types: [] };
};

export const saveLeaveMaster = async (companyId, configData) => {
  const response = await apiClient.post(`leave-masters/company/${companyId}`, configData);
  if ((response.data?.status || response.data?.success) && response.data?.data) {
    const rawData = response.data.data;
    let yearlyLeaveCap = 12.0;
    const leaveTypes = [];

    rawData.forEach(item => {
      if (item.yearly_leave_cap !== null && item.yearly_leave_cap !== undefined) {
        yearlyLeaveCap = parseFloat(item.yearly_leave_cap);
      }
      if (item.leave_type) {
        leaveTypes.push({
          id: item.id,
          leave_type: item.leave_type,
          leave_days: item.leave_days !== null ? String(item.leave_days) : ''
        });
      }
    });

    return {
      yearly_leave_cap: yearlyLeaveCap,
      leave_types: leaveTypes
    };
  }
  return await getLeaveMaster(companyId);
};

export const deleteLeaveType = async (id, companyId) => {
  await apiClient.delete(`leave-masters/${id}`);
  return await getLeaveMaster(companyId);
};
