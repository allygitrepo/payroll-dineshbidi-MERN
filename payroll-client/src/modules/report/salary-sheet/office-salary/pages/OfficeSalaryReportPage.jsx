import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  Download,
  FileSpreadsheet,
  Copy,
  FileText,
  File,
  Printer,
  Users,
  CalendarDays
} from 'lucide-react';
import styles from './OfficeSalaryReportPage.module.css';
import { useToast, MonthYearPicker } from '../../../../../shared/components';
import { fetchOfficeSalarySheet } from '../services/officeSalaryReportService';

const formatMonthLabel = (monthYear) => {
  if (!monthYear) return '';
  const [year, month] = monthYear.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};

const getCurrentMonth = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

const OfficeSalaryReportPage = () => {
  const addToast = useToast();
  const dropdownRef = useRef(null);

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [activeMonth, setActiveMonth] = useState('');
  const [reportData, setReportData] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  const handleSearch = async () => {
    if (!selectedMonth) {
      addToast({ type: 'error', message: 'Please select a Month and Year.' });
      return;
    }

    setLoading(true);
    try {
      const companyId = localStorage.getItem('selectedCompany');
      if (!companyId) {
        throw new Error('No company selected. Please select a company first.');
      }

      const response = await fetchOfficeSalarySheet(companyId, selectedMonth);
      if (response && response.status) {
        setReportData(response.data || []);
        setActiveMonth(selectedMonth);
        setHasSearched(true);
        setCurrentPage(1); // Reset to first page on search
      } else {
        throw new Error(response.message || 'Failed to fetch report data.');
      }
    } catch (error) {
      addToast({ type: 'error', message: error.response?.data?.message || error.message || 'Failed to load data from server' });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (type) => {
    setIsDropdownOpen(false);
    addToast({ type: 'info', message: `${type} export started for ${reportData.length} records!` });
  };

  const totals = useMemo(() => {
    return reportData.reduce((acc, row) => ({
      daysWorked: acc.daysWorked + (parseInt(row.daysWorked) || 0),
      leaveWithPay: acc.leaveWithPay + (parseInt(row.leaveWithPay) || 0),
      absentDays: acc.absentDays + (parseInt(row.absentDays) || 0),
      addition: acc.addition + (parseFloat(row.addition) || 0),
      basicSalary: acc.basicSalary + (parseFloat(row.basicSalary) || 0),
      gross: acc.gross + (parseFloat(row.grossWages) || 0),
      pf: acc.pf + (parseFloat(row.pf) || 0),
      pt: acc.pt + (parseFloat(row.pt) || 0),
      esic: acc.esic + (parseFloat(row.esic) || 0),
      netWages: acc.netWages + (parseFloat(row.netWages) || 0),
    }), {
      daysWorked: 0, leaveWithPay: 0, absentDays: 0, addition: 0,
      basicSalary: 0, gross: 0, pf: 0, pt: 0, esic: 0, netWages: 0
    });
  }, [reportData]);

  // Pagination bounds
  const totalEntries = reportData.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);

  const paginatedData = useMemo(() => {
    return reportData.slice(startIndex, endIndex);
  }, [reportData, startIndex, endIndex]);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.headerSection}>
        <h1 className={styles.title}>Office Salary Sheet</h1>
        <div className={styles.headerActions}>
          <div className={styles.dropdownContainer} ref={dropdownRef}>
            <button
              className={styles.downloadBtn}
              onClick={() => setIsDropdownOpen(prev => !prev)}
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

      {/* Month & Year Search Card */}
      <div className={styles.searchCard}>
        <div className={styles.searchCardTitle}>
          <CalendarDays size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
          Month and Year
        </div>
        <div className={styles.searchRow}>
          <MonthYearPicker
            value={selectedMonth}
            onChange={setSelectedMonth}
            placeholder="Select Month & Year"
          />
          <button className={styles.searchBtn} onClick={handleSearch} disabled={loading}>
            <Search size={16} /> {loading ? 'Loading...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Entry Table Card */}
      {!hasSearched ? (
        <div className={styles.tableCard}>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Users size={56} />
            </div>
            <h3>No Data Loaded</h3>
            <p>Select a Month &amp; Year above and click Search to load employee data.</p>
          </div>
        </div>
      ) : (
        <div className={styles.tableCard}>
          <div className={styles.tableCardHeader}>
            <span className={styles.tableCardTitle}>
              Office Salary Sheet — {reportData.length} Employee{reportData.length !== 1 ? 's' : ''}
            </span>
            <span className={styles.monthBadge}>{formatMonthLabel(activeMonth)}</span>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>SR NO.</th>
                  <th style={{ width: 220 }}>Employee Name</th>
                  <th style={{ textAlign: 'right' }}>Basic Salary</th>
                  <th style={{ textAlign: 'right' }}>No. Of Days Worked</th>
                  <th style={{ textAlign: 'right' }}>Holiday</th>
                  <th style={{ textAlign: 'right' }}>Absent</th>
                  <th style={{ textAlign: 'right' }}>Additional</th>
                  <th style={{ textAlign: 'right' }}>Total Amount</th>
                  <th style={{ textAlign: 'right' }}>PT</th>
                  <th style={{ textAlign: 'right' }}>PF</th>
                  <th style={{ textAlign: 'right' }}>ESIC</th>
                  <th style={{ textAlign: 'right' }}>Net Amount Paid</th>
                  <th style={{ textAlign: 'left' }}>Signature of The Employee</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, index) => (
                  <tr key={row.employeeId || row.id}>
                    <td>{startIndex + index + 1}</td>
                    <td>
                      <div className={styles.empCell}>
                        <span className={styles.empName}>{row.name}</span>
                        <span className={styles.empCode}>Member Id:{row.employeeCode}</span>
                        <span className={styles.empAccount} style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>UAN:{row.uan}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>{Math.round(row.basicSalary)}</td>
                    <td style={{ textAlign: 'right' }}>{row.daysWorked}</td>
                    <td style={{ textAlign: 'right' }}>{row.leaveWithPay}</td>
                    <td style={{ textAlign: 'right' }}>{row.absentDays}</td>
                    <td style={{ textAlign: 'right' }}>{Math.round(row.addition)}</td>
                    <td style={{ textAlign: 'right' }}>{Math.round(row.grossWages)}</td>
                    <td style={{ textAlign: 'right' }} className={styles.deductCol}>{Math.round(row.pt)}</td>
                    <td style={{ textAlign: 'right' }} className={styles.deductCol}>{Math.round(row.pf)}</td>
                    <td style={{ textAlign: 'right' }} className={styles.deductCol}>{Math.round(row.esic)}</td>
                    <td style={{ textAlign: 'right' }} className={styles.netCol}>{Math.round(row.netWages)}</td>
                    <td style={{ textAlign: 'left' }}></td>
                  </tr>
                ))}

                {reportData.length > 0 && (
                  <tr className={styles.totalRow}>
                    <td></td>
                    <td><strong>Total</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{Math.round(totals.basicSalary)}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{totals.daysWorked}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{totals.leaveWithPay}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{totals.absentDays}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{Math.round(totals.addition)}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{Math.round(totals.gross)}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong className={styles.deductCol}>{Math.round(totals.pt)}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong className={styles.deductCol}>{Math.round(totals.pf)}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong className={styles.deductCol}>{Math.round(totals.esic)}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong className={styles.netCol}>{Math.round(totals.netWages)}</strong></td>
                    <td style={{ textAlign: 'left' }}></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer controls: limit selector and pagination */}
          {reportData.length > 0 && (
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
                
                {getPageNumbers().map((pageNum, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (pageNum !== '...') setCurrentPage(pageNum);
                    }}
                    className={`${styles.pageBtn} ${pageNum === currentPage ? styles.activePageBtn : ''}`}
                    disabled={pageNum === '...'}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={styles.pageBtn}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OfficeSalaryReportPage;
