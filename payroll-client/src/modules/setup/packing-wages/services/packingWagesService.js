const STORAGE_KEY = 'payroll_packing_wages';

const defaultPackingWages = [
  {
    id: '1',
    startDate: '2018-02-01',
    endDate: '2021-11-30',
    rate1: '72.00',
    rate2: '110.00',
    rate3: '95.00',
    rate4: '12.00',
    bonus: '8.33'
  },
  {
    id: '2',
    startDate: '2016-04-01',
    endDate: '2018-01-31',
    rate1: '65.00',
    rate2: '115.00',
    rate3: '0.00',
    rate4: '0.00',
    bonus: '8.33'
  },
  {
    id: '3',
    startDate: '2021-12-01',
    endDate: '2023-03-31',
    rate1: '90.00',
    rate2: '135.00',
    rate3: '115.00',
    rate4: '15.00',
    bonus: '8.33'
  },
  {
    id: '4',
    startDate: '2023-04-01',
    endDate: '2025-03-31',
    rate1: '99.00',
    rate2: '149.00',
    rate3: '127.00',
    rate4: '214.00',
    bonus: '8.33'
  },
  {
    id: '5',
    startDate: '2025-04-01',
    endDate: '2027-03-31',
    rate1: '109.00',
    rate2: '165.00',
    rate3: '149.00',
    rate4: '235.00',
    bonus: '8.33'
  }
];

export const getPackingWages = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPackingWages));
    return defaultPackingWages;
  }
  return JSON.parse(data);
};

export const savePackingWages = (wages) => {
  const list = getPackingWages();
  if (wages.id) {
    // Update existing
    const index = list.findIndex(w => w.id === wages.id);
    if (index !== -1) {
      list[index] = wages;
    }
  } else {
    // Create new
    const nextId = String(list.length > 0 ? Math.max(...list.map(w => parseInt(w.id))) + 1 : 1);
    const newWages = { ...wages, id: nextId };
    list.push(newWages);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return list;
};

export const deletePackingWages = (id) => {
  const list = getPackingWages();
  const filtered = list.filter(w => w.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return filtered;
};
