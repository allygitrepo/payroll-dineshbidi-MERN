import apiClient from '../../../../shared/services/apiClient';

const mapToFrontend = (t) => ({
  id: t.id,
  startDate: t.start_date,
  endDate: t.end_date,
  from: t.from_amount ? String(t.from_amount) : '0.00',
  to: t.to_amount ? String(t.to_amount) : '0.00',
  taxRate: t.tax_rate ? String(t.tax_rate) : '0.00'
});

const mapToBackend = (t, companyId) => ({
  company_id: companyId,
  start_date: t.startDate,
  end_date: t.endDate,
  from_amount: parseFloat(t.from) || 0.00,
  to_amount: parseFloat(t.to) || 0.00,
  tax_rate: parseFloat(t.taxRate) || 0.00
});

export const getProfessionalTax = async (companyId) => {
  if (!companyId) return [];
  const response = await apiClient.get(`professional-taxes/company/${companyId}`);
  if ((response.data?.status || response.data?.success) && response.data?.data) {
    return response.data.data.map(mapToFrontend);
  }
  return [];
};

export const saveProfessionalTax = async (tax, companyId) => {
  const payload = mapToBackend(tax, companyId);
  if (tax.id) {
    // Update
    await apiClient.put(`professional-taxes/${tax.id}`, payload);
  } else {
    // Create
    await apiClient.post('professional-taxes', payload);
  }
  return await getProfessionalTax(companyId);
};

export const deleteProfessionalTax = async (id, companyId) => {
  await apiClient.delete(`professional-taxes/${id}`);
  return await getProfessionalTax(companyId);
};
