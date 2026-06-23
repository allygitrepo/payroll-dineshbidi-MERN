import React, { useState, useEffect } from 'react';
import styles from './BidiRollerWagesPage.module.css';
import { useToast } from '../../../../shared/components';

const BidiRollerWagesForm = ({ wages, onSave, onCancel }) => {
  const addToast = useToast();

  const [formData, setFormData] = useState({
    id: '',
    startDate: '',
    endDate: '',
    rate1: '',
    hra1: '',
    bonus1: '',
    rate2: '',
    hra2: '',
    bonus2: ''
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
        rate1: '',
        hra1: '',
        bonus1: '',
        rate2: '',
        hra2: '',
        bonus2: ''
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
    if (name === 'bonus1' || name === 'bonus2') {
      return !value || !value.trim() ? 'Bonus is required!' : '';
    }
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;

    if (['rate1', 'hra1', 'bonus1', 'rate2', 'hra2', 'bonus2'].includes(name)) {
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
    const keysToValidate = ['startDate', 'endDate', 'bonus1', 'bonus2'];

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

    // Format optional rate values to '0.00' if they are empty
    const formattedData = {
      ...formData,
      rate1: formData.rate1 ? Number(formData.rate1).toFixed(2) : '0.00',
      hra1: formData.hra1 ? Number(formData.hra1).toFixed(2) : '0.00',
      bonus1: formData.bonus1 ? Number(formData.bonus1).toFixed(2) : '0.00',
      rate2: formData.rate2 ? Number(formData.rate2).toFixed(2) : '0.00',
      hra2: formData.hra2 ? Number(formData.hra2).toFixed(2) : '0.00',
      bonus2: formData.bonus2 ? Number(formData.bonus2).toFixed(2) : '0.00'
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
          {/* Rate 1 */}
          <div className={styles.field}>
            <label className={styles.label}>Rate 1</label>
            <input
              type="text"
              name="rate1"
              value={formData.rate1}
              onChange={handleChange}
              placeholder="ENTER RATE1"
              className={styles.input}
            />
          </div>

          {/* HRA 1 */}
          <div className={styles.field}>
            <label className={styles.label}>HRA 1</label>
            <input
              type="text"
              name="hra1"
              value={formData.hra1}
              onChange={handleChange}
              placeholder="ENTER HRA1"
              className={styles.input}
            />
          </div>

          {/* Bonus 1 */}
          <div className={styles.field}>
            <label className={styles.label}>
              Bonus 1 <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="bonus1"
              value={formData.bonus1}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="ENTER BONUS1"
              className={styles.input}
            />
            {errors.bonus1 && <span className={styles.errorText}>{errors.bonus1}</span>}
          </div>
        </div>

        <div className={styles.formGrid} style={{ marginTop: '20px' }}>
          {/* Rate 2 */}
          <div className={styles.field}>
            <label className={styles.label}>Rate 2</label>
            <input
              type="text"
              name="rate2"
              value={formData.rate2}
              onChange={handleChange}
              placeholder="ENTER RATE2"
              className={styles.input}
            />
          </div>

          {/* HRA 2 */}
          <div className={styles.field}>
            <label className={styles.label}>HRA 2</label>
            <input
              type="text"
              name="hra2"
              value={formData.hra2}
              onChange={handleChange}
              placeholder="ENTER HRA2"
              className={styles.input}
            />
          </div>

          {/* Bonus 2 */}
          <div className={styles.field}>
            <label className={styles.label}>
              Bonus 2 <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="bonus2"
              value={formData.bonus2}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="ENTER BONUS2"
              className={styles.input}
            />
            {errors.bonus2 && <span className={styles.errorText}>{errors.bonus2}</span>}
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

export default BidiRollerWagesForm;
