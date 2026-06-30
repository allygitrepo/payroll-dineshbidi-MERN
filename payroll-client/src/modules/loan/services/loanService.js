import apiClient from '../../../shared/services/apiClient';

const mapToFrontend = (l) => ({
  id: l.id,
  employeeId: l.employee_id,
  companyId: l.company_id,
  totalAmount: parseFloat(l.total_amount),
  remainingAmount: parseFloat(l.remaining_amount),
  emiAmount: parseFloat(l.emi_amount),
  emiType: l.emi_type,
  tenureMonths: l.tenure_months,
  interestRate: parseFloat(l.interest_rate),
  interestType: l.interest_type,
  deductionType: l.deduction_type,
  status: l.status,
  startDate: l.start_date,
  lastDeductionDate: l.last_deduction_date,
  createdAt: l.created_at || l.createdAt
});

const mapTxToFrontend = (t) => ({
  id: t.id,
  loanId: t.loan_id,
  employeeId: t.employee_id,
  amount: parseFloat(t.amount),
  transactionDate: t.transaction_date || t.transactionDate,
  type: t.type,
  paymentSource: t.payment_source,
  description: t.description
});

export const getLoansByEmployee = async (employeeId) => {
  if (!employeeId) return [];
  const response = await apiClient.get(`loans/employee/${employeeId}`);
  if ((response.data?.status || response.data?.success) && response.data?.data) {
    return response.data.data.map(mapToFrontend);
  }
  return [];
};

export const createLoan = async (loanData) => {
  const payload = {
    employee_id: loanData.employeeId,
    total_amount: parseFloat(loanData.totalAmount),
    emi_amount: loanData.emiAmount ? parseFloat(loanData.emiAmount) : null,
    emi_type: loanData.emiType || 'Fixed',
    tenure_months: loanData.tenureMonths ? parseInt(loanData.tenureMonths) : null,
    interest_rate: loanData.interestRate ? parseFloat(loanData.interestRate) : 0,
    interest_type: loanData.interestType || 'Flat',
    deduction_type: loanData.deductionType || 'Monthly',
    start_date: loanData.startDate
  };
  const response = await apiClient.post('loans/create', payload);
  return response.data;
};

export const updateLoan = async (id, updateData) => {
  const payload = {};
  if (updateData.status) payload.status = updateData.status;
  if (updateData.emiAmount) payload.emi_amount = parseFloat(updateData.emiAmount);
  
  const response = await apiClient.put(`loans/override/${id}`, payload);
  return response.data;
};

export const recordRepayment = async (id, repaymentData) => {
  const payload = {
    amount: parseFloat(repaymentData.amount),
    payment_source: repaymentData.paymentSource || 'Cash',
    description: repaymentData.description || ''
  };
  const response = await apiClient.post(`loans/repayment/${id}`, payload);
  return response.data;
};

export const getLoanTransactions = async (loanId) => {
  if (!loanId) return [];
  const response = await apiClient.get(`loans/transactions/${loanId}`);
  if ((response.data?.status || response.data?.success) && response.data?.data) {
    return response.data.data.map(mapTxToFrontend);
  }
  return [];
};

export const getLoanSummary = async (companyId) => {
  if (!companyId) return null;
  const response = await apiClient.get(`loans/summary?company_id=${companyId}`);
  if ((response.data?.status || response.data?.success) && response.data?.data) {
    return response.data.data;
  }
  return null;
};
