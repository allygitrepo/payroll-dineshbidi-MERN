import apiClient from '../../../../shared/services/apiClient';

const mapToFrontend = (e) => {
  const panDoc = e.kycDetail?.pan || '';
  const bankAcDoc = e.kycDetail?.bank_ac || '';
  const bankNameDoc = e.kycDetail?.bank_name || '';
  const ifscDoc = e.kycDetail?.ifsc || '';

  const kycDetails = [];
  if (panDoc) {
    kycDetails.push({
      id: 'k_pan_' + e.id,
      documentType: 'PAN',
      documentNumber: panDoc,
      nameAsPerDocument: e.name,
      ifsc: '',
      kycImage: ''
    });
  }
  if (bankAcDoc) {
    kycDetails.push({
      id: 'k_bank_' + e.id,
      documentType: 'BANK PASSBOOK',
      documentNumber: bankAcDoc,
      nameAsPerDocument: e.name,
      ifsc: ifscDoc,
      kycImage: ''
    });
  }
  if (e.uan) {
    kycDetails.push({
      id: 'k_uan_' + e.id,
      documentType: 'UAN',
      documentNumber: e.uan,
      nameAsPerDocument: e.name,
      ifsc: '',
      kycImage: ''
    });
  }
  if (e.aadhar) {
    kycDetails.push({
      id: 'k_aadhaar_' + e.id,
      documentType: 'AADHAAR',
      documentNumber: e.aadhar,
      nameAsPerDocument: e.name,
      ifsc: '',
      kycImage: ''
    });
  }

  return {
    id: e.id,
    abryApplicable: e.abry_applicable || false,
    uan: e.uan,
    ipNumber: e.ip_number,
    memberId: e.member_id || '',
    memberName: e.name,
    dob: e.dob,
    dateOfJoining: e.date_of_joining,
    aadhaarCard: e.aadhar,
    gender: e.gender ? e.gender.toUpperCase() : 'MALE',
    fatherHusbandName: e.father_or_husband_name || '',
    relation: e.relation || '',
    maritalStatus: e.marital_status || '',
    mobile: e.mobile,
    qualification: e.qualification || '',
    employeeType: e.employee_type,
    contractor: e.contractor ? e.contractor.name : 'SELF',
    contractor_id: e.contractor_id,
    address: e.address?.address || '',
    postOffice: e.address?.post_office || '',
    district: e.address?.district || '',
    pincode: e.address?.pincode || '',
    address_id: e.address_id,
    nationality: e.nationality || 'INDIAN',
    email: e.email || '',
    isInternationalWorker: e.is_international_worker ? 'YES' : 'NO',
    physicalHandicap: e.physical_handicap ? 'YES' : 'NO',
    pmrpy: e.pmrpy ? 'YES' : 'NO',
    status: e.status !== undefined ? e.status : true,
    employeeImage: e.image_path || '',
    faceDescriptorPath: e.face_descriptor_path || null,
    kycDetails: kycDetails,
    nomineeDetails: (e.nomineeDetails || []).map(n => ({
      id: n.id,
      name: n.name,
      address: n.address?.address || '',
      postOffice: n.address?.post_office || '',
      district: n.address?.district || '',
      pincode: n.address?.pincode || '',
      address_id: n.address_id,
      aadhaarNumber: n.aadhar,
      relation: n.relation,
      dob: n.dob,
      sharePercentage: String(n.share_percentage),
      guardianName: n.guardian_name || '',
      guardianAddress: n.guardian_address || ''
    })),
    familyDetails: (e.familyMembers || []).map(f => ({
      id: f.id,
      relation: f.relation,
      name: f.name,
      dob: f.dob,
      aadhaarNumber: f.aadhar
    }))
  };
};

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const mapToBackend = (e, companyId, addresses = [], contractors = []) => {
  const normalize = (value) =>
    String(value ?? "")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();

  let matchingAddress = null;
  if (e.address) {
    matchingAddress = addresses.find(a => normalize(a.address || a.address_name) === normalize(e.address));
  }
  if (!matchingAddress && e.address_id && uuidRegex.test(e.address_id)) {
    matchingAddress = addresses.find(a => a.id === e.address_id || a.address_id === e.address_id);
  }

  // Only use addressId if it belongs to an address in this company's list
  const addressId = matchingAddress?.id || matchingAddress?.address_id || null;

  console.log("Excel Address Name:", e.address);
  console.log("Available Address Names:", addresses.map(a => a.address || a.address_name));
  console.log("Matched Address:", matchingAddress);
  console.log("Resolved Address ID:", addressId);

  if (e.address && String(e.address).trim() !== '' && (!addressId || !uuidRegex.test(addressId))) {
    console.error("FATAL: Resolved addressId is not a valid UUID!", addressId);
    throw new Error(`Address "${e.address || ''}" was not found for this company.`);
  }

  let contractorId = null;
  if (e.contractor && e.contractor !== 'SELF') {
    const matchingContractor = contractors.find(c => normalize(c.name) === normalize(e.contractor));
    contractorId = matchingContractor?.id || e.contractor_id || null;
    if (contractorId && !uuidRegex.test(contractorId)) {
      contractorId = null;
    }
  }

  const panDoc = e.kycDetails?.find(k => k.documentType === 'PAN')?.documentNumber || null;
  const bankPassbook = e.kycDetails?.find(k => k.documentType === 'BANK PASSBOOK');
  const bankAc = bankPassbook?.documentNumber || null;
  const ifsc = bankPassbook?.ifsc || null;
  const bankName = bankPassbook?.bankName || null;

  const kycDetailsPayload = {
    pan: panDoc,
    bank_ac: bankAc,
    bank_name: bankName,
    ifsc: ifsc
  };

  const familyMembersPayload = (e.familyDetails || e.familyMembers || []).map(f => ({
    relation: f.relation,
    name: f.name,
    dob: f.dob || '2000-01-01',
    aadhar: f.aadhaarNumber || f.aadhar
  }));

  const nomineesPayload = (e.nomineeDetails || e.nominees || []).map(n => {
    const nAddress = addresses.find(a => normalize(a.address || a.address_name) === normalize(n.address));
    const nAddressId = nAddress?.id || n.address_id || (uuidRegex.test(n.address) ? n.address : null);

    if (nAddressId && !uuidRegex.test(nAddressId)) {
      console.error("FATAL: Resolved Nominee Address ID is not a valid UUID!", nAddressId);
      throw new Error(`Frontend Validation Failed: Could not resolve Nominee Address ID. Got: ${nAddressId}. Please check the Nominee's address.`);
    }

    return {
      address_id: nAddressId,
      name: n.name,
      aadhar: n.aadhaarNumber,
      relation: n.relation,
      dob: n.dob || '2000-01-01',
      share_percentage: parseFloat(n.sharePercentage) || 100,
      guardian_name: n.guardianName || null,
      guardian_address: n.guardianAddress || null
    };
  });

  const formatGender = (g) => {
    if (!g) return 'Male';
    const lower = g.toLowerCase();
    if (lower === 'male') return 'Male';
    if (lower === 'female') return 'Female';
    return 'Other';
  };

  const payload = {
    company_id: companyId,
    address_id: addressId,
    contractor_id: contractorId,
    image_path: e.employeeImage || null,
    uan: e.uan,
    ip_number: e.ipNumber,
    member_id: e.memberId || null,
    name: e.memberName,
    dob: e.dob,
    aadhar: e.aadhaarCard,
    gender: formatGender(e.gender),
    father_or_husband_name: e.fatherHusbandName || null,
    relation: e.relation || null,
    marital_status: e.maritalStatus || null,
    mobile: e.mobile,
    qualification: e.qualification || null,
    date_of_joining: e.dateOfJoining,
    employee_type: e.employeeType,
    nationality: e.nationality || 'INDIAN',
    email: e.email || null,
    is_international_worker: e.isInternationalWorker === 'YES',
    physical_handicap: e.physicalHandicap === 'YES',
    pmrpy: e.pmrpy === 'YES',
    abry_applicable: e.abryApplicable || false,
    status: (e.status === 'Active' || e.status === true || e.status === 'true' || e.status === 1) ? true : false,
    kyc_details: kycDetailsPayload,
    nominees: nomineesPayload,
    family_members: familyMembersPayload
  };

  console.log("Employee Import Payload:", payload);

  return payload;
};

export const getEmployees = async (companyId, params = {}) => {
  if (!companyId) return { data: [], total: 0, totalPages: 1 };
  
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page);
  if (params.limit) query.append('limit', params.limit);
  if (params.search) query.append('search', params.search);
  if (params.status !== undefined && params.status !== '') query.append('status', params.status);
  if (params.employeeType) query.append('employeeType', params.employeeType);

  const queryString = query.toString() ? `?${query.toString()}` : '';
  const response = await apiClient.get(`employees/company/${companyId}${queryString}`);
  
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

export const getMissingDetails = async (companyId, fields) => {
  if (!companyId || !fields || fields.length === 0) return [];
  const fieldsStr = fields.join(',');
  const response = await apiClient.get(`employees/company/${companyId}/missing-details?fields=${encodeURIComponent(fieldsStr)}`);
  if ((response.data?.status || response.data?.success) && response.data?.data) {
    return response.data.data.map(e => ({
      ...mapToFrontend(e),
      missingFields: e.missingFields || []
    }));
  }
  return [];
};

export const saveEmployee = async (employee, companyId, addresses = [], contractors = []) => {
  if (!addresses || addresses.length === 0) {
    const { getAddresses } = await import('../../address/services/addressService');
    addresses = await getAddresses(companyId);
  }
  if (!contractors || contractors.length === 0) {
    const { getContractors } = await import('../../contractor/services/contractorService');
    contractors = await getContractors(companyId);
  }

  const normalize = (value) =>
    String(value ?? "")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();

  const resolveOrCreateAddress = async (addressStr) => {
    if (!addressStr) return null;
    if (uuidRegex.test(addressStr)) return addressStr;
    const matchingAddress = addresses.find(a => normalize(a.address || a.address_name) === normalize(addressStr));
    if (matchingAddress) return matchingAddress.id || matchingAddress.address_id;
    return null;
  };

  const resolveOrCreateContractor = async (contractorStr, addrId) => {
    if (!contractorStr || normalize(contractorStr) === 'self') return null;
    if (uuidRegex.test(contractorStr)) return contractorStr;
    const matchingContractor = contractors.find(c => normalize(c.name) === normalize(contractorStr));
    if (matchingContractor) return matchingContractor.id;

    try {
      const res = await apiClient.post('contractors', {
        company_id: companyId,
        name: contractorStr.toUpperCase(),
        address_id: addrId || addresses[0]?.id || null,
        ccode: 'AUTO-' + Math.floor(100000 + Math.random() * 900000),
        pf_code: 'N/A',
        date_of_joining: new Date().toISOString().split('T')[0],
        status: true
      });
      if (res.data?.data?.id) {
        contractors.push(res.data.data);
        return res.data.data.id;
      }
    } catch (e) {
      console.error("Failed to auto-create contractor", e);
    }
    return contractorStr;
  };

  // Pre-resolve or auto-create related entities
  employee.address_id = await resolveOrCreateAddress(employee.address || employee.address_id, employee.postOffice, employee.district, employee.pincode);

  if (employee.contractor && normalize(employee.contractor) !== 'self') {
    employee.contractor_id = await resolveOrCreateContractor(employee.contractor, employee.address_id);
  }

  if (employee.nomineeDetails && employee.nomineeDetails.length > 0) {
    for (const nom of employee.nomineeDetails) {
      nom.address_id = await resolveOrCreateAddress(nom.address || nom.address_id, employee.postOffice, employee.district, employee.pincode);
    }
  }

  const payload = mapToBackend(employee, companyId, addresses, contractors);
  let savedEmpId = employee.id;
  let savedEmpName = employee.memberName;

  if (employee.id) {
    // Strip company_id from update payload to satisfy backend schema constraints
    const { company_id, ...updatePayload } = payload;
    await apiClient.put(`employees/${employee.id}`, updatePayload);
  } else {
    const res = await apiClient.post('employees', payload);
    if (res.data?.data) {
      savedEmpId = res.data.data.id;
      savedEmpName = res.data.data.name;
    }
  }

  // If there are temp face descriptors to enroll, save them
  if (employee.tempFaceDescriptors && employee.tempFaceDescriptors.length > 0) {
    const enrollPayload = {
      employee_id: savedEmpId,
      name: savedEmpName,
      descriptors: employee.tempFaceDescriptors.map(d => Array.from(d))
    };
    await apiClient.post('employees/face/enroll', enrollPayload);
  }

  return await getEmployees(companyId);
};

export const deleteEmployee = async (id, companyId) => {
  await apiClient.delete(`employees/${id}`);
  return await getEmployees(companyId);
};

export const toggleAbryStatus = async (id, currentStatus, companyId) => {
  await apiClient.put(`employees/${id}`, { abry_applicable: !currentStatus });
  return await getEmployees(companyId);
};
