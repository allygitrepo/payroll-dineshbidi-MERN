import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Download, FileSpreadsheet, Copy, FileText, File, Printer, Upload } from 'lucide-react';
import styles from '../components/EmployeePage.module.css';
import EmployeeForm from '../components/EmployeeForm';
import EmployeeTable from '../components/EmployeeTable';
import { getEmployees, saveEmployee, deleteEmployee, toggleAbryStatus } from '../services/employeeService';
import { getAddresses } from '../../address/services/addressService';
import { getContractors } from '../../contractor/services/contractorService';
import { useToast, ConfirmModal, Pagination, Loader } from '../../../../shared/components';
import { exportModuleData } from '../../../../shared/services/exportService';
import WhatsAppBulkSendModal from '../../../utility/whatsapp/components/WhatsAppBulkSendModal';
import { getWhatsAppStatus } from '../../../utility/whatsapp/services/whatsappService';
import { usePermissions } from '../../../../shared/hooks/usePermissions';

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

const EmployeePage = () => {
  const addToast = useToast();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formInitialTab, setFormInitialTab] = useState('Personal Info');

  const { canRead, canCreate, canEdit, canDelete } = usePermissions('employee');

  const [searchTerm, setSearchTerm] = useState('');
  const [employeeTypeFilter, setEmployeeTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIVE'); // Active by default
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppEmployees, setWhatsAppEmployees] = useState([]);
  const [isFetchingWhatsApp, setIsFetchingWhatsApp] = useState(false);
  const [isWhatsAppConnected, setIsWhatsAppConnected] = useState(false);

  // Pagination & Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalEntries, setTotalEntries] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Confirm delete states
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const dropdownRef = useRef(null);
  const pageTopRef = useRef(null);

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

  // Load initial static data (Addresses & Contractors)
  useEffect(() => {
    const fetchStaticData = async () => {
      const companyId = localStorage.getItem('selectedCompany');
      if (!companyId) return;
      try {
        const [loadedAddresses, loadedContractors] = await Promise.all([
          getAddresses(companyId),
          getContractors(companyId)
        ]);
        setAddresses(loadedAddresses);
        setContractors(loadedContractors);
      } catch (err) {
        console.error('Error fetching static data:', err);
      }
    };
    fetchStaticData();
  }, []);

  // Fetch employees dynamically with pagination and filtering
  const fetchEmployees = async () => {
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
        status: statusFilter === 'ACTIVE' ? '1' : statusFilter === 'INACTIVE' ? '0' : '',
        employeeType: employeeTypeFilter
      };

      const response = await getEmployees(companyId, params);
      setEmployees(response.data || []);
      setTotalEntries(response.total || 0);
      setTotalPages(response.totalPages || 1);
    } catch (err) {
      console.error('Error fetching employees:', err);
      addToast({ type: 'error', message: 'Failed to load employee data.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenWhatsAppModal = async () => {
    const companyId = localStorage.getItem('selectedCompany');
    if (!companyId) return;

    setIsFetchingWhatsApp(true);
    try {
      const params = {
        search: searchTerm,
        status: statusFilter === 'ACTIVE' ? '1' : statusFilter === 'INACTIVE' ? '0' : '',
        employeeType: employeeTypeFilter
        // Intentionally omitting page and limit to fetch all matching records
      };

      const response = await getEmployees(companyId, params);
      setWhatsAppEmployees(Array.isArray(response) ? response : response.data || []);
      setIsWhatsAppModalOpen(true);
    } catch (err) {
      console.error('Error fetching employees for WhatsApp:', err);
      addToast({ type: 'error', message: 'Failed to load employees for WhatsApp.' });
    } finally {
      setIsFetchingWhatsApp(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [currentPage, pageSize, searchTerm, statusFilter, employeeTypeFilter, addToast]);

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
    setEditingEmployee(null);
    setFormInitialTab('Personal Info');
    setIsFormOpen(true);
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormInitialTab('Personal Info');
    setIsFormOpen(true);
    setTimeout(() => {
      if (pageTopRef.current) {
        pageTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
  };

  const handleRegisterFace = (employee) => {
    setEditingEmployee(employee);
    setFormInitialTab('Face Registration');
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
      setIsSaving(true);
      try {
        await deleteEmployee(deleteTargetId, companyId);
        fetchEmployees();
        addToast({ type: 'success', message: 'Employee deleted successfully!' });
      } catch (err) {
        console.error('Error deleting employee:', err);
        addToast({ type: 'error', message: 'Failed to delete employee.' });
      } finally {
        setIsSaving(false);
      }
    }
    setIsConfirmOpen(false);
    setDeleteTargetId(null);
  };

  const handleCancelDelete = () => {
    setIsConfirmOpen(false);
    setDeleteTargetId(null);
  };

  const handleSave = async (employeeData) => {
    const companyId = localStorage.getItem('selectedCompany');
    setIsSaving(true);
    try {
      await saveEmployee(employeeData, companyId, addresses, contractors);
      fetchEmployees();
      setIsFormOpen(false);
      setEditingEmployee(null);
      addToast({
        type: 'success',
        message: employeeData.id ? 'Employee updated successfully!' : 'Employee created successfully!'
      });
    } catch (err) {
      console.error('Error saving employee:', err);
      addToast({
        type: 'error',
        message: err.response?.data?.messageToShow || err.message || 'Failed to save employee.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleAbry = async (employeeId) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return;

    const companyId = localStorage.getItem('selectedCompany');
    setIsSaving(true);
    try {
      const updatedEmployees = await toggleAbryStatus(employeeId, employee.abryApplicable, companyId);
      setEmployees(updatedEmployees);
      addToast({
        type: 'success',
        message: `ABRY Applicable status toggled for ${employee.memberName}!`
      });
    } catch (err) {
      console.error('Error toggling ABRY status:', err);
      addToast({
        type: 'error',
        message: 'Failed to toggle ABRY status.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingEmployee(null);
  };

  // Filtered employees listing (Since search is backend now, we just pass the backend data directly)
  const filteredEmployees = employees;

  // Export handlers
  const handleExportClick = async (type) => {
    setIsDropdownOpen(false);
    try {
      addToast({ type: 'info', message: `${type} export started...` });

      const companyId = localStorage.getItem('selectedCompany');
      let allRecords = employees;

      if (companyId) {
        try {
          const params = {
            search: searchTerm,
            status: statusFilter === 'ACTIVE' ? '1' : statusFilter === 'INACTIVE' ? '0' : '',
            employeeType: employeeTypeFilter
            // Omitting page and limit parameters so backend returns ALL records
          };
          const res = await getEmployees(companyId, params);
          const list = Array.isArray(res) ? res : (res.data || []);
          if (list && list.length > 0) {
            allRecords = list;
          }
        } catch (e) {
          console.warn('Could not fetch all employee records for export, using current page:', e);
        }
      }

      const headers = [
        "Sr. No.", "ABRY Applicable", "UAN", "IP Number", "Member ID", 
        "Member Name", "Date Of Birth", "Date of Joining", "Aadhaar Card", "Gender", 
        "Father/Husband Name", "Relation", "Marital Status", "Mobile", "Qualification", 
        "Employee Type", "Contractor", "Address", "Post Office", "District", 
        "Pincode", "Nationality", "Email", "Int. Worker", "Physical Handicap", 
        "PMRPY", "PAN Card", "Bank Account No", "Bank Name", "IFSC Code", 
        "Status", "Face Status"
      ];
      const rows = allRecords.map((e, idx) => [
        idx + 1,
        e.abryApplicable ? "Yes" : "No",
        e.uan || "-",
        e.ipNumber || "-",
        e.memberId || "-",
        e.memberName || e.name || "-",
        formatDate(e.dob),
        formatDate(e.dateOfJoining || e.date_of_joining),
        e.aadhaarCard || e.aadhar || "-",
        e.gender || "-",
        e.fatherHusbandName || e.father_or_husband_name || "-",
        e.relation || "-",
        e.maritalStatus || e.marital_status || "-",
        e.mobile || "-",
        e.qualification || "-",
        e.employeeType || e.employee_type || "-",
        (typeof e.contractor === 'object' ? e.contractor?.name : e.contractor) || "SELF",
        (typeof e.address === 'object' ? e.address?.address : e.address) || "-",
        (typeof e.address === 'object' ? e.address?.post_office : e.postOffice) || "-",
        (typeof e.address === 'object' ? e.address?.district : e.district) || "-",
        (typeof e.address === 'object' ? e.address?.pincode : e.pincode) || "-",
        e.nationality || "INDIAN",
        e.email || "-",
        (e.isInternationalWorker === 'YES' || e.is_international_worker) ? "Yes" : "No",
        (e.physicalHandicap === 'YES' || e.physical_handicap) ? "Yes" : "No",
        (e.pmrpy === 'YES' || e.pmrpy) ? "Yes" : "No",
        e.kycDetails?.find(k => k.documentType === 'PAN')?.documentNumber || e.kycDetail?.pan || "-",
        e.kycDetails?.find(k => k.documentType === 'BANK PASSBOOK')?.documentNumber || e.kycDetail?.bank_ac || "-",
        e.kycDetails?.find(k => k.documentType === 'BANK PASSBOOK')?.bankName || e.kycDetail?.bank_name || "-",
        e.kycDetails?.find(k => k.documentType === 'BANK PASSBOOK')?.ifsc || e.kycDetail?.ifsc || "-",
        (e.status === true || e.status === 'Active' || e.status === 1) ? "Active" : "Inactive",
        (e.faceDescriptorPath || e.face_descriptor_path) ? "Enrolled" : "Not Enrolled"
      ]);

      await exportModuleData('employees', type.toLowerCase(), {
        title: "Employee Master Report",
        headers,
        rows
      });
      addToast({ type: 'success', message: `${type} export completed successfully!` });
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', message: `Failed to export ${type} file.` });
    }
  };

  const handleCopyClick = async () => {
    setIsDropdownOpen(false);
    let allRecords = employees;
    const companyId = localStorage.getItem('selectedCompany');
    if (companyId) {
      try {
        const params = {
          search: searchTerm,
          status: statusFilter === 'ACTIVE' ? '1' : statusFilter === 'INACTIVE' ? '0' : '',
          employeeType: employeeTypeFilter
        };
        const res = await getEmployees(companyId, params);
        const list = Array.isArray(res) ? res : (res.data || []);
        if (list && list.length > 0) {
          allRecords = list;
        }
      } catch (e) {
        console.warn('Could not fetch all records for copy:', e);
      }
    }
    const headers = [
      "Sr. No.", "ABRY Applicable", "UAN", "IP Number", "Member ID", 
      "Member Name", "Date Of Birth", "Date of Joining", "Aadhaar Card", "Gender", 
      "Father/Husband Name", "Relation", "Marital Status", "Mobile", "Qualification", 
      "Employee Type", "Contractor", "Address", "Post Office", "District", 
      "Pincode", "Nationality", "Email", "Int. Worker", "Physical Handicap", 
      "PMRPY", "PAN Card", "Bank Account No", "Bank Name", "IFSC Code", 
      "Status", "Face Status"
    ];
    const headerRow = headers.join('\t');
    const dataRows = allRecords.map((e, idx) => [
      idx + 1,
      e.abryApplicable ? "Yes" : "No",
      e.uan || "-",
      e.ipNumber || "-",
      e.memberId || "-",
      e.memberName || e.name || "-",
      formatDate(e.dob),
      formatDate(e.dateOfJoining || e.date_of_joining),
      e.aadhaarCard || e.aadhar || "-",
      e.gender || "-",
      e.fatherHusbandName || e.father_or_husband_name || "-",
      e.relation || "-",
      e.maritalStatus || e.marital_status || "-",
      e.mobile || "-",
      e.qualification || "-",
      e.employeeType || e.employee_type || "-",
      (typeof e.contractor === 'object' ? e.contractor?.name : e.contractor) || "SELF",
      (typeof e.address === 'object' ? e.address?.address : e.address) || "-",
      (typeof e.address === 'object' ? e.address?.post_office : e.postOffice) || "-",
      (typeof e.address === 'object' ? e.address?.district : e.district) || "-",
      (typeof e.address === 'object' ? e.address?.pincode : e.pincode) || "-",
      e.nationality || "INDIAN",
      e.email || "-",
      (e.isInternationalWorker === 'YES' || e.is_international_worker) ? "Yes" : "No",
      (e.physicalHandicap === 'YES' || e.physical_handicap) ? "Yes" : "No",
      (e.pmrpy === 'YES' || e.pmrpy) ? "Yes" : "No",
      e.kycDetails?.find(k => k.documentType === 'PAN')?.documentNumber || e.kycDetail?.pan || "-",
      e.kycDetails?.find(k => k.documentType === 'BANK PASSBOOK')?.documentNumber || e.kycDetail?.bank_ac || "-",
      e.kycDetails?.find(k => k.documentType === 'BANK PASSBOOK')?.bankName || e.kycDetail?.bank_name || "-",
      e.kycDetails?.find(k => k.documentType === 'BANK PASSBOOK')?.ifsc || e.kycDetail?.ifsc || "-",
      (e.status === true || e.status === 'Active' || e.status === 1) ? "Active" : "Inactive",
      (e.faceDescriptorPath || e.face_descriptor_path) ? "Enrolled" : "Not Enrolled"
    ].join('\t')).join('\n');

    const text = `${headerRow}\n${dataRows}`;
    navigator.clipboard.writeText(text);
    addToast({ type: 'success', message: 'Copied all employee records to clipboard!' });
  };

  return (
    <div className={styles.container} ref={pageTopRef}>
      {(isLoading || isSaving) && <Loader fullPage={true} />}
      {/* Header section with heading and actions */}
      <div className={styles.headerSection}>
        <h1 className={styles.title}>Employee</h1>
        <div className={styles.headerActions}>
          {!isFormOpen && canCreate && (
            <button onClick={handleAddNew} className={styles.addBtn}>
              <Plus size={18} /> Employee
            </button>
          )}

          <button
            className={styles.addBtn}
            style={{ backgroundColor: 'var(--primary)', opacity: 0.9 }}
            onClick={() => navigate('/utility/employee-data-import')}
          >
            <Upload size={18} /> Import
          </button>
          {/* 
          {isWhatsAppConnected && (
            <button
              className={styles.addBtn}
              style={{ backgroundColor: '#25D366', opacity: isFetchingWhatsApp ? 0.7 : 1, cursor: isFetchingWhatsApp ? 'not-allowed' : 'pointer' }}
              onClick={handleOpenWhatsAppModal}
              disabled={isFetchingWhatsApp}
            >
              <img src="/wa-whatsapp-icon.png" width={18} height={18} alt="WhatsApp" style={{ verticalAlign: 'middle', marginRight: '4px' }} /> {isFetchingWhatsApp ? 'Loading...' : 'WhatsApp'}
            </button>
          )} */}

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

      {/* Render tabbed form card if open */}
      {isFormOpen && (
        <EmployeeForm
          employee={editingEmployee}
          addresses={addresses}
          contractors={contractors}
          onSave={handleSave}
          onCancel={handleCancel}
          initialTab={formInitialTab}
        />
      )}

      {/* Render table card containing list */}
      <div style={{ position: 'relative' }}>
        {isLoading && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="loader"></div>
          </div>
        )}
        <EmployeeTable
          data={filteredEmployees}
          searchTerm={searchTerm}
          onSearchChange={(val) => { setSearchTerm(val); setCurrentPage(1); }}
          selectedType={employeeTypeFilter}
          onTypeFilterChange={(val) => { setEmployeeTypeFilter(val); setCurrentPage(1); }}
          selectedStatus={statusFilter}
          onStatusFilterChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onToggleAbry={handleToggleAbry}
          onRegisterFace={handleRegisterFace}
          canEdit={canEdit}
          canDelete={canDelete}
        />

        {/* Pagination controls directly mimicking MissingInformationPage */}
        {!isFormOpen && totalEntries > 0 && (
          <div className={styles.tableFooter} style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
            <div className={styles.footerLeft}>
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

      {/* Reusable Confirm Delete Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Employee"
        message="Are you sure you want to delete this employee? This action cannot be undone."
      />

      {isWhatsAppModalOpen && (
        <WhatsAppBulkSendModal
          employees={whatsAppEmployees}
          onClose={() => setIsWhatsAppModalOpen(false)}
        />
      )}
    </div>
  );
};

export default EmployeePage;
