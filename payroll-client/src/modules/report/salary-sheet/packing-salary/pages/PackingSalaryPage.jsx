import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Download, FileSpreadsheet, Copy, FileText, File, Printer } from 'lucide-react';
import { useToast, MonthYearPicker } from '../../../../../shared/components';
import { getEmployees } from '../../../../master/employee/services/employeeService';
import styles from '../components/PackingSalaryPage.module.css';

const MOCK_PACKING_SALARY_RECORDS = [
  { id: 'pack1', name: 'SAMIR MACHHWAR', memberId: '0005872', uan: '100329862005', daysWorked: 23, unit1: 0, unit1Rate: 109, unit2: 0, unit2Rate: 165, unit3: 57, unit3Rate: 149, unit4: 0, unit4Rate: 235, extra: 0 },
  { id: 'pack2', name: 'NARESH BAGDI', memberId: '0005876', uan: '100251178836', daysWorked: 23, unit1: 0, unit1Rate: 109, unit2: 0, unit2Rate: 165, unit3: 54, unit3Rate: 149, unit4: 0, unit4Rate: 235, extra: 0 },
  { id: 'pack3', name: 'RAMKRISHNA BAGTI', memberId: '16936', uan: '101177429203', daysWorked: 0, unit1: 0, unit1Rate: 109, unit2: 0, unit2Rate: 165, unit3: 0, unit3Rate: 149, unit4: 0, unit4Rate: 235, extra: 0 }
];

const PackingSalaryPage = () => {
  const [selectedMonth, setSelectedMonth] = useState('2026-01'); // Default to match screenshot 01/2026
  const [searchTriggeredMonth, setSearchTriggeredMonth] = useState('2026-01');
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const dropdownRef = useRef(null);
  const addToast = useToast();

  // Load database employees of type "PACKING STAFF" and calculate their salary values
  const salaryRecords = useMemo(() => {
    const dbList = getEmployees() || [];
    const dbPackingStaff = dbList.filter(emp => emp.employeeType === 'PACKING STAFF');

    const mappedDbRecords = dbPackingStaff.map(emp => {
      // Default working days for simulated month: 23 worked, all unit outputs at 0
      const daysWorked = 23;
      const unit1 = 0;
      const unit1Rate = 109;
      const unit2 = 0;
      const unit2Rate = 165;
      const unit3 = 0;
      const unit3Rate = 149;
      const unit4 = 0;
      const unit4Rate = 235;
      const extra = 0;

      return {
        id: emp.id,
        name: emp.memberName,
        memberId: emp.memberId || '-',
        uan: emp.uan,
        daysWorked,
        unit1,
        unit1Rate,
        unit2,
        unit2Rate,
        unit3,
        unit3Rate,
        unit4,
        unit4Rate,
        extra
      };
    });

    // Merge database list and mockup records avoiding duplicates by UAN
    const uniqueUans = new Set(mappedDbRecords.map(e => e.uan));
    const uniqueMocks = MOCK_PACKING_SALARY_RECORDS.filter(e => !uniqueUans.has(e.uan));

    const combinedList = [...mappedDbRecords, ...uniqueMocks];

    // Compute derived payroll columns for each record
    return combinedList.map(row => {
      const totalWages = (row.unit1 * row.unit1Rate) + (row.unit2 * row.unit2Rate) + (row.unit3 * row.unit3Rate) + (row.unit4 * row.unit4Rate);
      // Holiday payment is exactly 1/6th of total wages
      const holidayPayment = Math.round(totalWages / 6);
      const grossAmount = totalWages + row.extra + holidayPayment;
      
      const pt = 0; // Professional tax
      const pf = Math.round(grossAmount * 0.10); // 10% PF Rate
      const esic = Math.ceil(grossAmount * 0.0075); // 0.75% ESIC Rate, rounded up
      const netPaid = grossAmount - pt - pf - esic;

      return {
        ...row,
        totalWages,
        holidayPayment,
        grossAmount,
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
      daysWorked: 0,
      unit1: 0,
      unit2: 0,
      unit3: 0,
      unit4: 0,
      totalWages: 0,
      extra: 0,
      holidayPayment: 0,
      grossAmount: 0,
      pt: 0,
      pf: 0,
      esic: 0,
      netPaid: 0
    };

    filteredRecords.forEach(rec => {
      sums.daysWorked += Number(rec.daysWorked) || 0;
      sums.unit1 += Number(rec.unit1) || 0;
      sums.unit2 += Number(rec.unit2) || 0;
      sums.unit3 += Number(rec.unit3) || 0;
      sums.unit4 += Number(rec.unit4) || 0;
      sums.totalWages += Number(rec.totalWages) || 0;
      sums.extra += Number(rec.extra) || 0;
      sums.holidayPayment += Number(rec.holidayPayment) || 0;
      sums.grossAmount += Number(rec.grossAmount) || 0;
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
      message: `Packer salary calculation sheet loaded for month: ${mStr}`
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
        message: 'Copied Packer Salary Sheet data to clipboard!'
      });
    } else {
      addToast({
        type: 'info',
        message: `${type} export generated for ${totalEntries} packer records!`
      });
    }
    setIsDropdownOpen(false);
  };

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.headerSection}>
        <div>
          <h2 className={styles.title}>Packer Salary Sheet</h2>
          <p className={styles.subtitle}>
            Review and compile monthly payroll registers, production unit piece wages, statutory PF and ESIC compliance balances for packing staff.
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
            Total Packer Records: {totalEntries}
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
                <th>Name of Employee</th>
                <th>No. of working Day</th>
                <th>Unit-1</th>
                <th>Unit-2</th>
                <th>Unit-3</th>
                <th>Unit-4</th>
                <th>Total wages</th>
                <th>Extra payment</th>
                <th>Holiday payment</th>
                <th>Total Gross Amount</th>
                <th>PT</th>
                <th>PF</th>
                <th>ESIC</th>
                <th>Net Amount Payable</th>
                <th style={{ width: '220px' }}>Signature Of The Employee</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={16} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
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
                      <td>{row.daysWorked}</td>
                      <td>{row.unit1} X {row.unit1Rate}</td>
                      <td>{row.unit2} X {row.unit2Rate}</td>
                      <td>{row.unit3} X {row.unit3Rate}</td>
                      <td>{row.unit4} X {row.unit4Rate}</td>
                      <td style={{ fontWeight: '500' }}>{row.totalWages}</td>
                      <td>{row.extra}</td>
                      <td>{row.holidayPayment}</td>
                      <td style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{row.grossAmount}</td>
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
                    <td>{totals.daysWorked}</td>
                    <td>{totals.unit1}</td>
                    <td>{totals.unit2}</td>
                    <td>{totals.unit3}</td>
                    <td>{totals.unit4}</td>
                    <td>{totals.totalWages}</td>
                    <td>{totals.extra}</td>
                    <td>{totals.holidayPayment}</td>
                    <td>{totals.grossAmount}</td>
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

export default PackingSalaryPage;
