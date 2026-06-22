const STORAGE_KEY = 'payroll_professional_tax';

const defaultProfessionalTax = [
  {
    id: '1',
    startDate: '2017-04-01',
    endDate: '2027-03-31',
    from: '0.00',
    to: '10000.00',
    taxRate: '0.00'
  },
  {
    id: '2',
    startDate: '2017-04-01',
    endDate: '2027-03-31',
    from: '10001.00',
    to: '15000.00',
    taxRate: '110.00'
  },
  {
    id: '3',
    startDate: '2017-04-01',
    endDate: '2027-03-31',
    from: '15001.00',
    to: '25000.00',
    taxRate: '130.00'
  },
  {
    id: '4',
    startDate: '2017-04-01',
    endDate: '2027-03-31',
    from: '25001.00',
    to: '40000.00',
    taxRate: '150.00'
  },
  {
    id: '5',
    startDate: '2017-04-01',
    endDate: '2027-03-31',
    from: '40001.00',
    to: '999999.00',
    taxRate: '200.00'
  }
];

export const getProfessionalTax = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultProfessionalTax));
    return defaultProfessionalTax;
  }
  return JSON.parse(data);
};

export const saveProfessionalTax = (tax) => {
  const list = getProfessionalTax();
  if (tax.id) {
    // Update existing
    const index = list.findIndex(t => t.id === tax.id);
    if (index !== -1) {
      list[index] = tax;
    }
  } else {
    // Create new
    const nextId = String(list.length > 0 ? Math.max(...list.map(t => parseInt(t.id))) + 1 : 1);
    const newTax = { ...tax, id: nextId };
    list.push(newTax);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return list;
};

export const deleteProfessionalTax = (id) => {
  const list = getProfessionalTax();
  const filtered = list.filter(t => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return filtered;
};
