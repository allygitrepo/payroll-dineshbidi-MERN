import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Download, FileSpreadsheet, Copy, FileText, File, Printer } from 'lucide-react';
import { useToast } from '../../../../shared/components';
import { getEmployees } from '../../../master/employee/services/employeeService';
import { getResignations } from '../../../entry/resignation/services/resignationService';
import { getEsicChallans, saveEsicChallan } from '../services/esicChallanYearlyService';
import YearPicker from '../../forms/form-3a/components/YearPicker';
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

  // Compile yearly financial challan records (April of selected year to March of following year)
  const yearlyRecords = useMemo(() => {
    if (!searchTriggeredYear) return [];

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
    const employees = getEmployees() || [];
    const resignations = getResignations() || [];
    const savedChallans = getEsicChallans() || [];

    return financialMonths.map(item => {
      // 1. Calculate dynamic ESIC contributions for the month
      let totalMonthWages = 0;
      employees.forEach(emp => {
        // Parse joined date
        if (emp.dateOfJoining) {
          const [joinY, joinM] = emp.dateOfJoining.split('-').map(Number);
          const joinVal = joinY * 12 + joinM;
          const targetVal = item.year * 12 + item.month;
          if (joinVal > targetVal) return; // Hasn't joined yet
        }

        // Parse resignation date
        const resignation = resignations.find(res => 
          (res.uan && res.uan === emp.uan) ||
          (res.nameOfMember && res.nameOfMember.toUpperCase() === emp.memberName.toUpperCase())
        );

        if (resignation && resignation.dateOfLeaving) {
          const [leaveY, leaveM] = resignation.dateOfLeaving.split('-').map(Number);
          const leaveVal = leaveY * 12 + leaveM;
          const targetVal = item.year * 12 + item.month;
          if (targetVal > leaveVal) return; // Resigned in a past month
        }

        // Add to total month wages
        totalMonthWages += emp.basicSalary || 8000;
      });

      // Calculate shares based on rates: Employee 0.75%, Employer 3.25% (both rounded up)
      const empShare = Math.ceil(totalMonthWages * 0.0075);
      const erShare = Math.ceil(totalMonthWages * 0.0325);

      // Find saved challan details
      const match = savedChallans.find(c => c.wageMonth === item.key);
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
                        <input
                          type="date"
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

export default EsicChallanYearlyPage;
