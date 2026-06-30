import { Pagination } from '../../../../shared/components';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Download, FileSpreadsheet, Copy, FileText, File, Printer } from 'lucide-react';
import { useToast, MonthYearPicker } from '../../../../shared/components';
import { getEmployees } from '../../../master/employee/services/employeeService';
import styles from '../components/EcrReportPage.module.css';

// Realistic ECR report mock records to enrich search queries
const MOCK_ECR_RECORDS = [
  { id: 'ecr1', uan: '100188684022', name: 'KANDAN KUMAR', grossWages: 7700, epfWages: 7700, epsWages: 7700, edliWages: 7700, ncpDays: 5, refundOfAdvances: 0, pmrpy: 'NO' },
  { id: 'ecr2', uan: '102008788327', name: 'SADHANA MAHATO', grossWages: 9500, epfWages: 9500, epsWages: 9500, edliWages: 9500, ncpDays: 0, refundOfAdvances: 0, pmrpy: 'NO' },
  { id: 'ecr3', uan: '100226766722', name: 'MEGHNATH MAHATO', grossWages: 16500, epfWages: 15000, epsWages: 15000, edliWages: 15000, ncpDays: 0, refundOfAdvances: 0, pmrpy: 'YES' },
  { id: 'ecr4', uan: '100362255467', name: 'SRIHARI KUMAR', grossWages: 14200, epfWages: 14200, epsWages: 14200, edliWages: 14200, ncpDays: 1, refundOfAdvances: 0, pmrpy: 'NO' },
  { id: 'ecr5', uan: '100247084817', name: 'NABIN MAHATO', grossWages: 12000, epfWages: 12000, epsWages: 12000, edliWages: 12000, ncpDays: 2, refundOfAdvances: 0, pmrpy: 'YES' },
  { id: 'ecr6', uan: '101002763152', name: 'SANJAY MAHATO', grossWages: 8000, epfWages: 8000, epsWages: 8000, edliWages: 8000, ncpDays: 0, refundOfAdvances: 0, pmrpy: 'NO' },
  { id: 'ecr7', uan: '101002763175', name: 'RAJU KUMAR', grossWages: 8000, epfWages: 8000, epsWages: 8000, edliWages: 8000, ncpDays: 2, refundOfAdvances: 0, pmrpy: 'NO' },
  { id: 'ecr8', uan: '100115419794', name: 'BIPADTARAN GOSWAMI', grossWages: 8700, epfWages: 8700, epsWages: 8700, edliWages: 8700, ncpDays: 0, refundOfAdvances: 0, pmrpy: 'YES' },
  { id: 'ecr9', uan: '102163961347', name: 'SWAPAN MAHATO', grossWages: 7000, epfWages: 7000, epsWages: 7000, edliWages: 7000, ncpDays: 0, refundOfAdvances: 0, pmrpy: 'NO' },
  { id: 'ecr10', uan: '100194181241', name: 'KIRAN KUMAR', grossWages: 7500, epfWages: 7500, epsWages: 7500, edliWages: 7500, ncpDays: 0, refundOfAdvances: 0, pmrpy: 'NO' }
];

const EcrReportPage = () => {
  const [selectedMonth, setSelectedMonth] = useState(''); // Default empty matching SELECT DATE placeholder
  const [pmrpyFilter, setPmrpyFilter] = useState('ALL');
  const [searchTriggeredMonth, setSearchTriggeredMonth] = useState('');
  const [searchTriggeredPmrpy, setSearchTriggeredPmrpy] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const dropdownRef = useRef(null);
  const addToast = useToast();

  const [allRecords, setAllRecords] = useState([]);

  // Load database and mock records
  useEffect(() => {
    const fetchData = async () => {
      const companyId = localStorage.getItem('selectedCompany');
      try {
        let dbList = await getEmployees(companyId) || [];
        dbList = dbList.filter(emp => emp.status === 'Active' || emp.status === true);
        
        // Map active db employees to ECR columns
        const mappedDb = dbList.map(emp => {
          const grossWages = emp.basicSalary || 8000;
          const epfWages = Math.min(grossWages, 15000);
          const epsWages = Math.min(grossWages, 15000);
          const edliWages = Math.min(grossWages, 15000);
          const ncpDays = 0; // Default 0 NCP Days
          const refundOfAdvances = 0;
          const pmrpy = emp.pmrpy ? 'YES' : 'NO';

          return {
            id: emp.id,
            uan: emp.uan || 'N/A',
            name: emp.memberName,
            grossWages,
            epfWages,
            epsWages,
            edliWages,
            ncpDays,
            refundOfAdvances,
            pmrpy
          };
        });

        // Merge database list and mock records avoiding duplicates by UAN
        const uniqueUans = new Set(mappedDb.map(e => e.uan));
        const uniqueMocks = MOCK_ECR_RECORDS.filter(e => !uniqueUans.has(e.uan));

        const combinedList = [...mappedDb, ...uniqueMocks];

        // Compute EPF, EPS and Diff contributions
        const finalRecords = combinedList.map(row => {
          const epfContribution = Math.round(row.epfWages * 0.12);
          const epsContribution = Math.round(row.epsWages * 0.0833);
          const epfEpsDiff = epfContribution - epsContribution;

          return {
            ...row,
            epfContribution,
            epsContribution,
            epfEpsDiff
          };
        });
        setAllRecords(finalRecords);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, []);

  // Filter records based on whether search was clicked, PMRPY filters, and local search term
  const filteredRecords = useMemo(() => {
    if (!searchTriggeredMonth) {
      return [];
    }

    let result = allRecords;

    if (searchTriggeredPmrpy !== 'ALL') {
      result = result.filter(rec => rec.pmrpy === searchTriggeredPmrpy);
    }

    const query = searchTerm.toLowerCase().trim();
    if (query) {
      result = result.filter(rec => {
        return (
          (rec.name && rec.name.toLowerCase().includes(query)) ||
          (rec.uan && rec.uan.includes(query))
        );
      });
    }

    return result;
  }, [allRecords, searchTriggeredMonth, searchTriggeredPmrpy, searchTerm]);

  // Aggregate columns totals for the summary row
  const totals = useMemo(() => {
    const sums = {
      grossWages: 0,
      epfWages: 0,
      epsWages: 0,
      edliWages: 0,
      epfContribution: 0,
      epsContribution: 0,
      epfEpsDiff: 0,
      ncpDays: 0,
      refundOfAdvances: 0
    };

    filteredRecords.forEach(rec => {
      sums.grossWages += rec.grossWages;
      sums.epfWages += rec.epfWages;
      sums.epsWages += rec.epsWages;
      sums.edliWages += rec.edliWages;
      sums.epfContribution += rec.epfContribution;
      sums.epsContribution += rec.epsContribution;
      sums.epfEpsDiff += rec.epfEpsDiff;
      sums.ncpDays += rec.ncpDays;
      sums.refundOfAdvances += rec.refundOfAdvances;
    });

    return sums;
  }, [filteredRecords]);

  // Pagination calculations
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
  }, [searchTerm, pageSize, searchTriggeredMonth, searchTriggeredPmrpy]);

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
    if (!selectedMonth) {
      addToast({
        type: 'error',
        message: 'Month and Year is required for ECR search.'
      });
      return;
    }

    setSearchTriggeredMonth(selectedMonth);
    setSearchTriggeredPmrpy(pmrpyFilter);

    const mStr = selectedMonth.split('-')[1] + '/' + selectedMonth.split('-')[0];
    addToast({
      type: 'success',
      message: `ECR Report compiled for Month: ${mStr}, PMRPY: ${pmrpyFilter}`
    });
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
      const headers = ['UAN', 'Employee Name', 'Gross Wages', 'EPF Wages', 'EPS Wages', 'EDLI Wages', 'EPF Contribution', 'EPS Contribution', 'EPF & EPS Diff', 'NCP Days', 'Refund of Advances'];
      let text = headers.join('\t') + '\n';
      filteredRecords.forEach(rec => {
        text += `${rec.uan}\t${rec.name}\t${rec.grossWages}\t${rec.epfWages}\t${rec.epsWages}\t${rec.edliWages}\t${rec.epfContribution}\t${rec.epsContribution}\t${rec.epfEpsDiff}\t${rec.ncpDays}\t${rec.refundOfAdvances}\n`;
      });
      text += `Total\t\t${totals.grossWages}\t${totals.epfWages}\t${totals.epsWages}\t${totals.edliWages}\t${totals.epfContribution}\t${totals.epsContribution}\t${totals.epfEpsDiff}\t${totals.ncpDays}\t${totals.refundOfAdvances}\n`;

      navigator.clipboard.writeText(text).then(() => {
        addToast({
          type: 'success',
          message: 'ECR Report data copied to clipboard!'
        });
      });
    } 
    else if (type === 'CSV' || type === 'Excel') {
      const headers = [
        'UAN',
        'Employee Name',
        'Gross Wages',
        'EPF Wages',
        'EPS Wages',
        'EDLI Wages',
        'EPF Contribution remitted',
        'EPS Contribution remitted',
        'EPF and EPS Diff remitted',
        'NCP Days',
        'Refund of Advances'
      ];

      let csvContent = headers.join(',') + '\n';
      filteredRecords.forEach(rec => {
        const row = [
          rec.uan,
          `"${rec.name}"`,
          rec.grossWages,
          rec.epfWages,
          rec.epsWages,
          rec.edliWages,
          rec.epfContribution,
          rec.epsContribution,
          rec.epfEpsDiff,
          rec.ncpDays,
          rec.refundOfAdvances
        ];
        csvContent += row.join(',') + '\n';
      });

      // Add Totals Row
      const totalRow = [
        'Total',
        '',
        totals.grossWages,
        totals.epfWages,
        totals.epsWages,
        totals.edliWages,
        totals.epfContribution,
        totals.epsContribution,
        totals.epfEpsDiff,
        totals.ncpDays,
        totals.refundOfAdvances
      ];
      csvContent += totalRow.join(',') + '\n';

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const monthLabel = searchTriggeredMonth ? searchTriggeredMonth.replace('-', '_') : 'all';
      link.download = `ECR_Report_${monthLabel}_PMRPY_${searchTriggeredPmrpy}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast({
        type: 'success',
        message: `ECR Report ${type} downloaded successfully for ${filteredRecords.length} records!`
      });
    }
    else {
      // PDF and Print simulator matching system behaviors
      addToast({
        type: 'info',
        message: `${type} generated for ECR Report (${searchTriggeredMonth})!`
      });
    }
    setIsDropdownOpen(false);
  };

  return (
    <div className={styles.container}>
      {/* Page Header with Download dropdown */}
      <div className={styles.headerSection}>
        <div>
          <h2 className={styles.title}>ECR Report</h2>
          <p className={styles.subtitle}>
            Generate and export the Electronic Challan cum Return (ECR) report details matching EPF returns.
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
          {/* Month Year Selector */}
          <div className={styles.filterGroup}>
            <span className={styles.label}>Month and Year <span className={styles.required}>*</span></span>
            <MonthYearPicker
              value={selectedMonth}
              onChange={setSelectedMonth}
              placeholder="SELECT DATE*"
            />
          </div>

          {/* PMRPY Selector */}
          <div className={styles.filterGroup}>
            <span className={styles.label}>PMRPY</span>
            <select
              value={pmrpyFilter}
              onChange={(e) => setPmrpyFilter(e.target.value)}
              className={styles.selectInput}
            >
              <option value="ALL">ALL</option>
              <option value="YES">YES</option>
              <option value="NO">NO</option>
            </select>
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
        {/* Controls Row */}
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
              disabled={!searchTriggeredMonth}
            />
          </div>
        </div>

        {/* Scrollable Table Container */}
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '80px', textTransform: 'none' }}>Sr No.</th>
                <th>UAN</th>
                <th>Employee Name</th>
                <th>Gross Wages</th>
                <th>EPF Wages</th>
                <th>EPS Wages</th>
                <th>EDLI Wages</th>
                <th>EPF Contribution remitted</th>
                <th>EPS Contribution remitted</th>
                <th>EPF and EPS Diff remitted</th>
                <th>NCP Days</th>
                <th>Refund of Advances</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={12} className={styles.noDataText}>
                    {!searchTriggeredMonth ? 'Select Month and PMRPY to query ECR Report records.' : 'No matching records found.'}
                  </td>
                </tr>
              ) : (
                <>
                  {paginatedData.map((row, idx) => (
                    <tr key={row.id}>
                      <td style={{ fontWeight: '500' }}>{startIndex + idx + 1}</td>
                      <td>{row.uan}</td>
                      <td style={{ fontWeight: '600' }}>{row.name}</td>
                      <td>{row.grossWages}</td>
                      <td>{row.epfWages}</td>
                      <td>{row.epsWages}</td>
                      <td>{row.edliWages}</td>
                      <td>{row.epfContribution}</td>
                      <td>{row.epsContribution}</td>
                      <td>{row.epfEpsDiff}</td>
                      <td>{row.ncpDays}</td>
                      <td>{row.refundOfAdvances}</td>
                    </tr>
                  ))}

                  {/* Summary Totals Row */}
                  <tr className={styles.totalRow}>
                    <td colSpan={3} style={{ textAlign: 'right', paddingRight: '20px' }}>Total</td>
                    <td>{totals.grossWages}</td>
                    <td>{totals.epfWages}</td>
                    <td>{totals.epsWages}</td>
                    <td>{totals.edliWages}</td>
                    <td>{totals.epfContribution}</td>
                    <td>{totals.epsContribution}</td>
                    <td>{totals.epfEpsDiff}</td>
                    <td>{totals.ncpDays}</td>
                    <td>{totals.refundOfAdvances}</td>
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

export default EcrReportPage;
