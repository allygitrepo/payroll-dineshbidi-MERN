import apiClient from '../../../../shared/services/apiClient';

const mapToFrontend = (c) => ({
  id: c.id,
  ccode: c.ccode,
  name: c.name,
  address: c.address?.address || '',
  postOffice: c.address?.post_office || '',
  district: c.address?.district || '',
  pincode: c.address?.pincode || '',
  pfCode: c.pf_code,
  dateOfJoining: c.date_of_joining,
  pan: c.pan || '',
  aadhaar: c.aadhar || '',
  gstNo: c.gst_no || '',
  bankAccount: c.bank_ac || '',
  bankName: c.bank_name || '',
  ifsc: c.ifsc || '',
  status: c.status ? 'Active' : 'Inactive',
  address_id: c.address_id
});

const mapToBackend = (c, companyId, addresses = []) => {
  // Try to find matching address from database address list
  const matchingAddress = addresses.find(a => a.address === c.address);
  const addressId = matchingAddress?.id || c.address_id || c.address;

  return {
    company_id: companyId,
    address_id: addressId,
    ccode: c.ccode,
    name: c.name,
    pf_code: c.pfCode,
    date_of_joining: c.dateOfJoining,
    pan: c.pan || null,
    aadhar: c.aadhaar || null,
    gst_no: c.gstNo || null,
    bank_ac: c.bankAccount || null,
    bank_name: c.bankName || null,
    ifsc: c.ifsc || null,
    status: c.status === 'Active'
  };
};

export const getContractors = async (companyId) => {
  if (!companyId) return [];
  const response = await apiClient.get(`contractors/company/${companyId}`);
  if ((response.data?.status || response.data?.success) && response.data?.data) {
    return response.data.data.map(mapToFrontend);
  }
  return [];
};

export const saveContractor = async (contractor, companyId, addresses = []) => {
  const payload = mapToBackend(contractor, companyId, addresses);
  if (contractor.id) {
    // Update
    await apiClient.put(`contractors/${contractor.id}`, payload);
  } else {
    // Create
    await apiClient.post('contractors', payload);
  }
  return await getContractors(companyId);
};

export const deleteContractor = async (id, companyId) => {
  await apiClient.delete(`contractors/${id}`);
  return await getContractors(companyId);
};

export const createContractorLogin = async (contractorId, credentials) => {
  const response = await apiClient.post(`contractors/${contractorId}/login`, credentials);
  return response.data;
};

export const getContractorLogin = async (contractorId) => {
  try {
    const response = await apiClient.get(`contractors/${contractorId}/login`);
    if (response.data?.status || response.data?.success) {
      return response.data.data;
    }
  } catch (err) {
    return null;
  }
  return null;
};
