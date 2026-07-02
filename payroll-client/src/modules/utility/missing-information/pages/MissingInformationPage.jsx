import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, RotateCcw, Edit, AlertCircle, MessageCircle } from 'lucide-react';
import { useToast, Pagination } from '../../../../shared/components';
import { getMissingDetails } from '../../../master/employee/services/employeeService';
import { getWhatsAppStatus } from '../../whatsapp/services/whatsappService';
import WhatsAppBulkSendModal from '../../whatsapp/components/WhatsAppBulkSendModal';
import styles from '../components/MissingInformationPage.module.css';

const WhatsAppIcon = ({ size = 24 }) => (
  <img src="/wa-whatsapp-icon.png" width={size} height={size} alt="WhatsApp" />
);

const DIAGNOSTIC_FIELDS = [
  { key: 'Name', label: 'Name' },
  { key: 'Dob', label: 'Dob' },
  { key: 'Doj', label: 'Doj' },
  { key: 'Gender', label: 'Gender' },
  { key: 'Relation', label: 'Relation' },
  { key: 'Marital Status', label: 'Marital Status' },
  { key: 'Qualification', label: 'Qualification' },
  { key: 'AADHAAR KYC', label: 'AADHAAR KYC' },
  { key: 'PAN KYC', label: 'PAN KYC' },
  { key: 'BANK KYC', label: 'BANK KYC' }
];

const MissingInformationPage = () => {
  const navigate = useNavigate();
  const addToast = useToast();

  const allFieldKeys = useMemo(() => DIAGNOSTIC_FIELDS.map(f => f.key), []);

  // Selection states for checkbox grid
  const [selectedFields, setSelectedFields] = useState(allFieldKeys);
  // Applied search states for results table
  const [appliedFields, setAppliedFields] = useState([]);

  // Local text search & pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [diagnosticResults, setDiagnosticResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isWaConnected, setIsWaConnected] = useState(false);

  useEffect(() => {
    // Check WhatsApp status on mount
    getWhatsAppStatus().then(res => {
      if (res && res.status === true && res.data) {
        setIsWaConnected(res.data.status === 'connected');
      } else {
        setIsWaConnected(false);
      }
    }).catch(() => setIsWaConnected(false));
  }, []);

  // Apply query text matching locally after fetching from DB
  const searchedResults = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return diagnosticResults;
    return diagnosticResults.filter(emp => {
      const matchName = emp.memberName && emp.memberName.toLowerCase().includes(query);
      const matchUan = emp.uan && emp.uan.toLowerCase().includes(query);
      const matchMissing = emp.missingFields && emp.missingFields.some(f => f.toLowerCase().includes(query));
      return matchName || matchUan || matchMissing;
    });
  }, [diagnosticResults, searchTerm]);

  // Reset pagination on filter updates
  useEffect(() => {
    setCurrentPage(1);
  }, [appliedFields, searchTerm, pageSize]);

  // Pagination index bounds
  const totalEntries = searchedResults.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);
  const paginatedData = useMemo(() => {
    return searchedResults.slice(startIndex, endIndex);
  }, [searchedResults, startIndex, endIndex]);

  const handleToggleField = (key) => {
    setSelectedFields(prev =>
      prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };

  const handleSearch = async () => {
    if (selectedFields.length === 0) {
      addToast({
        type: 'error',
        message: 'Please select at least one field for diagnostic audit.'
      });
      return;
    }

    setIsLoading(true);
    try {
      const companyId = localStorage.getItem('selectedCompany');
      if (!companyId) {
        addToast({ type: 'warning', message: 'No company selected! Please select a company on login.' });
        return;
      }

      const res = await getMissingDetails(companyId, selectedFields);
      setDiagnosticResults(res || []);
      setAppliedFields(selectedFields);

      addToast({
        type: 'success',
        message: `Diagnostic audit completed for ${selectedFields.length} selected categories.`
      });
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to fetch diagnostic data' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFields(allFieldKeys);
    setAppliedFields([]);
    setDiagnosticResults([]);
    setSearchTerm('');
    addToast({
      type: 'info',
      message: 'Diagnostic parameters reset to default.'
    });
  };

  const handleEditClick = (emp) => {
    addToast({
      type: 'info',
      message: `Redirecting to edit employee: ${emp.memberName}`
    });
    // Navigate to employee edit profile route, or employee master page
    navigate('/master/employee');
  };

  return (
    <div className={styles.container}>
      {/* Page Title & Header */}
      <div className={styles.headerSection}>
        <div>
          <h2 className={styles.title}>Missing Information</h2>
          <p className={styles.subtitle}>
            Analyze the database to discover employees missing mandatory profile details or KYC records.
          </p>
        </div>
      </div>

      {/* Audit Form Grid Selector Card */}
      <div className={styles.card}>
        <h3 className={styles.sectionTitle}>
          <AlertCircle size={18} style={{ color: 'var(--primary)' }} />
          Select Diagnostic Categories
        </h3>

        <div className={styles.checkboxGrid}>
          {DIAGNOSTIC_FIELDS.map(field => {
            const isActive = selectedFields.includes(field.key);
            return (
              <div
                key={field.key}
                className={`${styles.checkboxItem} ${isActive ? styles.checkboxItemActive : ''}`}
                onClick={() => handleToggleField(field.key)}
              >
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={() => { }} // Toggled by parent click
                  className={styles.checkboxInput}
                />
                <span className={styles.checkboxLabel}>{field.label}</span>
              </div>
            );
          })}
        </div>

        <div className={styles.buttonGroup}>
          <button
            type="button"
            className={styles.searchBtn}
            onClick={handleSearch}
          >
            <Search size={16} />
            Search
          </button>
          <button
            type="button"
            className={styles.resetBtn}
            onClick={handleReset}
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </div>

      {/* Results Table Card */}
      <div className={styles.tableCard}>
        <div className={styles.tableControls}>
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, UAN, or field..."
              className={styles.searchInput}
            />
          </div>
          {diagnosticResults.length > 0 && isWaConnected && (
            <button
              className={styles.resetBtn}
              style={{ backgroundColor: '#25D366', color: 'white', borderColor: '#25D366', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontWeight: 'bold' }}
              onClick={() => setIsWhatsAppModalOpen(true)}
            >
              <WhatsAppIcon size={18} />
              {/* Send WhatsApp Message */}
            </button>
          )}
        </div>

        {/* Data Table */}
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '80px', textAlign: 'center' }}>Sr. No.</th>
                <th>Employee Name</th>
                <th>Universal Account Number (UAN)</th>
                <th>Missing Fields</th>
                <th style={{ width: '100px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    Loading...
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No employees with missing details matching selected criteria.
                  </td>
                </tr>
              ) : (
                paginatedData.map((emp, index) => (
                  <tr key={emp.id}>
                    <td style={{ textAlign: 'center', fontWeight: '500' }}>
                      {startIndex + index + 1}
                    </td>
                    <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                      {emp.memberName}
                    </td>
                    <td style={{ color: 'var(--text-primary)' }}>
                      {emp.uan || '-'}
                    </td>
                    <td>
                      <div className={styles.badgeContainer}>
                        {emp.missingFields.map(f => {
                          const isAuditTarget = appliedFields.includes(f);
                          return (
                            <span
                              key={f}
                              className={`${styles.badge} ${isAuditTarget ? styles.badgeActive : styles.badgeInactive
                                }`}
                            >
                              {f}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td>
                      <div className={styles.actionCell}>
                        <button
                          onClick={() => handleEditClick(emp)}
                          title="Update Employee Details"
                          className={styles.editBtn}
                        >
                          <Edit size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer controls: Info text, limit control and pagination */}
        <div className={styles.tableFooter}>
          <div className={styles.footerLeft}>
            <div className={styles.limitControl}>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className={styles.limitSelect}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>records per page</span>
            </div>
            <div className={styles.infoText}>
              Showing {totalEntries > 0 ? startIndex + 1 : 0} to {endIndex} of {totalEntries} entries
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
      </div>

      {isWhatsAppModalOpen && (
        <WhatsAppBulkSendModal
          employees={diagnosticResults}
          onClose={() => setIsWhatsAppModalOpen(false)}
        />
      )}
    </div>
  );
};

export default MissingInformationPage;
