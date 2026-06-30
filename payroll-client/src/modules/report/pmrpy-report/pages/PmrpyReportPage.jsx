import { Pagination } from '../../../../shared/components';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Download, FileSpreadsheet, Copy, FileText, File, Printer } from 'lucide-react';
import { useToast, MonthYearPicker } from '../../../../shared/components';
import { getEmployees } from '../../../master/employee/services/employeeService';
import styles from '../components/PmrpyReportPage.module.css';

// Realistic PMRPY mock records to match financial year searches
const MOCK_PMRPY_RECORDS = [
  { id: 'pmrpy1', uan: '100226766722', aadhaar: '546310293817', grossWages: 16500, jobId: 'JOB-ROLLER-01' },
  { id: 'pmrpy2', uan: '100247084817', aadhaar: '728193047510', grossWages: 12000, jobId: 'JOB-ROLLER-02' },
  { id: 'pmrpy3', uan: '100115419794', aadhaar: '918273645019', grossWages: 8700, jobId: 'JOB-OFFICE-01' },
  { id: 'pmrpy4', uan: '101177429203', aadhaar: '827103948576', grossWages: 9200, jobId: 'JOB-ROLLER-03' },
  { id: 'pmrpy5', uan: '100362255467', aadhaar: '485720193847', grossWages: 14200, jobId: 'JOB-ROLLER-04' }
];

const PmrpyReportPage = () => {
  const [selectedMonth, setSelectedMonth] = useState('2020-01'); // Default to 01/2020 matching screenshot
  const [searchTriggeredMonth, setSearchTriggeredMonth] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const dropdownRef = useRef(null);
  const addToast = useToast();

  const [allRecords, setAllRecords] = useState([]);

  // Load database employees whose PMRPY status is YES, and combine with mock records
  useEffect(() => {
    const fetchData = async () => {
      const companyId = localStorage.getItem('selectedCompany');
      try {
        let dbList = await getEmployees(companyId) || [];
        dbList = dbList.filter(emp => emp.status === 'Active' || emp.status === true);
        const dbPmrpy = dbList.filter(emp => emp.pmrpy === 'YES');

    const mappedDb = dbPmrpy.map(emp => {
      const grossWages = emp.basicSalary || 8000;
      // Get Aadhaar Card from employee details or from KYC Aadhaar record
      let aadhaar = emp.aadhaarCard || 'N/A';
      if ((!aadhaar || aadhaar === 'N/A') && emp.kycDetails) {
        const adKyc = emp.kycDetails.find(k => k.documentType === 'AADHAAR');
        if (adKyc) aadhaar = adKyc.documentNumber;
      }

      return {
        id: emp.id,
        uan: emp.uan || 'N/A',
        aadhaar,
        grossWages,
        jobId: 'JOB-' + (emp.employeeType || 'STAFF').split(' ')[0] + '-' + String(emp.id).padStart(2, '0')
      };
    });

    // Merge database list and mock records avoiding duplicates by UAN
    const uniqueUans = new Set(mappedDb.map(e => e.uan));
    const uniqueMocks = MOCK_PMRPY_RECORDS.filter(e => !uniqueUans.has(e.uan));

    setAllRecords([...mappedDb, ...uniqueMocks]);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, []);

  // Filter records based on whether search was clicked and local search term
  const filteredRecords = useMemo(() => {
    if (!searchTriggeredMonth) {
      return []; // Return empty list before search
    }

    let result = allRecords;

    // Filter by local search query
    const query = searchTerm.toLowerCase().trim();
    if (query) {
      result = result.filter(rec => {
        return (
          (rec.uan && rec.uan.includes(query)) ||
          (rec.aadhaar && rec.aadhaar.includes(query)) ||
          (rec.jobId && rec.jobId.toLowerCase().includes(query))
        );
      });
    }

    return result;
  }, [allRecords, searchTriggeredMonth, searchTerm]);

  // Aggregate Gross Wages total for the summary row
  const totals = useMemo(() => {
    const sums = { grossWages: 0 };
    filteredRecords.forEach(rec => {
      sums.grossWages += rec.grossWages;
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

  const handleSearch = (e) => {
    e.preventDefault();
    if (!selectedMonth) {
      addToast({
        type: 'error',
        message: 'Month and Year is required for PMRPY search.'
      });
      return;
    }

    setSearchTriggeredMonth(selectedMonth);

    const mStr = selectedMonth.split('-')[1] + '/' + selectedMonth.split('-')[0];
    addToast({
      type: 'success',
      message: `PMRPY Report compiled for Month: ${mStr}`
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
      const headers = ['UAN', 'Aadhaar No.', 'Gross Wages', 'Job Description Id'];
      let text = headers.join('\t') + '\n';
      filteredRecords.forEach(rec => {
        text += `${rec.uan}\t${rec.aadhaar}\t${rec.grossWages}\t${rec.jobId}\n`;
      });
      text += `Total\t\t${totals.grossWages}\t\n`;

      navigator.clipboard.writeText(text).then(() => {
        addToast({
          type: 'success',
          message: 'PMRPY Report data copied to clipboard!'
        });
      });
    } 
    else if (type === 'CSV' || type === 'Excel') {
      const headers = [
        'UAN',
        'Aadhaar No.',
        'Gross Wages',
        'Job Description Id'
      ];

      let csvContent = headers.join(',') + '\n';
      filteredRecords.forEach(rec => {
        const row = [
          rec.uan,
          `"${rec.aadhaar}"`,
          rec.grossWages,
          rec.jobId
        ];
        csvContent += row.join(',') + '\n';
      });

      // Add Totals Row
      const totalRow = [
        'Total',
        '',
        totals.grossWages,
        ''
      ];
      csvContent += totalRow.join(',') + '\n';

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const monthLabel = searchTriggeredMonth ? searchTriggeredMonth.replace('-', '_') : 'all';
      link.download = `PMRPY_Report_${monthLabel}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast({
        type: 'success',
        message: `PMRPY Report ${type} downloaded successfully for ${filteredRecords.length} records!`
      });
    }
    else {
      // PDF and Print simulator matching system behaviors
      addToast({
        type: 'info',
        message: `${type} generated for PMRPY Report (${searchTriggeredMonth})!`
      });
    }
    setIsDropdownOpen(false);
  };

  return (
    <div className={styles.container}>
      {/* Page Header with Download dropdown */}
      <div className={styles.headerSection}>
        <div>
          <h2 className={styles.title}>PMRPY Report</h2>
          <p className={styles.subtitle}>
            Generate and download Pradhan Mantri Rojgar Protsahan Yojana (PMRPY) employer benefit details.
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
                <th style={{ width: '80px' }}>Sr No.</th>
                <th>UAN</th>
                <th>Aadhaar No.</th>
                <th>Gross Wages</th>
                <th>Job Description Id</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.noDataText}>
                    {!searchTriggeredMonth ? 'Select Month and Year to query PMRPY Report records.' : 'No matching records found.'}
                  </td>
                </tr>
              ) : (
                <>
                  {paginatedData.map((row, idx) => (
                    <tr key={row.id}>
                      <td style={{ fontWeight: '500' }}>{startIndex + idx + 1}</td>
                      <td>{row.uan}</td>
                      <td>{row.aadhaar}</td>
                      <td>{row.grossWages}</td>
                      <td>{row.jobId}</td>
                    </tr>
                  ))}

                  {/* Summary Totals Row */}
                  <tr className={styles.totalRow}>
                    <td colSpan={3} style={{ textAlign: 'right', paddingRight: '20px' }}>Total</td>
                    <td>{totals.grossWages}</td>
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

export default PmrpyReportPage;
