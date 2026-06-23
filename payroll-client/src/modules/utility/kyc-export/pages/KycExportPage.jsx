import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Download, FileSpreadsheet, Copy, FileText, File, Printer } from 'lucide-react';
import { useToast } from '../../../../shared/components';
import { getEmployees } from '../../../master/employee/services/employeeService';
import styles from '../components/KycExportPage.module.css';

// Preloaded mock database matching screenshot values
const MOCK_KYC_RECORDS = [
  { id: 'ky1', employeeName: 'NAMITA MAHATO', uan: '102318950034', typeCode: 'A', docNumber: '657199054792', nameAsPerDoc: 'NAMITA MAHATO', ifsc: '', expiryDate: '', dateOfJoining: '2026-06-23' },
  { id: 'ky2', employeeName: 'REKHA KUMAR', uan: '102318088496', typeCode: 'A', docNumber: '989264086590', nameAsPerDoc: 'REKHA KUMAR', ifsc: '', expiryDate: '', dateOfJoining: '2026-06-23' },
  { id: 'ky3', employeeName: 'NIYATI MACHHUAR', uan: '102318063813', typeCode: 'A', docNumber: '399417814159', nameAsPerDoc: 'NIYATI MACHHUAR', ifsc: '', expiryDate: '', dateOfJoining: '2026-06-23' },
  { id: 'ky4', employeeName: 'RAHUL KUMAR', uan: '101556427344', typeCode: 'A', docNumber: '804595857184', nameAsPerDoc: 'RAHUL KUMAR', ifsc: '', expiryDate: '', dateOfJoining: '2026-06-23' },
  { id: 'ky5', employeeName: 'MONARANJAN MAHATO', uan: '102316622517', typeCode: 'A', docNumber: '361931314912', nameAsPerDoc: 'MONARANJAN MAHATO', ifsc: '', expiryDate: '', dateOfJoining: '2026-06-23' },
  { id: 'ky6', employeeName: 'ARCHANA MAHATO', uan: '102318953530', typeCode: 'A', docNumber: '880453022750', nameAsPerDoc: 'ARCHANA MAHATO', ifsc: '', expiryDate: '', dateOfJoining: '2026-06-23' },
  { id: 'ky7', employeeName: 'MANIK MAHATO', uan: '102318956783', typeCode: 'A', docNumber: '547473395083', nameAsPerDoc: 'MANIK MAHATO', ifsc: '', expiryDate: '', dateOfJoining: '2026-06-23' },
  { id: 'ky8', employeeName: 'RABI NAYEK', uan: '102318079307', typeCode: 'A', docNumber: '414445977128', nameAsPerDoc: 'RABI NAYEK', ifsc: '', expiryDate: '', dateOfJoining: '2026-06-23' },
  { id: 'ky9', employeeName: 'BASAKI KUMAR', uan: '102318092814', typeCode: 'A', docNumber: '442467963633', nameAsPerDoc: 'BASAKI KUMAR', ifsc: '', expiryDate: '', dateOfJoining: '2026-06-23' },
  { id: 'ky10', employeeName: 'SHANTI KUMAR', uan: '102318098224', typeCode: 'A', docNumber: '902794851149', nameAsPerDoc: 'SHANTI KUMAR', ifsc: '', expiryDate: '', dateOfJoining: '2026-06-23' }
];

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

const KycExportPage = () => {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchTriggeredRange, setSearchTriggeredRange] = useState({ from: '', to: '' });
  const [localSearch, setLocalSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const addToast = useToast();

  // Load database employees flattened to individual KYC records
  const allKycRecords = useMemo(() => {
    const dbList = getEmployees() || [];
    const parsedKyc = [];

    dbList.forEach(emp => {
      if (emp.kycDetails && emp.kycDetails.length > 0) {
        emp.kycDetails.forEach(k => {
          parsedKyc.push({
            id: k.id || `kyc_${emp.id}_${k.documentType}`,
            employeeName: emp.memberName,
            uan: emp.uan,
            typeCode: k.documentType.substring(0, 1).toUpperCase(),
            docNumber: k.documentNumber,
            nameAsPerDoc: k.nameAsPerDocument,
            ifsc: k.ifsc || '',
            expiryDate: k.expiryDate || '',
            dateOfJoining: emp.dateOfJoining || '2026-06-23'
          });
        });
      }
    });

    // Merge in mocks that don't duplicate by UAN
    const dbUans = new Set(parsedKyc.map(k => k.uan));
    const uniqueMocks = MOCK_KYC_RECORDS.filter(k => !dbUans.has(k.uan));

    return [...parsedKyc, ...uniqueMocks];
  }, []);

  // Filter based on Date Range
  const filteredData = useMemo(() => {
    if (!searchTriggeredRange.from && !searchTriggeredRange.to) {
      return allKycRecords;
    }

    return allKycRecords.filter(rec => {
      const recDate = rec.dateOfJoining;
      if (!recDate) return true;
      if (searchTriggeredRange.from && recDate < searchTriggeredRange.from) {
        return false;
      }
      if (searchTriggeredRange.to && recDate > searchTriggeredRange.to) {
        return false;
      }
      return true;
    });
  }, [allKycRecords, searchTriggeredRange]);

  // Handle local text search query input
  const searchedData = useMemo(() => {
    const query = localSearch.toLowerCase().trim();
    if (!query) return filteredData;

    return filteredData.filter(rec => {
      return (
        (rec.employeeName && rec.employeeName.toLowerCase().includes(query)) ||
        (rec.uan && rec.uan.toLowerCase().includes(query)) ||
        (rec.typeCode && rec.typeCode.toLowerCase().includes(query)) ||
        (rec.docNumber && rec.docNumber.toLowerCase().includes(query)) ||
        (rec.nameAsPerDoc && rec.nameAsPerDoc.toLowerCase().includes(query)) ||
        (rec.ifsc && rec.ifsc.toLowerCase().includes(query))
      );
    });
  }, [filteredData, localSearch]);

  // Close dropdown on outside click
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

  // Reset pagination if filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTriggeredRange, localSearch, pageSize]);

  // Pagination bounds
  const totalEntries = searchedData.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);
  
  const paginatedData = useMemo(() => {
    return searchedData.slice(startIndex, endIndex);
  }, [searchedData, startIndex, endIndex]);

  const handleSearch = () => {
    setSearchTriggeredRange({ from: fromDate, to: toDate });
    const fromStr = fromDate ? formatDate(fromDate) : 'any';
    const toStr = toDate ? formatDate(toDate) : 'any';
    addToast({
      type: 'success',
      message: `Search query completed for date range: ${fromStr} to ${toStr}`
    });
  };

  const handleClearFilters = () => {
    setFromDate('');
    setToDate('');
    setSearchTriggeredRange({ from: '', to: '' });
    setLocalSearch('');
    addToast({
      type: 'info',
      message: 'Search filters cleared.'
    });
  };

  const handleExport = (type) => {
    if (totalEntries === 0) {
      addToast({
        type: 'error',
        message: 'No records available to export!'
      });
      setIsDropdownOpen(false);
      return;
    }

    if (type === 'Copy') {
      addToast({
        type: 'success',
        message: 'Copied filtered KYC records to clipboard!'
      });
    } else {
      addToast({
        type: 'info',
        message: `${type} export started for ${totalEntries} KYC records!`
      });
    }
    setIsDropdownOpen(false);
  };

  return (
    <div className={styles.container}>
      {/* Page Header with download actions dropdown */}
      <div className={styles.headerSection}>
        <div>
          <h2 className={styles.title}>KYC Export</h2>
          <p className={styles.subtitle}>
            Export employee Aadhaar, PAN card numbers, and bank account validation registers.
          </p>
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

      {/* Date Range Selector Card */}
      <div className={styles.card}>
        <div className={styles.filterRow}>
          <div className={styles.filterGroup}>
            <span className={styles.label}>From Date</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className={styles.input}
              placeholder="SELECT DATE*"
            />
          </div>

          <div className={styles.filterGroup}>
            <span className={styles.label}>To Date</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className={styles.input}
              placeholder="SELECT DATE*"
            />
          </div>
          
          <button
            type="button"
            className={styles.searchBtn}
            onClick={handleSearch}
          >
            <Search size={16} />
            Search
          </button>

          {(fromDate || toDate || localSearch) && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={handleClearFilters}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Grid Table Card */}
      <div className={styles.tableCard}>
        {/* Controls Row - Search input aligned right */}
        <div className={styles.tableControls} style={{ justifyContent: 'flex-end' }}>
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search..."
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* Data Grid Table */}
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '70px', textAlign: 'center' }}>SR.NO.</th>
                <th>Employee Name</th>
                <th>Universal Account Number (UAN)</th>
                <th>KYC Type Code</th>
                <th>KYC Document Number</th>
                <th>Name as on KYC document</th>
                <th>IFSC</th>
                <th>Expiry Date</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No matching records found.
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, index) => (
                  <tr key={row.id}>
                    <td style={{ textAlign: 'center', fontWeight: '500' }}>
                      {startIndex + index + 1}
                    </td>
                    <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{row.employeeName}</td>
                    <td style={{ color: 'var(--text-primary)' }}>{row.uan}</td>
                    <td style={{ textAlign: 'center', fontWeight: '600' }}>{row.typeCode}</td>
                    <td>{row.docNumber}</td>
                    <td>{row.nameAsPerDoc}</td>
                    <td>{row.ifsc || '-'}</td>
                    <td>{formatDate(row.expiryDate)}</td>
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
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
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
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={styles.pageBtn}
            >
              Previous
            </button>

            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`${styles.pageBtn} ${currentPage === i + 1 ? styles.activePageBtn : ''}`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={styles.pageBtn}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KycExportPage;
