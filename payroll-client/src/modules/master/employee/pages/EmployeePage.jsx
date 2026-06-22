import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Download, FileSpreadsheet, Copy, FileText, File, Printer } from 'lucide-react';
import styles from '../components/EmployeePage.module.css';
import EmployeeForm from '../components/EmployeeForm';
import EmployeeTable from '../components/EmployeeTable';
import { getEmployees, saveEmployee, deleteEmployee } from '../services/employeeService';
import { useToast, ConfirmModal } from '../../../../shared/components';

const EmployeePage = () => {
  const addToast = useToast();
  const [employees, setEmployees] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  // Search filter and download dropdown states
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Confirm delete states
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const dropdownRef = useRef(null);

  // Load initial employees
  useEffect(() => {
    setEmployees(getEmployees());
  }, []);

  // Close download dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleAddNew = () => {
    setEditingEmployee(null);
    setIsFormOpen(true);
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = (id) => {
    setDeleteTargetId(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteTargetId) {
      const updated = deleteEmployee(deleteTargetId);
      setEmployees(updated);
      addToast({ type: 'success', message: 'Employee deleted successfully!' });
    }
    setIsConfirmOpen(false);
    setDeleteTargetId(null);
  };

  const handleCancelDelete = () => {
    setIsConfirmOpen(false);
    setDeleteTargetId(null);
  };

  const handleSave = (employeeData) => {
    const updated = saveEmployee(employeeData);
    setEmployees(updated);
    setIsFormOpen(false);
    setEditingEmployee(null);
    addToast({
      type: 'success',
      message: employeeData.id ? 'Employee updated successfully!' : 'Employee created successfully!'
    });
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingEmployee(null);
  };

  // Filtered employees listing
  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const search = searchTerm.toLowerCase();
      return (
        (employee.uan && employee.uan.toLowerCase().includes(search)) ||
        (employee.ipNumber && employee.ipNumber.toLowerCase().includes(search)) ||
        (employee.memberId && employee.memberId.toLowerCase().includes(search)) ||
        (employee.memberName && employee.memberName.toLowerCase().includes(search)) ||
        (employee.gender && employee.gender.toLowerCase().includes(search)) ||
        (employee.fatherHusbandName && employee.fatherHusbandName.toLowerCase().includes(search)) ||
        (employee.address && employee.address.toLowerCase().includes(search)) ||
        (employee.postOffice && employee.postOffice.toLowerCase().includes(search)) ||
        (employee.district && employee.district.toLowerCase().includes(search)) ||
        (employee.pincode && employee.pincode.toLowerCase().includes(search))
      );
    });
  }, [employees, searchTerm]);

  // Export alerts
  const handleExportClick = (type) => {
    addToast({ type: 'info', message: `${type} export started for ${filteredEmployees.length} employees!` });
    setIsDropdownOpen(false);
  };

  const handleCopyClick = () => {
    const text = filteredEmployees
      .map(
        (e) =>
          `${e.uan}\t${e.ipNumber}\t${e.memberId}\t${e.memberName}\t${e.dob}\t${e.dateOfJoining}\t${e.gender}\t${e.fatherHusbandName}\t${e.address}\t${e.pincode}`
      )
      .join('\n');
    navigator.clipboard.writeText(text);
    addToast({ type: 'success', message: 'Copied filtered employees list to clipboard!' });
    setIsDropdownOpen(false);
  };

  return (
    <div className={styles.container}>
      {/* Header section with heading and actions */}
      <div className={styles.headerSection}>
        <h1 className={styles.title}>Employee</h1>
        <div className={styles.headerActions}>
          {!isFormOpen && (
            <button onClick={handleAddNew} className={styles.addBtn}>
              <Plus size={18} /> Employee
            </button>
          )}
          <div className={styles.dropdownContainer} ref={dropdownRef}>
            <button
              className={styles.downloadBtn}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <Download size={18} /> Download
            </button>
            {isDropdownOpen && (
              <div className={styles.dropdownMenu}>
                <button onClick={() => handleExportClick('Excel')}>
                  <FileSpreadsheet size={16} /> Excel
                </button>
                <button onClick={handleCopyClick}>
                  <Copy size={16} /> Copy
                </button>
                <button onClick={() => handleExportClick('CSV')}>
                  <FileText size={16} /> CSV
                </button>
                <button onClick={() => handleExportClick('PDF')}>
                  <File size={16} /> PDF
                </button>
                <button onClick={() => handleExportClick('Print')}>
                  <Printer size={16} /> Print
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Render tabbed form card if open */}
      {isFormOpen && (
        <EmployeeForm
          employee={editingEmployee}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {/* Render table card containing list */}
      <EmployeeTable
        data={filteredEmployees}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
      />

      {/* Reusable Confirm Delete Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Employee"
        message="Are you sure you want to delete this employee? This action cannot be undone."
      />
    </div>
  );
};

export default EmployeePage;
