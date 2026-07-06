import React, { useState, useEffect } from 'react';
import styles from './KycUpdatePage.module.css';
import { SearchableSelect } from '../../../../shared/components';

const KycSearch = ({ employees, selectedEmployeeId, onSelectEmployee, onSearch, onReset }) => {
  const [error, setError] = useState('');

  // Reset local error when selectedEmployeeId becomes empty (e.g. on global reset)
  useEffect(() => {
    if (!selectedEmployeeId) {
      setError('');
    }
  }, [selectedEmployeeId]);

  // Find current selected employee details
  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);

  const employeeOptions = employees.map(emp => ({
    value: emp.id,
    label: emp.memberName
  }));

  const handleSelectChange = (e) => {
    const val = e.target.value;
    onSelectEmployee(val);
    if (val) {
      setError('');
    } else {
      setError('Please select an employee first!');
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!selectedEmployeeId) {
      setError('Please select an employee first!');
      return;
    }
    setError('');
    onSearch();
  };

  const handleResetClick = () => {
    setError('');
    onReset();
  };

  return (
    <div className={styles.card} style={{ marginBottom: '24px' }}>
      <form onSubmit={handleSearchSubmit}>
        <div className={styles.formGrid}>
          {/* Employee dropdown */}
          <div className={styles.field}>
            <label className={styles.label}>
              Name (as Per Aadhar) <span className={styles.required}>*</span>
            </label>
            <SearchableSelect
              name="employee"
              value={selectedEmployeeId}
              onChange={handleSelectChange}
              options={employeeOptions}
              placeholder="SELECT EMPLOYEE"
              required={true}
              error={error}
            />
          </div>

          {/* UAN input */}
          <div className={styles.field}>
            <label className={styles.label}>Enter UAN</label>
            <input
              type="text"
              value={selectedEmployee ? selectedEmployee.uan : ''}
              readOnly
              placeholder="ENTER UAN"
              className={`${styles.input} ${styles.disabledInput}`}
            />
          </div>

          {/* Member ID input */}
          <div className={styles.field}>
            <label className={styles.label}>Enter Member ID</label>
            <input
              type="text"
              value={selectedEmployee ? selectedEmployee.memberId || '' : ''}
              readOnly
              placeholder="ENTER MEMBER ID"
              className={`${styles.input} ${styles.disabledInput}`}
            />
          </div>
        </div>

        {/* Centered Actions */}
        <div className={styles.buttonGroupCentered}>
          <button type="submit" className={styles.searchBtn}>
            Search
          </button>
          <button type="button" onClick={handleResetClick} className={styles.resetBtn}>
            Reset
          </button>
        </div>
      </form>
    </div>
  );
};

export default KycSearch;

