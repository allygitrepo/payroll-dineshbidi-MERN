import React, { useState, useEffect } from 'react';
import styles from './ChallanSetupPage.module.css';
import { useToast, DatePicker } from '../../../../shared/components';

const numericFields = [
  'salaryLimit', 'edliWages', 'accNo1EEMale', 'accNo1EEFemale',
  'accNo1ER', 'accNo2', 'accNo10', 'accNo21', 'accNo22',
  'accNo2Min', 'accNo22Min', 'pmrpy', 'esicWages',
  'employeeShare', 'employerShare'
];

const defaultForm = {
  id: '',
  startDate: '',
  endDate: '',
  salaryLimit: '',
  edliWages: '',
  accNo1EEMale: '',
  accNo1EEFemale: '',
  accNo1ER: '',
  accNo2: '',
  accNo10: '',
  accNo21: '',
  accNo22: '',
  accNo2Min: '',
  accNo22Min: '',
  pmrpy: '',
  esicWages: '',
  employeeShare: '',
  employerShare: ''
};

const ChallanSetupForm = ({ challan, onSave, onCancel }) => {
  const addToast = useToast();
  const [formData, setFormData] = useState(defaultForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setErrors({});
    if (challan) {
      setFormData(challan);
    } else {
      setFormData(defaultForm);
    }
  }, [challan]);

  const validateField = (name, value) => {
    if (name === 'startDate') return !value ? 'Start Date is required!' : '';
    if (name === 'endDate') return !value ? 'End Date is required!' : '';
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;

    if (numericFields.includes(name)) {
      let cleaned = value.replace(/[^0-9.]/g, '');
      const parts = cleaned.split('.');
      if (parts.length > 2) cleaned = parts[0] + '.' + parts.slice(1).join('');
      if (parts[1]) cleaned = parts[0] + '.' + parts[1].slice(0, 2);
      finalValue = cleaned;
    }

    setFormData(prev => ({ ...prev, [name]: finalValue }));
    const error = validateField(name, finalValue);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const tempErrors = {};
    ['startDate', 'endDate'].forEach(key => {
      const error = validateField(key, formData[key] || '');
      if (error) tempErrors[key] = error;
    });

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      addToast({ type: 'error', message: 'Please correct the errors in the form.' });
      return;
    }

    const formattedData = { ...formData };
    numericFields.forEach(field => {
      formattedData[field] = formData[field] ? Number(formData[field]).toFixed(2) : '0.00';
    });

    onSave(formattedData);
  };

  const renderField = (label, name, required = false, placeholder = '') => {
    const isDate = name === 'startDate' || name === 'endDate';
    return (
      <div className={styles.field}>
        <label className={styles.label}>
          {label} {required && <span className={styles.required}>*</span>}
        </label>
        {isDate ? (
          <DatePicker
            name={name}
            value={formData[name]}
            onChange={handleChange}
          />
        ) : (
          <input
            type="text"
            name={name}
            value={formData[name]}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder || `Enter ${label}`}
            className={styles.input}
          />
        )}
        {errors[name] && <span className={styles.errorText}>{errors[name]}</span>}
      </div>
    );
  };

  return (
    <div className={styles.formCard} style={{ marginBottom: '24px' }}>
      <form onSubmit={handleSubmit} noValidate>
        {/* Row 1: Dates */}
        <div className={styles.formGrid}>
          {renderField('Start Date', 'startDate', true)}
          {renderField('End Date', 'endDate', true)}
          {renderField('Salary Limit', 'salaryLimit', false, 'e.g. 15000.00')}
          {renderField('EDLI Wages', 'edliWages', false, 'e.g. 15000.00')}
        </div>

        {/* Row 2: Account fields */}
        <div className={styles.formGrid} style={{ marginTop: '20px' }}>
          {renderField('A/c No.1 EE (Male)', 'accNo1EEMale', false, 'e.g. 12.00')}
          {renderField('A/c No.1 EE (Female)', 'accNo1EEFemale', false, 'e.g. 8.00')}
          {renderField('A/c No.1 ER', 'accNo1ER', false, 'e.g. 3.67')}
          {renderField('A/c No.2', 'accNo2', false, 'e.g. 0.50')}
        </div>

        {/* Row 3: More account fields */}
        <div className={styles.formGrid} style={{ marginTop: '20px' }}>
          {renderField('A/c No.10', 'accNo10', false, 'e.g. 8.33')}
          {renderField('A/c No.21', 'accNo21', false, 'e.g. 0.01')}
          {renderField('A/c No.22', 'accNo22', false, 'e.g. 0.50')}
          {renderField('A/c No.2 Min', 'accNo2Min', false, 'e.g. 0.00')}
        </div>

        {/* Row 4: Remaining fields */}
        <div className={styles.formGrid} style={{ marginTop: '20px' }}>
          {renderField('A/c No.22 Min', 'accNo22Min', false, 'e.g. 0.00')}
          {renderField('PMRPY', 'pmrpy', false, 'e.g. 0.00')}
          {renderField('ESIC Wages', 'esicWages', false, 'e.g. 21000.00')}
          {renderField('Employee Share (%)', 'employeeShare', false, 'e.g. 0.75')}
        </div>

        {/* Row 5: Employer share */}
        <div className={styles.formGrid} style={{ marginTop: '20px' }}>
          {renderField('Employer Share', 'employerShare', false, 'e.g. 3.25')}
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

export default ChallanSetupForm;
