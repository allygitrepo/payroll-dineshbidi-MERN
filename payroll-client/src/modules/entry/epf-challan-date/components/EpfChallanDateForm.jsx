import React, { useState, useEffect } from 'react';
import styles from './EpfChallanDatePage.module.css';
import { useToast } from '../../../../shared/components';

const EpfChallanDateForm = ({ challan, onSave, onCancel }) => {
  const addToast = useToast();

  const [formData, setFormData] = useState({
    id: '',
    trrn: '',
    crnNo: '',
    wageMonth: '',
    dueDate: '',
    challanDate: '',
    ac1EE: '0',
    ac1ER: '0',
    ac2: '0',
    ac10: '0',
    ac21: '0',
    ac22: '0',
    totalAmount: '0',
    returnDate: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    setErrors({});
    if (challan) {
      setFormData(challan);
    } else {
      setFormData({
        id: '',
        trrn: '',
        crnNo: '',
        wageMonth: '',
        dueDate: '',
        challanDate: '',
        ac1EE: '0',
        ac1ER: '0',
        ac2: '0',
        ac10: '0',
        ac21: '0',
        ac22: '0',
        totalAmount: '0',
        returnDate: ''
      });
    }
  }, [challan]);

  // Recalculate total amount when AC fields change
  useEffect(() => {
    const ac1EEVal = parseFloat(formData.ac1EE) || 0;
    const ac1ERVal = parseFloat(formData.ac1ER) || 0;
    const ac2Val = parseFloat(formData.ac2) || 0;
    const ac10Val = parseFloat(formData.ac10) || 0;
    const ac21Val = parseFloat(formData.ac21) || 0;
    const ac22Val = parseFloat(formData.ac22) || 0;

    const sum = ac1EEVal + ac1ERVal + ac2Val + ac10Val + ac21Val + ac22Val;
    setFormData((prev) => ({
      ...prev,
      totalAmount: String(Math.round(sum))
    }));
  }, [
    formData.ac1EE,
    formData.ac1ER,
    formData.ac2,
    formData.ac10,
    formData.ac21,
    formData.ac22
  ]);

  const validateField = (name, value) => {
    if (name === 'wageMonth') {
      if (!value || !value.trim()) return 'Wage Month is required!';
      const monthRegex = /^(0[1-9]|1[0-2])\/\d{4}$/;
      if (!monthRegex.test(value)) return 'Wage Month must be in MM/YYYY format!';
      return '';
    }
    if (name === 'challanDate') {
      return !value ? 'EPF Challan Date is required!' : '';
    }
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;

    // Keystroke restrictions for numeric inputs
    if ([
      'trrn',
      'crnNo',
      'ac1EE',
      'ac1ER',
      'ac2',
      'ac10',
      'ac21',
      'ac22'
    ].includes(name)) {
      finalValue = value.replace(/[^0-9]/g, '');
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
    const keysToValidate = ['wageMonth', 'challanDate'];

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

    onSave(formData);
  };

  return (
    <div className={styles.formCard} style={{ marginBottom: '24px' }}>
      <form onSubmit={handleSubmit} noValidate>
        <div className={styles.formGrid}>
          {/* TRRN */}
          <div className={styles.field}>
            <label className={styles.label}>TRRN</label>
            <input
              type="text"
              name="trrn"
              value={formData.trrn}
              onChange={handleChange}
              placeholder="TRRN"
              className={styles.input}
            />
          </div>

          {/* CRN NO. */}
          <div className={styles.field}>
            <label className={styles.label}>CRN NO.</label>
            <input
              type="text"
              name="crnNo"
              value={formData.crnNo}
              onChange={handleChange}
              placeholder="CRN NO."
              className={styles.input}
            />
          </div>

          {/* Wage Month */}
          <div className={styles.field}>
            <label className={styles.label}>
              Wage Month <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="wageMonth"
              value={formData.wageMonth}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="MM/YYYY"
              className={styles.input}
            />
            {errors.wageMonth && <span className={styles.errorText}>{errors.wageMonth}</span>}
          </div>

          {/* Due Date */}
          <div className={styles.field}>
            <label className={styles.label}>Due Date</label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className={styles.input}
            />
          </div>

          {/* EPF Challan Date */}
          <div className={styles.field}>
            <label className={styles.label}>
              EPF Challan Date <span className={styles.required}>*</span>
            </label>
            <input
              type="date"
              name="challanDate"
              value={formData.challanDate}
              onChange={handleChange}
              onBlur={handleBlur}
              className={styles.input}
            />
            {errors.challanDate && <span className={styles.errorText}>{errors.challanDate}</span>}
          </div>

          {/* A/C 1 (EE) */}
          <div className={styles.field}>
            <label className={styles.label}>A/C 1 (EE)</label>
            <input
              type="text"
              name="ac1EE"
              value={formData.ac1EE}
              onChange={handleChange}
              placeholder="ENTER A/C 1"
              className={styles.input}
            />
          </div>

          {/* A/C 1 (ER) */}
          <div className={styles.field}>
            <label className={styles.label}>A/C 1 (ER)</label>
            <input
              type="text"
              name="ac1ER"
              value={formData.ac1ER}
              onChange={handleChange}
              placeholder="ENTER A/C 1"
              className={styles.input}
            />
          </div>

          {/* A/C 2 */}
          <div className={styles.field}>
            <label className={styles.label}>A/C 2</label>
            <input
              type="text"
              name="ac2"
              value={formData.ac2}
              onChange={handleChange}
              placeholder="ENTER A/C 2"
              className={styles.input}
            />
          </div>

          {/* A/C 10 */}
          <div className={styles.field}>
            <label className={styles.label}>A/C 10</label>
            <input
              type="text"
              name="ac10"
              value={formData.ac10}
              onChange={handleChange}
              placeholder="ENTER A/C 10"
              className={styles.input}
            />
          </div>

          {/* A/C 21 */}
          <div className={styles.field}>
            <label className={styles.label}>A/C 21</label>
            <input
              type="text"
              name="ac21"
              value={formData.ac21}
              onChange={handleChange}
              placeholder="ENTER A/C 21"
              className={styles.input}
            />
          </div>

          {/* A/C 22 */}
          <div className={styles.field}>
            <label className={styles.label}>A/C 22</label>
            <input
              type="text"
              name="ac22"
              value={formData.ac22}
              onChange={handleChange}
              placeholder="ENTER A/C 22"
              className={styles.input}
            />
          </div>

          {/* Total Amount */}
          <div className={styles.field}>
            <label className={styles.label}>Total Amount</label>
            <input
              type="text"
              name="totalAmount"
              value={formData.totalAmount}
              disabled
              className={`${styles.input} ${styles.disabledInput}`}
            />
          </div>

          {/* Return Date */}
          <div className={styles.field}>
            <label className={styles.label}>Return Date</label>
            <input
              type="date"
              name="returnDate"
              value={formData.returnDate}
              onChange={handleChange}
              className={styles.input}
            />
          </div>
        </div>

        {/* Buttons Group (both styled green to match Screen 2 exactly) */}
        <div className={styles.buttonGroup}>
          <button type="button" onClick={onCancel} className={styles.saveBtn} style={{ backgroundColor: 'var(--text-muted)' }}>
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

export default EpfChallanDateForm;
