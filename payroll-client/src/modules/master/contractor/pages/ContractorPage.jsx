import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Download, FileSpreadsheet, Copy, FileText, File, Printer, Briefcase, CalendarDays, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import styles from '../components/ContractorPage.module.css';
import ContractorForm from '../components/ContractorForm';
import ContractorTable from '../components/ContractorTable';
import ContractorLoginModal from '../components/ContractorLoginModal';
import { getContractors, saveContractor, deleteContractor, createContractorLogin, getContractorLogin } from '../services/contractorService';
import { getAddresses } from '../../address/services/addressService';
import { useToast, ConfirmModal } from '../../../../shared/components';
import { exportModuleData } from '../../../../shared/services/exportService';
import { parseExcelDate } from '../../../../shared/utils/dateUtils';

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

  // Login Modal states
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginTargetContractor, setLoginTargetContractor] = useState(null);
  const [existingLogin, setExistingLogin] = useState(null);

  const dropdownRef = useRef(null);
  const pageTopRef = useRef(null);
  const fileInputRef = useRef(null);

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
    setTimeout(() => {
      if (pageTopRef.current) {
        pageTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
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

  const handleCreateLoginClick = async (contractor) => {
    setLoginTargetContractor(contractor);
    try {
      const loginInfo = await getContractorLogin(contractor.id);
      setExistingLogin(loginInfo);
    } catch (err) {
      setExistingLogin(null);
    }
    setIsLoginModalOpen(true);
  };

  const handleLoginModalClose = () => {
    setIsLoginModalOpen(false);
    setLoginTargetContractor(null);
    setExistingLogin(null);
  };

  const handleLoginModalSave = async (credentials) => {
    if (!loginTargetContractor) return;
    try {
      await createContractorLogin(loginTargetContractor.id, credentials);
      addToast({ type: 'success', message: 'Contractor login saved successfully!' });
      setIsLoginModalOpen(false);
      setLoginTargetContractor(null);
      setExistingLogin(null);
    } catch (err) {
      console.error('Error creating contractor login:', err);
      addToast({
        type: 'error',
        message: err.response?.data?.messageToShow || 'Failed to create login.'
      });
    }
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
    
    if (type === 'Excel' || type === 'Excel Template') {
      const isTemplate = type === 'Excel Template';
      const aoa = [
        ['ID (Do Not Modify)', 'Code', 'Name', 'Address', 'Post Office', 'District', 'Pincode', 'PF Code', 'Date of Joining', 'PAN', 'Aadhaar', 'GST No', 'Bank Account', 'Bank Name', 'IFSC', 'Status']
      ];
      
      if (!isTemplate) {
        filteredContractors.forEach(c => {
          aoa.push([
            c.id, c.ccode, c.name, c.address, c.postOffice, c.district, c.pincode, c.pfCode, c.dateOfJoining, c.pan, c.aadhaar, c.gstNo, c.bankAccount, c.bankName, c.ifsc, c.status
          ]);
        });
      }
      
      const worksheet = XLSX.utils.aoa_to_sheet(aoa);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Contractors');
      XLSX.writeFile(workbook, `Contractors_${isTemplate ? 'Template' : 'Export'}.xlsx`);
      addToast({ type: 'success', message: `${type} downloaded!` });
      return;
    }

    try {
      addToast({ type: 'info', message: `${type} export started...` });
      await exportModuleData('contractors', type.toLowerCase());
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
          let cId = row['ID (Do Not Modify)'];
          
          const safeVal = (val) => {
            const str = val ? String(val).trim() : '';
            if (str.toUpperCase() === 'NA' || str.toUpperCase() === 'N/A' || str === '-') return '';
            return str;
          };

          if (!cId && row['Code']) {
            const existingContractor = contractors.find(c => 
              String(c.ccode).trim().toLowerCase() === String(row['Code']).trim().toLowerCase()
            );
            if (existingContractor) {
              cId = existingContractor.id;
            }
          }

          const contractorData = {
            id: cId || undefined,
            ccode: row['Code'] ? String(row['Code']) : '',
            name: row['Name'] ? String(row['Name']) : '',
            address: row['Address'] ? String(row['Address']) : '',
            postOffice: row['Post Office'] ? String(row['Post Office']) : '',
            district: row['District'] ? String(row['District']) : '',
            pincode: row['Pincode'] ? String(row['Pincode']) : '',
            pfCode: safeVal(row['PF Code']),
            dateOfJoining: parseExcelDate(row['Date of Joining']),
            pan: safeVal(row['PAN']),
            aadhaar: safeVal(row['Aadhaar']),
            gstNo: safeVal(row['GST No']),
            bankAccount: safeVal(row['Bank Account']),
            bankName: safeVal(row['Bank Name']),
            ifsc: safeVal(row['IFSC']),
            status: (row['Status'] === 1 || String(row['Status']).toLowerCase() === 'active' || String(row['Status']).toLowerCase() === 'true') ? 'Active' : 'Inactive'
          };
          if (!contractorData.name) continue;
          
          await saveContractor(contractorData, companyId, addresses);
          successCount++;
        }
        
        addToast({ type: 'success', message: `Successfully uploaded ${successCount} contractors.` });
        const updated = await getContractors(companyId);
        setContractors(updated);
      } catch (error) {
        console.error('Error importing Excel:', error);
        addToast({ type: 'error', message: 'Failed to import Excel file.' });
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = null;
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
    <div className={styles.container} ref={pageTopRef}>
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
                <button onClick={() => handleExportClick('Excel')}>
                  <FileSpreadsheet size={16} /> Excel
                </button>
                <button onClick={() => handleExportClick('Excel Template')}>
                  <FileSpreadsheet size={16} /> Excel Template
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
        onCreateLogin={handleCreateLoginClick}
      />

      <ContractorLoginModal
        isOpen={isLoginModalOpen}
        onClose={handleLoginModalClose}
        onSave={handleLoginModalSave}
        contractorName={loginTargetContractor?.name || ''}
        existingLogin={existingLogin}
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
