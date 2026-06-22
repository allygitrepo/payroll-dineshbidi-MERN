import apiClient from '../../../../shared/services/apiClient';

const mapToFrontend = (c) => ({
  id: c.id,
  holidayType: c.holiday_type || 'COMPANY',
  weekDay: c.week_day || '',
  holidayDate: c.holiday_date || '',
  year: c.year || '',
  remark: c.remark || ''
});

const mapToBackend = (c, companyId) => ({
  company_id: companyId,
  holiday_type: c.holidayType,
  week_day: c.holidayType === 'WEEKLY' ? c.weekDay : null,
  holiday_date: c.holidayType === 'COMPANY' ? c.holidayDate : null,
  remark: c.remark || null
});

export const getCalender = async (companyId) => {
  if (!companyId) return [];
  const response = await apiClient.get(`calenders/company/${companyId}`);
  if ((response.data?.status || response.data?.success) && response.data?.data) {
    return response.data.data.map(mapToFrontend);
  }
  return [];
};

export const saveCalender = async (data, companyId) => {
  const payload = mapToBackend(data, companyId);
  if (data.id) {
    // Update
    await apiClient.put(`calenders/${data.id}`, payload);
  } else {
    // Create
    await apiClient.post('calenders', payload);
  }
  return await getCalender(companyId);
};

export const deleteCalender = async (id, companyId) => {
  await apiClient.delete(`calenders/${id}`);
  return await getCalender(companyId);
};
