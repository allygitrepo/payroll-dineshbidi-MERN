const STORAGE_KEY = 'payroll_challan_setup';

const defaultChallanSetup = [
  {
    id: '1',
    startDate: '2018-04-01',
    endDate: '2021-03-31',
    salaryLimit: '15000.00',
    edliWages: '15000.00',
    accNo1EEMale: '12.00',
    accNo1EEFemale: '8.00',
    accNo1ER: '3.67',
    accNo2: '0.50',
    accNo10: '8.33',
    accNo21: '0.01',
    accNo22: '0.50',
    accNo2Min: '0.00',
    accNo22Min: '0.00',
    pmrpy: '0.00',
    esicWages: '21000.00',
    employeeShare: '0.75',
    employerShare: '3.25'
  },
  {
    id: '2',
    startDate: '2021-04-01',
    endDate: '2023-03-31',
    salaryLimit: '15000.00',
    edliWages: '15000.00',
    accNo1EEMale: '12.00',
    accNo1EEFemale: '8.00',
    accNo1ER: '3.67',
    accNo2: '0.50',
    accNo10: '8.33',
    accNo21: '0.01',
    accNo22: '0.50',
    accNo2Min: '0.00',
    accNo22Min: '0.00',
    pmrpy: '0.00',
    esicWages: '21000.00',
    employeeShare: '0.75',
    employerShare: '3.25'
  },
  {
    id: '3',
    startDate: '2023-04-01',
    endDate: '2025-03-31',
    salaryLimit: '15000.00',
    edliWages: '15000.00',
    accNo1EEMale: '12.00',
    accNo1EEFemale: '8.00',
    accNo1ER: '3.67',
    accNo2: '0.50',
    accNo10: '8.33',
    accNo21: '0.01',
    accNo22: '0.50',
    accNo2Min: '75.00',
    accNo22Min: '25.00',
    pmrpy: '0.00',
    esicWages: '21000.00',
    employeeShare: '0.75',
    employerShare: '3.25'
  }
];

export const getChallanSetup = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultChallanSetup));
    return defaultChallanSetup;
  }
  return JSON.parse(data);
};

export const saveChallanSetup = (challan) => {
  const list = getChallanSetup();
  if (challan.id) {
    // Update existing
    const index = list.findIndex(c => c.id === challan.id);
    if (index !== -1) {
      list[index] = challan;
    }
  } else {
    // Create new
    const nextId = String(list.length > 0 ? Math.max(...list.map(c => parseInt(c.id))) + 1 : 1);
    const newChallan = { ...challan, id: nextId };
    list.push(newChallan);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return list;
};

export const deleteChallanSetup = (id) => {
  const list = getChallanSetup();
  const filtered = list.filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return filtered;
};
