import React, { useState, useEffect } from 'react';
import styles from './ProfessionalTaxPage.module.css';
import { useToast } from '../../../../shared/components';

const ProfessionalTaxForm = ({ wages, onSave, onCancel }) => {
  const addToast = useToast();

  const [formData, setFormData] = useState({
    id: '',
    startDate: '',
    endDate: '',
    from: '',
    to: '',
    taxRate: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    setErrors({});
    if (wages) {
      setFormData(wages);
    } else {
      setFormData({
        id: '',
        startDate: '',
        endDate: '',
        from: '',
        to: '',
        taxRate: ''
      });
    }
  }, [wages]);

  const validateField = (name, value) => {
    if (name === 'startDate') {
      return !value ? 'Start Date is required!' : '';
    }
    if (name === 'endDate') {
      return !value ? 'End Date is required!' : '';
    }
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;

    if (['from', 'to', 'taxRate'].includes(name)) {
      // Allow only numbers and a single decimal point
      let cleaned = value.replace(/[^0-9.]/g, '');
      const parts = cleaned.split('.');
      if (parts.length > 2) {
        cleaned = parts[0] + '.' + parts.slice(1).join('');
      }
      if (parts[1]) {
        cleaned = parts[0] + '.' + parts[1].slice(0, 2);
      }
      finalValue = cleaned;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: finalValue
    }));

    const error = validateField(name, finalValue);
    setErrors((prev) => ({
      ...prev,
      [name]: error
    }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors((prev) => ({
      ...prev,
      [name]: error
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const tempErrors = {};
    const keysToValidate = ['startDate', 'endDate'];

    keysToValidate.forEach((key) => {
      const error = validateField(key, formData[key] || '');
      if (error) {
        tempErrors[key] = error;
      }
    });

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      addToast({ type: 'error', message: 'Please correct the errors in the form.' });
      return;
    }

    // Format decimal values to '0.00' if they are empty
    const formattedData = {
      ...formData,
      from: formData.from ? Number(formData.from).toFixed(2) : '0.00',
      to: formData.to ? Number(formData.to).toFixed(2) : '0.00',
      taxRate: formData.taxRate ? Number(formData.taxRate).toFixed(2) : '0.00'
    };

    onSave(formattedData);
  };

  return (
    <div className={styles.formCard} style={{ marginBottom: '24px' }}>
      <form onSubmit={handleSubmit} noValidate>
        <div className={styles.formGrid}>
          {/* Start Date */}
          <div className={styles.field}>
            <label className={styles.label}>
              Start Date <span className={styles.required}>*</span>
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              onBlur={handleBlur}
              className={styles.input}
            />
            {errors.startDate && <span className={styles.errorText}>{errors.startDate}</span>}
          </div>

          {/* End Date */}
          <div className={styles.field}>
            <label className={styles.label}>
              End Date <span className={styles.required}>*</span>
            </label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              onBlur={handleBlur}
              className={styles.input}
            />
            {errors.endDate && <span className={styles.errorText}>{errors.endDate}</span>}
          </div>
        </div>

        <div className={styles.formGrid} style={{ marginTop: '20px' }}>
          {/* From */}
          <div className={styles.field}>
            <label className={styles.label}>From</label>
            <input
              type="text"
              name="from"
              value={formData.from}
              onChange={handleChange}
              placeholder="ENTER FROM"
              className={styles.input}
            />
          </div>

          {/* To */}
          <div className={styles.field}>
            <label className={styles.label}>To</label>
            <input
              type="text"
              name="to"
              value={formData.to}
              onChange={handleChange}
              placeholder="ENTER TO"
              className={styles.input}
            />
          </div>

          {/* Tax Rate */}
          <div className={styles.field}>
            <label className={styles.label}>Tax Rate</label>
            <input
              type="text"
              name="taxRate"
              value={formData.taxRate}
              onChange={handleChange}
              placeholder="ENTER TAX RATE"
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <button type="button" onClick={onCancel} className={styles.cancelBtn}>
            Cancel
          </button>
          <button type="submit" className={styles.saveBtn}>
            Save
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfessionalTaxForm;
