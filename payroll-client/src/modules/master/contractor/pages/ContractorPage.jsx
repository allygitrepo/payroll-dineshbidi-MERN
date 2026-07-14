import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Download, FileSpreadsheet, Copy, FileText, File, Printer, Briefcase, CalendarDays, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import styles from '../components/ContractorPage.module.css';
import ContractorForm from '../components/ContractorForm';
import ContractorTable from '../components/ContractorTable';
import ContractorLoginModal from '../components/ContractorLoginModal';
import { getContractors, saveContractor, deleteContractor, createContractorLogin, getContractorLogin } from '../services/contractorService';
import { getAddresses } from '../../address/services/addressService';
import { useToast, ConfirmModal, Pagination } from '../../../../shared/components';
import { exportModuleData } from '../../../../shared/services/exportService';
import { parseExcelDate } from '../../../../shared/utils/dateUtils';
import { MessageCircle } from 'lucide-react';
import WhatsAppBulkSendModal from '../../../utility/whatsapp/components/WhatsAppBulkSendModal';
import { getWhatsAppStatus } from '../../../utility/whatsapp/services/whatsappService';
import { usePermissions } from '../../../../shared/hooks/usePermissions';

const ContractorPage = () => {
  const navigate = useNavigate();
  const addToast = useToast();
  const [contractors, setContractors] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContractor, setEditingContractor] = useState(null);

  const { canRead, canCreate, canEdit, canDelete } = usePermissions('contractor');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppEmployees, setWhatsAppEmployees] = useState([]);
  const [isFetchingWhatsApp, setIsFetchingWhatsApp] = useState(false);
  const [isWhatsAppConnected, setIsWhatsAppConnected] = useState(false);

  // Pagination & Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalEntries, setTotalEntries] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

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

  // Check WhatsApp connection status on mount
  useEffect(() => {
    getWhatsAppStatus()
      .then(res => {
        if (res && res.status === true && res.data) {
          setIsWhatsAppConnected(res.data.status === 'connected');
        } else {
          setIsWhatsAppConnected(false);
        }
      })
      .catch(() => setIsWhatsAppConnected(false));
  }, []);

  // Load initial addresses
  useEffect(() => {
    const fetchStaticData = async () => {
      const companyId = localStorage.getItem('selectedCompany');
      if (!companyId) return;
      try {
        const loadedAddresses = await getAddresses(companyId);
        setAddresses(loadedAddresses);
      } catch (err) {
        console.error('Error loading contractor static data:', err);
      }
    };
    fetchStaticData();
  }, []);

  // Fetch contractors dynamically with pagination and filtering
  const fetchContractors = async () => {
    const companyId = localStorage.getItem('selectedCompany');
    if (!companyId) {
      addToast({ type: 'warning', message: 'No company selected! Please select a company on login.' });
      return;
    }

    setIsLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: pageSize,
        search: searchTerm,
        status: statusFilter === 'ACTIVE' ? '1' : statusFilter === 'INACTIVE' ? '0' : ''
      };

      const response = await getContractors(companyId, params);
      setContractors(response.data || []);
      setTotalEntries(response.total || 0);
      setTotalPages(response.totalPages || 1);
    } catch (err) {
      console.error('Error fetching contractors:', err);
      addToast({ type: 'error', message: 'Failed to load contractor data.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContractors();
  }, [currentPage, pageSize, searchTerm, statusFilter, addToast]);

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
        await deleteContractor(deleteTargetId, companyId);
        fetchContractors();
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
      await saveContractor(contractorData, companyId, addresses);
      fetchContractors();
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
      fetchContractors(); // Refresh the list to update the login icon
    } catch (err) {
      console.error('Error creating contractor login:', err);
      addToast({
        type: 'error',
        message: err.response?.data?.messageToShow || 'Failed to create login.'
      });
    }
  };

  const handleOpenWhatsAppModal = async () => {
    const companyId = localStorage.getItem('selectedCompany');
    if (!companyId) return;

    setIsFetchingWhatsApp(true);
    try {
      const params = {
        search: searchTerm,
        status: statusFilter === 'ACTIVE' ? '1' : statusFilter === 'INACTIVE' ? '0' : ''
        // Intentionally omitting page and limit to fetch all matching records
      };

      const response = await getContractors(companyId, params);
      setWhatsAppEmployees(Array.isArray(response) ? response : response.data || []);
      setIsWhatsAppModalOpen(true);
    } catch (err) {
      console.error('Error fetching contractors for WhatsApp:', err);
      addToast({ type: 'error', message: 'Failed to load contractors for WhatsApp.' });
    } finally {
      setIsFetchingWhatsApp(false);
    }
  };

  // Filtered listing based on Search and Status Filter
  const filteredContractors = contractors;

  // Export handlers
  const handleExportClick = async (type) => {
    setIsDropdownOpen(false);

    if (type === 'Excel' || type === 'Excel Template') {
      const isTemplate = type === 'Excel Template';
      const aoa = [
        ['ID (Do Not Modify)', 'Code', 'Name', 'Address', 'Post Office', 'District', 'Pincode', 'PF Code', 'Date of Joining', 'PAN', 'Aadhaar', 'GST No', 'Bank Account', 'Bank Name', 'IFSC', 'Status', 'WhatsApp Number', 'Login ID', 'Password', 'Send to WhatsApp']
      ];

      if (!isTemplate) {
        filteredContractors.forEach(c => {
          aoa.push([
            c.id, c.ccode, c.name, c.address, c.postOffice, c.district, c.pincode, c.pfCode, c.dateOfJoining, c.pan, c.aadhaar, c.gstNo, c.bankAccount, c.bankName, c.ifsc, c.status, c.whatsappNumber || '', c.loginId || '', '', 'NO'
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
            whatsappNumber: safeVal(row['WhatsApp Number'] || row['whatsapp_number'] || row['whatsappNumber'] || row['WhatsApp'] || row['whatsapp'] || ''),
            status: (row['Status'] === 1 || String(row['Status']).toLowerCase() === 'active' || String(row['Status']).toLowerCase() === 'true') ? 'Active' : 'Inactive'
          };
          if (!contractorData.name) continue;

          const updatedList = await saveContractor(contractorData, companyId, addresses);
          successCount++;

          const loginIdVal = safeVal(row['Login ID'] || row['Login id'] || row['login id'] || row['Username'] || row['username'] || '');
          const passwordVal = safeVal(row['Password'] || row['password'] || '');
          const sendToWhatsappVal = safeVal(row['Send to WhatsApp'] || row['Send to whatsapp'] || row['send to whatsapp'] || 'NO').toUpperCase();

          if (loginIdVal) {
            const savedContractor = updatedList.find(c => {
              if (contractorData.ccode && c.ccode) {
                return String(c.ccode).trim().toLowerCase() === String(contractorData.ccode).trim().toLowerCase();
              }
              return String(c.name).trim().toLowerCase() === String(contractorData.name).trim().toLowerCase();
            });

            if (savedContractor) {
              await createContractorLogin(savedContractor.id, {
                username: loginIdVal,
                password: passwordVal || undefined,
                sendWhatsapp: sendToWhatsappVal === 'YES' || sendToWhatsappVal === 'TRUE' || sendToWhatsappVal === '1'
              });
            }
          }
        }

        addToast({ type: 'success', message: `Successfully uploaded ${successCount} contractors.` });
        fetchContractors();
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
          `${c.ccode}\t${c.name}\t${c.address}\t${c.postOffice}\t${c.district}\t${c.pincode}\t${c.pfCode}\t${c.dateOfJoining}\t${c.pan}\t${c.aadhaar}\t${c.gstNo}\t${c.bankAccount}\t${c.bankName}\t${c.ifsc}\t${c.status}\t${c.whatsappNumber || ''}\t${c.loginId || ''}\t\tNO`
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
          {!isFormOpen && canCreate && (
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
            onClick={() => navigate('/utility/contractor-data-import')}
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
          {isWhatsAppConnected && (
            <button
              style={{ backgroundColor: 'transparent', border: 'none', opacity: isFetchingWhatsApp ? 0.7 : 1, cursor: isFetchingWhatsApp ? 'not-allowed' : 'pointer', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={handleOpenWhatsAppModal}
              disabled={isFetchingWhatsApp}
              title="Send WhatsApp Message"
            >
              {isFetchingWhatsApp ? <span style={{ fontSize: '14px', color: 'var(--text-color)', fontWeight: 'bold' }}>...</span> : <img src="/wa-whatsapp-icon.png" width={38} height={38} alt="WhatsApp" />}
            </button>
          )}
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
      <div style={{ position: 'relative' }}>
        {isLoading && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="loader"></div>
          </div>
        )}
        <ContractorTable
          data={filteredContractors}
          searchTerm={searchTerm}
          onSearchChange={(val) => { setSearchTerm(val); setCurrentPage(1); }}
          statusFilter={statusFilter}
          onStatusFilterChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onCreateLogin={handleCreateLoginClick}
          canEdit={canEdit}
          canDelete={canDelete}
        />

        {/* Pagination controls */}
        {!isFormOpen && totalEntries > 0 && (
          <div className={styles.tableFooter} style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
            <div className={styles.footerLeft} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div className={styles.limitControl} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className={styles.limitSelect}
                  style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>records per page</span>
              </div>
              <div className={styles.infoText} style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalEntries)} of {totalEntries} entries
              </div>
            </div>

            <div className={styles.pagination}>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        )}
      </div>

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

      {isWhatsAppModalOpen && (
        <WhatsAppBulkSendModal
          employees={whatsAppEmployees} // Works for contractors too
          recipientType="contractor"
          onClose={() => setIsWhatsAppModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ContractorPage;
