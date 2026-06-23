import React, { useState } from 'react';
import { Trash2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useToast, MonthYearPicker, ConfirmModal } from '../../../../shared/components';
import styles from '../components/DeleteMonthEntryPage.module.css';

const EMPLOYEE_TYPES = [
  { value: 'BIDI PACKER', label: 'BIDI PACKER' },
  { value: 'BIDI MAKER', label: 'BIDI MAKER' },
  { value: 'OFFICE STAFF', label: 'OFFICE STAFF' }
];

const getLocalStorageKey = (type, monthYear) => {
  if (type === 'BIDI PACKER') {
    return `payroll_packers_entry_${monthYear}`;
  }
  if (type === 'BIDI MAKER') {
    return `payroll_bidi_roller_entry_${monthYear}`;
  }
  if (type === 'OFFICE STAFF') {
    return `payroll_office_staff_entry_${monthYear}`;
  }
  return '';
};

const formatMonthLabel = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 2) {
    const year = parts[0];
    const month = parts[1];
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthIndex = parseInt(month, 10) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${months[monthIndex]} ${year}`;
    }
  }
  return dateStr;
};

const DeleteMonthEntryPage = () => {
  const addToast = useToast();

  // Selected parameters state
  const [selectedMonth, setSelectedMonth] = useState('2026-06');
  const [employeeType, setEmployeeType] = useState('');

  // Confirmation Modal overlay state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleDeleteClick = () => {
    if (!selectedMonth) {
      addToast({
        type: 'error',
        message: 'Please select a Month and Year.'
      });
      return;
    }
    if (!employeeType) {
      addToast({
        type: 'error',
        message: 'Please select a Type of Employee.'
      });
      return;
    }
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    const storageKey = getLocalStorageKey(employeeType, selectedMonth);
    if (!storageKey) {
      addToast({
        type: 'error',
        message: 'Invalid parameters for record deletion.'
      });
      setIsConfirmOpen(false);
      return;
    }

    const currentRecords = localStorage.getItem(storageKey);

    if (!currentRecords) {
      addToast({
        type: 'warning',
        message: `No active records found for ${formatMonthLabel(selectedMonth)} (${employeeType}).`
      });
    } else {
      localStorage.removeItem(storageKey);
      addToast({
        type: 'success',
        message: `Successfully deleted attendance and wage records for ${formatMonthLabel(selectedMonth)} (${employeeType}).`
      });
    }

    setIsConfirmOpen(false);
  };

  const handleCancelDelete = () => {
    setIsConfirmOpen(false);
  };

  return (
    <div className={styles.container}>
      {/* Header section */}
      <div className={styles.headerSection}>
        <div>
          <h2 className={styles.title}>Delete Month Entry</h2>
          <p className={styles.subtitle}>
            Admin utility to purge or lock monthly attendance sheets, wages, and transaction logs.
          </p>
        </div>
      </div>

      {/* Selector controls card */}
      <div className={styles.card}>
        <div className={styles.rowLayout}>
          
          <div className={styles.formGroup}>
            <span className={styles.label}>Select Month and Year</span>
            <MonthYearPicker
              value={selectedMonth}
              onChange={setSelectedMonth}
            />
          </div>

          <div className={styles.formGroup}>
            <span className={styles.label}>Type of Employee</span>
            <select
              value={employeeType}
              onChange={(e) => setEmployeeType(e.target.value)}
              className={styles.selectInput}
            >
              <option value="">SELECT EMPLOYEE TYPE</option>
              {EMPLOYEE_TYPES.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className={styles.deleteBtn}
            onClick={handleDeleteClick}
          >
            <Trash2 size={16} />
            Delete
          </button>

        </div>
      </div>

      {/* Safety alerts banner */}
      <div className={styles.infoBox}>
        <ShieldAlert size={28} style={{ color: 'var(--danger)', flexShrink: 0 }} />
        <div className={styles.infoContent}>
          <h4>Destructive Administrative Action</h4>
          <p>
            Deleting a month entry will permanently clear all daily wage registries, EPF/ESIC calculations, 
            and attendance logs for the selected category. Please double-check your dates and make sure you 
            have exported all payroll records or taken database backups before performing this operation.
          </p>
        </div>
      </div>

      {/* Confirmation Modal dialog overlay */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Confirm Month Deletion"
        message={`Are you sure you want to delete the monthly records for ${formatMonthLabel(
          selectedMonth
        )} (${employeeType})? This action cannot be undone.`}
      />
    </div>
  );
};

export default DeleteMonthEntryPage;
