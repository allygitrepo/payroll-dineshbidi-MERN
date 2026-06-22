import React from 'react';
import styles from './KycUpdatePage.module.css';

const KycSearch = ({ employees, selectedEmployeeId, onSelectEmployee, onSearch, onReset }) => {
  // Find current selected employee details
  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);

  const handleSelectChange = (e) => {
    onSelectEmployee(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearch();
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
            <select
              value={selectedEmployeeId}
              onChange={handleSelectChange}
              className={styles.select}
              required
            >
              <option value="">SELECT EMPLOYEE</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.memberName}
                </option>
              ))}
            </select>
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
          <button type="button" onClick={onReset} className={styles.resetBtn}>
            Reset
          </button>
        </div>
      </form>
    </div>
  );
};

export default KycSearch;
