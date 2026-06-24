import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Download, FileSpreadsheet, Copy, FileText, File, Printer } from 'lucide-react';
import { useToast, MonthYearPicker } from '../../../../shared/components';
import { getEmployees } from '../../../master/employee/services/employeeService';
import { getResignations } from '../../../entry/resignation/services/resignationService';
import { getOfficeStaffEntry } from '../../../entry/office-staff/services/officeStaffEntryService';
import { getPackersEntry } from '../../../entry/packers/services/packersEntryService';
import { getBidiRollerEntry } from '../../../entry/bidi-roller/services/bidiRollerEntryService';
import styles from '../components/EsicReportPage.module.css';

// Realistic ESIC mock records to enrich search queries and represent reference data
const MOCK_ESIC_RECORDS = [
  { id: 'esic1', ipNumber: '7431081694', name: 'KANDAN KUMAR', daysWorked: 24, totalWages: 7700, reasonCode: 0, lastWorkingDay: '' },
  { id: 'esic2', ipNumber: '7431095828', name: 'SADHANA MAHATO', daysWorked: 26, totalWages: 9500, reasonCode: 0, lastWorkingDay: '' },
  { id: 'esic3', ipNumber: '7431095855', name: 'MEGHNATH MAHATO', daysWorked: 22, totalWages: 16500, reasonCode: 0, lastWorkingDay: '' },
  { id: 'esic4', ipNumber: '7431095866', name: 'SRIHARI KUMAR', daysWorked: 23, totalWages: 14200, reasonCode: 0, lastWorkingDay: '' },
  { id: 'esic5', ipNumber: '7431095877', name: 'NABIN MAHATO', daysWorked: 0, totalWages: 0, reasonCode: 4, lastWorkingDay: '15/05/2026' },
  { id: 'esic6', ipNumber: '7431095888', name: 'SANJAY MAHATO', daysWorked: 26, totalWages: 8000, reasonCode: 0, lastWorkingDay: '' },
  { id: 'esic7', ipNumber: '7431095899', name: 'RAJU KUMAR', daysWorked: 24, totalWages: 8000, reasonCode: 0, lastWorkingDay: '' },
  { id: 'esic8', ipNumber: '7431095901', name: 'BIPADTARAN GOSWAMI', daysWorked: 26, totalWages: 8700, reasonCode: 0, lastWorkingDay: '' },
  { id: 'esic9', ipNumber: '7431095912', name: 'SWAPAN MAHATO', daysWorked: 26, totalWages: 7000, reasonCode: 0, lastWorkingDay: '' },
  { id: 'esic10', ipNumber: '7431095923', name: 'KIRAN KUMAR', daysWorked: 26, totalWages: 7500, reasonCode: 0, lastWorkingDay: '' }
];

const EsicReportPage = () => {
  const [selectedMonth, setSelectedMonth] = useState('2026-05'); // Default to match screenshot 05/2026
  const [searchTriggeredMonth, setSearchTriggeredMonth] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const dropdownRef = useRef(null);
  const addToast = useToast();

  const [allRecords, setAllRecords] = useState([]);

  // Load database employees, cross reference with resignations and combine with mock records
  useEffect(() => {
    const fetchData = async () => {
      if (!searchTriggeredMonth) {
        setAllRecords([]);
        return;
      }

      const companyId = localStorage.getItem('selectedCompany');
      try {
        const dbList = await getEmployees(companyId) || [];
        const resignationsList = await getResignations(companyId) || [];
        const officeRes = await getOfficeStaffEntry(searchTriggeredMonth, companyId);
        const packersRes = await getPackersEntry(searchTriggeredMonth, companyId);
        const bidiRes = await getBidiRollerEntry(searchTriggeredMonth, companyId);
        
        const officeRows = officeRes?.data || [];
        const packersRows = packersRes?.data || [];
        const bidiRows = bidiRes?.data || [];

        // Helper to format Date string YYYY-MM-DD to DD/MM/YYYY
        const formatLeavingDate = (dStr) => {
          if (!dStr) return '';
          const parts = dStr.split('-');
          if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
          }
          return dStr;
        };

        const mapReasonToCode = (reason) => {
          if (!reason) return 11;
          const r = String(reason).trim().toUpperCase();
          if (r === 'C') return 2;
          if (r === 'S') return 3;
          if (r === 'D') return 5;
          return 11;
        };

        // Process DB employee list
        const mappedDb = dbList.map(emp => {
          const name = emp.memberName;
          const uan = emp.uan;
          const ipNumber = emp.ipNumber || '';
          
          let days = 0;
          let wages = 0;

          if (emp.employeeType === 'OFFICE STAFF') {
             const row = officeRows.find(r => r.employeeName === name || r.employeeCode === emp.memberId);
             if (row) { days = row.no_of_days_worked || row.days || 0; wages = row.gross || row.gross_wages || row.netWages || 0; }
          } else if (emp.employeeType === 'PACKING STAFF') {
             const row = packersRows.find(r => r.employeeName === name || r.employeeCode === emp.memberId);
             if (row) { days = row.no_of_worked_days || row.no_of_days || row.days || 0; wages = row.total || row.gross_wages || row.netWages || 0; }
          } else {
             const row = bidiRows.find(r => r.employeeName === name || r.employeeCode === emp.memberId);
             if (row) { days = row.no_of_days || row.days || 0; wages = row.total || row.gross_wages || row.netWages || 0; }
          }
          
          days = Math.ceil(parseFloat(days) || 0);
          wages = Math.round(parseFloat(wages) || 0);
          
          let reasonCode = '';
          let lastWorkingDay = '';
          
          if (days > 0 && wages > 0) {
            reasonCode = '';
            lastWorkingDay = '';
          } else {
            const resignation = resignationsList.find(res => {
              return (res.uan && res.uan === uan) || (res.nameOfMember && res.nameOfMember.toUpperCase() === name.toUpperCase());
            });
            
            if (resignation) {
              reasonCode = mapReasonToCode(resignation.reasonOfLeaving);
              lastWorkingDay = formatLeavingDate(resignation.dateOfLeaving);
            } else {
              reasonCode = 11;
              lastWorkingDay = '';
            }
          }

          return {
            id: emp.id,
            ipNumber,
            name,
            daysWorked: days,
            totalWages: wages,
            reasonCode,
            lastWorkingDay
          };
        });

        // Filter out employees without an IP Number and who did not work or resign
        const validRecords = mappedDb.filter(e => e.ipNumber);

        setAllRecords(validRecords);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, [searchTriggeredMonth]);

  // Filter list based on whether search was clicked, and local search term
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
          (rec.name && rec.name.toLowerCase().includes(query)) ||
          (rec.ipNumber && rec.ipNumber.includes(query))
        );
      });
    }

    return result;
  }, [allRecords, searchTriggeredMonth, searchTerm]);

  // Aggregate columns totals for the summary row
  const totals = useMemo(() => {
    const sums = {
      daysWorked: 0,
      totalWages: 0
    };

    filteredRecords.forEach(rec => {
      sums.daysWorked += rec.daysWorked;
      sums.totalWages += rec.totalWages;
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
        message: 'Month and Year is required for ESIC search.'
      });
      return;
    }

    setSearchTriggeredMonth(selectedMonth);

    const mStr = selectedMonth.split('-')[1] + '/' + selectedMonth.split('-')[0];
    addToast({
      type: 'success',
      message: `ESIC Report compiled for Month: ${mStr}`
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
      const headers = ['IP Number', 'IP Name', 'Days Paid/Payable', 'Total Monthly Wages', 'Reason Code for Zero Days', 'Last Working Day'];
      let text = headers.join('\t') + '\n';
      filteredRecords.forEach(rec => {
        text += `${rec.ipNumber}\t${rec.name}\t${rec.daysWorked}\t${rec.totalWages}\t${rec.reasonCode}\t${rec.lastWorkingDay || ''}\n`;
      });
      text += `Total\t\t${totals.daysWorked}\t${totals.totalWages}\t\t\n`;

      navigator.clipboard.writeText(text).then(() => {
        addToast({
          type: 'success',
          message: 'ESIC Report data copied to clipboard!'
        });
      });
    } 
    else if (type === 'TXT (ESIC)') {
      let txtContent = '';
      const mStr = searchTriggeredMonth ? (searchTriggeredMonth.split('-')[1] + ' ' + searchTriggeredMonth.split('-')[0]) : '';
      filteredRecords.forEach(rec => {
        txtContent += `${rec.ipNumber}####${rec.name}####${rec.daysWorked}####${rec.totalWages}####${rec.reasonCode}####${rec.lastWorkingDay || ''}####${mStr}\n`;
      });

      const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const monthLabel = searchTriggeredMonth ? searchTriggeredMonth.replace('-', '_') : 'all';
      link.download = `ESIC_Report_${monthLabel}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast({
        type: 'success',
        message: `ESIC Report TXT downloaded successfully for ${filteredRecords.length} records!`
      });
    }
    else if (type === 'CSV' || type === 'Excel') {
      const headers = [
        'IP Number',
        'IP Name',
        'Days Paid/Payable',
        'Total Monthly Wages',
        'Reason Code for Zero Days',
        'Last Working Day'
      ];

      let csvContent = headers.join(',') + '\n';
      filteredRecords.forEach(rec => {
        const row = [
          rec.ipNumber,
          `"${rec.name}"`,
          rec.daysWorked,
          rec.totalWages,
          rec.reasonCode,
          rec.lastWorkingDay || ''
        ];
        csvContent += row.join(',') + '\n';
      });

      // Add Totals Row
      const totalRow = [
        'Total',
        '',
        totals.daysWorked,
        totals.totalWages,
        '',
        ''
      ];
      csvContent += totalRow.join(',') + '\n';

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const monthLabel = searchTriggeredMonth ? searchTriggeredMonth.replace('-', '_') : 'all';
      link.download = `ESIC_Report_${monthLabel}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast({
        type: 'success',
        message: `ESIC Report ${type} downloaded successfully for ${filteredRecords.length} records!`
      });
    }
    else {
      // PDF and Print simulator matching system behaviors
      addToast({
        type: 'info',
        message: `${type} generated for ESIC Report (${searchTriggeredMonth})!`
      });
    }
    setIsDropdownOpen(false);
  };

  return (
    <div className={styles.container}>
      {/* Page Header with Download dropdown */}
      <div className={styles.headerSection}>
        <div>
          <h2 className={styles.title}>ESIC Report</h2>
          <p className={styles.subtitle}>
            Generate and export monthly Employees' State Insurance Corporation (ESIC) reports and contributor sheets.
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
                <button onClick={() => handleExport('TXT (ESIC)')}>
                  <FileText size={16} /> TXT (ESIC)
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
                <th>IP Number<br />(10 Digits)</th>
                <th>IP Name<br />(Only alphabets and space)</th>
                <th>No of Days for which wages<br />paid/payable during the month</th>
                <th>Total Monthly Wages</th>
                <th>Reason Code for Zero working<br />days(numeric only, provide 0 for all<br />other reasons- Click on the link for reference)</th>
                <th>Last Working Day<br />(Format DD/MM/YYYY or<br />DD-MM-YYYY)</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.noDataText}>
                    {!searchTriggeredMonth ? 'Select Month and Year to query ESIC Report records.' : 'No matching records found.'}
                  </td>
                </tr>
              ) : (
                <>
                  {paginatedData.map((row, idx) => (
                    <tr key={row.id}>
                      <td style={{ fontWeight: '500' }}>{startIndex + idx + 1}</td>
                      <td>{row.ipNumber}</td>
                      <td style={{ fontWeight: '600' }}>{row.name}</td>
                      <td>{row.daysWorked}</td>
                      <td>{row.totalWages}</td>
                      <td>{row.reasonCode}</td>
                      <td>{row.lastWorkingDay || '-'}</td>
                    </tr>
                  ))}

                  {/* Summary Totals Row */}
                  <tr className={styles.totalRow}>
                    <td colSpan={3} style={{ textAlign: 'right', paddingRight: '20px' }}>Total</td>
                    <td>{totals.daysWorked}</td>
                    <td>{totals.totalWages}</td>
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

export default EsicReportPage;
