import apiClient from '../../../../shared/services/apiClient';

const mapToFrontend = (a) => ({
  id: a.id,
  address: a.address,
  postOffice: a.post_office,
  district: a.district,
  pincode: a.pincode
});

const mapToBackend = (a, companyId) => ({
  company_id: companyId,
  address: a.address,
  post_office: a.postOffice,
  district: a.district,
  pincode: a.pincode
});

export const getAddresses = async (companyId) => {
  if (!companyId) return [];
  const response = await apiClient.get(`addresses/company/${companyId}`);
  if ((response.data?.status || response.data?.success) && response.data?.data) {
    return response.data.data.map(mapToFrontend);
  }
  return [];
};

export const saveAddress = async (address, companyId) => {
  const payload = mapToBackend(address, companyId);
  if (address.id) {
    // Update
    await apiClient.put(`addresses/${address.id}`, payload);
  } else {
    // Create
    await apiClient.post('addresses', payload);
  }
  return await getAddresses(companyId);
};

export const deleteAddress = async (id, companyId) => {
  await apiClient.delete(`addresses/${id}`);
  return await getAddresses(companyId);
};
