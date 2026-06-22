import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Download, FileSpreadsheet, Copy, FileText, File, Printer } from 'lucide-react';
import styles from '../components/EpfChallanDatePage.module.css';
import EpfChallanDateForm from '../components/EpfChallanDateForm';
import EpfChallanDateTable from '../components/EpfChallanDateTable';
import {
  getEpfChallans,
  saveEpfChallan,
  deleteEpfChallan
} from '../services/epfChallanDateService';
import { useToast, ConfirmModal } from '../../../../shared/components';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

const EpfChallanDatePage = () => {
  const addToast = useToast();

  const [challans, setChallans] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingChallan, setEditingChallan] = useState(null);

  // Search and dropdown state
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Delete modal state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // Load initial data
  useEffect(() => {
    setChallans(getEpfChallans());
  }, []);

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
    setEditingChallan(null);
    setIsFormOpen(true);
  };

  const handleEdit = (challan) => {
    setEditingChallan(challan);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = (id) => {
    setDeleteTargetId(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteTargetId) {
      const updated = deleteEpfChallan(deleteTargetId);
      setChallans(updated);
      addToast({ type: 'success', message: 'EPF Challan record deleted successfully!' });
    }
    setIsConfirmOpen(false);
    setDeleteTargetId(null);
  };

  const handleCancelDelete = () => {
    setIsConfirmOpen(false);
    setDeleteTargetId(null);
  };

  const handleSave = (challanData) => {
    const updated = saveEpfChallan(challanData);
    setChallans(updated);
    setIsFormOpen(false);
    setEditingChallan(null);
    addToast({
      type: 'success',
      message: challanData.id ? 'EPF Challan record updated successfully!' : 'EPF Challan record created successfully!'
    });
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingChallan(null);
  };

  // Filtered challans data based on search term
  const filteredChallans = useMemo(() => {
    return challans.filter((item) => {
      const search = searchTerm.toLowerCase();
      const formattedDue = formatDate(item.dueDate).toLowerCase();
      const formattedChallan = formatDate(item.challanDate).toLowerCase();
      const formattedReturn = formatDate(item.returnDate).toLowerCase();

      return (
        (item.trrn && item.trrn.toLowerCase().includes(search)) ||
        (item.crnNo && item.crnNo.toLowerCase().includes(search)) ||
        (item.wageMonth && item.wageMonth.toLowerCase().includes(search)) ||
        formattedDue.includes(search) ||
        formattedChallan.includes(search) ||
        formattedReturn.includes(search) ||
        (item.ac1EE && String(item.ac1EE).toLowerCase().includes(search)) ||
        (item.ac1ER && String(item.ac1ER).toLowerCase().includes(search)) ||
        (item.ac2 && String(item.ac2).toLowerCase().includes(search)) ||
        (item.ac10 && String(item.ac10).toLowerCase().includes(search)) ||
        (item.ac21 && String(item.ac21).toLowerCase().includes(search)) ||
        (item.ac22 && String(item.ac22).toLowerCase().includes(search)) ||
        (item.totalAmount && String(item.totalAmount).toLowerCase().includes(search))
      );
    });
  }, [challans, searchTerm]);

  const handleExport = (type) => {
    if (type === 'Copy') {
      const header = 'TRRN\tCRN No\tWage Month\tDue Date\tChallan Date\tA/C 1 (EE)\tA/C 1 (ER)\tA/C 2\tA/C 10\tA/C 21\tA/C 22\tTotal Amount\tReturn Date';
      const body = filteredChallans.map(c =>
        `${c.trrn}\t${c.crnNo}\t${c.wageMonth}\t${c.dueDate}\t${c.challanDate}\t${c.ac1EE}\t${c.ac1ER}\t${c.ac2}\t${c.ac10}\t${c.ac21}\t${c.ac22}\t${c.totalAmount}\t${c.returnDate}`
      ).join('\n');
      navigator.clipboard.writeText(`${header}\n${body}`);
      addToast({ type: 'success', message: 'Copied filtered records to clipboard!' });
    } else {
      addToast({ type: 'info', message: `${type} export started for ${filteredChallans.length} records!` });
    }
    setIsDropdownOpen(false);
  };

  return (
    <div className={styles.container}>
      {/* Header section with page heading and action buttons */}
      <div className={styles.headerSection}>
        <h1 className={styles.title}>EPF Challan Date Entry</h1>
        <div className={styles.headerActions}>
          {!isFormOpen && (
            <button onClick={handleAddNew} className={styles.addBtn}>
              <Plus size={18} /> EPF Challan Date
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
                <button onClick={() => handleExport('Excel')}>
                  <FileSpreadsheet size={16} /> Excel
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
        <EpfChallanDateForm
          challan={editingChallan}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {/* Render table showing challans list */}
      <EpfChallanDateTable
        data={filteredChallans}
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
        title="Delete EPF Challan Record"
        message="Are you sure you want to delete this EPF Challan record? This action cannot be undone."
      />
    </div>
  );
};

export default EpfChallanDatePage;
