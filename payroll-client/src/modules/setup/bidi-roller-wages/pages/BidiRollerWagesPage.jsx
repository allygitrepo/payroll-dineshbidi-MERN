import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Download, FileSpreadsheet, Copy, FileText, File, Printer, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import styles from '../components/BidiRollerWagesPage.module.css';
import BidiRollerWagesForm from '../components/BidiRollerWagesForm';
import BidiRollerWagesTable from '../components/BidiRollerWagesTable';
import { getBidiRollerWages, saveBidiRollerWages, deleteBidiRollerWages } from '../services/bidiRollerWagesService';
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

const BidiRollerWagesPage = () => {
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

  const fetchWages = async () => {
    const companyId = localStorage.getItem('selectedCompany');
    if (!companyId) {
      addToast({ type: 'warning', message: 'No company selected! Please select a company on login.' });
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getBidiRollerWages(companyId);
      setWagesList(data);
    } catch (err) {
      console.error('Error fetching bidi wages:', err);
      addToast({ type: 'error', message: 'Failed to load bidi roller wages.' });
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchWages();
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
        const updated = await deleteBidiRollerWages(deleteTargetId, companyId);
        setWagesList(updated);
        addToast({ type: 'success', message: 'Bidi Roller Wages record deleted successfully!' });
      } catch (err) {
        console.error('Error deleting bidi wages:', err);
        addToast({ type: 'error', message: 'Failed to delete bidi roller wages.' });
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
      const updated = await saveBidiRollerWages(wagesData, companyId);
      setWagesList(updated);
      setIsFormOpen(false);
      setEditingWages(null);
      addToast({
        type: 'success',
        message: wagesData.id ? 'Bidi Roller Wages record updated successfully!' : 'Bidi Roller Wages record created successfully!'
      });
    } catch (err) {
      console.error('Error saving bidi wages:', err);
      addToast({
        type: 'error',
        message: err.response?.data?.messageToShow || 'Failed to save bidi roller wages.'
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
        (item.rate1 && item.rate1.toLowerCase().includes(search)) ||
        (item.rate2 && item.rate2.toLowerCase().includes(search)) ||
        (item.rate3 && item.rate3.toLowerCase().includes(search)) ||
        (item.rate4 && item.rate4.toLowerCase().includes(search)) ||
        (item.bonus && item.bonus.toLowerCase().includes(search))
      );
    });
  }, [wagesList, searchTerm]);

  // Export handlers
  const handleExport = async (type) => {
    setIsDropdownOpen(false);
    
    if (type === 'Excel' || type === 'Excel Template') {
      const isTemplate = type === 'Excel Template';
      const aoa = [
        ['ID (Do Not Modify)', 'Start Date (YYYY-MM-DD)', 'End Date (YYYY-MM-DD)', 'Rate 1', 'HRA 1', 'Bonus 1', 'Rate 2', 'HRA 2', 'Bonus 2']
      ];
      
      if (!isTemplate) {
        filteredWages.forEach(w => {
          aoa.push([
            w.id, w.startDate, w.endDate, w.rate1, w.hra1, w.bonus1, w.rate2, w.hra2, w.bonus2
          ]);
        });
      }
      
      const worksheet = XLSX.utils.aoa_to_sheet(aoa);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'BidiRoller_Wages');
      XLSX.writeFile(workbook, `BidiRoller_Wages_${isTemplate ? 'Template' : 'Export'}.xlsx`);
      addToast({ type: 'success', message: `${type} downloaded!` });
      return;
    }

    if (type === 'Copy') {
      const text = filteredWages.map((w, index) => 
        `${index + 1}\t${formatDateForExport(w.startDate)}\t${formatDateForExport(w.endDate)}\t${w.rate1}\t${w.rate2}\t${w.rate3}\t${w.rate4}\t${w.bonus}`
      ).join('\n');
      navigator.clipboard.writeText(text);
      addToast({ type: 'success', message: 'Copied filtered records to clipboard!' });
      return;
    }
    
    try {
      addToast({ type: 'info', message: `${type} export started...` });
      await exportModuleData('bidi-roller-wages', type.toLowerCase());
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
          
          const wagesData = {
            id: wId || undefined,
            startDate: parseExcelDate(row['Start Date (YYYY-MM-DD)']),
            endDate: parseExcelDate(row['End Date (YYYY-MM-DD)']),
            rate1: row['Rate 1'] || 0,
            hra1: row['HRA 1'] || 0,
            bonus1: row['Bonus 1'] || 0,
            rate2: row['Rate 2'] || 0,
            hra2: row['HRA 2'] || 0,
            bonus2: row['Bonus 2'] || 0
          };
          if (!wagesData.startDate) continue; 
          
          await saveBidiRollerWages(wagesData, companyId);
          successCount++;
        }
        
        addToast({ type: 'success', message: `Successfully uploaded ${successCount} records.` });
        fetchWages();
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
        <h1 className={styles.title}>Bidi Roller Wages</h1>
        <div className={styles.headerActions}>
          {!isFormOpen && (
            <button onClick={handleAddNew} className={styles.addBtn}>
              <Plus size={18} /> Bidi Roller Wages
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
        <BidiRollerWagesForm
          wages={editingWages}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {/* Render table showing bidi roller wages list */}
      <BidiRollerWagesTable
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
        title="Delete Bidi Roller Wages Setup"
        message="Are you sure you want to delete this bidi roller wages entry? This action cannot be undone."
      />

    </div>
  );
};

export default BidiRollerWagesPage;
