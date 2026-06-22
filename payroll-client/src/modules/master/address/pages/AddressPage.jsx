import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Download, FileSpreadsheet, Copy, FileText, File, Printer } from 'lucide-react';
import styles from '../components/AddressPage.module.css';
import AddressForm from '../components/AddressForm';
import AddressTable from '../components/AddressTable';
import { getAddresses, saveAddress, deleteAddress } from '../services/addressService';
import { useToast, ConfirmModal } from '../../../../shared/components';

const AddressPage = () => {
  const addToast = useToast();
  const [addresses, setAddresses] = useState([]);
  const [editingAddress, setEditingAddress] = useState(null);

  // Search filter and download dropdown states
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Confirm delete states
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const dropdownRef = useRef(null);

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

  // Filtered address list based on search keyword
  const filteredAddresses = useMemo(() => {
    return addresses.filter((addr) => {
      const search = searchTerm.toLowerCase();
      return (
        (addr.address && addr.address.toLowerCase().includes(search)) ||
        (addr.postOffice && addr.postOffice.toLowerCase().includes(search)) ||
        (addr.district && addr.district.toLowerCase().includes(search)) ||
        (addr.pincode && addr.pincode.toLowerCase().includes(search))
      );
    });
  }, [addresses, searchTerm]);

  // Export alerts
  const handleExportClick = (type) => {
    addToast({ type: 'info', message: `${type} export started for ${filteredAddresses.length} addresses!` });
    setIsDropdownOpen(false);
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
    <div className={styles.container}>
      {/* Header section with heading and actions */}
      <div className={styles.headerSection}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 className={styles.title} style={{ fontSize: '1.75rem', fontWeight: 700 }}>Address</h1>
        </div>
        <div className={styles.headerActions}>
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

      {/* Render form card (always open) */}
      <AddressForm
        address={editingAddress}
        onSave={handleSave}
        onCancel={handleCancelEdit}
      />

      {/* Render table card containing list */}
      <AddressTable
        data={filteredAddresses}
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
        title="Delete Address"
        message="Are you sure you want to delete this address? This action cannot be undone."
      />
    </div>
  );
};

export default AddressPage;
