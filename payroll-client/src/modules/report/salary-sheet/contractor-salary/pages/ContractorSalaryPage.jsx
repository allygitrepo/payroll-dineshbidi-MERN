import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Download, FileSpreadsheet, Copy, FileText, File, Printer, ChevronDown, Check, X, CalendarDays, Users } from 'lucide-react';
import { useToast, MonthYearPicker, Pagination } from '../../../../../shared/components';
import { fetchContractorSalarySheet } from '../services/contractorSalaryReportService';
import { getContractors } from '../../../../master/contractor/services/contractorService';
import styles from '../components/ContractorSalaryPage.module.css';
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

const ContractorSalaryPage = () => {
  const addToast = useToast();
  const dropdownRef = useRef(null);
  const multiSelectRef = useRef(null);

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [activeMonth, setActiveMonth] = useState('');
  
  const [reportData, setReportData] = useState([]);
  const [contractorsList, setContractorsList] = useState([]);
  const [selectedContractors, setSelectedContractors] = useState([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMultiSelectOpen, setIsMultiSelectOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch all contractors on mount
  useEffect(() => {
    const fetchAllContractors = async () => {
      const companyId = localStorage.getItem('selectedCompany');
      if (companyId) {
        try {
          const contractors = await getContractors(companyId);
          const formattedContractors = contractors
            .filter(c => c.status === 'Active')
            .map(c => `${c.name} - ${c.pfCode}`);
          setContractorsList(formattedContractors);
          setSelectedContractors(formattedContractors);
        } catch (error) {
          console.error("Failed to load contractors for dropdown:", error);
        }
      }
    };
    fetchAllContractors();
  }, []);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
      if (multiSelectRef.current && !multiSelectRef.current.contains(e.target)) {
        setIsMultiSelectOpen(false);
      }
    };
    if (isDropdownOpen || isMultiSelectOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen, isMultiSelectOpen]);

  const handleFetchData = async () => {
    if (!selectedMonth) {
      addToast({ type: 'error', message: 'Please select a Month and Year.' });
      return;
    }

    setLoading(true);
    try {
      const companyId = localStorage.getItem('selectedCompany');
      if (!companyId) throw new Error('No company selected.');

      const response = await fetchContractorSalarySheet(companyId, selectedMonth);
      if (response && response.status) {
        const data = response.data || [];
        setReportData(data);
        
        setActiveMonth(selectedMonth);
        setHasSearched(true);
        setCurrentPage(1);
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
    let result = reportData;

    // Filter by selected contractors
    if (selectedContractors.length > 0) {
      result = result.filter(rec => selectedContractors.includes(rec.contractor));
    } else {
      result = []; // If none selected, show nothing
    }

    // Universal Search
    const query = searchTerm.toLowerCase().trim();
    if (query) {
      result = result.filter(row => {
        return Object.values(row).some(value => 
          value !== null && value !== undefined && String(value).toLowerCase().includes(query)
        );
      });
    }

    return result;
  }, [reportData, selectedContractors, searchTerm]);

  const totals = useMemo(() => {
    return filteredData.reduce((acc, row) => ({
      quantity: acc.quantity + (parseFloat(row.quantity) || 0),
      daysWorked: acc.daysWorked + (parseFloat(row.daysWorked) || 0),
      wages: acc.wages + (parseFloat(row.wages) || 0),
      hra: acc.hra + (parseFloat(row.hra) || 0),
      total: acc.total + (parseFloat(row.total) || 0),
      pf: acc.pf + (parseFloat(row.pf) || 0),
      esic: acc.esic + (parseFloat(row.esic) || 0),
      abry: acc.abry + (parseFloat(row.abry) || 0),
      netPaid: acc.netPaid + (parseFloat(row.netPaid) || 0)
    }), {
      quantity: 0, daysWorked: 0, wages: 0, hra: 0, total: 0, pf: 0, esic: 0, abry: 0, netPaid: 0
    });
  }, [filteredData]);

  // Export Functions
  const generatePDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text(`Contractor Salary Sheet_${activeMonth}`, doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
    doc.setFontSize(9);
    doc.text(`COMPANY NAME : BRIJBASHI TRADERS , ADDRESS: BANDHA GHAT , POSTOFFICE: JHALDA , DISTRICT: PURULIA`, doc.internal.pageSize.getWidth() / 2, 22, { align: 'center' });

    const tableColumn = [
      "SR NO", "Employee Name", "Contractor", "Quantity", "No. of working Day", "Wages", "HRA", 
      "Total", "PF(EE)", "ESIC", "ABRY", "Net Wages", "Signature"
    ];
    
    const tableRows = filteredData.map((row, index) => [
      index + 1,
      `${row.name}\nMember Id:${row.employeeCode}\nUAN:${row.uan}`,
      row.contractor,
      row.quantity,
      row.daysWorked,
      Math.round(row.wages),
      Math.round(row.hra),
      Math.round(row.total),
      Math.round(row.pf),
      Math.round(row.esic),
      Math.round(row.abry),
      Math.round(row.netPaid),
      ""
    ]);

    tableRows.push([
      "", "Total", "", totals.quantity, totals.daysWorked, Math.round(totals.wages), 
      Math.round(totals.hra), Math.round(totals.total), Math.round(totals.pf), 
      Math.round(totals.esic), Math.round(totals.abry), Math.round(totals.netPaid), ""
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 28,
      theme: 'grid',
      headStyles: { fillColor: [243, 244, 246], textColor: [55, 65, 81], fontStyle: 'bold', halign: 'center' },
      bodyStyles: { textColor: [55, 65, 81], halign: 'center', valign: 'middle' },
      columnStyles: { 1: { halign: 'left', cellWidth: 35 }, 2: { cellWidth: 25 }, 12: { cellWidth: 25 } },
      didParseCell: function(data) {
        if (data.row.index === tableRows.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [243, 244, 246];
        }
      }
    });

    doc.save(`Contractor_Salary_Sheet_${activeMonth}.pdf`);
  };

  const handleCopy = () => {
    const headers = ["SR NO", "Employee Name", "Member Id", "UAN", "Contractor", "Quantity", "Working Days", "Wages", "HRA", "Total", "PF(EE)", "ESIC", "ABRY", "Net Wages"].join("\t");
    const rows = filteredData.map((row, index) => [
      index + 1, row.name, row.employeeCode, row.uan, row.contractor, row.quantity, row.daysWorked,
      Math.round(row.wages), Math.round(row.hra), Math.round(row.total), Math.round(row.pf), 
      Math.round(row.esic), Math.round(row.abry), Math.round(row.netPaid)
    ].join("\t")).join("\n");
    
    navigator.clipboard.writeText(`${headers}\n${rows}`);
    addToast({ type: 'success', message: 'Data copied to clipboard!' });
  };

  const handleCSV = (filename) => {
    const headers = ["SR NO", "Employee Name", "Member Id", "UAN", "Contractor", "Quantity", "Working Days", "Wages", "HRA", "Total", "PF(EE)", "ESIC", "ABRY", "Net Wages"].join(",");
    const rows = filteredData.map((row, index) => [
      index + 1, `"${row.name}"`, `"${row.employeeCode}"`, `"${row.uan}"`, `"${row.contractor}"`, row.quantity, row.daysWorked,
      Math.round(row.wages), Math.round(row.hra), Math.round(row.total), Math.round(row.pf), 
      Math.round(row.esic), Math.round(row.abry), Math.round(row.netPaid)
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
    
    let html = `<html><head><title>Print Contractor Salary Sheet</title>`;
    html += `<style>
      body { font-family: sans-serif; padding: 20px; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
      th { background-color: #f3f4f6; text-align: center; }
      td:nth-child(2) { text-align: left; }
      .emp-details { font-size: 10px; color: #666; display: block; }
    </style></head><body>`;
    html += `<h2 style="text-align:center;">Contractor Salary Sheet_${activeMonth}</h2>`;
    html += `<table>
      <thead>
        <tr>
          <th>SR NO</th><th>Employee Name</th><th>Contractor</th><th>Qty</th><th>Days</th><th>Wages</th>
          <th>HRA</th><th>Total</th><th>PF</th><th>ESIC</th><th>ABRY</th><th>Net Paid</th>
        </tr>
      </thead><tbody>`;
    
    filteredData.forEach((row, i) => {
      html += `<tr>
        <td>${i+1}</td>
        <td>${row.name}<br/><span class="emp-details">Id: ${row.employeeCode} | UAN: ${row.uan}</span></td>
        <td style="text-align:left;">${row.contractor}</td>
        <td>${row.quantity}</td>
        <td>${row.daysWorked}</td>
        <td>${Math.round(row.wages)}</td>
        <td>${Math.round(row.hra)}</td>
        <td>${Math.round(row.total)}</td>
        <td>${Math.round(row.pf)}</td>
        <td>${Math.round(row.esic)}</td>
        <td>${Math.round(row.abry)}</td>
        <td>${Math.round(row.netPaid)}</td>
      </tr>`;
    });
    
    html += `<tr style="font-weight:bold; background-color:#f9fafb;">
      <td></td><td>Total</td><td></td>
      <td>${totals.quantity}</td>
      <td>${totals.daysWorked}</td>
      <td>${Math.round(totals.wages)}</td>
      <td>${Math.round(totals.hra)}</td>
      <td>${Math.round(totals.total)}</td>
      <td>${Math.round(totals.pf)}</td>
      <td>${Math.round(totals.esic)}</td>
      <td>${Math.round(totals.abry)}</td>
      <td>${Math.round(totals.netPaid)}</td>
    </tr></tbody></table></body></html>`;
    
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
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
    } else if (type === 'Copy') handleCopy();
    else if (type === 'CSV' || type === 'Excel') handleCSV(`Contractor_Salary_Sheet_${activeMonth}.csv`);
    else if (type === 'Print') handlePrint();
  };

  // Pagination
  const totalEntries = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);
  const paginatedData = useMemo(() => filteredData.slice(startIndex, endIndex), [filteredData, startIndex, endIndex]);

  const toggleContractorOption = (contractor) => {
    setSelectedContractors(prev => prev.includes(contractor) ? prev.filter(c => c !== contractor) : [...prev, contractor]);
  };

  return (
    <div className={styles.container}>
      {/* Header section with download button mapped from office/packing UI */}
      <div className={styles.headerSection}>
        <h1 className={styles.title}>Contractor Salary Sheet</h1>
        <div className={styles.headerActions}>
          <div className={styles.dropdownContainer} ref={dropdownRef}>
            <button className={styles.downloadBtn} onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              <Download size={18} /> Download
            </button>
            {isDropdownOpen && (
              <div className={styles.dropdownMenu}>
                <button onClick={() => handleExport('Excel')}><FileSpreadsheet size={16} /> Excel</button>
                <button onClick={() => handleExport('Copy')}><Copy size={16} /> Copy</button>
                <button onClick={() => handleExport('CSV')}><FileText size={16} /> CSV</button>
                <button onClick={() => handleExport('PDF')}><File size={16} /> PDF</button>
                <button onClick={() => handleExport('Print')}><Printer size={16} /> Print</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.filterRow} style={{ justifyContent: 'center' }}>
          <div className={styles.filterGroup}>
            <span className={styles.label}>Month and Year</span>
            <MonthYearPicker value={selectedMonth} onChange={setSelectedMonth} />
          </div>

          <div className={styles.filterGroup}>
            <span className={styles.label}>Contractor Name - Pf Code</span>
            <div className={styles.multiSelectWrapper} ref={multiSelectRef}>
              <div className={styles.multiSelectBox} onClick={() => setIsMultiSelectOpen(!isMultiSelectOpen)}>
                {selectedContractors.length === 0 ? (
                  <span className={styles.placeholderText}>Select Contractors</span>
                ) : selectedContractors.length > 2 ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{selectedContractors.length} Selected</span>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedContractors([]); }} style={{ background: 'none', border: 'none', padding: 0 }}><X size={16}/></button>
                  </div>
                ) : (
                  <div className={styles.tagsList}>
                    {selectedContractors.map(c => (
                      <span key={c} className={styles.tag}>
                        {c.split(' - ')[0]}
                        <button type="button" className={styles.tagRemove} onClick={(e) => { e.stopPropagation(); toggleContractorOption(c); }}>
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <ChevronDown size={16} className={styles.dropdownIndicator} />
              </div>
              {isMultiSelectOpen && (
                <div className={styles.selectMenu}>
                  {contractorsList.map(option => (
                    <div key={option} className={styles.selectOption} onClick={() => toggleContractorOption(option)}>
                      <span>{option}</span>
                      {selectedContractors.includes(option) && <Check size={14} />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <button type="button" className={styles.searchBtn} onClick={handleFetchData} disabled={loading}>
            <Search size={16} /> {loading ? 'Loading...' : 'Search'}
          </button>
        </div>
      </div>

      {!hasSearched ? (
        <div className={styles.tableCard}>
          <div className={styles.emptyState} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Users size={56} style={{ opacity: 0.5, marginBottom: '16px' }} />
            <h3>No Data Loaded</h3>
            <p>Select a Month & Year above and click Search to load contractor entries.</p>
          </div>
        </div>
      ) : (
        <div className={styles.tableCard}>
          <div className={styles.tableControls} style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className={styles.tableCardTitle} style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                Contractor Salary Sheet — {filteredData.length} Employee{filteredData.length !== 1 ? 's' : ''}
              </span>
              <span className={styles.monthBadge} style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600 }}>
                {formatMonthLabel(activeMonth)}
              </span>
            </div>
            
            <div className={styles.searchWrapper} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Search all columns:</label>
              <input
                type="text"
                placeholder="Search name, UAN, contractor..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className={styles.searchInput}
                style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '6px', outline: 'none' }}
              />
            </div>
          </div>

          <div className={styles.tableContainer} style={{ overflowX: 'auto' }}>
            <table className={styles.table} style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ backgroundColor: 'var(--surface-50)' }}>
                <tr>
                  <th style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>SR NO.</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>Employee Name</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>Quantity</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>No. of working Day</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>Wages</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>HRA</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>Total</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>PF(EE)</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>ESIC</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>ABRY</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>Net Wages</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>Signature</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={12} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  <>
                    {paginatedData.map((row, index) => (
                      <tr key={row.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '12px' }}>{startIndex + index + 1}</td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 600 }}>{row.name}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Member Id:{row.employeeCode}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>UAN:{row.uan}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '2px' }}>{row.contractor}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px' }}>{row.quantity}</td>
                        <td style={{ padding: '12px' }}>{row.daysWorked}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>{Math.round(row.wages)}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>{Math.round(row.hra)}</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>{Math.round(row.total)}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>{Math.round(row.pf)}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>{Math.round(row.esic)}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>{Math.round(row.abry)}</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: 'var(--primary)' }}>{Math.round(row.netPaid)}</td>
                        <td style={{ padding: '12px' }}></td>
                      </tr>
                    ))}
                    <tr style={{ background: 'var(--surface-50)', fontWeight: 'bold' }}>
                      <td colSpan={2} style={{ textAlign: 'right', padding: '12px' }}>Total</td>
                      <td style={{ padding: '12px' }}>{totals.quantity}</td>
                      <td style={{ padding: '12px' }}>{totals.daysWorked}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{Math.round(totals.wages)}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{Math.round(totals.hra)}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{Math.round(totals.total)}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{Math.round(totals.pf)}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{Math.round(totals.esic)}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{Math.round(totals.abry)}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: 'var(--primary)' }}>{Math.round(totals.netPaid)}</td>
                      <td></td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          <div className={styles.tableFooter} style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div>
                <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} style={{ padding: '4px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span style={{ marginLeft: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>records per page</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Showing {totalEntries > 0 ? startIndex + 1 : 0} to {endIndex} of {totalEntries} entries
              </div>
            </div>

            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractorSalaryPage;
