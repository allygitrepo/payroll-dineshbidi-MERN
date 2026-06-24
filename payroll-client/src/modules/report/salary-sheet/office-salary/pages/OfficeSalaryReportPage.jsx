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
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const [searchTerm, setSearchTerm] = useState('');
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

  const filteredData = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return reportData;
    
    return reportData.filter(row => {
      return Object.values(row).some(value => 
        value !== null && value !== undefined && String(value).toLowerCase().includes(query)
      );
    });
  }, [reportData, searchTerm]);

  const generatePDF = () => {
    const doc = new jsPDF('landscape'); // use landscape to fit all columns
    
    // Title
    doc.setFontSize(16);
    const titleText = `Office Staff Salary Sheet_${activeMonth ? activeMonth.split('-')[1] + '/' + activeMonth.split('-')[0] : ''}`;
    doc.text(titleText, doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
    
    // Subtitle
    doc.setFontSize(9);
    doc.text(`COMPANY NAME : BRIJBASHI TRADERS , ADDRESS: BANDHA GHAT , POSTOFFICE: JHALDA , DISTRICT: PURULIA , PINCODE: 723202`, doc.internal.pageSize.getWidth() / 2, 22, { align: 'center' });

    // Table Data
    const tableColumn = [
      "SR NO", "Employee Name", "Basic Salary", "NO.Of Days Worked", "Holiday", "Absent", 
      "Additional", "Total Amount", "PT", "PF", "ESIC", "Net Amount Paid", "Signature of The Employee"
    ];
    const tableRows = [];

    filteredData.forEach((row, index) => {
      const rowData = [
        index + 1,
        `${row.name}\nMember Id:${row.employeeCode}\nUAN:${row.uan}`,
        Math.round(row.basicSalary),
        row.daysWorked,
        row.leaveWithPay,
        row.absentDays,
        Math.round(row.addition),
        Math.round(row.grossWages),
        Math.round(row.pt),
        Math.round(row.pf),
        Math.round(row.esic),
        Math.round(row.netWages),
        "" // Signature empty
      ];
      tableRows.push(rowData);
    });

    // Add total row
    const totalsRow = [
      "",
      "Total",
      Math.round(totals.basicSalary),
      totals.daysWorked,
      totals.leaveWithPay,
      totals.absentDays,
      Math.round(totals.addition),
      Math.round(totals.gross),
      Math.round(totals.pt),
      Math.round(totals.pf),
      Math.round(totals.esic),
      Math.round(totals.netWages),
      ""
    ];
    tableRows.push(totalsRow);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 28,
      theme: 'grid',
      headStyles: { fillColor: [243, 244, 246], textColor: [55, 65, 81], fontStyle: 'bold', halign: 'center' },
      bodyStyles: { textColor: [55, 65, 81], halign: 'center', valign: 'middle' },
      columnStyles: {
        1: { halign: 'left', cellWidth: 40 }, // Employee name column slightly wider and left-aligned
        12: { cellWidth: 35 } // Signature
      },
      didParseCell: function(data) {
        // Style the Total row
        if (data.row.index === tableRows.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [243, 244, 246];
        }
      }
    });

    doc.save(`Office_Staff_Salary_Sheet_${activeMonth}.pdf`);
  };

  const handleCopy = () => {
    const headers = ["SR NO", "Employee Name", "Member Id", "UAN", "Basic Salary", "NO.Of Days Worked", "Holiday", "Absent", "Additional", "Total Amount", "PT", "PF", "ESIC", "Net Amount Paid"].join("\t");
    const rows = filteredData.map((row, index) => [
      index + 1,
      row.name,
      row.employeeCode,
      row.uan,
      Math.round(row.basicSalary),
      row.daysWorked,
      row.leaveWithPay,
      row.absentDays,
      Math.round(row.addition),
      Math.round(row.grossWages),
      Math.round(row.pt),
      Math.round(row.pf),
      Math.round(row.esic),
      Math.round(row.netWages)
    ].join("\t")).join("\n");
    
    navigator.clipboard.writeText(`${headers}\n${rows}`);
    addToast({ type: 'success', message: 'Data copied to clipboard!' });
  };

  const handleCSV = (filename) => {
    const headers = ["SR NO", "Employee Name", "Member Id", "UAN", "Basic Salary", "NO.Of Days Worked", "Holiday", "Absent", "Additional", "Total Amount", "PT", "PF", "ESIC", "Net Amount Paid"].join(",");
    const rows = filteredData.map((row, index) => [
      index + 1,
      `"${row.name}"`,
      `"${row.employeeCode}"`,
      `"${row.uan}"`,
      Math.round(row.basicSalary),
      row.daysWorked,
      row.leaveWithPay,
      row.absentDays,
      Math.round(row.addition),
      Math.round(row.grossWages),
      Math.round(row.pt),
      Math.round(row.pf),
      Math.round(row.esic),
      Math.round(row.netWages)
    ].join(",")).join("\n");
    
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast({ type: 'success', message: 'Export downloaded successfully!' });
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=800,width=1200');
    if (!printWindow) return;
    
    let html = `<html><head><title>Print Office Salary Sheet</title>`;
    html += `<style>
      body { font-family: sans-serif; padding: 20px; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
      th { background-color: #f3f4f6; text-align: center; }
      td:nth-child(2) { text-align: left; }
      .emp-details { font-size: 10px; color: #666; display: block; }
    </style></head><body>`;
    html += `<h2 style="text-align:center;">Office Staff Salary Sheet_${activeMonth}</h2>`;
    html += `<table>
      <thead>
        <tr>
          <th>SR NO</th><th>Employee Name</th><th>Basic Salary</th><th>Days</th><th>Holiday</th><th>Absent</th>
          <th>Addition</th><th>Total</th><th>PT</th><th>PF</th><th>ESIC</th><th>Net Paid</th>
        </tr>
      </thead><tbody>`;
    
    filteredData.forEach((row, i) => {
      html += `<tr>
        <td>${i+1}</td>
        <td>${row.name}<br/><span class="emp-details">Id: ${row.employeeCode} | UAN: ${row.uan}</span></td>
        <td>${Math.round(row.basicSalary)}</td>
        <td>${row.daysWorked}</td>
        <td>${row.leaveWithPay}</td>
        <td>${row.absentDays}</td>
        <td>${Math.round(row.addition)}</td>
        <td>${Math.round(row.grossWages)}</td>
        <td>${Math.round(row.pt)}</td>
        <td>${Math.round(row.pf)}</td>
        <td>${Math.round(row.esic)}</td>
        <td>${Math.round(row.netWages)}</td>
      </tr>`;
    });
    
    // Totals row for print
    html += `<tr style="font-weight:bold; background-color:#f9fafb;">
      <td></td>
      <td>Total</td>
      <td>${Math.round(totals.basicSalary)}</td>
      <td>${totals.daysWorked}</td>
      <td>${totals.leaveWithPay}</td>
      <td>${totals.absentDays}</td>
      <td>${Math.round(totals.addition)}</td>
      <td>${Math.round(totals.gross)}</td>
      <td>${Math.round(totals.pt)}</td>
      <td>${Math.round(totals.pf)}</td>
      <td>${Math.round(totals.esic)}</td>
      <td>${Math.round(totals.netWages)}</td>
    </tr>`;
    
    html += `</tbody></table></body></html>`;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    // Use timeout to allow styles to render
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleExport = (type) => {
    setIsDropdownOpen(false);
    if (filteredData.length === 0) {
      addToast({ type: 'error', message: 'No data to export!' });
      return;
    }

    if (type === 'PDF') {
      generatePDF();
      addToast({ type: 'success', message: 'PDF generated successfully!' });
    } else if (type === 'Copy') {
      handleCopy();
    } else if (type === 'CSV' || type === 'Excel') {
      handleCSV(`Office_Salary_Sheet_${activeMonth}.csv`);
    } else if (type === 'Print') {
      handlePrint();
    }
  };

  const totals = useMemo(() => {
    return filteredData.reduce((acc, row) => ({
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
  }, [filteredData]);

  // Pagination bounds
  const totalEntries = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);

  const paginatedData = useMemo(() => {
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, startIndex, endIndex]);

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className={styles.tableCardTitle}>
                Office Salary Sheet — {filteredData.length} Employee{filteredData.length !== 1 ? 's' : ''}
              </span>
              <span className={styles.monthBadge}>{formatMonthLabel(activeMonth)}</span>
            </div>
            {/* Search Input for columns */}
            <div className={styles.tableSearch}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginRight: '8px' }}>Search all columns:</label>
              <input
                type="text"
                placeholder="Search name, UAN..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className={styles.searchInput}
                style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '6px', outline: 'none' }}
              />
            </div>
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
