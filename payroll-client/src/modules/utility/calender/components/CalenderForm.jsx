import React, { useState, useEffect } from 'react';
import styles from './CalenderPage.module.css';
import { useToast, DatePicker } from '../../../../shared/components';

const defaultForm = {
  id: '',
  holidayType: '',
  weekDay: '',
  holidayDate: '',
  remark: ''
};

const weekDaysList = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

const CalenderForm = ({ entry, onSave, onCancel }) => {
  const addToast = useToast();
  const [formData, setFormData] = useState(defaultForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setErrors({});
    if (entry) {
      setFormData({
        id: entry.id || '',
        holidayType: entry.holidayType || '',
        weekDay: entry.weekDay || '',
        holidayDate: entry.holidayDate || '',
        remark: entry.remark || ''
      });
    } else {
      setFormData(defaultForm);
    }
  }, [entry]);

  const validateField = (name, value, currentType) => {
    const type = currentType || formData.holidayType;
    if (name === 'holidayType') {
      return !value ? 'Holiday Type is required!' : '';
    }
    if (name === 'weekDay' && type === 'WEEKLY') {
      return !value ? 'Week Day is required for Weekly Holidays!' : '';
    }
    if (name === 'holidayDate' && type === 'COMPANY') {
      return !value ? 'Holiday Date is required for Company Holidays!' : '';
    }
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedFormData = { ...formData, [name]: value };

    // Clear mutually exclusive fields when type changes
    if (name === 'holidayType') {
      if (value === 'COMPANY') {
        updatedFormData.weekDay = '';
      } else if (value === 'WEEKLY') {
        updatedFormData.holidayDate = '';
      }
    }

    setFormData(updatedFormData);

    const error = validateField(name, value, updatedFormData.holidayType);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const tempErrors = {};
    
    const typeError = validateField('holidayType', formData.holidayType);
    if (typeError) tempErrors.holidayType = typeError;

    if (formData.holidayType === 'WEEKLY') {
      const dayError = validateField('weekDay', formData.weekDay, 'WEEKLY');
      if (dayError) tempErrors.weekDay = dayError;
    } else if (formData.holidayType === 'COMPANY') {
      const dateError = validateField('holidayDate', formData.holidayDate, 'COMPANY');
      if (dateError) tempErrors.holidayDate = dateError;
    }

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      addToast({ type: 'error', message: 'Please correct the errors in the form.' });
      return;
    }

    onSave(formData);
  };

  const handleCancelClick = () => {
    setFormData(defaultForm);
    setErrors({});
    if (onCancel) onCancel();
  };

  return (
    <div className={styles.formCard}>
      <form onSubmit={handleSubmit} noValidate>
        <div className={styles.formGrid}>
          {/* Holiday Type */}
          <div className={styles.field}>
            <label className={styles.label}>
              Holiday Type <span className={styles.required}>*</span>
            </label>
            <select
              name="holidayType"
              value={formData.holidayType}
              onChange={handleChange}
              className={styles.select}
            >
              <option value="">SELECT HOLIDAY TYPE</option>
              <option value="COMPANY">COMPANY HOLIDAY</option>
              <option value="WEEKLY">WEEKLY HOLIDAY</option>
            </select>
            {errors.holidayType && <span className={styles.errorText}>{errors.holidayType}</span>}
          </div>

          {/* Week Days */}
          <div className={styles.field}>
            <label className={styles.label}>
              Week Days {formData.holidayType === 'WEEKLY' && <span className={styles.required}>*</span>}
            </label>
            <select
              name="weekDay"
              value={formData.weekDay}
              onChange={handleChange}
              disabled={formData.holidayType !== 'WEEKLY'}
              className={styles.select}
            >
              <option value="">SELECT WEEK DAY</option>
              {weekDaysList.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
            {errors.weekDay && <span className={styles.errorText}>{errors.weekDay}</span>}
          </div>

          {/* Select Date */}
          <div className={styles.field}>
            <label className={styles.label}>
              Select Date {formData.holidayType === 'COMPANY' && <span className={styles.required}>*</span>}
            </label>
            <DatePicker
              name="holidayDate"
              value={formData.holidayDate}
              onChange={handleChange}
              disabled={formData.holidayType !== 'COMPANY'}
            />
            {errors.holidayDate && <span className={styles.errorText}>{errors.holidayDate}</span>}
          </div>

          {/* Remark */}
          <div className={styles.field}>
            <label className={styles.label}>Remark</label>
            <input
              type="text"
              name="remark"
              value={formData.remark}
              onChange={handleChange}
              placeholder="ENTER REMARK"
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <button type="button" onClick={handleCancelClick} className={styles.cancelBtn}>
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

export default CalenderForm;
