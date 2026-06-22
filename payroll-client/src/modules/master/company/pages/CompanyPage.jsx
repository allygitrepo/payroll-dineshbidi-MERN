import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Download, FileSpreadsheet, Copy, FileText, File, Printer } from 'lucide-react';
import styles from '../components/CompanyPage.module.css';
import CompanyForm from '../components/CompanyForm';
import CompanyTable from '../components/CompanyTable';
import { getCompanies, saveCompany, deleteCompany } from '../services/companyService';
import { useToast, ConfirmModal } from '../../../../shared/components';

const CompanyPage = () => {
  const addToast = useToast();
  const [companies, setCompanies] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  
  // Search state managed at page level to coordinate with dropdown exports
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Confirmation Modal state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // Load initial data
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const data = await getCompanies();
        setCompanies(data);
      } catch (err) {
        console.error('Error fetching companies:', err);
        addToast({ type: 'error', message: 'Failed to load companies.' });
      }
    };
    fetchCompanies();
  }, [addToast]);

  const dropdownRef = useRef(null);

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
    setEditingCompany(null);
    setIsFormOpen(true);
  };

  const handleEdit = (company) => {
    setEditingCompany(company);
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
        const updated = await deleteCompany(deleteTargetId);
        setCompanies(updated);
        addToast({ type: 'success', message: 'Company deleted successfully!' });
      } catch (err) {
        console.error('Error deleting company:', err);
        addToast({ type: 'error', message: 'Failed to delete company.' });
      }
    }
    setIsConfirmOpen(false);
    setDeleteTargetId(null);
  };

  const handleCancelDelete = () => {
    setIsConfirmOpen(false);
    setDeleteTargetId(null);
  };

  const handleSave = async (companyData) => {
    try {
      const updated = await saveCompany(companyData);
      setCompanies(updated);
      setIsFormOpen(false);
      setEditingCompany(null);
      addToast({
        type: 'success',
        message: companyData.id ? 'Company updated successfully!' : 'Company created successfully!'
      });
    } catch (err) {
      console.error('Error saving company:', err);
      addToast({
        type: 'error',
        message: err.response?.data?.messageToShow || 'Failed to save company.'
      });
    }
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingCompany(null);
  };

  // Filtered data based on search term
  const filteredCompanies = useMemo(() => {
    return companies.filter(company => {
      const search = searchTerm.toLowerCase();
      return (
        (company.estbId && company.estbId.toLowerCase().includes(search)) ||
        (company.estbName && company.estbName.toLowerCase().includes(search)) ||
        (company.estbType && company.estbType.toLowerCase().includes(search)) ||
        (company.epfoOffice && company.epfoOffice.toLowerCase().includes(search)) ||
        (company.linNo && company.linNo.toLowerCase().includes(search)) ||
        (company.esicId && company.esicId.toLowerCase().includes(search)) ||
        (company.address && company.address.toLowerCase().includes(search)) ||
        (company.postOffice && company.postOffice.toLowerCase().includes(search)) ||
        (company.district && company.district.toLowerCase().includes(search)) ||
        (company.pincode && company.pincode.toLowerCase().includes(search)) ||
        (company.pan && company.pan.toLowerCase().includes(search))
      );
    });
  }, [companies, searchTerm]);

  // Export handlers at page level
  const handleExportClick = (type) => {
    addToast({ type: 'info', message: `${type} export started for ${filteredCompanies.length} records!` });
    setIsDropdownOpen(false);
  };

  const handleCopyClick = () => {
    const text = filteredCompanies.map(c => 
      `${c.estbId}\t${c.estbName}\t${c.estbType}\t${c.epfoOffice}\t${c.linNo}\t${c.address}\t${c.postOffice}\t${c.district}\t${c.pincode}\t${c.pan}`
    ).join('\n');
    navigator.clipboard.writeText(text);
    addToast({ type: 'success', message: 'Copied filtered records to clipboard!' });
    setIsDropdownOpen(false);
  };

  return (
    <div className={styles.container}>
      
      {/* Header section with heading and actions */}
      <div className={styles.headerSection}>
        <h1 className={styles.title}>Company</h1>
        <div className={styles.headerActions}>
          {!isFormOpen && (
            <button onClick={handleAddNew} className={styles.addBtn}>
              <Plus size={18} /> Company
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
        <CompanyForm
          company={editingCompany}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {/* Render table card containing list */}
      <CompanyTable
        data={filteredCompanies}
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
        title="Delete Company"
        message="Are you sure you want to delete this company? This action cannot be undone."
      />

    </div>
  );
};

export default CompanyPage;
