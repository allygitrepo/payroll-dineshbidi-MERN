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
    abryApplicable: false,
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
    employeeImage: e.image_path || '',
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

const mapToBackend = (e, companyId, addresses = [], contractors = []) => {
  const matchingAddress = addresses.find(a => a.address === e.address);
  const addressId = matchingAddress?.id || e.address_id || e.address;

  let contractorId = null;
  if (e.contractor && e.contractor !== 'SELF') {
    const matchingContractor = contractors.find(c => c.name === e.contractor);
    contractorId = matchingContractor?.id || e.contractor_id || e.contractor;
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

  const nomineesPayload = (e.nomineeDetails || []).map(n => {
    const nAddress = addresses.find(a => a.address === n.address);
    const nAddressId = nAddress?.id || n.address_id || n.address;
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

  const familyMembersPayload = (e.familyDetails || []).map(f => ({
    relation: f.relation,
    name: f.name,
    dob: f.dob || '2000-01-01',
    aadhar: f.aadhaarNumber
  }));

  const formatGender = (g) => {
    if (!g) return 'Male';
    const lower = g.toLowerCase();
    if (lower === 'male') return 'Male';
    if (lower === 'female') return 'Female';
    return 'Other';
  };

  return {
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
    kyc_details: kycDetailsPayload,
    nominees: nomineesPayload,
    family_members: familyMembersPayload
  };
};

export const getEmployees = async (companyId) => {
  if (!companyId) return [];
  const response = await apiClient.get(`employees/company/${companyId}`);
  if ((response.data?.status || response.data?.success) && response.data?.data) {
    return response.data.data.map(mapToFrontend);
  }
  return [];
};

export const saveEmployee = async (employee, companyId, addresses = [], contractors = []) => {
  const payload = mapToBackend(employee, companyId, addresses, contractors);
  if (employee.id) {
    await apiClient.put(`employees/${employee.id}`, payload);
  } else {
    await apiClient.post('employees', payload);
  }
  return await getEmployees(companyId);
};

export const deleteEmployee = async (id, companyId) => {
  await apiClient.delete(`employees/${id}`);
  return await getEmployees(companyId);
};
