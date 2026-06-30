import { Pagination } from '../../../../shared/components';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Download, FileSpreadsheet, Copy, FileText, File, Printer } from 'lucide-react';
import { useToast, DatePicker } from '../../../../shared/components';
import { getOfficeStaffEntry } from '../../../entry/office-staff/services/officeStaffEntryService';
import { getPackersEntry } from '../../../entry/packers/services/packersEntryService';
import { getBidiRollerEntry } from '../../../entry/bidi-roller/services/bidiRollerEntryService';
import { getEsicChallans, saveEsicChallan } from '../services/esicChallanYearlyService';
import YearPicker from '../../forms/form-3a/components/YearPicker';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import styles from '../components/EsicChallanYearlyPage.module.css';

const EsicChallanYearlyPage = () => {
  const [selectedYear, setSelectedYear] = useState('2026'); // Default to 2026 matching screenshot
  const [searchTriggeredYear, setSearchTriggeredYear] = useState('2026');
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [rowInputs, setRowInputs] = useState({});

  const dropdownRef = useRef(null);
  const addToast = useToast();

  // Helper to format Date string YYYY-MM-DD to DD/MM/YYYY for input fields or display
  const formatDateString = (dStr) => {
    if (!dStr) return '';
    const parts = dStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dStr;
  };

  const [yearlyRecords, setYearlyRecords] = useState([]);

  // Compile yearly financial challan records (April of selected year to March of following year)
  useEffect(() => {
    const fetchData = async () => {
      if (!searchTriggeredYear) {
        setYearlyRecords([]);
        return;
      }

    const startYearNum = parseInt(searchTriggeredYear);
    const endYearNum = startYearNum + 1;

    // Define the 12 financial year months
    const financialMonths = [
      { name: `April-${String(startYearNum).slice(-2)}`, key: `04/${startYearNum}`, month: 4, year: startYearNum },
      { name: `May-${String(startYearNum).slice(-2)}`, key: `05/${startYearNum}`, month: 5, year: startYearNum },
      { name: `June-${String(startYearNum).slice(-2)}`, key: `06/${startYearNum}`, month: 6, year: startYearNum },
      { name: `July-${String(startYearNum).slice(-2)}`, key: `07/${startYearNum}`, month: 7, year: startYearNum },
      { name: `August-${String(startYearNum).slice(-2)}`, key: `08/${startYearNum}`, month: 8, year: startYearNum },
      { name: `September-${String(startYearNum).slice(-2)}`, key: `09/${startYearNum}`, month: 9, year: startYearNum },
      { name: `October-${String(startYearNum).slice(-2)}`, key: `10/${startYearNum}`, month: 10, year: startYearNum },
      { name: `November-${String(startYearNum).slice(-2)}`, key: `11/${startYearNum}`, month: 11, year: startYearNum },
      { name: `December-${String(startYearNum).slice(-2)}`, key: `12/${startYearNum}`, month: 12, year: startYearNum },
      { name: `January-${String(endYearNum).slice(-2)}`, key: `01/${endYearNum}`, month: 1, year: endYearNum },
      { name: `February-${String(endYearNum).slice(-2)}`, key: `02/${endYearNum}`, month: 2, year: endYearNum },
      { name: `March-${String(endYearNum).slice(-2)}`, key: `03/${endYearNum}`, month: 3, year: endYearNum }
    ];

    // Load static employees & resignations to calculate ESIC shares dynamically
    try {
      const companyId = localStorage.getItem('selectedCompany');
      const savedChallans = await getEsicChallans(companyId) || [];

      const officePromises = financialMonths.map(m => {
        const [mm, yyyy] = m.key.split('/');
        const monthYear = `${yyyy}-${mm}`;
        return getOfficeStaffEntry(monthYear, companyId).catch(() => ({ data: [] }));
      });
      const packersPromises = financialMonths.map(m => {
        const [mm, yyyy] = m.key.split('/');
        const monthYear = `${yyyy}-${mm}`;
        return getPackersEntry(monthYear, companyId).catch(() => ({ data: [] }));
      });
      const bidiPromises = financialMonths.map(m => {
        const [mm, yyyy] = m.key.split('/');
        const monthYear = `${yyyy}-${mm}`;
        return getBidiRollerEntry(monthYear, companyId).catch(() => ({ data: [] }));
      });

      const [officeResults, packersResults, bidiResults] = await Promise.all([
        Promise.all(officePromises),
        Promise.all(packersPromises),
        Promise.all(bidiPromises)
      ]);

      const mapped = financialMonths.map((item, index) => {
        let totalMonthEsic = 0;
        let totalMonthGross = 0;

        const processRows = (rows) => {
          (rows || []).forEach(row => {
            totalMonthEsic += parseFloat(row.esic || row.esic_amount || 0);
            totalMonthGross += parseFloat(row.gross || row.gross_wages || row.total || row.netWages || 0);
          });
        };

        processRows(officeResults[index]?.data);
        processRows(packersResults[index]?.data);
        processRows(bidiResults[index]?.data);

        const empShare = Math.round(totalMonthEsic);
        const erShare = Math.round(totalMonthGross * 0.0325);

        const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const altKey1 = `${shortMonths[item.month - 1]}-${String(item.year).slice(-2)}`;
        const altKey2 = `${shortMonths[item.month - 1]}-${item.year}`;
        const match = savedChallans.find(c => {
          const dbM = String(c.wageMonth).trim();
          return dbM === item.key || dbM === altKey1 || dbM === altKey2 || dbM === item.name;
        });

        const challanNumber = match ? match.challanNumber : '';
        const actualDate = match ? match.actualDate : '';

        return {
          monthName: item.name,
          monthKey: item.key,
          empShare,
          erShare,
          challanNumber,
          actualDate
        };
      });
      setYearlyRecords(mapped);
    } catch (err) {
      console.error(err);
    }
  };
  fetchData();
  }, [searchTriggeredYear, refreshTrigger]);

  // Sync state rowInputs when yearlyRecords loads/re-runs
  useEffect(() => {
    const inputs = {};
    yearlyRecords.forEach(rec => {
      inputs[rec.monthKey] = {
        challanNumber: rec.challanNumber || '',
        actualDate: rec.actualDate || ''
      };
    });
    setRowInputs(inputs);
  }, [yearlyRecords]);

  // Filter records based on local search query
  const filteredRecords = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return yearlyRecords;

    return yearlyRecords.filter(rec => {
      const inputs = rowInputs[rec.monthKey] || {};
      return (
        rec.monthName.toLowerCase().includes(query) ||
        (rec.challanNumber && rec.challanNumber.toLowerCase().includes(query)) ||
        (inputs.challanNumber && inputs.challanNumber.toLowerCase().includes(query)) ||
        rec.actualDate.includes(query)
      );
    });
  }, [yearlyRecords, searchTerm, rowInputs]);

  // Aggregate columns totals for the summary row
  const totals = useMemo(() => {
    const sums = {
      empShare: 0,
      erShare: 0
    };

    filteredRecords.forEach(rec => {
      sums.empShare += rec.empShare;
      sums.erShare += rec.erShare;
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

  // Reset page index if search term or limit is changed
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize, searchTriggeredYear]);

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

  const handleSearch = (e) => {
    e.preventDefault();
    if (!selectedYear) {
      addToast({
        type: 'error',
        message: 'Year is required for yearly ESIC challan search.'
      });
      return;
    }

    setSearchTriggeredYear(selectedYear);
    addToast({
      type: 'success',
      message: `ESIC Challan yearly report loaded for Year: ${selectedYear}`
    });
  };

  const handleRowInputChange = (monthKey, field, value) => {
    setRowInputs(prev => ({
      ...prev,
      [monthKey]: {
        ...prev[monthKey],
        [field]: value
      }
    }));
  };

  const handleSaveRow = (monthKey) => {
    const inputs = rowInputs[monthKey];
    const challanNumber = inputs?.challanNumber || '';
    const actualDate = inputs?.actualDate || '';

    if (!challanNumber.trim()) {
      addToast({
        type: 'error',
        message: 'Challan Number is required to save.'
      });
      return;
    }
    if (!actualDate) {
      addToast({
        type: 'error',
        message: 'Actual Date of Payment is required to save.'
      });
      return;
    }

    saveEsicChallan({
      wageMonth: monthKey,
      challanNumber,
      actualDate
    });

    addToast({
      type: 'success',
      message: `ESIC Challan for Month ${monthKey} saved successfully!`
    });

    setRefreshTrigger(prev => prev + 1);
  };

  const handleExport = (type) => {
    if (filteredRecords.length === 0) {
      addToast({
        type: 'error',
        message: 'No records available to export!'
      });
      setIsDropdownOpen(false);
      return;
    }

    if (type === 'Copy') {
      const headers = ['Month', 'Employee Share', 'Employer Share', 'Challan Number', 'Actual Date of Payment'];
      let text = headers.join('\t') + '\n';
      filteredRecords.forEach(rec => {
        const inputs = rowInputs[rec.monthKey] || {};
        text += `${rec.monthName}\t${rec.empShare}\t${rec.erShare}\t${inputs.challanNumber || ''}\t${inputs.actualDate || ''}\n`;
      });
      text += `Total\t${totals.empShare}\t${totals.erShare}\t\t\n`;
      
      navigator.clipboard.writeText(text).then(() => {
        addToast({
          type: 'success',
          message: 'ESIC Challan Yearly data copied to clipboard!'
        });
      }).catch(() => {
        addToast({
          type: 'error',
          message: 'Failed to copy data.'
        });
      });
    } 
    else if (type === 'CSV' || type === 'Excel') {
      const headers = ['Month', 'Employee Share', 'Employer Share', 'Challan Number', 'Actual Date of Payment'];
      let csvContent = headers.join(',') + '\n';
      filteredRecords.forEach(rec => {
        const inputs = rowInputs[rec.monthKey] || {};
        csvContent += `${rec.monthName},${rec.empShare},${rec.erShare},"${inputs.challanNumber || ''}",${inputs.actualDate || ''}\n`;
      });
      csvContent += `Total,${totals.empShare},${totals.erShare},,\n`;

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ESIC_Challan_Yearly_${searchTriggeredYear}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast({
        type: 'success',
        message: `ESIC Challan Yearly ${type} downloaded successfully!`
      });
    }
    else if (type === 'PDF') {
      const doc = new jsPDF('landscape');
      doc.setFontSize(16);
      const titleText = `ESIC Challan Yearly Report_${searchTriggeredYear}`;
      doc.text(titleText, doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });

      const tableColumn = [
        "Month", "Employee Share", "Employer Share", "Challan Number", "Actual Date of Payment"
      ];
      const tableRows = [];

      filteredRecords.forEach((rec) => {
        const inputs = rowInputs[rec.monthKey] || {};
        tableRows.push([
          rec.monthName,
          rec.empShare,
          rec.erShare,
          inputs.challanNumber || '',
          inputs.actualDate || ''
        ]);
      });

      const totalRow = [
        "Total", totals.empShare, totals.erShare, "", ""
      ];
      tableRows.push(totalRow);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 25,
        theme: 'grid',
        headStyles: { fillColor: [243, 244, 246], textColor: [55, 65, 81], fontStyle: 'bold', halign: 'center', fontSize: 8 },
        bodyStyles: { textColor: [55, 65, 81], halign: 'center', valign: 'middle', fontSize: 8 },
        didParseCell: function(data) {
          if (data.row.index === tableRows.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [243, 244, 246];
          }
        }
      });

      doc.save(`ESIC_Challan_Yearly_${searchTriggeredYear}.pdf`);
      addToast({
        type: 'success',
        message: `ESIC Challan Yearly PDF downloaded successfully!`
      });
    }
    else {
      addToast({
        type: 'info',
        message: `${type} generated for ESIC Challan Yearly Report (${searchTriggeredYear})!`
      });
    }
    setIsDropdownOpen(false);
  };

  return (
    <div className={styles.container}>
      {/* Page Header with Company Page layout dropdown */}
      <div className={styles.headerSection}>
        <div>
          <h2 className={styles.title}>ESIC Challan Yearly</h2>
          <p className={styles.subtitle}>
            Review and update annual ESIC challan payments status, employee/employer share summaries, and payment schedules.
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

      {/* Filter Card */}
      <div className={styles.card}>
        <form onSubmit={handleSearch} className={styles.filterRow}>
          {/* Year Selector */}
          <div className={styles.filterGroup}>
            <span className={styles.label}>Select Year <span className={styles.required}>*</span></span>
            <YearPicker
              value={selectedYear}
              onChange={setSelectedYear}
            />
          </div>

          {/* Search Trigger Button */}
          <button type="submit" className={styles.searchBtn}>
            <Search size={16} />
            Search
          </button>
        </form>
      </div>

      {/* Results Card */}
      <div className={styles.tableCard}>
        {/* Controls Row aligned to Company gold standard */}
        <div className={styles.tableControls}>
          <div className={styles.totalRecords}>
            Total Records: {totalEntries}
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

        {/* Scrollable Table Container */}
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>For The Month Of</th>
                <th>Employee Share Rs.</th>
                <th>Employer Share Rs.</th>
                <th>Challan Number</th>
                <th>Actual Date of Payment</th>
                <th style={{ width: '120px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.noDataText}>
                    No records matching query found.
                  </td>
                </tr>
              ) : (
                <>
                  {paginatedData.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: '600' }}>{row.monthName}</td>
                      <td>{row.empShare}</td>
                      <td>{row.erShare}</td>
                      <td>
                        <input
                          type="text"
                          value={rowInputs[row.monthKey]?.challanNumber || ''}
                          onChange={(e) => handleRowInputChange(row.monthKey, 'challanNumber', e.target.value)}
                          className={styles.tableInput}
                          placeholder="Challan Number"
                        />
                      </td>
                      <td>
                        <DatePicker
                          name={`actualDate-${row.monthKey}`}
                          value={rowInputs[row.monthKey]?.actualDate || ''}
                          onChange={(e) => handleRowInputChange(row.monthKey, 'actualDate', e.target.value)}
                          className={styles.tableInput}
                        />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => handleSaveRow(row.monthKey)}
                          className={styles.saveRowBtn}
                        >
                          Save
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* Summary Totals Row */}
                  <tr className={styles.totalRow}>
                    <td>Total</td>
                    <td>{totals.empShare.toFixed(2)}</td>
                    <td>{totals.erShare.toFixed(2)}</td>
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer controls: Info text and pagination */}
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
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EsicChallanYearlyPage;
