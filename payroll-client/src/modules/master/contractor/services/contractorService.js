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
  whatsappNumber: c.whatsapp_number || '',
  mobile: c.whatsapp_number || '',
  status: c.status ? 'Active' : 'Inactive',
  address_id: c.address_id
});

const mapToBackend = (c, companyId, addresses = []) => {
  return {
    company_id: companyId,
    address_id: c.address_id,
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
    whatsapp_number: c.whatsappNumber || null,
    status: c.status === 'Active'
  };
};

export const getContractors = async (companyId, params = {}) => {
  if (!companyId) return { data: [], total: 0, totalPages: 1 };
  
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page);
  if (params.limit) query.append('limit', params.limit);
  if (params.search) query.append('search', params.search);
  if (params.status !== undefined && params.status !== '') query.append('status', params.status);

  const queryString = query.toString() ? `?${query.toString()}` : '';
  const response = await apiClient.get(`contractors/company/${companyId}${queryString}`);
  
  const isPaginationRequested = params.page !== undefined || params.limit !== undefined;

  if ((response.data?.status || response.data?.success) && response.data?.data) {
    if (response.data.data.rows) {
        if (isPaginationRequested) {
            return {
                data: response.data.data.rows.map(mapToFrontend),
                total: response.data.data.total,
                totalPages: response.data.data.totalPages,
                currentPage: response.data.data.currentPage
            };
        } else {
            return response.data.data.rows.map(mapToFrontend);
        }
    } else {
        const arr = Array.isArray(response.data.data) ? response.data.data : [];
        if (isPaginationRequested) {
            return {
                data: arr.map(mapToFrontend),
                total: arr.length,
                totalPages: 1,
                currentPage: 1
            };
        } else {
            return arr.map(mapToFrontend);
        }
    }
  }
  return isPaginationRequested ? { data: [], total: 0, totalPages: 1 } : [];
};

export const saveContractor = async (contractor, companyId, addresses = []) => {
  const safeStr = (str) => (str || '').toString().trim().toLowerCase();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const resolveOrCreateAddress = async (addressStr, postOffice, district, pincode) => {
    if (!addressStr) return null;
    if (uuidRegex.test(addressStr)) return addressStr;
    const matchingAddress = addresses.find(a => safeStr(a.address) === safeStr(addressStr));
    if (matchingAddress) return matchingAddress.id;

    try {
      const res = await apiClient.post('addresses', {
        company_id: companyId,
        address: addressStr.toUpperCase(),
        post_office: (postOffice || 'UNKNOWN').toUpperCase(),
        district: (district || 'UNKNOWN').toUpperCase(),
        pincode: pincode || '000000',
        status: true
      });
      if (res.data?.data?.id) {
        addresses.push(res.data.data);
        return res.data.data.id;
      }
    } catch (e) {
      console.error("Failed to auto-create address", e);
    }
    return addressStr;
  };

  // Pre-resolve or auto-create address
  contractor.address_id = await resolveOrCreateAddress(
    contractor.address || contractor.address_id,
    contractor.postOffice,
    contractor.district,
    contractor.pincode
  );

  if (contractor.address_id && !uuidRegex.test(contractor.address_id)) {
    throw new Error(`Failed to resolve Address ID for ${contractor.address}. Please ensure the address exists.`);
  }

  const payload = mapToBackend(contractor, companyId, addresses);
  if (contractor.id) {
    // Strip company_id for update if needed (some backend schemas strictly forbid company_id in PUT)
    const { company_id, ...updatePayload } = payload;
    await apiClient.put(`contractors/${contractor.id}`, updatePayload);
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
