import apiClient from '../../../../shared/services/apiClient';

// Helper to map backend to frontend
const mapToFrontend = (data) => {
  return {
    id: data.id,
    trrn: data.ttrn,
    crnNo: data.crn_no,
    wageMonth: data.wage_month,
    dueDate: data.due_date,
    challanDate: data.challan_date,
    ac1EE: data.ac1ee,
    ac1ER: data.ac1er,
    ac2: data.ac2,
    ac10: data.ac10,
    ac21: data.ac21,
    ac22: data.ac22,
    totalAmount: data.total_amount,
    returnDate: data.return_date,
  };
};

// Helper to map frontend to backend
const mapToBackend = (data) => {
  const company_id = localStorage.getItem('selectedCompany') || localStorage.getItem('company_id');
  return {
    id: data.id || undefined,
    ttrn: data.trrn || null,
    crn_no: data.crnNo || null,
    wage_month: data.wageMonth,
    due_date: data.dueDate || null,
    challan_date: data.challanDate || null,
    ac1ee: Number(data.ac1EE) || 0,
    ac1er: Number(data.ac1ER) || 0,
    ac2: Number(data.ac2) || 0,
    ac10: Number(data.ac10) || 0,
    ac21: Number(data.ac21) || 0,
    ac22: Number(data.ac22) || 0,
    total_amount: Number(data.totalAmount) || 0,
    return_date: data.returnDate || null,
    company_id: company_id || null
  };
};

export const getEpfChallans = async () => {
  try {
    const response = await apiClient.get('/challan-date-entries');
    const data = response.data?.data || []; 
    return data.map(mapToFrontend);
  } catch (error) {
    console.error('Error fetching EPF challans:', error);
    throw error;
  }
};

export const saveEpfChallan = async (challanData) => {
  try {
    const payload = mapToBackend(challanData);
    const response = await apiClient.post('/challan-date-entries', payload);
    return mapToFrontend(response.data?.data || {}); 
  } catch (error) {
    console.error('Error saving EPF challan:', error);
    throw error;
  }
};

export const saveBulkEpfChallans = async (challansDataArray) => {
  try {
    const payload = challansDataArray.map(mapToBackend);
    const response = await apiClient.post('/challan-date-entries/bulk', { data: payload });
    return response.data;
  } catch (error) {
    console.error('Error saving bulk EPF challans:', error);
    throw error;
  }
};

export const deleteEpfChallan = async (id) => {
  try {
    const response = await apiClient.delete(`/challan-date-entries/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting EPF challan:', error);
    throw error;
  }
};
