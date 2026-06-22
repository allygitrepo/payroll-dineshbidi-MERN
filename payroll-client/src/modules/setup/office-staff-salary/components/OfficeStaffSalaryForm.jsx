import React, { useState, useEffect } from 'react';
import styles from './OfficeStaffSalaryPage.module.css';
import { getEmployees } from '../../../master/employee/services/employeeService';
import { useToast } from '../../../../shared/components';

const OfficeStaffSalaryForm = ({ wages, onSave, onCancel }) => {
  const addToast = useToast();
  const [employees, setEmployees] = useState([]);

  const [formData, setFormData] = useState({
    id: '',
    startDate: '',
    endDate: '',
    employeeId: '',
    employeeName: '',
    salary: '',
    standardBonus: '',
    additionalBonus: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchEmps = async () => {
      const companyId = localStorage.getItem('selectedCompany');
      if (companyId) {
        try {
          const data = await getEmployees(companyId);
          setEmployees(data);
        } catch (err) {
          console.error('Error fetching employees for dropdown:', err);
        }
      }
    };
    fetchEmps();
  }, []);

  useEffect(() => {
    setErrors({});
    if (wages) {
      setFormData(wages);
    } else {
      setFormData({
        id: '',
        startDate: '',
        endDate: '',
        employeeId: '',
        employeeName: '',
        salary: '',
        standardBonus: '',
        additionalBonus: ''
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
    if (name === 'employeeId') {
      return !value ? 'Employee is required!' : '';
    }
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;

    if (['salary', 'standardBonus', 'additionalBonus'].includes(name)) {
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
    const keysToValidate = ['startDate', 'endDate', 'employeeId'];

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

    // Map selected employee name to save it alongside employeeId
    const selectedEmp = employees.find(emp => emp.id === formData.employeeId);

    const formattedData = {
      ...formData,
      employeeName: selectedEmp ? selectedEmp.memberName : (formData.employeeName || ''),
      salary: formData.salary ? Number(formData.salary).toFixed(2) : '0.00',
      standardBonus: formData.standardBonus ? Number(formData.standardBonus).toFixed(2) : '0.00',
      additionalBonus: formData.additionalBonus ? Number(formData.additionalBonus).toFixed(2) : '0.00'
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
          {/* Employee Name */}
          <div className={styles.field}>
            <label className={styles.label}>
              Employee Name <span className={styles.required}>*</span>
            </label>
            <select
              name="employeeId"
              value={formData.employeeId}
              onChange={handleChange}
              onBlur={handleBlur}
              className={styles.select}
            >
              <option value="">SELECT EMPLOYEE</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.memberName}
                </option>
              ))}
            </select>
            {errors.employeeId && <span className={styles.errorText}>{errors.employeeId}</span>}
          </div>

          {/* Salary */}
          <div className={styles.field}>
            <label className={styles.label}>Salary</label>
            <input
              type="text"
              name="salary"
              value={formData.salary}
              onChange={handleChange}
              placeholder="ENTER SALARY"
              className={styles.input}
            />
          </div>

          {/* Standard Bonus */}
          <div className={styles.field}>
            <label className={styles.label}>Standard Bonus</label>
            <input
              type="text"
              name="standardBonus"
              value={formData.standardBonus}
              onChange={handleChange}
              placeholder="ENTER STANDARD BONUS"
              className={styles.input}
            />
          </div>

          {/* Additional Bonus */}
          <div className={styles.field}>
            <label className={styles.label}>Additional Bonus</label>
            <input
              type="text"
              name="additionalBonus"
              value={formData.additionalBonus}
              onChange={handleChange}
              placeholder="ENTER ADDITIONAL BONUS"
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

export default OfficeStaffSalaryForm;
