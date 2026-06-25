import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Download, FileSpreadsheet, Copy, FileText, File, Printer, Briefcase } from 'lucide-react';
import styles from '../components/ContractorPage.module.css';
import ContractorForm from '../components/ContractorForm';
import ContractorTable from '../components/ContractorTable';
import { getContractors, saveContractor, deleteContractor } from '../services/contractorService';
import { getAddresses } from '../../address/services/addressService';
import { useToast, ConfirmModal } from '../../../../shared/components';
import { exportModuleData } from '../../../../shared/services/exportService';

const ContractorPage = () => {
  const addToast = useToast();
  const [contractors, setContractors] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContractor, setEditingContractor] = useState(null);

  // Search filter and download dropdown states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Active');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Confirm delete states
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const dropdownRef = useRef(null);

  // Load initial contractors and addresses
  useEffect(() => {
    const fetchInitialData = async () => {
      const companyId = localStorage.getItem('selectedCompany');
      if (!companyId) {
        addToast({ type: 'warning', message: 'No company selected! Please select a company on login.' });
        return;
      }
      try {
        const [loadedContractors, loadedAddresses] = await Promise.all([
          getContractors(companyId),
          getAddresses(companyId)
        ]);
        setContractors(loadedContractors);
        setAddresses(loadedAddresses);
      } catch (err) {
        console.error('Error loading contractor initial data:', err);
        addToast({ type: 'error', message: 'Failed to load contractor data.' });
      }
    };
    fetchInitialData();
  }, [addToast]);

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
    setEditingContractor(null);
    setIsFormOpen(true);
  };

  const handleEdit = (contractor) => {
    setEditingContractor(contractor);
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
        const updated = await deleteContractor(deleteTargetId, companyId);
        setContractors(updated);
        addToast({ type: 'success', message: 'Contractor deleted successfully!' });
      } catch (err) {
        console.error('Error deleting contractor:', err);
        addToast({ type: 'error', message: 'Failed to delete contractor.' });
      }
    }
    setIsConfirmOpen(false);
    setDeleteTargetId(null);
  };

  const handleCancelDelete = () => {
    setIsConfirmOpen(false);
    setDeleteTargetId(null);
  };

  const handleSave = async (contractorData) => {
    const companyId = localStorage.getItem('selectedCompany');
    try {
      const updated = await saveContractor(contractorData, companyId, addresses);
      setContractors(updated);
      setIsFormOpen(false);
      setEditingContractor(null);
      addToast({
        type: 'success',
        message: contractorData.id ? 'Contractor updated successfully!' : 'Contractor created successfully!'
      });
    } catch (err) {
      console.error('Error saving contractor:', err);
      addToast({
        type: 'error',
        message: err.response?.data?.messageToShow || 'Failed to save contractor.'
      });
    }
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingContractor(null);
  };

  // Filtered listing based on Search and Status Filter
  const filteredContractors = useMemo(() => {
    return contractors.filter((contractor) => {
      // 1. Status Filter
      if (statusFilter !== 'All' && contractor.status !== statusFilter) {
        return false;
      }
      // 2. Keyword Search
      const search = searchTerm.toLowerCase();
      return (
        (contractor.ccode && contractor.ccode.toLowerCase().includes(search)) ||
        (contractor.name && contractor.name.toLowerCase().includes(search)) ||
        (contractor.address && contractor.address.toLowerCase().includes(search)) ||
        (contractor.postOffice && contractor.postOffice.toLowerCase().includes(search)) ||
        (contractor.district && contractor.district.toLowerCase().includes(search)) ||
        (contractor.pincode && contractor.pincode.toLowerCase().includes(search)) ||
        (contractor.pfCode && contractor.pfCode.toLowerCase().includes(search)) ||
        (contractor.pan && contractor.pan.toLowerCase().includes(search)) ||
        (contractor.aadhaar && contractor.aadhaar.toLowerCase().includes(search)) ||
        (contractor.bankAccount && contractor.bankAccount.toLowerCase().includes(search)) ||
        (contractor.bankName && contractor.bankName.toLowerCase().includes(search)) ||
        (contractor.ifsc && contractor.ifsc.toLowerCase().includes(search))
      );
    });
  }, [contractors, searchTerm, statusFilter]);

  // Export handlers
  const handleExportClick = async (type) => {
    setIsDropdownOpen(false);
    try {
      addToast({ type: 'info', message: `${type} export started...` });
      await exportModuleData('contractors', type.toLowerCase());
      addToast({ type: 'success', message: `${type} export completed successfully!` });
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', message: `Failed to export ${type} file.` });
    }
  };

  const handleCopyClick = () => {
    const text = filteredContractors
      .map(
        (c) =>
          `${c.ccode}\t${c.name}\t${c.address}\t${c.postOffice}\t${c.district}\t${c.pincode}\t${c.pfCode}\t${c.dateOfJoining}\t${c.pan}\t${c.aadhaar}\t${c.gstNo}\t${c.bankAccount}\t${c.bankName}\t${c.ifsc}\t${c.status}`
      )
      .join('\n');
    navigator.clipboard.writeText(text);
    addToast({ type: 'success', message: 'Copied filtered contractors list to clipboard!' });
    setIsDropdownOpen(false);
  };

  return (
    <div className={styles.container}>
      {/* Header section with heading and actions */}
      <div className={styles.headerSection}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* <div style={{ color: 'var(--primary)', backgroundColor: 'var(--primary-light)', padding: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center' }}>
            <Briefcase size={24} />
          </div> */}
          <h1 className={styles.title} style={{ fontSize: '1.75rem', fontWeight: 700 }}>Contractor</h1>
        </div>
        <div className={styles.headerActions}>
          {!isFormOpen && (
            <button onClick={handleAddNew} className={styles.addBtn}>
              <Plus size={18} /> Contractor
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

      {/* Render form card if open */}
      {isFormOpen && (
        <ContractorForm
          contractor={editingContractor}
          addresses={addresses}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {/* Render table card containing list */}
      <ContractorTable
        data={filteredContractors}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
      />

      {/* Reusable Confirm Delete Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Contractor"
        message="Are you sure you want to delete this contractor? This action cannot be undone."
      />
    </div>
  );
};

export default ContractorPage;
