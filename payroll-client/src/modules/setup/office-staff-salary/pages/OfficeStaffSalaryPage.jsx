import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Download, FileSpreadsheet, Copy, FileText, File, Printer, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import styles from '../components/OfficeStaffSalaryPage.module.css';
import OfficeStaffSalaryForm from '../components/OfficeStaffSalaryForm';
import OfficeStaffSalaryTable from '../components/OfficeStaffSalaryTable';
import { getOfficeStaffSalaries, saveOfficeStaffSalary, deleteOfficeStaffSalary } from '../services/officeStaffSalaryService';
import { useToast, ConfirmModal } from '../../../../shared/components';
import { exportModuleData } from '../../../../shared/services/exportService';
import { parseExcelDate } from '../../../../shared/utils/dateUtils';

const formatDateForExport = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

const OfficeStaffSalaryPage = () => {
  const addToast = useToast();
  
  const [wagesList, setWagesList] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWages, setEditingWages] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Confirmation Modal state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  const fetchSalaries = async () => {
    const companyId = localStorage.getItem('selectedCompany');
    if (!companyId) {
      addToast({ type: 'warning', message: 'No company selected! Please select a company on login.' });
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getOfficeStaffSalaries(companyId);
      setWagesList(data);
    } catch (err) {
      console.error('Error fetching office staff salaries:', err);
      addToast({ type: 'error', message: 'Failed to load office staff salaries.' });
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchSalaries();
  }, [addToast]);

  // Close dropdown when clicking outside
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
    setEditingWages(null);
    setIsFormOpen(true);
  };

  const handleEdit = (wages) => {
    setEditingWages(wages);
    setIsFormOpen(true);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleDeleteClick = (id) => {
    setDeleteTargetId(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteTargetId) {
      const companyId = localStorage.getItem('selectedCompany');
      try {
        const updated = await deleteOfficeStaffSalary(deleteTargetId, companyId);
        setWagesList(updated);
        addToast({ type: 'success', message: 'Office Staff Salary record deleted successfully!' });
      } catch (err) {
        console.error('Error deleting office staff salary:', err);
        addToast({ type: 'error', message: 'Failed to delete office staff salary.' });
      }
    }
    setIsConfirmOpen(false);
    setDeleteTargetId(null);
  };

  const handleCancelDelete = () => {
    setIsConfirmOpen(false);
    setDeleteTargetId(null);
  };

  const handleSave = async (wagesData) => {
    const companyId = localStorage.getItem('selectedCompany');
    try {
      const updated = await saveOfficeStaffSalary(wagesData, companyId);
      setWagesList(updated);
      setIsFormOpen(false);
      setEditingWages(null);
      addToast({
        type: 'success',
        message: wagesData.id ? 'Office Staff Salary record updated successfully!' : 'Office Staff Salary record created successfully!'
      });
    } catch (err) {
      console.error('Error saving office staff salary:', err);
      addToast({
        type: 'error',
        message: err.response?.data?.messageToShow || 'Failed to save office staff salary.'
      });
    }
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingWages(null);
  };

  // Filter list by search term
  const filteredWages = useMemo(() => {
    return wagesList.filter(item => {
      const search = searchTerm.toLowerCase();
      
      const formattedStart = formatDateForExport(item.startDate).toLowerCase();
      const formattedEnd = formatDateForExport(item.endDate).toLowerCase();
      
      return (
        formattedStart.includes(search) ||
        formattedEnd.includes(search) ||
        (item.employeeName && item.employeeName.toLowerCase().includes(search)) ||
        (item.salary && item.salary.toLowerCase().includes(search)) ||
        (item.standardBonus && item.standardBonus.toLowerCase().includes(search)) ||
        (item.additionalBonus && item.additionalBonus.toLowerCase().includes(search))
      );
    });
  }, [wagesList, searchTerm]);

  // Export handlers
  const handleExport = async (type) => {
    setIsDropdownOpen(false);
    
    if (type === 'Excel' || type === 'Excel Template') {
      const isTemplate = type === 'Excel Template';
      const aoa = [
        ['ID (Do Not Modify)', 'Employee ID (Do Not Modify)', 'Employee Name', 'Start Date (YYYY-MM-DD)', 'End Date (YYYY-MM-DD)', 'Salary', 'Standard Bonus', 'Additional Bonus']
      ];
      
      if (!isTemplate) {
        filteredWages.forEach(w => {
          aoa.push([
            w.id, w.employeeId, w.employeeName, w.startDate, w.endDate, w.salary, w.standardBonus, w.additionalBonus
          ]);
        });
      }
      
      const worksheet = XLSX.utils.aoa_to_sheet(aoa);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'OfficeStaff_Salary');
      XLSX.writeFile(workbook, `OfficeStaff_Salary_${isTemplate ? 'Template' : 'Export'}.xlsx`);
      addToast({ type: 'success', message: `${type} downloaded!` });
      return;
    }

    if (type === 'Copy') {
      const text = filteredWages.map((w, index) => 
        `${index + 1}\t${formatDateForExport(w.startDate)}\t${formatDateForExport(w.endDate)}\t${w.employeeName}\t${w.salary}\t${w.standardBonus}\t${w.additionalBonus}`
      ).join('\n');
      navigator.clipboard.writeText(text);
      addToast({ type: 'success', message: 'Copied filtered records to clipboard!' });
      return;
    }
    
    try {
      addToast({ type: 'info', message: `${type} export started...` });
      await exportModuleData('office-staff-salaries', type.toLowerCase());
      addToast({ type: 'success', message: `${type} export completed successfully!` });
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', message: `Failed to export ${type} file.` });
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const companyId = localStorage.getItem('selectedCompany');
    if (!companyId) {
      addToast({ type: 'error', message: 'No company selected.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const workbook = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const importedData = XLSX.utils.sheet_to_json(worksheet);

        let successCount = 0;
        for (const row of importedData) {
          const wId = row['ID (Do Not Modify)'];
          const eId = row['Employee ID (Do Not Modify)'];
          
          const wagesData = {
            id: wId || undefined,
            employeeId: eId || undefined,
            startDate: parseExcelDate(row['Start Date (YYYY-MM-DD)']),
            endDate: parseExcelDate(row['End Date (YYYY-MM-DD)']),
            salary: row['Salary'] || 0,
            standardBonus: row['Standard Bonus'] || 0,
            additionalBonus: row['Additional Bonus'] || 0
          };
          if (!wagesData.startDate || !wagesData.employeeId) continue; 
          
          await saveOfficeStaffSalary(wagesData, companyId);
          successCount++;
        }
        
        addToast({ type: 'success', message: `Successfully uploaded ${successCount} records.` });
        fetchSalaries();
      } catch (error) {
        console.error('Error importing Excel:', error);
        addToast({ type: 'error', message: 'Failed to import Excel file.' });
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = null;
  };

  return (
    <div className={styles.container}>
      
      {/* Header section with page heading and action buttons */}
      <div className={styles.headerSection}>
        <h1 className={styles.title}>Office Staff Salary</h1>
        <div className={styles.headerActions}>
          {!isFormOpen && (
            <button onClick={handleAddNew} className={styles.addBtn}>
              <Plus size={18} /> Office Staff Salary
            </button>
          )}
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            style={{ display: 'none' }} 
          />
          <button
            className={styles.downloadBtn}
            style={{ backgroundColor: 'var(--success-color, #10b981)' }}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={18} /> Upload Excel
          </button>
          <div className={styles.dropdownContainer} ref={dropdownRef}>
            <button 
              className={styles.downloadBtn} 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <Download size={18} /> Download
            </button>
            {isDropdownOpen && (
              <div className={styles.dropdownMenu}>
                <button onClick={() => handleExport('Excel')}>
                  <FileSpreadsheet size={16} /> Excel
                </button>
                <button onClick={() => handleExport('Excel Template')}>
                  <FileSpreadsheet size={16} /> Excel Template
                </button>
                <button onClick={() => handleExport('Copy')}>
                  <Copy size={16} /> Copy
                </button>
                <button onClick={() => handleExport('CSV')}>
                  <FileText size={16} /> CSV
                </button>
                <button onClick={() => handleExport('PDF')}>
                  <File size={16} /> PDF
                </button>
                <button onClick={() => handleExport('Print')}>
                  <Printer size={16} /> Print
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Render form card if editing or adding */}
      {isFormOpen && (
        <OfficeStaffSalaryForm
          wages={editingWages}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {/* Render table showing office staff salary list */}
      <OfficeStaffSalaryTable
        data={filteredWages}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Office Staff Salary Setup"
        message="Are you sure you want to delete this office staff salary entry? This action cannot be undone."
      />

    </div>
  );
};

export default OfficeStaffSalaryPage;
