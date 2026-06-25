import apiClient from '../../../../shared/services/apiClient';

const mapToFrontend = (w) => ({
  id: w.id,
  startDate: w.start_date,
  endDate: w.end_date,
  rate1: w.rate_1 ? String(w.rate_1) : '0.00',
  rate2: w.rate_2 ? String(w.rate_2) : '0.00',
  rate3: w.rate_3 ? String(w.rate_3) : '0.00',
  rate4: w.rate_4 ? String(w.rate_4) : '0.00',
  bonus: w.bonus ? String(w.bonus) : '0.00'
});

const mapToBackend = (w, companyId) => ({
  company_id: companyId,
  start_date: w.startDate,
  end_date: w.endDate,
  rate_1: parseFloat(w.rate1) || 0.00,
  rate_2: parseFloat(w.rate2) || 0.00,
  rate_3: parseFloat(w.rate3) || 0.00,
  rate_4: parseFloat(w.rate4) || 0.00,
  bonus: parseFloat(w.bonus) || 0.00
});

export const getPackingWages = async (companyId) => {
  if (!companyId) return [];
  const response = await apiClient.get(`packing-wages/company/${companyId}`);
  if ((response.data?.status || response.data?.success) && response.data?.data) {
    return response.data.data.map(mapToFrontend);
  }
  return [];
};

export const savePackingWages = async (wages, companyId) => {
  const payload = mapToBackend(wages, companyId);
  if (wages.id) {
    // Update
    await apiClient.put(`packing-wages/${wages.id}`, payload);
  } else {
    // Create
    await apiClient.post('packing-wages', payload);
  }
  return await getPackingWages(companyId);
};

export const deletePackingWages = async (id, companyId) => {
  await apiClient.delete(`packing-wages/${id}`);
  return await getPackingWages(companyId);
};
