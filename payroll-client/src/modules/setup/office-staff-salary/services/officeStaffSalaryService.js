const STORAGE_KEY = 'payroll_office_staff_salary';

const defaultOfficeStaffSalaries = [
  {
    id: '1',
    startDate: '2017-04-01',
    endDate: '2019-04-30',
    employeeId: 'mock1',
    employeeName: 'PRASANTA GOSWAMI',
    salary: '4960.00',
    standardBonus: '8.33',
    additionalBonus: '5.56'
  },
  {
    id: '2',
    startDate: '2017-04-01',
    endDate: '2030-03-31',
    employeeId: 'mock2',
    employeeName: 'MAHESH CHANDRA AGARWAL',
    salary: '40000.00',
    standardBonus: '8.33',
    additionalBonus: '5.56'
  },
  {
    id: '3',
    startDate: '2017-04-01',
    endDate: '2019-04-30',
    employeeId: 'mock3',
    employeeName: 'DHARANI MAHATO',
    salary: '4270.00',
    standardBonus: '8.33',
    additionalBonus: '5.56'
  },
  {
    id: '4',
    startDate: '2017-04-01',
    endDate: '2019-04-30',
    employeeId: 'mock4',
    employeeName: 'MEGHNATH MAHATA',
    salary: '4270.00',
    standardBonus: '8.33',
    additionalBonus: '5.56'
  },
  {
    id: '5',
    startDate: '2017-04-01',
    endDate: '2019-04-30',
    employeeId: 'mock5',
    employeeName: 'SRIHARI KUMAR',
    salary: '4000.00',
    standardBonus: '8.33',
    additionalBonus: '5.56'
  },
  {
    id: '6',
    startDate: '2017-04-01',
    endDate: '2019-04-30',
    employeeId: 'mock6',
    employeeName: 'NABIN MAHATO',
    salary: '4000.00',
    standardBonus: '8.33',
    additionalBonus: '5.56'
  },
  {
    id: '7',
    startDate: '2017-04-01',
    endDate: '2019-04-30',
    employeeId: 'mock7',
    employeeName: 'SUSHIL KUMAR TEKRIWAL',
    salary: '5900.00',
    standardBonus: '8.33',
    additionalBonus: '5.56'
  },
  {
    id: '8',
    startDate: '2017-04-01',
    endDate: '2019-04-30',
    employeeId: 'mock8',
    employeeName: 'SANJAY MAHATO',
    salary: '3800.00',
    standardBonus: '8.33',
    additionalBonus: '5.56'
  },
  {
    id: '9',
    startDate: '2017-04-01',
    endDate: '2019-04-30',
    employeeId: 'mock9',
    employeeName: 'RAJU KUMAR',
    salary: '3800.00',
    standardBonus: '8.33',
    additionalBonus: '5.56'
  },
  {
    id: '10',
    startDate: '2017-04-01',
    endDate: '2030-03-31',
    employeeId: 'mock10',
    employeeName: 'GOHALI KUMAR',
    salary: '3800.00',
    standardBonus: '8.33',
    additionalBonus: '5.56'
  }
];

export const getOfficeStaffSalaries = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultOfficeStaffSalaries));
    return defaultOfficeStaffSalaries;
  }
  return JSON.parse(data);
};

export const saveOfficeStaffSalary = (salary) => {
  const list = getOfficeStaffSalaries();
  if (salary.id) {
    // Update existing
    const index = list.findIndex(s => s.id === salary.id);
    if (index !== -1) {
      list[index] = salary;
    }
  } else {
    // Create new
    const nextId = String(list.length > 0 ? Math.max(...list.map(s => parseInt(s.id))) + 1 : 1);
    const newSalary = { ...salary, id: nextId };
    list.push(newSalary);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return list;
};

export const deleteOfficeStaffSalary = (id) => {
  const list = getOfficeStaffSalaries();
  const filtered = list.filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return filtered;
};
