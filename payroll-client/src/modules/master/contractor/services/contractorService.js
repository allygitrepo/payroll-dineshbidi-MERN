const STORAGE_KEY = 'payroll_contractors';

const defaultContractors = [
  {
    id: '1',
    ccode: '4',
    name: 'BISHNU PADA MAJHI',
    address: 'BANDHA GHAT',
    postOffice: 'JHALDA',
    district: 'PURULIA',
    pincode: '723202',
    pfCode: '176',
    dateOfJoining: '2017-04-01',
    pan: 'DJSPM3836A',
    aadhaar: '123456789012',
    gstNo: '19DJSPM3836A1Z4',
    bankAccount: '1000987654321',
    bankName: 'SBI',
    ifsc: 'SBIN0001234',
    status: 'Active'
  },
  {
    id: '2',
    ccode: '5',
    name: 'BABLU KUMAR',
    address: 'BANDHA GHAT',
    postOffice: 'JHALDA',
    district: 'PURULIA',
    pincode: '723202',
    pfCode: '139',
    dateOfJoining: '2017-04-01',
    pan: 'BCDPK3306D',
    aadhaar: '987654321098',
    gstNo: '19BCDPK3306D1Z2',
    bankAccount: '4405101000955',
    bankName: 'UCO BANK',
    ifsc: 'UCBA0004405',
    status: 'Active'
  },
  {
    id: '3',
    ccode: '60',
    name: 'BHARAT KUMAR',
    address: 'BANDHA GHAT',
    postOffice: 'JHALDA',
    district: 'PURULIA',
    pincode: '723202',
    pfCode: '165',
    dateOfJoining: '2017-04-01',
    pan: 'AIYPK3417H',
    aadhaar: '676179607185',
    gstNo: 'NA',
    bankAccount: '4405101000952',
    bankName: 'CANARA BANK',
    ifsc: 'CNRB0004405',
    status: 'Active'
  }
];

export const getContractors = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultContractors));
    return defaultContractors;
  }
  return JSON.parse(data);
};

export const saveContractor = (contractor) => {
  const contractors = getContractors();
  if (contractor.id) {
    const index = contractors.findIndex(c => c.id === contractor.id);
    if (index !== -1) {
      contractors[index] = contractor;
    }
  } else {
    const nextId = String(contractors.length > 0 ? Math.max(...contractors.map(c => parseInt(c.id))) + 1 : 1);
    const newContractor = { ...contractor, id: nextId };
    contractors.push(newContractor);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contractors));
  return contractors;
};

export const deleteContractor = (id) => {
  const contractors = getContractors();
  const filtered = contractors.filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return filtered;
};
