export const API_ENDPOINTS = {
  USERS: {
    GET_ALL: '/users',
    REGISTER: '/users/register',
    UPDATE: (id) => `/users/${id}`,
    DELETE: (id) => `/users/${id}`,
    REFRESH: 'users/refresh',
    LOGIN: '/users/login' // Added for completeness, usually needed
  },
  ROLES: {
    GET_ALL: '/roles',
    CREATE: '/roles',
    UPDATE: (id) => `/roles/${id}`,
    DELETE: (id) => `/roles/${id}`
  },
  ATTENDANCE: {
    COMPANY: (companyId) => `attendance/company/${companyId}`,
    COMPANY_WITH_MONTH_YEAR: (companyId, month, year) => `attendance/company/${companyId}?month=${month}&year=${year}`,
    SIGN_IN: 'attendance/sign-in',
    SIGN_OUT: 'attendance/sign-out',
    CLOCK: 'attendance/clock',
    SUMMARY: (companyId, monthYear) => `attendance/summary/company/${companyId}?month_year=${monthYear}`,
  },
  LEAVES: {
    COMPANY: (companyId) => `leaves/company/${companyId}`,
    CREATE: 'leaves',
    APPROVE: (id) => `leaves/${id}/approve`,
    REJECT: (id) => `leaves/${id}/reject`,
  },
  EMPLOYEES: {
    COMPANY: (companyId) => `employees/company/${companyId}`,
    MISSING_DETAILS: (companyId, fieldsStr) => `employees/company/${companyId}/missing-details?fields=${encodeURIComponent(fieldsStr)}`,
    CREATE: 'employees',
    UPDATE: (id) => `employees/${id}`,
    DELETE: (id) => `employees/${id}`,
    UPDATE_ABRY: (id) => `employees/${id}`,
    FACE_ENROLL: 'employees/face/enroll',
    FACE_RECOGNIZE: 'employees/face/recognize',
  },
  ADDRESSES: {
    CREATE: 'addresses'
  },
  CONTRACTORS: {
    CREATE: 'contractors'
  },
  COMPANIES: {
    GET_ALL: 'companies',
    CREATE: 'companies',
    UPDATE: (id) => `companies/${id}`,
    DELETE: (id) => `companies/${id}`
  },
  CALENDERS: {
    COMPANY: (companyId) => `calenders/company/${companyId}`,
    CREATE: 'calenders',
    UPDATE: (id) => `calenders/${id}`,
    DELETE: (id) => `calenders/${id}`
  },
  NOTES: {
    COMPANY: (companyId) => `/notes/company/${companyId}`,
    CREATE: `/notes`,
    UPDATE: (id) => `/notes/${id}`,
    DELETE: (id) => `/notes/${id}`
  },
  REPORTS: {
    PACKING_SALARY: 'reports/packing-salary-sheet',
    OFFICE_SALARY: '/reports/office-salary-sheet',
    CONTRACTOR_SALARY: 'reports/contractor-salary-sheet',
  },
  EXPORT: {
    DYNAMIC: (moduleName, format) => `export/${moduleName}/${format}`
  },
  SETUP: {
    BIDI_ROLLER_WAGES: {
      COMPANY: (companyId) => `bidi-roller-wages/company/${companyId}`,
      CREATE: 'bidi-roller-wages',
      UPDATE: (id) => `bidi-roller-wages/${id}`,
      DELETE: (id) => `bidi-roller-wages/${id}`
    },
    CHALLAN: {
      COMPANY: (companyId) => `challan-setups/company/${companyId}`,
      CREATE: 'challan-setups',
      UPDATE: (id) => `challan-setups/${id}`,
      DELETE: (id) => `challan-setups/${id}`
    },
    LEAVE_MASTER: {
      COMPANY: (companyId) => `leave-masters/company/${companyId}`,
      CREATE: (companyId) => `leave-masters/company/${companyId}`,
      DELETE: (id) => `leave-masters/${id}`
    },
    OFFICE_STAFF_SALARY: {
      COMPANY: (companyId) => `office-staff-salaries/company/${companyId}`,
      CREATE: 'office-staff-salaries',
      UPDATE: (id) => `office-staff-salaries/${id}`,
      DELETE: (id) => `office-staff-salaries/${id}`
    },
    PACKING_WAGES: {
      COMPANY: (companyId) => `packing-wages/company/${companyId}`,
      CREATE: 'packing-wages',
      UPDATE: (id) => `packing-wages/${id}`,
      DELETE: (id) => `packing-wages/${id}`
    },
    PROFESSIONAL_TAX: {
      COMPANY: (companyId) => `professional-taxes/company/${companyId}`,
      CREATE: 'professional-taxes',
      UPDATE: (id) => `professional-taxes/${id}`,
      DELETE: (id) => `professional-taxes/${id}`
    }
  },
  UTILITY: {
    BACKUP: '/utility/backup',
    RESTORE_PREVIEW: '/utility/restore/preview',
    RESTORE_EXECUTE: '/utility/restore/execute',
    UAN_TO_IP: (companyId) => `/utility/uan-to-ip/${companyId}/bulk-update`,
    // Delete month entry is highly dynamic: `${endpoint}?company_id=${companyId}&month_year=${selectedMonth}`
    DELETE_MONTH_ENTRY: (endpoint, companyId, selectedMonth) => `${endpoint}?company_id=${companyId}&month_year=${selectedMonth}`
  }
};
