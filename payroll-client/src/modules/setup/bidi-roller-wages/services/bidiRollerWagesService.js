import apiClient from '../../../../shared/services/apiClient';

const mapToFrontend = (w) => ({
  id: w.id,
  startDate: w.start_date,
  endDate: w.end_date,
  rate1: w.rate_1 ? String(w.rate_1) : '0.00',
  rate2: w.hra_1 ? String(w.hra_1) : '0.00',
  rate3: w.bonus_1 ? String(w.bonus_1) : '0.00',
  rate4: w.rate_2 ? String(w.rate_2) : '0.00',
  bonus: w.hra_2 ? String(w.hra_2) : '0.00'
});

const mapToBackend = (w, companyId) => ({
  company_id: companyId,
  start_date: w.startDate,
  end_date: w.endDate,
  rate_1: parseFloat(w.rate1) || 0.00,
  hra_1: parseFloat(w.rate2) || 0.00,
  bonus_1: parseFloat(w.rate3) || 0.00,
  rate_2: parseFloat(w.rate4) || 0.00,
  hra_2: parseFloat(w.bonus) || 0.00,
  bonus_2: 0.00
});

export const getBidiRollerWages = async (companyId) => {
  if (!companyId) return [];
  const response = await apiClient.get(`bidi-roller-wages/company/${companyId}`);
  if ((response.data?.status || response.data?.success) && response.data?.data) {
    return response.data.data.map(mapToFrontend);
  }
  return [];
};

export const saveBidiRollerWages = async (wages, companyId) => {
  const payload = mapToBackend(wages, companyId);
  if (wages.id) {
    // Update
    await apiClient.put(`bidi-roller-wages/${wages.id}`, payload);
  } else {
    // Create
    await apiClient.post('bidi-roller-wages', payload);
  }
  return await getBidiRollerWages(companyId);
};

export const deleteBidiRollerWages = async (id, companyId) => {
  await apiClient.delete(`bidi-roller-wages/${id}`);
  return await getBidiRollerWages(companyId);
};
