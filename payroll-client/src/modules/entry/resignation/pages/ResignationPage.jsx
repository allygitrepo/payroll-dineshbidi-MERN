import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Download, FileSpreadsheet, Copy, FileText, File, Printer } from 'lucide-react';
import styles from '../components/ResignationPage.module.css';
import ResignationForm from '../components/ResignationForm';
import ResignationTable from '../components/ResignationTable';
import {
  getResignations,
  saveResignation,
  deleteResignation
} from '../services/resignationService';
import { useToast, ConfirmModal, Loader } from '../../../../shared/components';
import { exportModuleData } from '../../../../shared/services/exportService';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

const ResignationPage = () => {
  const addToast = useToast();

  const [resignations, setResignations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingResignation, setEditingResignation] = useState(null);

  // Filters & layout state
  const [selectedMonth, setSelectedMonth] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Confirmation Modal state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // Load initial data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const data = await getResignations();
      setResignations(data);
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to fetch resignations' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
    setEditingResignation(null);
    setIsFormOpen(true);
  };

  const handleEdit = (resignation) => {
    setEditingResignation(resignation);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = (id) => {
    setDeleteTargetId(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteTargetId) {
      try {
        await deleteResignation(deleteTargetId);
        addToast({ type: 'success', message: 'Resignation record deleted successfully!' });
        fetchData(); // Reload from server
      } catch (error) {
        addToast({ type: 'error', message: 'Failed to delete resignation' });
      }
    }
    setIsConfirmOpen(false);
    setDeleteTargetId(null);
  };

  const handleCancelDelete = () => {
    setIsConfirmOpen(false);
    setDeleteTargetId(null);
  };

  const handleSave = async (resignationData) => {
    try {
      await saveResignation(resignationData);
      setIsFormOpen(false);
      setEditingResignation(null);
      addToast({
        type: 'success',
        message: resignationData.id ? 'Resignation record updated successfully!' : 'Resignation record created successfully!'
      });
      fetchData(); // Reload from server
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to save resignation' });
    }
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingResignation(null);
  };

  // Filtered resignation records based on month and search text
  const filteredResignations = useMemo(() => {
    return resignations.filter((item) => {
      // 1. Month Wise filter (comparing item.dateOfLeaving "YYYY-MM-DD" with selectedMonth "YYYY-MM")
      if (selectedMonth) {
        if (!item.dateOfLeaving || !item.dateOfLeaving.startsWith(selectedMonth)) {
          return false;
        }
      }

      // 2. Global text filter
      const search = searchTerm.toLowerCase();
      const formattedDate = formatDate(item.dateOfLeaving).toLowerCase();

      return (
        (item.uan && item.uan.toLowerCase().includes(search)) ||
        (item.accountNo && item.accountNo.toLowerCase().includes(search)) ||
        (item.nameOfMember && item.nameOfMember.toLowerCase().includes(search)) ||
        (item.nameOfParents && item.nameOfParents.toLowerCase().includes(search)) ||
        (item.reasonOfLeaving && item.reasonOfLeaving.toLowerCase().includes(search)) ||
        formattedDate.includes(search)
      );
    });
  }, [resignations, selectedMonth, searchTerm]);

  const handleExport = async (type) => {
    setIsDropdownOpen(false);
    if (type === 'Copy') {
      const header = 'UAN\tAccount No.\tName Of Member\tName Of Parents\tDate of Leaving\tReason Of Leaving';
      const body = filteredResignations.map(r =>
        `${r.uan}\t${r.accountNo || ''}\t${r.nameOfMember}\t${r.nameOfParents || ''}\t${formatDate(r.dateOfLeaving)}\t${r.reasonOfLeaving}`
      ).join('\n');
      navigator.clipboard.writeText(`${header}\n${body}`);
      addToast({ type: 'success', message: 'Copied filtered resignation records to clipboard!' });
    } else {
      try {
        addToast({ type: 'info', message: `${type} export started...` });

        const headers = [
          'Sr. No.', 'UAN', 'Account No.', 'Name Of Member', 'Name Of Parents', 'Date of Leaving', 'Reason Of Leaving'
        ];
        const rows = filteredResignations.map((r, idx) => [
          idx + 1,
          r.uan || '-',
          r.accountNo || '-',
          r.nameOfMember || '-',
          r.nameOfParents || '-',
          formatDate(r.dateOfLeaving) || '-',
          r.reasonOfLeaving || '-'
        ]);

        await exportModuleData('resignation', type.toLowerCase(), {
          title: "Resignation Report",
          headers,
          rows
        });
        addToast({ type: 'success', message: `${type} export completed successfully!` });
      } catch (err) {
        console.error(err);
        addToast({ type: 'error', message: `Failed to export ${type} file.` });
      }
    }
  };

  return (
    <div className={styles.container}>
      {/* Header section with page heading and action buttons */}
      <div className={styles.headerSection}>
        <h1 className={styles.title}>Resignation</h1>
        <div className={styles.headerActions}>
          {!isFormOpen && (
            <button onClick={handleAddNew} className={styles.addBtn}>
              <Plus size={18} /> Resignation
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
        <ResignationForm
          resignation={editingResignation}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {/* Render table showing resignations list */}
      <ResignationTable
        data={filteredResignations}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
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
        title="Delete Resignation Record"
        message="Are you sure you want to delete this resignation record? This action cannot be undone."
      />
    </div>
  );
};

export default ResignationPage;
