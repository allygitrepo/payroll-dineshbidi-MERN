const STORAGE_KEY = 'payroll_resignations';

const DEFAULT_RESIGNATIONS = [
  {
    id: 'res-1',
    uan: '1',
    accountNo: 'DLCPM0012345/0000001',
    nameOfMember: 'RAMESH KUMAR',
    nameOfParents: 'HARISH PRASAD',
    dateOfLeaving: '2019-03-01',
    reasonOfLeaving: 'CESSATION (SHORT SERVICE)'
  },
  {
    id: 'res-2',
    uan: '100043291997',
    accountNo: 'DLCPM0012345/0000432',
    nameOfMember: 'ANIL SHARMA',
    nameOfParents: 'VIJAY SHARMA',
    dateOfLeaving: '2021-10-31',
    reasonOfLeaving: 'CESSATION (SHORT SERVICE)'
  },
  {
    id: 'res-3',
    uan: '100060535254',
    accountNo: 'DLCPM0012345/0000605',
    nameOfMember: 'MANOJ PATEL',
    nameOfParents: 'RAMESH BHAI',
    dateOfLeaving: '2021-10-31',
    reasonOfLeaving: 'CESSATION (SHORT SERVICE)'
  },
  {
    id: 'res-4',
    uan: '100065601181',
    accountNo: 'DLCPM0012345/0000656',
    nameOfMember: 'SANJAY SINGH',
    nameOfParents: 'BALDEV SINGH',
    dateOfLeaving: '2021-10-31',
    reasonOfLeaving: 'CESSATION (SHORT SERVICE)'
  },
  {
    id: 'res-5',
    uan: '100074172012',
    accountNo: 'DLCPM0012345/0000741',
    nameOfMember: 'RAJESH MISHRA',
    nameOfParents: 'OM PRAKASH',
    dateOfLeaving: '2018-09-01',
    reasonOfLeaving: 'CESSATION (SHORT SERVICE)'
  },
  {
    id: 'res-6',
    uan: '100076131260',
    accountNo: 'DLCPM0012345/0000761',
    nameOfMember: 'VIKRAM DUBEY',
    nameOfParents: 'KAILASH DUBEY',
    dateOfLeaving: '2023-04-28',
    reasonOfLeaving: 'SUPERANNUATION'
  },
  {
    id: 'res-7',
    uan: '100076520002',
    accountNo: 'DLCPM0012345/0000765',
    nameOfMember: 'KIRAN MEHTA',
    nameOfParents: 'SURENDRA MEHTA',
    dateOfLeaving: '2023-03-08',
    reasonOfLeaving: 'SUPERANNUATION'
  },
  {
    id: 'res-8',
    uan: '100076905132',
    accountNo: 'DLCPM0012345/0000769',
    nameOfMember: 'DEEPAK GUPTA',
    nameOfParents: 'RAM GUPTA',
    dateOfLeaving: '2019-07-31',
    reasonOfLeaving: 'CESSATION (SHORT SERVICE)'
  },
  {
    id: 'res-9',
    uan: '100077688284',
    accountNo: 'DLCPM0012345/0000776',
    nameOfMember: 'ARVIND JOSHI',
    nameOfParents: 'DHARAM PAL',
    dateOfLeaving: '2025-09-05',
    reasonOfLeaving: 'SUPERANNUATION'
  },
  {
    id: 'res-10',
    uan: '100079616984',
    accountNo: 'DLCPM0012345/0000796',
    nameOfMember: 'SUNIL VERMA',
    nameOfParents: 'SHIV KUMAR',
    dateOfLeaving: '2024-06-30',
    reasonOfLeaving: 'CESSATION (SHORT SERVICE)'
  }
];

export const getResignations = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_RESIGNATIONS));
    return DEFAULT_RESIGNATIONS;
  }
  return JSON.parse(data);
};

export const saveResignation = (resignation) => {
  const list = getResignations();
  if (resignation.id) {
    // Edit mode
    const idx = list.findIndex(item => item.id === resignation.id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...resignation };
    }
  } else {
    // Add mode
    const newResignation = {
      ...resignation,
      id: `res-${Date.now()}`
    };
    list.unshift(newResignation);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return list;
};

export const deleteResignation = (id) => {
  const list = getResignations();
  const updated = list.filter(item => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};
