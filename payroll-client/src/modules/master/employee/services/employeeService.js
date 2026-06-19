const STORAGE_KEY = 'payroll_employees';

const defaultEmployees = [
  {
    id: '1',
    abryApplicable: false,
    uan: '100188684022',
    ipNumber: '7431081694',
    memberId: '17291',
    memberName: 'KANDAN KUMAR',
    dob: '1977-01-29',
    dateOfJoining: '2025-06-01',
    aadhaarCard: '123456789012',
    gender: 'MALE',
    fatherHusbandName: 'BIBHUTI KUMAR',
    relation: 'FATHER',
    maritalStatus: 'MARRIED',
    mobile: '9876543210',
    qualification: 'MATRIC',
    employeeType: 'OFFICE STAFF',
    contractor: 'SELF',
    address: 'BANDHA GHAT',
    postOffice: 'JHALDA',
    district: 'PURULIA',
    pincode: '723202',
    nationality: 'INDIAN',
    email: 'kandan@example.com',
    isInternationalWorker: 'NO',
    physicalHandicap: 'NO',
    pmrpy: 'NO',
    kycDetails: [
      {
        id: 'k1',
        documentType: 'AADHAAR',
        documentNumber: '123456789012',
        nameAsPerDocument: 'KANDAN KUMAR',
        ifsc: 'SBIN0001234',
        kycImage: 'aadhaar_kandan.jpg'
      }
    ],
    nomineeDetails: [
      {
        id: 'n1',
        name: 'SITA KUMARI',
        address: 'BANDHA GHAT',
        postOffice: 'JHALDA',
        district: 'PURULIA',
        pincode: '723202',
        aadhaarNumber: '987654321098',
        relation: 'WIFE',
        dob: '1982-05-15',
        sharePercentage: '100',
        guardianName: '',
        guardianAddress: ''
      }
    ],
    familyDetails: [
      {
        id: 'f1',
        relation: 'SON',
        name: 'RAHUL KUMAR',
        dob: '2005-08-20',
        aadhaarNumber: '112233445566'
      }
    ]
  },
  {
    id: '2',
    abryApplicable: false,
    uan: '102008788327',
    ipNumber: '7431095828',
    memberId: '16764',
    memberName: 'SADHANA MAHATO',
    dob: '1992-04-14',
    dateOfJoining: '2023-10-01',
    aadhaarCard: '987654321012',
    gender: 'FEMALE',
    fatherHusbandName: 'AMRIT MAHATO',
    relation: 'FATHER',
    maritalStatus: 'MARRIED',
    mobile: '9876543211',
    qualification: 'GRADUATE',
    employeeType: 'PACKING STAFF',
    contractor: 'SELF',
    address: 'DURGAPUR INDUSTRIAL AREA',
    postOffice: 'DURGAPUR HQ',
    district: 'PASCHIM BARDHAMAN',
    pincode: '713216',
    nationality: 'INDIAN',
    email: 'sadhana@example.com',
    isInternationalWorker: 'NO',
    physicalHandicap: 'NO',
    pmrpy: 'NO',
    kycDetails: [],
    nomineeDetails: [],
    familyDetails: []
  }
];

export const getEmployees = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultEmployees));
    return defaultEmployees;
  }
  return JSON.parse(data);
};

export const saveEmployee = (employee) => {
  const employees = getEmployees();
  if (employee.id) {
    const index = employees.findIndex(e => e.id === employee.id);
    if (index !== -1) {
      employees[index] = employee;
    }
  } else {
    const nextId = String(employees.length > 0 ? Math.max(...employees.map(e => parseInt(e.id))) + 1 : 1);
    const newEmployee = { ...employee, id: nextId };
    employees.push(newEmployee);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
  return employees;
};

export const deleteEmployee = (id) => {
  const employees = getEmployees();
  const filtered = employees.filter(e => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return filtered;
};
