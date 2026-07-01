import React, { useState, useEffect } from 'react';
import styles from './LoanPage.module.css';
import { useToast, DatePicker } from '../../../shared/components';

const calculateEMI = (principal, rate, tenure, type) => {
  if (!principal || isNaN(principal) || parseFloat(principal) <= 0) return '';
  if (!tenure || isNaN(tenure) || parseInt(tenure) <= 0) return '';
  
  const p = parseFloat(principal);
  const rVal = parseFloat(rate || 0);
  const t = parseInt(tenure);
  
  let interest = 0;
  if (rVal > 0) {
    if (type === 'Flat') {
      interest = p * (rVal / 100);
    } else if (type === 'Reducing') {
      const r = (rVal / 12) / 100;
      if (r > 0) {
        interest = (p * r * (t + 1)) / 2;
      }
    }
  }
  
  const emi = (p + interest) / t;
  return emi.toFixed(2);
};

const calculateTenure = (principal, rate, emiAmount, type) => {
  if (!principal || isNaN(principal) || parseFloat(principal) <= 0) return '';
  if (!emiAmount || isNaN(emiAmount) || parseFloat(emiAmount) <= 0) return '';
  
  const p = parseFloat(principal);
  const rVal = parseFloat(rate || 0);
  const e = parseFloat(emiAmount);
  
  if (rVal === 0) {
    return Math.ceil(p / e).toString();
  }
  
  if (type === 'Flat') {
    const totalWithInterest = p + (p * (rVal / 100));
    return Math.ceil(totalWithInterest / e).toString();
  } else if (type === 'Reducing') {
      const r = (rVal / 12) / 100;
      if (r === 0) return Math.ceil(p / e).toString();
      const divisor = e - (p * r) / 2;
      if (divisor <= 0) return '';
      const t = (p * (1 + r / 2)) / divisor;
      return Math.ceil(t).toString();
  }
  return '';
};

const LoanForm = ({ employee, onSave, onCancel }) => {
  const addToast = useToast();
  const [formData, setFormData] = useState({
    totalAmount: '',
    emiAmount: '',
    emiType: 'Fixed',
    tenureMonths: '',
    interestRate: '0.00',
    interestType: 'Flat',
    deductionType: 'Monthly',
    startDate: new Date().toISOString().substring(0, 10)
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      
      // Calculate EMI if user changes Tenure, Principal or Interest
      if (name === 'tenureMonths' || name === 'totalAmount' || name === 'interestRate' || name === 'interestType') {
        if (newData.totalAmount && newData.tenureMonths) {
          newData.emiAmount = calculateEMI(newData.totalAmount, newData.interestRate, newData.tenureMonths, newData.interestType);
        } else if (name === 'tenureMonths' && !value) {
          newData.emiAmount = '';
        }
      }
      
      // Calculate Tenure if user changes EMI Amount
      if (name === 'emiAmount') {
        if (newData.totalAmount && value) {
          newData.tenureMonths = calculateTenure(newData.totalAmount, newData.interestRate, value, newData.interestType);
        } else if (!value) {
          newData.tenureMonths = '';
        }
      }
      
      return newData;
    });

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const tempErrors = {};
    if (!formData.totalAmount || isNaN(formData.totalAmount) || parseFloat(formData.totalAmount) <= 0) {
      tempErrors.totalAmount = 'Total Loan Amount is required and must be positive.';
    }
    
    // Validate that either EMI Amount or Tenure Months is provided
    if (!formData.emiAmount && !formData.tenureMonths) {
      tempErrors.emiAmount = 'Please provide either EMI Amount or Tenure in Months.';
      tempErrors.tenureMonths = 'Please provide either EMI Amount or Tenure in Months.';
    }

    if (formData.emiAmount && (isNaN(formData.emiAmount) || parseFloat(formData.emiAmount) <= 0)) {
      tempErrors.emiAmount = 'EMI must be a positive number.';
    }

    if (formData.tenureMonths && (isNaN(formData.tenureMonths) || parseInt(formData.tenureMonths) <= 0)) {
      tempErrors.tenureMonths = 'Tenure must be a positive integer.';
    }

    if (formData.interestRate && (isNaN(formData.interestRate) || parseFloat(formData.interestRate) < 0 || parseFloat(formData.interestRate) > 100)) {
      tempErrors.interestRate = 'Interest rate must be between 0 and 100.';
    }

    if (!formData.startDate) {
      tempErrors.startDate = 'Loan Start Date is required.';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      addToast({ type: 'error', message: 'Please correct the errors in the form.' });
      return;
    }

    const payload = {
      ...formData,
      employeeId: employee.id
    };

    onSave(payload);
  };

  const totalPayable = formData.emiAmount && formData.tenureMonths
    ? (parseFloat(formData.emiAmount) * parseInt(formData.tenureMonths)).toFixed(2)
    : '-';

  const generateSchedule = () => {
    if (!formData.totalAmount || !formData.tenureMonths || !formData.emiAmount || !formData.startDate) return null;
    const p = parseFloat(formData.totalAmount);
    const t = parseInt(formData.tenureMonths);
    const e = parseFloat(formData.emiAmount);
    const rVal = parseFloat(formData.interestRate || 0);
    const type = formData.interestType;
    
    if (isNaN(p) || isNaN(t) || isNaN(e) || p <= 0 || t <= 0 || e <= 0) return null;
    
    const schedule = [];
    let balance = p;
    let startDate = new Date(formData.startDate);

    if (type === 'Flat' || rVal === 0) {
      const totalInterest = (e * t) - p;
      const monthlyInterest = totalInterest / t;
      const monthlyPrincipal = p / t;
      
      for (let i = 1; i <= t; i++) {
        balance -= monthlyPrincipal;
        if (balance < 0.01) balance = 0;
        
        const dateStr = new Date(startDate.getFullYear(), startDate.getMonth() + (i - 1), startDate.getDate()).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
        
        schedule.push({
          month: i,
          date: dateStr,
          emi: e.toFixed(2),
          principal: monthlyPrincipal.toFixed(2),
          interest: monthlyInterest.toFixed(2),
          balance: balance.toFixed(2)
        });
      }
    } else if (type === 'Reducing') {
      const r = (rVal / 12) / 100;
      const monthlyPrincipal = p / t;
      for (let i = 1; i <= t; i++) {
        let interest = balance * r;
        let currentEmi = monthlyPrincipal + interest;
        
        balance -= monthlyPrincipal;
        if (balance < 0.01) balance = 0;
        
        const dateStr = new Date(startDate.getFullYear(), startDate.getMonth() + (i - 1), startDate.getDate()).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
        schedule.push({
          month: i,
          date: dateStr,
          emi: currentEmi.toFixed(2),
          principal: monthlyPrincipal.toFixed(2),
          interest: interest.toFixed(2),
          balance: balance.toFixed(2)
        });
      }
    }
    
    // Calculate Totals
    const totalEmiSum = schedule.reduce((sum, row) => sum + parseFloat(row.emi), 0).toFixed(2);
    const totalPrincipalSum = schedule.reduce((sum, row) => sum + parseFloat(row.principal), 0).toFixed(2);
    const totalInterestSum = schedule.reduce((sum, row) => sum + parseFloat(row.interest), 0).toFixed(2);
    
    return { schedule, totalEmiSum, totalPrincipalSum, totalInterestSum };
  };

  const scheduleDataResult = generateSchedule();
  const scheduleData = scheduleDataResult?.schedule || [];
  const totals = scheduleDataResult;

  return (
    <div className={styles.formCard}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Issue Loan to {employee.name}</h3>
      </div>
      <form onSubmit={handleSubmit} noValidate>
        <div className={styles.formGrid}>
          {/* Loan Amount */}
          <div className={styles.field}>
            <label className={styles.label}>
              Total Loan Amount (₹) <span className={styles.required}>*</span>
            </label>
            <input
              type="number"
              name="totalAmount"
              value={formData.totalAmount}
              onChange={handleChange}
              placeholder="Enter loan amount"
              className={styles.input}
            />
            {errors.totalAmount && <span className={styles.errorText}>{errors.totalAmount}</span>}
          </div>

          {/* EMI Type */}
          <div className={styles.field}>
            <label className={styles.label}>EMI Type</label>
            <select
              name="emiType"
              value={formData.emiType}
              onChange={handleChange}
              className={styles.select}
            >
              <option value="Fixed">Fixed (Auto-EMI)</option>
              <option value="Flexible">Flexible</option>
            </select>
          </div>

          {/* Tenure */}
          <div className={styles.field}>
            <label className={styles.label}>Tenure (Months)</label>
            <input
              type="number"
              name="tenureMonths"
              value={formData.tenureMonths}
              onChange={handleChange}
              placeholder="Enter tenure in months"
              className={styles.input}
            />
            {errors.tenureMonths && <span className={styles.errorText}>{errors.tenureMonths}</span>}
          </div>

          {/* EMI Amount */}
          <div className={styles.field}>
            <label className={styles.label}>EMI Amount (₹)</label>
            <input
              type="number"
              name="emiAmount"
              value={formData.emiAmount}
              onChange={handleChange}
              placeholder="EMI per period (optional)"
              className={styles.input}
            />
            {errors.emiAmount && <span className={styles.errorText}>{errors.emiAmount}</span>}
          </div>

          {/* Interest Rate */}
          <div className={styles.field}>
            <label className={styles.label}>Interest Rate (%)</label>
            <input
              type="number"
              name="interestRate"
              value={formData.interestRate}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              className={styles.input}
            />
            {errors.interestRate && <span className={styles.errorText}>{errors.interestRate}</span>}
          </div>

          {/* Interest Type */}
          <div className={styles.field}>
            <label className={styles.label}>Interest Calculation Type</label>
            <select
              name="interestType"
              value={formData.interestType}
              onChange={handleChange}
              className={styles.select}
            >
              <option value="Flat">Flat Rate</option>
              <option value="Reducing">Reducing Balance</option>
            </select>
          </div>

          {/* EMI Amount is now grouped above */}

          {/* Start Date */}
          <div className={styles.field}>
            <label className={styles.label}>
              Start Date <span className={styles.required}>*</span>
            </label>
            <DatePicker
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
            />
            {errors.startDate && <span className={styles.errorText}>{errors.startDate}</span>}
          </div>

          {/* Total Payable */}
          <div className={styles.field}>
            <label className={styles.label}>Total Payable Amount (₹)</label>
            <div 
              className={styles.input} 
              style={{ backgroundColor: 'var(--bg-secondary)', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center' }}
            >
              {totalPayable !== '-' ? `₹ ${totalPayable}` : '-'}
            </div>
          </div>
        </div>

        {scheduleData && scheduleData.length > 0 && (
          <div style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              Amortization Schedule (Repayment Plan)
            </h4>
            <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead style={{ backgroundColor: 'var(--bg-secondary)', position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr>
                    <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontWeight: 600 }}>Month</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontWeight: 600 }}>EMI (₹)</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontWeight: 600 }}>Principal (₹)</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontWeight: 600 }}>Interest (₹)</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontWeight: 600 }}>Balance (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduleData.map((row) => (
                    <tr key={row.month} style={{ borderBottom: '1px solid var(--border)', backgroundColor: '#fff' }}>
                      <td style={{ padding: '10px 12px' }}>{row.date}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 500 }}>{row.emi}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--primary)' }}>{row.principal}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#f59e0b' }}>{row.interest}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>{row.balance}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot style={{ backgroundColor: 'var(--bg-secondary)', fontWeight: 700, position: 'sticky', bottom: 0, borderTop: '2px solid var(--border)' }}>
                  <tr>
                    <td style={{ padding: '10px 12px' }}>Total</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>{totals.totalEmiSum}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--primary)' }}>{totals.totalPrincipalSum}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: '#f59e0b' }}>{totals.totalInterestSum}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>0.00</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        <div className={styles.buttonGroupCentered} style={{ marginTop: '24px' }}>
          <button type="button" onClick={onCancel} className={styles.cancelBtn}>
            Cancel
          </button>
          <button type="submit" className={styles.saveBtn}>
            Save & Active
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoanForm;
