import React, { useState, useEffect } from 'react';
import styles from './LoanPage.module.css';
import { useToast, DatePicker } from '../../../shared/components';

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
    setFormData((prev) => ({ ...prev, [name]: value }));
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
