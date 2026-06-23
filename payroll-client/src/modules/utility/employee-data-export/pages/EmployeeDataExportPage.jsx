import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Download, FileSpreadsheet, Copy, FileText, File, Printer } from 'lucide-react';
import { useToast, MonthYearPicker } from '../../../../shared/components';
import { getEmployees } from '../../../master/employee/services/employeeService';
import styles from '../components/EmployeeDataExportPage.module.css';

// Extra mock database to match the screenshot style values
const EXTRA_MOCK_EMPLOYEES = [
  { id: 'm1', uan: '100030547463', ipNumber: '7431095090', memberId: '16729', memberName: 'ASWINI KUMAR', dob: '1993-08-24', dateOfJoining: '2025-04-01', gender: 'MALE', fatherHusbandName: 'MADHUSUDAN KUMAR', relation: 'FATHER' },
  { id: 'm2', uan: '100071775230', ipNumber: '7431097178', memberId: '16730', memberName: 'ABALA KUMAR', dob: '1984-02-04', dateOfJoining: '2009-06-01', gender: 'FEMALE', fatherHusbandName: 'MAGARAM KUMAR', relation: 'FATHER' },
  { id: 'm3', uan: '100074055850', ipNumber: '7431097302', memberId: '16731', memberName: 'ADITYA KUMAR', dob: '1975-05-02', dateOfJoining: '1999-01-01', gender: 'MALE', fatherHusbandName: 'HABLU KUMAR', relation: 'FATHER' },
  { id: 'm4', uan: '100074323433', ipNumber: '7431099562', memberId: '16732', memberName: 'AGAMANI KUMAR', dob: '1975-08-13', dateOfJoining: '2010-10-02', gender: 'FEMALE', fatherHusbandName: 'PHALGUNI KUMAR', relation: 'FATHER' },
  { id: 'm5', uan: '100076209547', ipNumber: '7431085231', memberId: '16733', memberName: 'AJIT MAHATO', dob: '1989-02-02', dateOfJoining: '2008-01-01', gender: 'MALE', fatherHusbandName: 'SHRIPADA MAHATO', relation: 'FATHER' },
  { id: 'm6', uan: '100079498235', ipNumber: '7431088720', memberId: '16734', memberName: 'AMBIKA KUMAR', dob: '1970-08-07', dateOfJoining: '2001-09-01', gender: 'FEMALE', fatherHusbandName: 'INDRAJIT KUMAR', relation: 'FATHER' },
  { id: 'm7', uan: '100082035888', ipNumber: '7431085139', memberId: '16735', memberName: 'ANADI ROHIDAS', dob: '1973-01-17', dateOfJoining: '2006-12-01', gender: 'MALE', fatherHusbandName: 'HABLU ROHIDAS', relation: 'FATHER' },
  { id: 'm8', uan: '100082628428', ipNumber: '7431089731', memberId: '16736', memberName: 'ANANDA KUMAR', dob: '1990-09-09', dateOfJoining: '2011-03-01', gender: 'MALE', fatherHusbandName: 'SHARANAN KUMAR', relation: 'FATHER' }
];

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

const EmployeeDataExportPage = () => {
  const [selectedMonth, setSelectedMonth] = useState('2026-06'); // default to match screenshot 06/2026
  const [searchTriggeredMonth, setSearchTriggeredMonth] = useState('2026-06');
  const [localSearch, setLocalSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const addToast = useToast();

  // Load database employees combined with extra mockup rows
  const allEmployees = useMemo(() => {
    const dbList = getEmployees() || [];
    // remove duplicates by UAN between db list and mockup
    const dbUans = new Set(dbList.map(e => e.uan));
    const uniqueMocks = EXTRA_MOCK_EMPLOYEES.filter(e => !dbUans.has(e.uan));
    return [...dbList, ...uniqueMocks];
  }, []);

  // Filter employees based on joining date <= selected month
  const filteredByMonth = useMemo(() => {
    if (!searchTriggeredMonth) return allEmployees;

    // Filter joining dates up to the selected searchTriggeredMonth
    const result = allEmployees.filter(emp => {
      if (!emp.dateOfJoining) return true;
      const joinMonth = emp.dateOfJoining.substring(0, 7);
      return joinMonth <= searchTriggeredMonth;
    });

    return result;
  }, [allEmployees, searchTriggeredMonth]);

  // Handle local text search query input
  const searchedData = useMemo(() => {
    const query = localSearch.toLowerCase().trim();
    if (!query) return filteredByMonth;

    return filteredByMonth.filter(emp => {
      return (
        (emp.uan && emp.uan.toLowerCase().includes(query)) ||
        (emp.ipNumber && emp.ipNumber.toLowerCase().includes(query)) ||
        (emp.memberName && emp.memberName.toLowerCase().includes(query)) ||
        (emp.fatherHusbandName && emp.fatherHusbandName.toLowerCase().includes(query)) ||
        (emp.relation && emp.relation.toLowerCase().includes(query)) ||
        (emp.memberId && emp.memberId.toLowerCase().includes(query))
      );
    });
  }, [filteredByMonth, localSearch]);

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
  }, [searchTriggeredMonth, localSearch, pageSize]);

  // Pagination bounds
  const totalEntries = searchedData.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);
  
  const paginatedData = useMemo(() => {
    return searchedData.slice(startIndex, endIndex);
  }, [searchedData, startIndex, endIndex]);

  const handleSearch = () => {
    setSearchTriggeredMonth(selectedMonth);
    const mStr = selectedMonth ? selectedMonth.split('-')[1] + '/' + selectedMonth.split('-')[0] : 'all';
    addToast({
      type: 'success',
      message: `Search query completed for wage month: ${mStr}`
    });
  };

  const handleClearFilters = () => {
    setSelectedMonth('');
    setSearchTriggeredMonth('');
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
        message: 'Copied filtered employees list to clipboard!'
      });
    } else {
      addToast({
        type: 'info',
        message: `${type} export started for ${totalEntries} employee records!`
      });
    }
    setIsDropdownOpen(false);
  };

  return (
    <div className={styles.container}>
      {/* Page Header with download actions dropdown */}
      <div className={styles.headerSection}>
        <div>
          <h2 className={styles.title}>Employee Data Export</h2>
          <p className={styles.subtitle}>
            Configure, filter, and export employee data registers into customized Excel formats.
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

      {/* Month Year Selector Card */}
      <div className={styles.card}>
        <div className={styles.filterRow}>
          <div className={styles.filterGroup}>
            <span className={styles.label}>Month and Year</span>
            <MonthYearPicker
              value={selectedMonth}
              onChange={setSelectedMonth}
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

          {(selectedMonth || localSearch) && (
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
                <th style={{ width: '70px', textAlign: 'center' }}>Sr. No.</th>
                <th>UAN</th>
                <th>IP Number</th>
                <th>Previous Member Id</th>
                <th>Member Name</th>
                <th>Date Of Birth</th>
                <th>DateOfJoining</th>
                <th>Gender</th>
                <th>Father/Husband Name</th>
                <th>Relationship</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No matching records found.
                  </td>
                </tr>
              ) : (
                paginatedData.map((emp, index) => (
                  <tr key={emp.id}>
                    <td style={{ textAlign: 'center', fontWeight: '500' }}>
                      {startIndex + index + 1}
                    </td>
                    <td style={{ color: 'var(--text-primary)' }}>{emp.uan}</td>
                    <td>{emp.ipNumber}</td>
                    <td>{emp.memberId || '-'}</td>
                    <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{emp.memberName}</td>
                    <td>{formatDate(emp.dob)}</td>
                    <td>{formatDate(emp.dateOfJoining)}</td>
                    <td>{emp.gender}</td>
                    <td>{emp.fatherHusbandName}</td>
                    <td>{emp.relation || 'FATHER'}</td>
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

export default EmployeeDataExportPage;
