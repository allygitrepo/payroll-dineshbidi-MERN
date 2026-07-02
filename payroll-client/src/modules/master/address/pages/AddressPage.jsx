import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Download, FileSpreadsheet, Copy, FileText, File, Printer, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import styles from '../components/AddressPage.module.css';
import AddressForm from '../components/AddressForm';
import AddressTable from '../components/AddressTable';
import { getAddresses, saveAddress, deleteAddress } from '../services/addressService';
import { useToast, ConfirmModal } from '../../../../shared/components';
import { exportModuleData } from '../../../../shared/services/exportService';
import { usePermissions } from '../../../../shared/hooks/usePermissions';

const AddressPage = () => {
  const addToast = useToast();
  const [addresses, setAddresses] = useState([]);
  const [editingAddress, setEditingAddress] = useState(null);

  const { canCreate, canEdit, canDelete } = usePermissions('address');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Active');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Confirm delete states
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const dropdownRef = useRef(null);
  const pageTopRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load initial address records
  useEffect(() => {
    const fetchAddresses = async () => {
      const companyId = localStorage.getItem('selectedCompany');
      if (!companyId) {
        addToast({ type: 'warning', message: 'No company selected! Please select a company on login.' });
        return;
      }
      try {
        const data = await getAddresses(companyId);
        setAddresses(data);
      } catch (err) {
        console.error('Error fetching addresses:', err);
        addToast({ type: 'error', message: 'Failed to load addresses.' });
      }
    };
    fetchAddresses();
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

  const handleEdit = (addr) => {
    setEditingAddress(addr);
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
        const updated = await deleteAddress(deleteTargetId, companyId);
        setAddresses(updated);
        addToast({ type: 'success', message: 'Address deleted successfully!' });
      } catch (err) {
        console.error('Error deleting address:', err);
        addToast({ type: 'error', message: 'Failed to delete address.' });
      }
    }
    setIsConfirmOpen(false);
    setDeleteTargetId(null);
  };

  const handleCancelDelete = () => {
    setIsConfirmOpen(false);
    setDeleteTargetId(null);
  };

  const handleSave = async (addressData) => {
    const companyId = localStorage.getItem('selectedCompany');
    try {
      const updated = await saveAddress(addressData, companyId);
      setAddresses(updated);
      setEditingAddress(null);
      addToast({
        type: 'success',
        message: addressData.id ? 'Address updated successfully!' : 'Address created successfully!'
      });
    } catch (err) {
      console.error('Error saving address:', err);
      addToast({
        type: 'error',
        message: err.response?.data?.messageToShow || 'Failed to save address.'
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingAddress(null);
  };

  // Filtered address list based on search keyword and status
  const filteredAddresses = useMemo(() => {
    return addresses.filter((addr) => {
      // 1. Status Filter
      if (statusFilter !== 'All' && addr.status !== statusFilter) {
        return false;
      }
      
      // 2. Keyword Search
      const search = searchTerm.toLowerCase();
      return (
        (addr.address && addr.address.toLowerCase().includes(search)) ||
        (addr.postOffice && addr.postOffice.toLowerCase().includes(search)) ||
        (addr.district && addr.district.toLowerCase().includes(search)) ||
        (addr.pincode && addr.pincode.toLowerCase().includes(search))
      );
    });
  }, [addresses, searchTerm, statusFilter]);

  // Export alerts
  const handleExportClick = async (type) => {
    setIsDropdownOpen(false);
    
    if (type === 'Excel' || type === 'Excel Template') {
      const isTemplate = type === 'Excel Template';
      const aoa = [
        ['ID (Do Not Modify)', 'Address', 'Post Office', 'District', 'Pincode', 'Status']
      ];
      
      if (!isTemplate) {
        filteredAddresses.forEach(a => {
          aoa.push([
            a.id, a.address, a.postOffice, a.district, a.pincode, a.status
          ]);
        });
      }
      
      const worksheet = XLSX.utils.aoa_to_sheet(aoa);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Addresses');
      XLSX.writeFile(workbook, `Addresses_${isTemplate ? 'Template' : 'Export'}.xlsx`);
      addToast({ type: 'success', message: `${type} downloaded!` });
      return;
    }

    addToast({ type: 'info', message: `${type} export started for ${filteredAddresses.length} addresses!` });
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
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const importedData = XLSX.utils.sheet_to_json(worksheet);

        let successCount = 0;
        for (const row of importedData) {
          const aId = row['ID (Do Not Modify)'];
          
          const addressData = {
            id: aId || undefined,
            address: row['Address'] ? String(row['Address']) : '',
            postOffice: row['Post Office'] ? String(row['Post Office']) : '',
            district: row['District'] ? String(row['District']) : '',
            pincode: row['Pincode'] ? String(row['Pincode']) : '',
            status: (row['Status'] === 1 || String(row['Status']).toLowerCase() === 'active' || String(row['Status']).toLowerCase() === 'true') ? 'Active' : 'Inactive'
          };
          if (!addressData.address) continue;
          
          await saveAddress(addressData, companyId);
          successCount++;
        }
        
        addToast({ type: 'success', message: `Successfully uploaded ${successCount} addresses.` });
        const updated = await getAddresses(companyId);
        setAddresses(updated);
      } catch (error) {
        console.error('Error importing Excel:', error);
        addToast({ type: 'error', message: 'Failed to import Excel file.' });
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = null;
  };

  const handleCopyClick = () => {
    const text = filteredAddresses
      .map((a) => `${a.address}\t${a.postOffice}\t${a.district}\t${a.pincode}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    addToast({ type: 'success', message: 'Copied filtered addresses list to clipboard!' });
    setIsDropdownOpen(false);
  };

  return (
    <div className={styles.container} ref={pageTopRef}>
      {/* Header section with heading and actions */}
      <div className={styles.headerSection}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 className={styles.title} style={{ fontSize: '1.75rem', fontWeight: 700 }}>Address</h1>
        </div>
        <div className={styles.headerActions}>
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

      {/* Render form card based on permissions */}
      {(canCreate || (canEdit && editingAddress)) && (
        <AddressForm
          address={editingAddress}
          onSave={handleSave}
          onCancel={handleCancelEdit}
        />
      )}

      {/* Render table card containing list */}
      <AddressTable
        data={filteredAddresses}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onEdit={canEdit ? handleEdit : undefined}
        onDelete={canDelete ? handleDeleteClick : undefined}
      />

      {/* Reusable Confirm Delete Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Address"
        message="Are you sure you want to delete this address? This action cannot be undone."
      />
    </div>
  );
};

export default AddressPage;
