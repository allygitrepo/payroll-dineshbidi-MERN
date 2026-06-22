const STORAGE_KEY = 'payroll_addresses';

const defaultAddresses = [
  {
    id: '1',
    address: 'BANDHA GHAT',
    postOffice: 'JHALDA',
    district: 'PURULIA',
    pincode: '723202'
  },
  {
    id: '2',
    address: 'NAMO PARA',
    postOffice: 'JHALDA',
    district: 'PURULIA',
    pincode: '723202'
  },
  {
    id: '3',
    address: 'CHEKYA',
    postOffice: 'CHEKYA',
    district: 'PURULIA',
    pincode: '723202'
  },
  {
    id: '4',
    address: 'DURGU',
    postOffice: 'CHEKYA',
    district: 'PURULIA',
    pincode: '723202'
  },
  {
    id: '5',
    address: 'HET KAHAN',
    postOffice: 'UPER KAHAN',
    district: 'PURULIA',
    pincode: '723202'
  },
  {
    id: '6',
    address: 'PATJHALDA',
    postOffice: 'PATJHALDA',
    district: 'PURULIA',
    pincode: '723202'
  },
  {
    id: '7',
    address: 'GOURA NAGAR COLONY',
    postOffice: 'VRINDABAN',
    district: 'MATHURA',
    pincode: '261121'
  }
];

export const getAddresses = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultAddresses));
    return defaultAddresses;
  }
  return JSON.parse(data);
};

export const saveAddress = (address) => {
  const addresses = getAddresses();
  if (address.id) {
    const index = addresses.findIndex(a => a.id === address.id);
    if (index !== -1) {
      addresses[index] = address;
    }
  } else {
    const nextId = String(addresses.length > 0 ? Math.max(...addresses.map(a => parseInt(a.id))) + 1 : 1);
    const newAddress = { ...address, id: nextId };
    addresses.push(newAddress);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses));
  return addresses;
};

export const deleteAddress = (id) => {
  const addresses = getAddresses();
  const filtered = addresses.filter(a => a.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return filtered;
};
