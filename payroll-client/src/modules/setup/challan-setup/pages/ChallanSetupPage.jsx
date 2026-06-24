import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Download, FileSpreadsheet, Copy, FileText, File, Printer } from 'lucide-react';
import styles from '../components/ChallanSetupPage.module.css';
import ChallanSetupForm from '../components/ChallanSetupForm';
import ChallanSetupTable from '../components/ChallanSetupTable';
import { getChallanSetup, saveChallanSetup, deleteChallanSetup } from '../services/challanSetupService';
import { useToast, ConfirmModal } from '../../../../shared/components';
import { exportModuleData } from '../../../../shared/services/exportService';

const formatDateForExport = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
};

const ChallanSetupPage = () => {
  const addToast = useToast();

  const [challanList, setChallanList] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingChallan, setEditingChallan] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Confirmation Modal state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const dropdownRef = useRef(null);

  const fetchChallans = async () => {
    const companyId = localStorage.getItem('selectedCompany');
    if (!companyId) {
      addToast({ type: 'warning', message: 'No company selected! Please select a company on login.' });
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getChallanSetup(companyId);
      setChallanList(data);
    } catch (err) {
      console.error('Error fetching challan setups:', err);
      addToast({ type: 'error', message: 'Failed to load challan setups.' });
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchChallans();
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

  const handleConfirmDelete = async () => {
    if (deleteTargetId) {
      const companyId = localStorage.getItem('selectedCompany');
      try {
        const updated = await deleteChallanSetup(deleteTargetId, companyId);
        setChallanList(updated);
        addToast({ type: 'success', message: 'Challan Setup record deleted successfully!' });
      } catch (err) {
        console.error('Error deleting challan setup:', err);
        addToast({ type: 'error', message: 'Failed to delete challan setup.' });
      }
    }
    setIsConfirmOpen(false);
    setDeleteTargetId(null);
  };

  const handleCancelDelete = () => {
    setIsConfirmOpen(false);
    setDeleteTargetId(null);
  };

  const handleSave = async (challanData) => {
    const companyId = localStorage.getItem('selectedCompany');
    try {
      const updated = await saveChallanSetup(challanData, companyId);
      setChallanList(updated);
      setIsFormOpen(false);
      setEditingChallan(null);
      addToast({
        type: 'success',
        message: challanData.id
          ? 'Challan Setup record updated successfully!'
          : 'Challan Setup record created successfully!'
      });
    } catch (err) {
      console.error('Error saving challan setup:', err);
      addToast({
        type: 'error',
        message: err.response?.data?.messageToShow || 'Failed to save challan setup.'
      });
    }
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingChallan(null);
  };

  // Filter list by search term
  const filteredChallan = useMemo(() => {
    return challanList.filter(item => {
      const search = searchTerm.toLowerCase();
      const formattedStart = formatDateForExport(item.startDate).toLowerCase();
      const formattedEnd = formatDateForExport(item.endDate).toLowerCase();
      return (
        formattedStart.includes(search) ||
        formattedEnd.includes(search) ||
        (item.salaryLimit && item.salaryLimit.toLowerCase().includes(search)) ||
        (item.esicWages && item.esicWages.toLowerCase().includes(search)) ||
        (item.employeeShare && item.employeeShare.toLowerCase().includes(search)) ||
        (item.employerShare && item.employerShare.toLowerCase().includes(search))
      );
    });
  }, [challanList, searchTerm]);

  // Export handlers
  const handleExport = async (type) => {
    setIsDropdownOpen(false);
    if (type === 'Copy') {
      const text = filteredChallan.map((c, index) =>
        `${index + 1}\t${formatDateForExport(c.startDate)}\t${formatDateForExport(c.endDate)}\t${c.salaryLimit}\t${c.edliWages}\t${c.accNo1EEMale}\t${c.accNo1EEFemale}\t${c.accNo1ER}\t${c.accNo2}\t${c.accNo10}\t${c.accNo21}\t${c.accNo22}\t${c.accNo2Min}\t${c.accNo22Min}\t${c.pmrpy}\t${c.esicWages}\t${c.employeeShare}\t${c.employerShare}`
      ).join('\n');
      navigator.clipboard.writeText(text);
      addToast({ type: 'success', message: 'Copied filtered records to clipboard!' });
      return;
    }

    try {
      addToast({ type: 'info', message: `${type} export started...` });
      await exportModuleData('challan-setups', type.toLowerCase());
      addToast({ type: 'success', message: `${type} export completed successfully!` });
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', message: `Failed to export ${type} file.` });
    }
  };

  return (
    <div className={styles.container}>

      {/* Header section with page heading and action buttons */}
      <div className={styles.headerSection}>
        <h1 className={styles.title}>Challan Setup</h1>
        <div className={styles.headerActions}>
          {!isFormOpen && (
            <button onClick={handleAddNew} className={styles.addBtn}>
              <Plus size={18} /> Challan Setup
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
        <ChallanSetupForm
          challan={editingChallan}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {/* Render table showing challan list */}
      <ChallanSetupTable
        data={filteredChallan}
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
        title="Delete Challan Setup"
        message="Are you sure you want to delete this challan setup entry? This action cannot be undone."
      />

    </div>
  );
};

export default ChallanSetupPage;
