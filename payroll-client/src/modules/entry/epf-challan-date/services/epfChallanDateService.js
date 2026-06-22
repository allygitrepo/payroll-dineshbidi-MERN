const STORAGE_KEY = 'payroll_epf_challans';

const defaultEpfChallans = [
  {
    id: '1',
    trrn: '4741806005355',
    crnNo: '002150618996301',
    wageMonth: '05/2018',
    dueDate: '2018-06-15',
    challanDate: '2016-06-15',
    ac1EE: '143930',
    ac1ER: '16536',
    ac2: '9355',
    ac10: '70169',
    ac21: '7071',
    ac22: '0',
    totalAmount: '247061',
    returnDate: '2018-06-14'
  },
  {
    id: '2',
    trrn: '4741807002125',
    crnNo: '002070718437261',
    wageMonth: '05/2018',
    dueDate: '2018-07-15',
    challanDate: '2018-07-07',
    ac1EE: '139521',
    ac1ER: '16752',
    ac2: '9069',
    ac10: '71246',
    ac21: '6822',
    ac22: '0',
    totalAmount: '243410',
    returnDate: '2018-07-07'
  },
  {
    id: '3',
    trrn: '4741805002367',
    crnNo: '002100518974575',
    wageMonth: '04/2018',
    dueDate: '2018-05-15',
    challanDate: '2018-05-09',
    ac1EE: '136310',
    ac1ER: '24805',
    ac2: '8860',
    ac10: '68038',
    ac21: '6694',
    ac22: '0',
    totalAmount: '244707',
    returnDate: '2018-05-09'
  },
  {
    id: '4',
    trrn: '4741808001305',
    crnNo: '002040818686720',
    wageMonth: '07/2018',
    dueDate: '2018-08-15',
    challanDate: '2018-08-04',
    ac1EE: '114641',
    ac1ER: '13677',
    ac2: '7452',
    ac10: '55873',
    ac21: '5616',
    ac22: '0',
    totalAmount: '197259',
    returnDate: '2018-08-04'
  },
  {
    id: '5',
    trrn: '4741809002577',
    crnNo: '002080918087261',
    wageMonth: '08/2018',
    dueDate: '2018-09-15',
    challanDate: '2018-09-08',
    ac1EE: '83099',
    ac1ER: '10580',
    ac2: '5401',
    ac10: '40377',
    ac21: '4030',
    ac22: '0',
    totalAmount: '143487',
    returnDate: '2018-09-08'
  },
  {
    id: '6',
    trrn: '4741810001745',
    crnNo: '002061018820039',
    wageMonth: '09/2018',
    dueDate: '2018-10-15',
    challanDate: '2018-10-06',
    ac1EE: '132900',
    ac1ER: '15438',
    ac2: '8639',
    ac10: '64679',
    ac21: '6520',
    ac22: '0',
    totalAmount: '228176',
    returnDate: '2018-10-06'
  },
  {
    id: '7',
    trrn: '4741811002105',
    crnNo: '002081118652718',
    wageMonth: '10/2018',
    dueDate: '2018-11-15',
    challanDate: '2018-11-08',
    ac1EE: '88823',
    ac1ER: '12574',
    ac2: '5773',
    ac10: '50349',
    ac21: '4319',
    ac22: '0',
    totalAmount: '161838',
    returnDate: '2018-11-08'
  }
];

export const getEpfChallans = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultEpfChallans));
    return defaultEpfChallans;
  }
  return JSON.parse(data);
};

export const saveEpfChallan = (challan) => {
  const list = getEpfChallans();
  if (challan.id) {
    const index = list.findIndex(c => c.id === challan.id);
    if (index !== -1) {
      list[index] = challan;
    }
  } else {
    const nextId = String(list.length > 0 ? Math.max(...list.map(c => parseInt(c.id))) + 1 : 1);
    const newChallan = { ...challan, id: nextId };
    list.push(newChallan);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return list;
};

export const deleteEpfChallan = (id) => {
  const list = getEpfChallans();
  const filtered = list.filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return filtered;
};
