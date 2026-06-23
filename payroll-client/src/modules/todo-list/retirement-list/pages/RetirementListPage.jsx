import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Download, FileSpreadsheet, Copy, FileText, File, Printer, UserCheck } from 'lucide-react';
import { useToast } from '../../../../shared/components';
import { getEmployees } from '../../../master/employee/services/employeeService';
import styles from '../components/RetirementListPage.module.css';

const MOCK_RETIREMENT_EMPLOYEES = [
  { id: 'ret1', memberName: 'SUDEBI KUMAR', memberId: '0016492', uan: '101888461316', dob: '1968-04-22', employeeType: 'BIDI MAKER', contractor: 'BIPADTARAN KUMAR' },
  { id: 'ret2', memberName: 'BIMALA KUMAR', memberId: '0005906', uan: '100147588188', dob: '1968-05-07', employeeType: 'BIDI MAKER', contractor: 'PARAN CHANDRA KUMAR' },
  { id: 'ret3', memberName: 'KETAKI KUMAR', memberId: '0016466', uan: '101888453173', dob: '1968-05-17', employeeType: 'BIDI MAKER', contractor: 'BIPADTARAN KUMAR' },
  { id: 'ret4', memberName: 'ARUN ROHIDAS', memberId: '0002041', uan: '100090965328', dob: '1968-07-06', employeeType: 'BIDI MAKER', contractor: 'LAKHIRAM KUMAR' },
  { id: 'ret5', memberName: 'BHAKU MAHATO', memberId: '0004872', uan: '100110358674', dob: '1968-08-05', employeeType: 'BIDI MAKER', contractor: 'SHREEPADA MAHATO' },
  { id: 'ret6', memberName: 'MEGHNATH MAHATO', memberId: '0004465', uan: '100226766722', dob: '1968-10-16', employeeType: 'OFFICE STAFF', contractor: '-' },
  { id: 'ret7', memberName: 'TARUNKANTI KUMAR', memberId: '0000407', uan: '100389767705', dob: '1968-10-23', employeeType: 'BIDI MAKER', contractor: 'TARUN KANTI KUMAR' },
  { id: 'ret8', memberName: 'GANESH KUMAR', memberId: '0004339', uan: '100150263249', dob: '1968-11-06', employeeType: 'BIDI MAKER', contractor: 'SHISHUPAL KUMAR' },
  { id: 'ret9', memberName: 'INDRAJIT KUMAR', memberId: '0000381', uan: '100167385757', dob: '1969-03-06', employeeType: 'BIDI MAKER', contractor: 'INDRAJIT KUMAR' },
  { id: 'ret10', memberName: 'BAHRAT CHANDRA DAS', memberId: '0016239', uan: '101238434600', dob: '1969-03-14', employeeType: 'BIDI MAKER', contractor: 'SAHUD ANSARI' },
  { id: 'ret11', memberName: 'MEGHLAL MAHATO', memberId: '0004450', uan: '100226766710', dob: '1968-12-10', employeeType: 'PACKING STAFF', contractor: 'TARUN KANTI KUMAR' }
];

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

const calculateAge = (dobString) => {
  if (!dobString) return 0;
  const birthDate = new Date(dobString);
  if (isNaN(birthDate.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const RetirementListPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const addToast = useToast();

  // Load database employees who are 58 or older, and merge with mock rows
  const candidates = useMemo(() => {
    const dbList = getEmployees() || [];
    // Filter database employees who are 58 or older
    const dbRetirees = dbList.filter(emp => calculateAge(emp.dob) >= 58);
    
    // Map them to match the grid structure
    const mappedDbRetirees = dbRetirees.map(emp => ({
      id: emp.id,
      memberName: emp.memberName,
      memberId: emp.memberId || '-',
      uan: emp.uan,
      dob: emp.dob,
      employeeType: emp.employeeType || 'OFFICE STAFF',
      contractor: emp.contractor || 'SELF'
    }));

    // Avoid duplicates by UAN
    const uniqueUans = new Set(mappedDbRetirees.map(e => e.uan));
    const uniqueMocks = MOCK_RETIREMENT_EMPLOYEES.filter(e => !uniqueUans.has(e.uan));

    return [...mappedDbRetirees, ...uniqueMocks];
  }, []);

  // Filter local data using text search queries
  const searchedCandidates = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return candidates;

    return candidates.filter(cand => {
      return (
        (cand.memberName && cand.memberName.toLowerCase().includes(query)) ||
        (cand.memberId && cand.memberId.toLowerCase().includes(query)) ||
        (cand.uan && cand.uan.toLowerCase().includes(query)) ||
        (cand.employeeType && cand.employeeType.toLowerCase().includes(query)) ||
        (cand.contractor && cand.contractor.toLowerCase().includes(query))
      );
    });
  }, [candidates, searchTerm]);

  // Pagination bounds
  const totalEntries = searchedCandidates.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);

  const paginatedData = useMemo(() => {
    return searchedCandidates.slice(startIndex, endIndex);
  }, [searchedCandidates, startIndex, endIndex]);

  // Reset pagination if filters/page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  // Close dropdown on click outside
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
        message: 'Copied retirement candidates list to clipboard!'
      });
    } else {
      addToast({
        type: 'info',
        message: `${type} export started for ${totalEntries} retirement candidate records!`
      });
    }
    setIsDropdownOpen(false);
  };

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.headerSection}>
        <div>
          <h2 className={styles.title}>58 Years of Age List</h2>
          <p className={styles.subtitle}>
            Register of active employees who have reached or are approaching the retirement age of 58 years.
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

      {/* Grid Table Card */}
      <div className={styles.tableCard}>
        {/* Controls Row */}
        <div className={styles.tableControls}>
          <div className={styles.totalRecords}>
            Total Candidates: {totalEntries}
          </div>
          
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
                <th style={{ width: '100px', textAlign: 'center', paddingLeft: '8px', paddingRight: '8px' }}>Sr No.</th>
                <th>Name</th>
                <th>Member Id</th>
                <th>UAN</th>
                <th>Date of Birth</th>
                <th>Type of Employee</th>
                <th>Contractor Name</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No matching records found.
                  </td>
                </tr>
              ) : (
                paginatedData.map((cand, index) => (
                  <tr key={cand.id}>
                    <td style={{ textAlign: 'center', fontWeight: '500', paddingLeft: '8px', paddingRight: '8px' }}>
                      {startIndex + index + 1}
                    </td>
                    <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                      {cand.memberName}
                    </td>
                    <td>{cand.memberId}</td>
                    <td style={{ fontWeight: '500' }}>{cand.uan}</td>
                    <td>{formatDate(cand.dob)}</td>
                    <td>{cand.employeeType}</td>
                    <td>{cand.contractor || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Controls */}
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

export default RetirementListPage;
