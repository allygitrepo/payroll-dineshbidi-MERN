import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Coins, 
  Pause, 
  Play, 
  CheckCircle, 
  AlertCircle, 
  Calendar, 
  DollarSign, 
  User, 
  CreditCard, 
  ChevronDown, 
  ChevronUp, 
  X,
  TrendingDown
} from 'lucide-react';
import styles from '../components/LoanPage.module.css';
import LoanForm from '../components/LoanForm';
import LoanTable from '../components/LoanTable';
import { 
  getLoansByEmployee, 
  createLoan, 
  updateLoan, 
  recordRepayment, 
  getLoanSummary 
} from '../services/loanService';
import { getEmployees } from '../../master/employee/services/employeeService';
import { useToast } from '../../../shared/components';

const LoanPage = () => {
  const addToast = useToast();
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loans, setLoans] = useState([]);
  const [summary, setSummary] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loadingLoans, setLoadingLoans] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Expanded loan transactions view
  const [expandedLoanId, setExpandedLoanId] = useState(null);

  // Manual payment modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLoan, setPaymentLoan] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentSource, setPaymentSource] = useState('Cash');
  const [paymentDesc, setPaymentDesc] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Load initial employees and summary stats
  useEffect(() => {
    const fetchInitialData = async () => {
      const companyId = localStorage.getItem('selectedCompany');
      if (!companyId) {
        addToast({ type: 'warning', message: 'No company selected! Please select a company.' });
        return;
      }
      try {
        setLoadingEmployees(true);
        const [empData, summaryData] = await Promise.all([
          getEmployees(companyId),
          getLoanSummary(companyId)
        ]);
        setEmployees(empData);
        setSummary(summaryData);
      } catch (err) {
        console.error('Error fetching initial data:', err);
        addToast({ type: 'error', message: 'Failed to load initial employees or statistics.' });
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetchInitialData();
  }, [addToast]);

  // Load loans for selected worker
  const fetchEmployeeLoans = async (empId) => {
    try {
      setLoadingLoans(true);
      const data = await getLoansByEmployee(empId);
      setLoans(data);
    } catch (err) {
      console.error('Error loading employee loans:', err);
      addToast({ type: 'error', message: 'Failed to retrieve employee loan history.' });
    } finally {
      setLoadingLoans(false);
    }
  };

  const handleSelectEmployee = (emp) => {
    setSelectedEmployee(emp);
    setShowCreateForm(false);
    setExpandedLoanId(null);
    fetchEmployeeLoans(emp.id);
  };

  // Filter employees
  const filteredEmployees = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return employees.filter(emp => 
      emp.memberName.toLowerCase().includes(term) || 
      (emp.memberId && emp.memberId.toLowerCase().includes(term)) ||
      (emp.uan && emp.uan.includes(term))
    );
  }, [employees, searchTerm]);

  // Refresh summary statistics
  const refreshSummary = async () => {
    const companyId = localStorage.getItem('selectedCompany');
    if (companyId) {
      try {
        const summaryData = await getLoanSummary(companyId);
        setSummary(summaryData);
      } catch (e) {
        console.error('Error refreshing summary', e);
      }
    }
  };

  // Save/Create Loan
  const handleSaveLoan = async (loanData) => {
    try {
      const result = await createLoan(loanData);
      if (result.success || result.status) {
        addToast({ 
          type: result.warning ? 'warning' : 'success', 
          message: result.warning ? `Loan created with warning: ${result.warning}` : 'Loan account created successfully!' 
        });
        setShowCreateForm(false);
        if (selectedEmployee) {
          fetchEmployeeLoans(selectedEmployee.id);
        }
        refreshSummary();
      }
    } catch (err) {
      console.error('Error creating loan:', err);
      addToast({ 
        type: 'error', 
        message: err.response?.data?.messageToShow || 'Failed to create loan account.' 
      });
    }
  };

  // Toggle status Pause / Resume
  const handleToggleStatus = async (loan) => {
    const newStatus = loan.status === 'Active' ? 'Paused' : 'Active';
    try {
      await updateLoan(loan.id, { status: newStatus });
      addToast({ type: 'success', message: `Loan is now ${newStatus === 'Active' ? 'Activated' : 'Paused'}.` });
      if (selectedEmployee) {
        fetchEmployeeLoans(selectedEmployee.id);
      }
      refreshSummary();
    } catch (err) {
      console.error('Error toggling loan status:', err);
      addToast({ type: 'error', message: 'Failed to update loan status.' });
    }
  };

  // Force close / Write-off
  const handleForceClose = async (loan) => {
    try {
      await updateLoan(loan.id, { status: 'Manual_Closed' });
      addToast({ type: 'success', message: 'Loan settled and closed manually.' });
      if (selectedEmployee) {
        fetchEmployeeLoans(selectedEmployee.id);
      }
      refreshSummary();
    } catch (err) {
      console.error('Error closing loan:', err);
      addToast({ type: 'error', message: 'Failed to settle loan.' });
    }
  };

  // Open manual repayment modal
  const openPaymentModal = (loan) => {
    setPaymentLoan(loan);
    setPaymentAmount('');
    setPaymentSource('Cash');
    setPaymentDesc('');
    setShowPaymentModal(true);
  };

  // Submit manual payment
  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!paymentAmount || isNaN(paymentAmount) || parseFloat(paymentAmount) <= 0) {
      addToast({ type: 'error', message: 'Please enter a valid repayment amount.' });
      return;
    }
    if (parseFloat(paymentAmount) > paymentLoan.remainingAmount) {
      addToast({ type: 'error', message: 'Repayment amount cannot exceed remaining balance.' });
      return;
    }

    try {
      setSubmittingPayment(true);
      await recordRepayment(paymentLoan.id, {
        amount: paymentAmount,
        paymentSource,
        description: paymentDesc
      });
      addToast({ type: 'success', message: 'Repayment recorded successfully!' });
      setShowPaymentModal(false);
      if (selectedEmployee) {
        fetchEmployeeLoans(selectedEmployee.id);
      }
      refreshSummary();
    } catch (err) {
      console.error('Error recording payment:', err);
      addToast({ type: 'error', message: 'Failed to record repayment.' });
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Calculated employee totals
  const employeeTotals = useMemo(() => {
    if (loans.length === 0) return { totalLoaned: 0, pending: 0, paid: 0 };
    const totalLoaned = loans.reduce((acc, curr) => acc + parseFloat(curr.totalAmount), 0);
    const pending = loans.reduce((acc, curr) => acc + parseFloat(curr.remainingAmount), 0);
    return {
      totalLoaned,
      pending,
      paid: totalLoaned - pending
    };
  }, [loans]);

  return (
    <div className={styles.container}>
      {/* Left Sidebar: Worker Search */}
      <div className={styles.leftSidebar}>
        <div className={styles.sidebarTitle}>Worker Database</div>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search worker name/UAN..."
            className={styles.searchInput}
          />
        </div>
        <div className={styles.employeeList}>
          {loadingEmployees ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
              Loading workers...
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
              No workers found.
            </div>
          ) : (
            filteredEmployees.map((emp) => (
              <div
                key={emp.id}
                onClick={() => handleSelectEmployee(emp)}
                className={`${styles.employeeItem} ${selectedEmployee?.id === emp.id ? styles.employeeItemActive : ''}`}
              >
                <div className={styles.empName}>{emp.memberName}</div>
                <div className={styles.empCode}>UAN: {emp.uan || 'N/A'} • IP: {emp.ipNumber || 'N/A'}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Content */}
      <div className={styles.rightContent}>
        {/* Statistics Banner */}
        {summary && (
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIconWrapper} style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                <Coins size={22} />
              </div>
              <div className={styles.statDetails}>
                <span className={styles.statLabel}>TOTAL LOANED AMOUNT</span>
                <span className={styles.statValue}>₹{summary.total_loaned.toFixed(2)}</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIconWrapper} style={{ backgroundColor: '#ffe5c7', color: 'var(--accent)' }}>
                <TrendingDown size={22} />
              </div>
              <div className={styles.statDetails}>
                <span className={styles.statLabel}>OUTSTANDING RECEIVABLE</span>
                <span className={styles.statValue}>₹{summary.total_pending.toFixed(2)}</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIconWrapper} style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
                <User size={22} />
              </div>
              <div className={styles.statDetails}>
                <span className={styles.statLabel}>ACTIVE ACCOUNTS</span>
                <span className={styles.statValue}>{summary.active_count} Users</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Details Panel */}
        {selectedEmployee ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className={styles.mainHeader}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <h2 className={styles.mainTitle}>{selectedEmployee.memberName} (UPAD Profile)</h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Total Loaned: ₹{employeeTotals.totalLoaned.toFixed(2)} • Outstanding: ₹{employeeTotals.pending.toFixed(2)} • Repaid: ₹{employeeTotals.paid.toFixed(2)}
                </span>
              </div>
              {!showCreateForm && (
                <button onClick={() => setShowCreateForm(true)} className={styles.addBtn}>
                  <Plus size={16} />
                  Issue New Loan
                </button>
              )}
            </div>

            {/* Create Loan form panel */}
            {showCreateForm ? (
              <LoanForm
                employee={selectedEmployee}
                onSave={handleSaveLoan}
                onCancel={() => setShowCreateForm(false)}
              />
            ) : (
              <div className={styles.loansContainer}>
                {loadingLoans ? (
                  <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'var(--card-bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    Loading loan records...
                  </div>
                ) : loans.length === 0 ? (
                  <div className={styles.noSelection}>
                    <Coins size={36} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                    <p style={{ fontWeight: '600' }}>No Loan profile records registered.</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Click "Issue New Loan" above to configure a repayment ledger.
                    </p>
                  </div>
                ) : (
                  loans.map((loan) => {
                    const percent = loan.totalAmount > 0 
                      ? Math.round(((loan.totalAmount - loan.remainingAmount) / loan.totalAmount) * 100)
                      : 0;

                    const isExpanded = expandedLoanId === loan.id;

                    let statusClass = styles.badgeActive;
                    if (loan.status === 'PAUSED') statusClass = styles.badgePaused;
                    if (loan.status === 'COMPLETED') statusClass = styles.badgeCompleted;
                    if (loan.status === 'MANUAL_CLOSED') statusClass = styles.badgeClosed;

                    return (
                      <div key={loan.id} className={styles.loanCard}>
                        {/* Title details */}
                        <div className={styles.loanHeader}>
                          <div className={styles.loanSummaryInfo}>
                            <div className={styles.loanName}>₹{loan.totalAmount.toFixed(2)} Loan Account</div>
                            <div className={styles.loanSubText}>
                              Issued: {new Date(loan.startDate).toLocaleDateString('en-IN')} • Tenure: {loan.tenureMonths || 'N/A'} Months
                            </div>
                          </div>
                          <span className={`${styles.statusBadge} ${statusClass}`}>
                            {loan.status}
                          </span>
                        </div>

                        {/* Details grid */}
                        <div className={styles.loanDetailsGrid}>
                          <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>EMI AMOUNT</span>
                            <span className={styles.detailValue}>₹{loan.emiAmount.toFixed(2)} ({loan.deductionType})</span>
                          </div>
                          <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>INTEREST STYLE</span>
                            <span className={styles.detailValue}>{loan.interestRate}% ({loan.interestType})</span>
                          </div>
                          <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>OUTSTANDING</span>
                            <span className={styles.detailValue} style={{ color: loan.remainingAmount > 0 ? 'var(--danger)' : 'var(--primary)' }}>
                              ₹{loan.remainingAmount.toFixed(2)}
                            </span>
                          </div>
                          <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>LAST TRANSACTION</span>
                            <span className={styles.detailValue}>
                              {loan.lastDeductionDate ? new Date(loan.lastDeductionDate).toLocaleDateString('en-IN') : 'None'}
                            </span>
                          </div>
                        </div>

                        {/* Progress */}
                        <div className={styles.progressSection}>
                          <div className={styles.progressLabelWrapper}>
                            <span>Repayment Progress</span>
                            <span>{percent}% Paid</span>
                          </div>
                          <div className={styles.progressBarContainer}>
                            <div className={styles.progressBar} style={{ width: `${percent}%` }} />
                          </div>
                        </div>

                        {/* Actions */}
                        <div className={styles.loanActions}>
                          <button
                            onClick={() => setExpandedLoanId(isExpanded ? null : loan.id)}
                            className={styles.actionBtn}
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            {isExpanded ? 'Hide History' : 'View Transactions'}
                          </button>
                          
                          {loan.status !== 'COMPLETED' && loan.status !== 'MANUAL_CLOSED' && (
                            <>
                              <button
                                onClick={() => handleToggleStatus(loan)}
                                className={`${styles.actionBtn} ${styles.toggleBtn}`}
                              >
                                {loan.status === 'Active' ? <Pause size={14} /> : <Play size={14} />}
                                {loan.status === 'Active' ? 'Pause Auto' : 'Resume Auto'}
                              </button>
                              <button
                                onClick={() => openPaymentModal(loan)}
                                className={`${styles.actionBtn} ${styles.payBtn}`}
                              >
                                <CreditCard size={14} />
                                Record Pay
                              </button>
                              <button
                                onClick={() => handleForceClose(loan)}
                                className={styles.actionBtn}
                                style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                              >
                                <AlertCircle size={14} />
                                Settle/Close
                              </button>
                            </>
                          )}
                        </div>

                        {/* History expansion */}
                        {isExpanded && <LoanTable loanId={loan.id} />}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        ) : (
          <div className={styles.noSelection} style={{ margin: 'auto 0' }}>
            <User size={48} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Select Employee</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Choose a worker from the sidebar list to view their outstanding loan ledger.
            </p>
          </div>
        )}
      </div>

      {/* Manual Payment Modal */}
      {showPaymentModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className={styles.modalTitle}>Record Manual Payment</div>
              <button 
                onClick={() => setShowPaymentModal(false)} 
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitPayment} className={styles.modalForm}>
              <div className={styles.field}>
                <label className={styles.label}>Outstanding Balance</label>
                <input
                  type="text"
                  disabled
                  value={`₹${paymentLoan?.remainingAmount.toFixed(2)}`}
                  className={styles.input}
                  style={{ backgroundColor: 'var(--bg-secondary)', fontWeight: 'bold' }}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Repayment Amount (₹)</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  max={paymentLoan?.remainingAmount}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Payment Mode</label>
                <select
                  value={paymentSource}
                  onChange={(e) => setPaymentSource(e.target.value)}
                  className={styles.select}
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank">Bank Transfer</option>
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Remarks / Description</label>
                <input
                  type="text"
                  value={paymentDesc}
                  onChange={(e) => setPaymentDesc(e.target.value)}
                  placeholder="e.g. Paid in hand at office"
                  className={styles.input}
                />
              </div>

              <div className={styles.buttonGroupCentered} style={{ marginTop: '12px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowPaymentModal(false)} 
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submittingPayment} 
                  className={styles.saveBtn}
                >
                  {submittingPayment ? 'Recording...' : 'Submit Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanPage;
