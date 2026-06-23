const STORAGE_KEY = 'payroll_users';

const ALL_PERMISSION_SLUGS = [
  'dashboard',
  'company', 'employee', 'kyc-update', 'contractor', 'address',
  'packing-wages', 'bidi-roller-wages', 'professional-tax', 'office-staff-salary', 'challan-setup',
  'office-attendance', 'packing-attendance', 'bidi-roller-attendance',
  'office-staff', 'packers', 'bidi-roller', 'epf-challan-date', 'resignation',
  'salary-sheet', 'form-2', 'ecr-report', 'esic-report', 'pmrpy-report', 'pf-challan-yearly', 'epf-challan', 'pf-summary', 'payment-advice', 'bonus-sheet', 'gratuity-calculation', 'report-pt',
  'calender', 'user-management', 'employee-data-import', 'employee-data-export', 'kyc-export', 'attendance-printing', 'missing-information', 'delete-month-entry', 'backup', 'restore',
  '3-month-absent-list', '58-years-of-age', 'notes',
  'excel-to-text'
];

const getFullPermissions = () => {
  const perm = {};
  ALL_PERMISSION_SLUGS.forEach(slug => {
    perm[slug] = true;
  });
  return perm;
};

const getOperatorPermissions = () => {
  const perm = {};
  ALL_PERMISSION_SLUGS.forEach(slug => {
    // operators don't have access to user-management by default, but have other basic features
    perm[slug] = slug !== 'user-management';
  });
  return perm;
};

const DEFAULT_USERS = [
  {
    id: 'usr-1',
    userName: 'DINESH AGRAWAL',
    userId: 'dca',
    password: 'dca',
    designation: 'OWNER',
    permissions: getFullPermissions()
  },
  {
    id: 'usr-2',
    userName: 'Mahesh Agrawal',
    userId: 'mca',
    password: 'mca',
    designation: 'DATA ENTRY OPERATOR',
    permissions: getOperatorPermissions()
  },
  {
    id: 'usr-3',
    userName: 'prasant',
    userId: 'pg',
    password: 'pg',
    designation: 'DATA ENTRY OPERATOR',
    permissions: getOperatorPermissions()
  },
  {
    id: 'usr-4',
    userName: 'pranab',
    userId: 'pranab',
    password: 'pranab',
    designation: 'DATA ENTRY OPERATOR',
    permissions: getOperatorPermissions()
  },
  {
    id: 'usr-5',
    userName: 'Vishal Akbari',
    userId: 'va',
    password: 'va',
    designation: 'OWNER',
    permissions: getFullPermissions()
  }
];

export const getUsers = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  }
  return JSON.parse(data);
};

export const saveUser = (user) => {
  const list = getUsers();
  if (user.id) {
    // Edit mode
    const idx = list.findIndex(item => item.id === user.id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...user };
    }
  } else {
    // Add mode
    const newUser = {
      ...user,
      id: `usr-${Date.now()}`
    };
    list.unshift(newUser);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return list;
};

export const deleteUser = (id) => {
  const list = getUsers();
  const updated = list.filter(item => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};
