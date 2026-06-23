import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Download, FileSpreadsheet, Copy, FileText, File, Printer, RefreshCw } from 'lucide-react';
import { useToast, MonthYearPicker } from '../../../../../shared/components';
import { getEmployees } from '../../../../master/employee/services/employeeService';
import styles from '../components/OfficeSalaryPage.module.css';

const MOCK_OFFICE_SALARY_RECORDS = [
  { id: 'off1', name: 'MEGHNATH MAHATO', memberId: '0004465', uan: '100226766722', basicSalary: 8470, daysWorked: 24, holiday: 7, absent: 0, additional: 0 },
  { id: 'off2', name: 'SRIHARI KUMAR', memberId: '0005868', uan: '100362255467', basicSalary: 8200, daysWorked: 23, holiday: 7, absent: 1, additional: 0 },
  { id: 'off3', name: 'NABIN MAHATO', memberId: '0005870', uan: '100247084817', basicSalary: 8200, daysWorked: 22, holiday: 7, absent: 2, additional: 0 },
  { id: 'off4', name: 'SANJAY MAHATO', memberId: '0016058', uan: '101002763152', basicSalary: 8000, daysWorked: 24, holiday: 7, absent: 0, additional: 0 },
  { id: 'off5', name: 'RAJU KUMAR', memberId: '0016060', uan: '101002763175', basicSalary: 8000, daysWorked: 22, holiday: 7, absent: 2, additional: 0 },
  { id: 'off6', name: 'BIPADTARAN GOSWAMI', memberId: '0016062', uan: '100115419794', basicSalary: 8700, daysWorked: 24, holiday: 7, absent: 0, additional: 0 },
  { id: 'off7', name: 'SWAPAN MAHATO', memberId: '0017224', uan: '102163961347', basicSalary: 7000, daysWorked: 24, holiday: 7, absent: 0, additional: 0 },
  { id: 'off8', name: 'KIRAN KUMAR', memberId: '0017225', uan: '100194181241', basicSalary: 7500, daysWorked: 24, holiday: 7, absent: 0, additional: 0 },
  { id: 'off9', name: 'RAJ KHATIK', memberId: '0017450', uan: '101613506630', basicSalary: 9000, daysWorked: 17, holiday: 7, absent: 7, additional: 0 },
  { id: 'off10', name: 'KANDAN KUMAR', memberId: '17291', uan: '100188684022', basicSalary: 7700, daysWorked: 19, holiday: 7, absent: 5, additional: 0 }
];

const OfficeSalaryPage = () => {
  const [selectedMonth, setSelectedMonth] = useState('2026-01'); // Default to match screenshot 01/2026
  const [searchTriggeredMonth, setSearchTriggeredMonth] = useState('2026-01');
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const dropdownRef = useRef(null);
  const addToast = useToast();

  // Load database employees of type "OFFICE STAFF" and calculate their salary values
  const salaryRecords = useMemo(() => {
    const dbList = getEmployees() || [];
    const dbOfficeStaff = dbList.filter(emp => emp.employeeType === 'OFFICE STAFF');

    const mappedDbRecords = dbOfficeStaff.map(emp => {
      // Basic salary extraction or default
      const basicSalary = emp.basicSalary || 8000;
      // Default working days for simulated month: 24 worked, 7 holidays, 0 absent
      const daysWorked = 24;
      const holiday = 7;
      const absent = 0;
      const additional = 0;

      return {
        id: emp.id,
        name: emp.memberName,
        memberId: emp.memberId || '-',
        uan: emp.uan,
        basicSalary,
        daysWorked,
        holiday,
        absent,
        additional
      };
    });

    // Merge database list and mockup records avoiding duplicates by UAN
    const uniqueUans = new Set(mappedDbRecords.map(e => e.uan));
    const uniqueMocks = MOCK_OFFICE_SALARY_RECORDS.filter(e => !uniqueUans.has(e.uan));

    const combinedList = [...mappedDbRecords, ...uniqueMocks];

    // Compute derived payroll columns for each record
    return combinedList.map(row => {
      // Deduction divisor is 24 days. Total Amount = Basic - (Basic / 24) * Absent
      const absentDeduction = row.absent > 0 ? Math.round((row.basicSalary / 24) * row.absent) : 0;
      const totalAmount = Math.max(0, row.basicSalary - absentDeduction + row.additional);
      
      const pt = 0; // Professional tax
      const pf = Math.round(totalAmount * 0.10); // 10% PF Rate
      const esic = Math.ceil(totalAmount * 0.0075); // 0.75% ESIC Rate, rounded up
      const netPaid = totalAmount - pt - pf - esic;

      return {
        ...row,
        totalAmount,
        pt,
        pf,
        esic,
        netPaid
      };
    });
  }, []);

  // Filter list based on wage month (if applicable) and local search query
  const filteredRecords = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    
    // If selectedMonth is cleared, show all, otherwise filter
    let result = salaryRecords;
    if (searchTriggeredMonth) {
      // In a real system we would filter by month log, here we keep the loaded list
    }

    if (query) {
      result = result.filter(rec => {
        return (
          (rec.name && rec.name.toLowerCase().includes(query)) ||
          (rec.memberId && rec.memberId.toLowerCase().includes(query)) ||
          (rec.uan && rec.uan.toLowerCase().includes(query))
        );
      });
    }

    return result;
  }, [salaryRecords, searchTriggeredMonth, searchTerm]);

  // Aggregate columns totals for the summary row
  const totals = useMemo(() => {
    const sums = {
      basicSalary: 0,
      daysWorked: 0,
      holiday: 0,
      absent: 0,
      additional: 0,
      totalAmount: 0,
      pt: 0,
      pf: 0,
      esic: 0,
      netPaid: 0
    };

    filteredRecords.forEach(rec => {
      sums.basicSalary += Number(rec.basicSalary) || 0;
      sums.daysWorked += Number(rec.daysWorked) || 0;
      sums.holiday += Number(rec.holiday) || 0;
      sums.absent += Number(rec.absent) || 0;
      sums.additional += Number(rec.additional) || 0;
      sums.totalAmount += Number(rec.totalAmount) || 0;
      sums.pt += Number(rec.pt) || 0;
      sums.pf += Number(rec.pf) || 0;
      sums.esic += Number(rec.esic) || 0;
      sums.netPaid += Number(rec.netPaid) || 0;
    });

    return sums;
  }, [filteredRecords]);

  // Pagination bounds
  const totalEntries = filteredRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);

  const paginatedData = useMemo(() => {
    return filteredRecords.slice(startIndex, endIndex);
  }, [filteredRecords, startIndex, endIndex]);

  // Reset page index if search or limit configuration updates
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize, searchTriggeredMonth]);

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

  const handleSearch = () => {
    setSearchTriggeredMonth(selectedMonth);
    const mStr = selectedMonth ? selectedMonth.split('-')[1] + '/' + selectedMonth.split('-')[0] : 'all';
    addToast({
      type: 'success',
      message: `Office salary calculation sheet loaded for month: ${mStr}`
    });
  };

  const handleClearFilters = () => {
    setSelectedMonth('');
    setSearchTriggeredMonth('');
    setSearchTerm('');
    addToast({
      type: 'info',
      message: 'Salary filters cleared.'
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
        message: 'Copied Office Salary Sheet data to clipboard!'
      });
    } else {
      addToast({
        type: 'info',
        message: `${type} export generated for ${totalEntries} staff records!`
      });
    }
    setIsDropdownOpen(false);
  };

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.headerSection}>
        <div>
          <h2 className={styles.title}>Office Salary Sheet</h2>
          <p className={styles.subtitle}>
            Review and compile monthly payroll registers, working days deductions, statutory PF and ESIC compliance balances for office staff.
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

      {/* Month Picker card */}
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

          {(selectedMonth || searchTerm) && (
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
        {/* Controls Row */}
        <div className={styles.tableControls}>
          <div className={styles.totalRecords}>
            Total Staff Records: {totalEntries}
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
                <th style={{ width: '80px', textAlign: 'center', paddingLeft: '8px', paddingRight: '8px' }}>Sr No.</th>
                <th>Employee Name</th>
                <th>Basic Salary</th>
                <th>No. Of Days Worked</th>
                <th>Holiday</th>
                <th>Absent</th>
                <th>Additional</th>
                <th>Total Amount</th>
                <th>PT</th>
                <th>PF</th>
                <th>ESIC</th>
                <th>Net Amount Paid</th>
                <th style={{ width: '220px' }}>Signature Of The Employee</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={13} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No matching records found.
                  </td>
                </tr>
              ) : (
                <>
                  {paginatedData.map((row, index) => (
                    <tr key={row.id}>
                      <td style={{ textAlign: 'center', fontWeight: '500', paddingLeft: '8px', paddingRight: '8px' }}>
                        {startIndex + index + 1}
                      </td>
                      <td>
                        <div className={styles.employeeStack}>
                          <span className={styles.employeeName}>{row.name}</span>
                          <span className={styles.employeeMeta}>Member Id: {row.memberId}</span>
                          <span className={styles.employeeMeta}>UAN: {row.uan}</span>
                        </div>
                      </td>
                      <td>{row.basicSalary}</td>
                      <td>{row.daysWorked}</td>
                      <td>{row.holiday}</td>
                      <td>{row.absent}</td>
                      <td>{row.additional}</td>
                      <td style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{row.totalAmount}</td>
                      <td>{row.pt}</td>
                      <td>{row.pf}</td>
                      <td>{row.esic}</td>
                      <td style={{ fontWeight: '600', color: 'var(--primary)' }}>{row.netPaid}</td>
                      <td></td>
                    </tr>
                  ))}
                  
                  {/* Summary/Totals Row */}
                  <tr className={styles.totalRow}>
                    <td colSpan={2} style={{ textAlign: 'right', paddingRight: '20px' }}>Total</td>
                    <td>{totals.basicSalary}</td>
                    <td>{totals.daysWorked}</td>
                    <td>{totals.holiday}</td>
                    <td>{totals.absent}</td>
                    <td>{totals.additional}</td>
                    <td>{totals.totalAmount}</td>
                    <td>{totals.pt}</td>
                    <td>{totals.pf}</td>
                    <td>{totals.esic}</td>
                    <td style={{ color: 'var(--primary)' }}>{totals.netPaid}</td>
                    <td></td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer controls: Info text, limit selector, and pagination */}
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

export default OfficeSalaryPage;
