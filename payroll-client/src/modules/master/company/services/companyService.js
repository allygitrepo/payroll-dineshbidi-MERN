import apiClient from '../../../../shared/services/apiClient';

const formatCompanyTypeToBackend = (type) => {
  if (!type) return 'Proprietorship';
  const lower = type.toLowerCase();
  if (lower === 'proprietorship') return 'Proprietorship';
  if (lower === 'partnership') return 'Partnership';
  if (lower === 'private limited' || lower === 'private_limited' || lower === 'private') return 'Private Limited';
  if (lower === 'public') return 'Public';
  return 'Proprietorship';
};

const mapToFrontend = (c) => ({
  id: c.id,
  estbId: c.establishment_id,
  estbName: c.company_name,
  estbType: c.company_type ? c.company_type.toUpperCase() : '',
  epfoOffice: c.epfo_office,
  linNo: c.lin_number || '',
  esicId: c.esic_id || '',
  address: c.address_line,
  postOffice: c.post_office,
  district: c.district,
  pincode: c.pincode,
  pan: c.pan,
  tan: c.tan,
  ptax: c.professional_tax_reg_no || '',
  email: c.email_id,
  phone: c.phone,
  website: c.website || ''
});

const mapToBackend = (c) => ({
  establishment_id: c.estbId,
  company_name: c.estbName,
  company_type: formatCompanyTypeToBackend(c.estbType),
  epfo_office: c.epfoOffice,
  lin_number: c.linNo || null,
  esic_id: c.esicId || null,
  address_line: c.address,
  post_office: c.postOffice,
  district: c.district,
  pincode: c.pincode,
  pan: c.pan,
  tan: c.tan,
  professional_tax_reg_no: c.ptax || null,
  email_id: c.email,
  phone: c.phone,
  website: c.website || null
});

export const getCompanies = async () => {
  const response = await apiClient.get('companies');
  if ((response.data?.status || response.data?.success) && response.data?.data) {
    return response.data.data.map(mapToFrontend);
  }
  return [];
};

export const saveCompany = async (company) => {
  const payload = mapToBackend(company);
  let response;
  if (company.id) {
    // Update
    response = await apiClient.put(`companies/${company.id}`, payload);
  } else {
    // Create
    response = await apiClient.post('companies', payload);
  }
  // Retrieve updated companies list
  return await getCompanies();
};

export const deleteCompany = async (id) => {
  await apiClient.delete(`companies/${id}`);
  return await getCompanies();
};
