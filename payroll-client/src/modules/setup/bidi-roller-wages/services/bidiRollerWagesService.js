const STORAGE_KEY = 'payroll_bidi_roller_wages';

const defaultBidiRollerWages = [
  {
    id: '1',
    startDate: '2018-02-01',
    endDate: '2021-11-30',
    rate1: '85.00',
    rate2: '125.00',
    rate3: '110.00',
    rate4: '18.00',
    bonus: '8.33'
  },
  {
    id: '2',
    startDate: '2016-04-01',
    endDate: '2018-01-31',
    rate1: '75.00',
    rate2: '115.00',
    rate3: '0.00',
    rate4: '0.00',
    bonus: '8.33'
  },
  {
    id: '3',
    startDate: '2021-12-01',
    endDate: '2023-03-31',
    rate1: '95.00',
    rate2: '145.00',
    rate3: '125.00',
    rate4: '25.00',
    bonus: '8.33'
  },
  {
    id: '4',
    startDate: '2023-04-01',
    endDate: '2025-03-31',
    rate1: '105.00',
    rate2: '155.00',
    rate3: '135.00',
    rate4: '220.00',
    bonus: '8.33'
  },
  {
    id: '5',
    startDate: '2025-04-01',
    endDate: '2027-03-31',
    rate1: '115.00',
    rate2: '175.00',
    rate3: '155.00',
    rate4: '240.00',
    bonus: '8.33'
  }
];

export const getBidiRollerWages = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultBidiRollerWages));
    return defaultBidiRollerWages;
  }
  return JSON.parse(data);
};

export const saveBidiRollerWages = (wages) => {
  const list = getBidiRollerWages();
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

export const deleteBidiRollerWages = (id) => {
  const list = getBidiRollerWages();
  const filtered = list.filter(w => w.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return filtered;
};
