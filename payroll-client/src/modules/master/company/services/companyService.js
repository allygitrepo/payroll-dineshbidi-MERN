const STORAGE_KEY = 'payroll_companies';

const defaultCompanies = [
  {
    id: '1',
    estbId: 'WBDGP0034083000',
    estbName: 'BRIJBASHI TRADERS',
    estbType: 'PROPRIETORSHIP',
    epfoOffice: 'DURGAPUR',
    linNo: '1312299607',
    esicId: '',
    address: 'BANDHA GHAT',
    postOffice: 'JHALDA',
    district: 'PURULIA',
    pincode: '723202',
    pan: 'ACTPA5069Q',
    tan: 'CALB01234F',
    ptax: 'WB0987654',
    email: 'info@brijbashitraders.com',
    phone: '9876543210',
    website: 'www.brijbashitraders.com'
  }
];

export const getCompanies = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultCompanies));
    return defaultCompanies;
  }
  return JSON.parse(data);
};

export const saveCompany = (company) => {
  const companies = getCompanies();
  if (company.id) {
    // Update
    const index = companies.findIndex(c => c.id === company.id);
    if (index !== -1) {
      companies[index] = company;
    }
  } else {
    // Create new
    const nextId = String(companies.length > 0 ? Math.max(...companies.map(c => parseInt(c.id))) + 1 : 1);
    const newCompany = { ...company, id: nextId };
    companies.push(newCompany);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(companies));
  return companies;
};

export const deleteCompany = (id) => {
  const companies = getCompanies();
  const filtered = companies.filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return filtered;
};
