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
        const emiCalc = p * (r * Math.pow(1 + r, t)) / (Math.pow(1 + r, t) - 1);
        interest = (emiCalc * t) - p;
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
    if (e <= p * r) return ''; // EMI too small to cover interest
    const t = Math.log(e / (e - p * r)) / Math.log(1 + r);
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
        </div>

        <div className={styles.buttonGroupCentered}>
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
