const STORAGE_KEY = 'payroll_esic_challans';

export const getEsicChallans = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    return [];
  }
  return JSON.parse(data);
};

export const saveEsicChallan = (challan) => {
  const list = getEsicChallans();
  const index = list.findIndex(c => c.wageMonth === challan.wageMonth);
  if (index !== -1) {
    list[index] = { ...list[index], ...challan };
  } else {
    const nextId = String(list.length > 0 ? Math.max(...list.map(c => parseInt(c.id || 0))) + 1 : 1);
    list.push({ ...challan, id: nextId });
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return list;
};
