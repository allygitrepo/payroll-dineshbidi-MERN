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
import styles from './PackingSalaryPage.module.css';
import { useToast, MonthYearPicker } from '../../../../../shared/components';
import { fetchPackingSalarySheet } from '../services/packingSalaryReportService';
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

const PackingSalaryPage = () => {
  const dropdownRef = useRef(null);
  const addToast = useToast();

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
      
      const response = await fetchPackingSalarySheet(companyId, selectedMonth);
      if (response && response.status) {
        setReportData(response.data || []);
        setActiveMonth(selectedMonth);
        setHasSearched(true);
        setCurrentPage(1); // Reset to first page on search
        setSearchTerm(''); // Reset search term
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

  const totals = useMemo(() => {
    return filteredData.reduce((acc, row) => ({
      daysWorked: acc.daysWorked + (parseFloat(row.daysWorked) || 0),
      unit1: acc.unit1 + (parseInt(row.unit1) || 0),
      unit2: acc.unit2 + (parseInt(row.unit2) || 0),
      unit3: acc.unit3 + (parseInt(row.unit3) || 0),
      unit4: acc.unit4 + (parseInt(row.unit4) || 0),
      totalWages: acc.totalWages + (parseFloat(row.totalWages) || 0),
      extraPayment: acc.extraPayment + (parseFloat(row.extraPayment) || 0),
      holidayPayment: acc.holidayPayment + (parseFloat(row.holidayPayment) || 0),
      grossAmount: acc.grossAmount + (parseFloat(row.grossAmount) || 0),
      pt: acc.pt + (parseFloat(row.pt) || 0),
      pf: acc.pf + (parseFloat(row.pf) || 0),
      esic: acc.esic + (parseFloat(row.esic) || 0),
      netPayable: acc.netPayable + (parseFloat(row.netPayable) || 0),
    }), {
      daysWorked: 0, unit1: 0, unit2: 0, unit3: 0, unit4: 0, totalWages: 0,
      extraPayment: 0, holidayPayment: 0, grossAmount: 0, pt: 0, pf: 0, esic: 0, netPayable: 0
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

  const generatePDF = () => {
    const doc = new jsPDF('landscape');
    
    doc.setFontSize(16);
    const titleText = `Packer Salary Sheet_${activeMonth ? activeMonth.split('-')[1] + '/' + activeMonth.split('-')[0] : ''}`;
    doc.text(titleText, doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
    
    doc.setFontSize(9);
    doc.text(`COMPANY NAME : BRIJBASHI TRADERS , ADDRESS: BANDHA GHAT , POSTOFFICE: JHALDA , DISTRICT: PURULIA , PINCODE: 723202`, doc.internal.pageSize.getWidth() / 2, 22, { align: 'center' });

    const tableColumn = [
      "SR NO", "Name of Employee", "Working Days", "Unit-1", "Unit-2", "Unit-3", "Unit-4",
      "Total wages", "Extra payment", "Holiday payment", "Gross Amount", "PT", "PF", "ESIC", "Net Payable", "Signature"
    ];
    const tableRows = [];

    filteredData.forEach((row, index) => {
      const rowData = [
        index + 1,
        `${row.name}\nMember Id:${row.employeeCode}\nUAN:${row.uan}`,
        row.daysWorked,
        `${row.unit1} X ${row.rate1}`,
        `${row.unit2} X ${row.rate2}`,
        `${row.unit3} X ${row.rate3}`,
        `${row.unit4} X ${row.rate4}`,
        Math.round(row.totalWages),
        Math.round(row.extraPayment),
        Math.round(row.holidayPayment),
        Math.round(row.grossAmount),
        Math.round(row.pt),
        Math.round(row.pf),
        Math.round(row.esic),
        Math.round(row.netPayable),
        ""
      ];
      tableRows.push(rowData);
    });

    const totalsRow = [
      "", "Total", totals.daysWorked, totals.unit1, totals.unit2, totals.unit3, totals.unit4,
      Math.round(totals.totalWages), Math.round(totals.extraPayment), Math.round(totals.holidayPayment),
      Math.round(totals.grossAmount), Math.round(totals.pt), Math.round(totals.pf), Math.round(totals.esic),
      Math.round(totals.netPayable), ""
    ];
    tableRows.push(totalsRow);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 28,
      theme: 'grid',
      headStyles: { fillColor: [243, 244, 246], textColor: [55, 65, 81], fontStyle: 'bold', halign: 'center', fontSize: 8 },
      bodyStyles: { textColor: [55, 65, 81], halign: 'center', valign: 'middle', fontSize: 8 },
      columnStyles: {
        1: { halign: 'left', cellWidth: 35 },
        15: { cellWidth: 25 }
      },
      didParseCell: function(data) {
        if (data.row.index === tableRows.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [243, 244, 246];
        }
      }
    });

    doc.save(`Packer_Salary_Sheet_${activeMonth}.pdf`);
  };

  const handleCopy = () => {
    const headers = ["SR NO", "Name of Employee", "Member Id", "UAN", "Working Days", "Unit-1", "Unit-2", "Unit-3", "Unit-4", "Total wages", "Extra payment", "Holiday payment", "Gross Amount", "PT", "PF", "ESIC", "Net Payable"].join("\t");
    const rows = filteredData.map((row, index) => [
      index + 1, row.name, row.employeeCode, row.uan, row.daysWorked, `${row.unit1} X ${row.rate1}`, `${row.unit2} X ${row.rate2}`, `${row.unit3} X ${row.rate3}`, `${row.unit4} X ${row.rate4}`,
      Math.round(row.totalWages), Math.round(row.extraPayment), Math.round(row.holidayPayment), Math.round(row.grossAmount),
      Math.round(row.pt), Math.round(row.pf), Math.round(row.esic), Math.round(row.netPayable)
    ].join("\t")).join("\n");
    
    navigator.clipboard.writeText(`${headers}\n${rows}`);
    addToast({ type: 'success', message: 'Data copied to clipboard!' });
  };

  const handleCSV = (filename) => {
    const headers = ["SR NO", "Name of Employee", "Member Id", "UAN", "Working Days", "Unit-1", "Unit-2", "Unit-3", "Unit-4", "Total wages", "Extra payment", "Holiday payment", "Gross Amount", "PT", "PF", "ESIC", "Net Payable"].join(",");
    const rows = filteredData.map((row, index) => [
      index + 1, `"${row.name}"`, `"${row.employeeCode}"`, `"${row.uan}"`, row.daysWorked, `"${row.unit1} X ${row.rate1}"`, `"${row.unit2} X ${row.rate2}"`, `"${row.unit3} X ${row.rate3}"`, `"${row.unit4} X ${row.rate4}"`,
      Math.round(row.totalWages), Math.round(row.extraPayment), Math.round(row.holidayPayment), Math.round(row.grossAmount),
      Math.round(row.pt), Math.round(row.pf), Math.round(row.esic), Math.round(row.netPayable)
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
    
    let html = `<html><head><title>Print Packer Salary Sheet</title>`;
    html += `<style>
      body { font-family: sans-serif; padding: 20px; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
      th, td { border: 1px solid #ddd; padding: 6px; text-align: right; }
      th { background-color: #f3f4f6; text-align: center; }
      td:nth-child(2) { text-align: left; }
      .emp-details { font-size: 9px; color: #666; display: block; }
    </style></head><body>`;
    html += `<h2 style="text-align:center;">Packer Salary Sheet_${activeMonth}</h2>`;
    html += `<table>
      <thead>
        <tr>
          <th>SR NO</th><th>Name of Employee</th><th>Days</th><th>Unit-1</th><th>Unit-2</th><th>Unit-3</th><th>Unit-4</th>
          <th>Wages</th><th>Extra</th><th>Holiday</th><th>Gross</th><th>PT</th><th>PF</th><th>ESIC</th><th>Net Paid</th>
        </tr>
      </thead><tbody>`;
    
    filteredData.forEach((row, i) => {
      html += `<tr>
        <td>${i+1}</td>
        <td>${row.name}<br/><span class="emp-details">Id: ${row.employeeCode} | UAN: ${row.uan}</span></td>
        <td>${row.daysWorked}</td>
        <td>${row.unit1} X ${row.rate1}</td>
        <td>${row.unit2} X ${row.rate2}</td>
        <td>${row.unit3} X ${row.rate3}</td>
        <td>${row.unit4} X ${row.rate4}</td>
        <td>${Math.round(row.totalWages)}</td>
        <td>${Math.round(row.extraPayment)}</td>
        <td>${Math.round(row.holidayPayment)}</td>
        <td>${Math.round(row.grossAmount)}</td>
        <td>${Math.round(row.pt)}</td>
        <td>${Math.round(row.pf)}</td>
        <td>${Math.round(row.esic)}</td>
        <td>${Math.round(row.netPayable)}</td>
      </tr>`;
    });
    
    html += `<tr style="font-weight:bold; background-color:#f9fafb;">
      <td></td><td>Total</td>
      <td>${totals.daysWorked}</td><td>${totals.unit1}</td><td>${totals.unit2}</td><td>${totals.unit3}</td><td>${totals.unit4}</td>
      <td>${Math.round(totals.totalWages)}</td><td>${Math.round(totals.extraPayment)}</td><td>${Math.round(totals.holidayPayment)}</td>
      <td>${Math.round(totals.grossAmount)}</td><td>${Math.round(totals.pt)}</td><td>${Math.round(totals.pf)}</td>
      <td>${Math.round(totals.esic)}</td><td>${Math.round(totals.netPayable)}</td>
    </tr>`;
    
    html += `</tbody></table></body></html>`;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
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
      handleCSV(`Packer_Salary_Sheet_${activeMonth}.csv`);
    } else if (type === 'Print') {
      handlePrint();
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.headerSection}>
        <h1 className={styles.title}>Packer Salary Sheet</h1>
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
            <p>Select a Month &amp; Year above and click Search to load packing staff data.</p>
          </div>
        </div>
      ) : (
        <div className={styles.tableCard}>
          <div className={styles.tableCardHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className={styles.tableCardTitle}>
                Packer Salary Sheet — {filteredData.length} Employee{filteredData.length !== 1 ? 's' : ''}
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
                  <th style={{ width: 220 }}>Name of Employee</th>
                  <th style={{ textAlign: 'right' }}>No. of working Day</th>
                  <th style={{ textAlign: 'right' }}>Unit-1</th>
                  <th style={{ textAlign: 'right' }}>Unit-2</th>
                  <th style={{ textAlign: 'right' }}>Unit-3</th>
                  <th style={{ textAlign: 'right' }}>Unit-4</th>
                  <th style={{ textAlign: 'right' }}>Total wages</th>
                  <th style={{ textAlign: 'right' }}>Extra payment</th>
                  <th style={{ textAlign: 'right' }}>Holiday payment</th>
                  <th style={{ textAlign: 'right' }}>Total Gross Amount</th>
                  <th style={{ textAlign: 'right' }}>PT</th>
                  <th style={{ textAlign: 'right' }}>PF</th>
                  <th style={{ textAlign: 'right' }}>ESIC</th>
                  <th style={{ textAlign: 'right' }}>Net Amount Payable</th>
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
                    <td style={{ textAlign: 'right' }}>{row.daysWorked}</td>
                    <td style={{ textAlign: 'right' }}>{row.unit1} X {row.rate1}</td>
                    <td style={{ textAlign: 'right' }}>{row.unit2} X {row.rate2}</td>
                    <td style={{ textAlign: 'right' }}>{row.unit3} X {row.rate3}</td>
                    <td style={{ textAlign: 'right' }}>{row.unit4} X {row.rate4}</td>
                    <td style={{ textAlign: 'right' }}>{Math.round(row.totalWages)}</td>
                    <td style={{ textAlign: 'right' }}>{Math.round(row.extraPayment)}</td>
                    <td style={{ textAlign: 'right' }}>{Math.round(row.holidayPayment)}</td>
                    <td style={{ textAlign: 'right' }}>{Math.round(row.grossAmount)}</td>
                    <td style={{ textAlign: 'right' }} className={styles.deductCol}>{Math.round(row.pt)}</td>
                    <td style={{ textAlign: 'right' }} className={styles.deductCol}>{Math.round(row.pf)}</td>
                    <td style={{ textAlign: 'right' }} className={styles.deductCol}>{Math.round(row.esic)}</td>
                    <td style={{ textAlign: 'right' }} className={styles.netCol}>{Math.round(row.netPayable)}</td>
                    <td style={{ textAlign: 'left' }}></td>
                  </tr>
                ))}

                {filteredData.length > 0 && (
                  <tr className={styles.totalRow}>
                    <td></td>
                    <td><strong>Total</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{totals.daysWorked}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{totals.unit1}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{totals.unit2}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{totals.unit3}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{totals.unit4}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{Math.round(totals.totalWages)}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{Math.round(totals.extraPayment)}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{Math.round(totals.holidayPayment)}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{Math.round(totals.grossAmount)}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong className={styles.deductCol}>{Math.round(totals.pt)}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong className={styles.deductCol}>{Math.round(totals.pf)}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong className={styles.deductCol}>{Math.round(totals.esic)}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong className={styles.netCol}>{Math.round(totals.netPayable)}</strong></td>
                    <td style={{ textAlign: 'left' }}></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer controls: limit selector and pagination */}
          {filteredData.length > 0 && (
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

export default PackingSalaryPage;
