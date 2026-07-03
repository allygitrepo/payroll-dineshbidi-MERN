import { Pagination } from '../../../../shared/components';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Download, FileSpreadsheet, Copy, FileText, File, Printer, UserX } from 'lucide-react';
import { useToast } from '../../../../shared/components';
import { getEmployees } from '../../../master/employee/services/employeeService';
import { getCalender } from '../../../utility/calender/services/calenderService';
import apiClient from '../../../../shared/services/apiClient';
import styles from '../components/AbsentListPage.module.css';

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
};

const getPastThreeMonths = () => {
  const months = [];
  const today = new Date();
  for (let i = 1; i <= 3; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1, // 1-indexed
      name: d.toLocaleString('default', { month: 'long', year: 'numeric' })
    });
  }
  return months;
};

const isHolidayForMonth = (dayNum, monthVal, yearVal, calList) => {
  const dateStr = `${yearVal}-${String(monthVal).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
  const isCompanyHoliday = calList.some(item => 
    item.holidayType === 'COMPANY' && item.holidayDate === dateStr
  );
  if (isCompanyHoliday) return true;

  const dateObj = new Date(yearVal, monthVal - 1, dayNum);
  const dayOfWeekIndex = dateObj.getDay();
  const dayOfWeekName = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
  ][dayOfWeekIndex];

  const hasWeeklyHolidays = calList.some(item => item.holidayType === 'WEEKLY');
  if (hasWeeklyHolidays) {
    const isWeeklyHoliday = calList.some(item => 
      item.holidayType === 'WEEKLY' && 
      item.weekDay?.trim().toLowerCase() === dayOfWeekName.toLowerCase()
    );
    return isWeeklyHoliday;
  } else {
    // Default fallback to Sunday if no weekly holidays are configured
    return dayOfWeekName === 'Sunday';
  }
};

const getWorkingDaysInMonth = (monthVal, yearVal, calList) => {
  const daysInMonth = new Date(yearVal, monthVal, 0).getDate();
  let workingDays = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    if (!isHolidayForMonth(d, monthVal, yearVal, calList)) {
      workingDays++;
    }
  }
  return workingDays;
};

const AbsentListPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const addToast = useToast();

  const [absentCandidates, setAbsentCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const pastMonths = useMemo(() => getPastThreeMonths(), []);
  const absentMonthsStr = useMemo(() => {
    return pastMonths.slice().reverse().map(m => m.name).join(', ');
  }, [pastMonths]);

  useEffect(() => {
    const fetchAbsentEmployees = async () => {
      setIsLoading(true);
      try {
        const companyId = localStorage.getItem('selectedCompany');
        if (!companyId) {
          addToast({ type: 'warning', message: 'No company selected! Please select a company on login.' });
          setIsLoading(false);
          return;
        }

        // 1. Fetch all active employees
        const allEmployees = await getEmployees(companyId);

        // 2. Fetch calendar data
        const calData = await getCalender(companyId);

        // 3. Calculate working days in each of the past 3 months
        const w1 = getWorkingDaysInMonth(pastMonths[0].month, pastMonths[0].year, calData);
        const w2 = getWorkingDaysInMonth(pastMonths[1].month, pastMonths[1].year, calData);
        const w3 = getWorkingDaysInMonth(pastMonths[2].month, pastMonths[2].year, calData);

        // 4. Fetch attendance logs for the last 3 months in parallel
        const [res1, res2, res3] = await Promise.all([
          apiClient.get(`attendance/company/${companyId}?month=${pastMonths[0].month}&year=${pastMonths[0].year}`),
          apiClient.get(`attendance/company/${companyId}?month=${pastMonths[1].month}&year=${pastMonths[1].year}`),
          apiClient.get(`attendance/company/${companyId}?month=${pastMonths[2].month}&year=${pastMonths[2].year}`)
        ]);

        // Helper to count present days per employee
        const getPresentDaysMap = (response) => {
          const map = {};
          const logs = response.data?.data || [];
          logs.forEach(log => {
            const isPresent = log.status === true || String(log.status).toLowerCase() === 'present';
            if (isPresent && log.employee_id) {
              map[log.employee_id] = (map[log.employee_id] || 0) + 1;
            }
          });
          return map;
        };

        const presentMap1 = getPresentDaysMap(res1);
        const presentMap2 = getPresentDaysMap(res2);
        const presentMap3 = getPresentDaysMap(res3);

        // 5. Filter employees who have less than full working days attendance in each of the three months
        const flaggedAbsent = allEmployees.filter(emp => {
          const p1 = presentMap1[emp.id] || 0;
          const p2 = presentMap2[emp.id] || 0;
          const p3 = presentMap3[emp.id] || 0;

          return p1 < w1 && p2 < w2 && p3 < w3;
        }).map(emp => ({
          id: emp.id,
          memberName: emp.memberName,
          memberId: emp.memberId || '-',
          uan: emp.uan || '-',
          dob: emp.dob,
          employeeType: emp.employeeType || 'OFFICE STAFF',
          contractor: emp.contractor || 'SELF',
          absentMonths: absentMonthsStr
        }));

        setAbsentCandidates(flaggedAbsent);
      } catch (err) {
        console.error('Error fetching absent list candidates:', err);
        addToast({ type: 'error', message: 'Failed to generate 3 Month Absent List.' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAbsentEmployees();
  }, [addToast, pastMonths, absentMonthsStr]);

  // Filter list by keyword
  const searchedCandidates = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return absentCandidates;

    return absentCandidates.filter(cand => {
      return (
        (cand.memberName && cand.memberName.toLowerCase().includes(query)) ||
        (cand.memberId && cand.memberId.toLowerCase().includes(query)) ||
        (cand.uan && cand.uan.toLowerCase().includes(query)) ||
        (cand.employeeType && cand.employeeType.toLowerCase().includes(query)) ||
        (cand.contractor && cand.contractor.toLowerCase().includes(query)) ||
        (formatDate(cand.dob).toLowerCase().includes(query))
      );
    });
  }, [absentCandidates, searchTerm]);

  // Pagination Logic
  const totalEntries = searchedCandidates.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);

  const paginatedData = useMemo(() => {
    return searchedCandidates.slice(startIndex, endIndex);
  }, [searchedCandidates, startIndex, endIndex]);

  // Reset page when search or layout changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

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

  const handleExport = (type) => {
    if (totalEntries === 0) {
      addToast({ type: 'error', message: 'No records available to export!' });
      setIsDropdownOpen(false);
      return;
    }

    if (type === 'Excel' || type === 'CSV') {
      const headers = ['Sr. No.', 'Name', 'Member Id', 'UAN', 'DOB', 'Type Of Employee', 'Contactor Name'];
      let csvContent = headers.join(',') + '\n';

      searchedCandidates.forEach((cand, index) => {
        const row = [
          index + 1,
          `"${cand.memberName || ''}"`,
          `"${cand.memberId || ''}"`,
          `"${cand.uan || ''}"`,
          `"${formatDate(cand.dob)}"`,
          `"${cand.employeeType || ''}"`,
          `"${cand.contractor || 'SELF'}"`
        ];
        csvContent += row.join(',') + '\n';
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `absent_list_3_months_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      addToast({ type: 'success', message: `${type} file downloaded successfully!` });
    }
    else if (type === 'Print' || type === 'PDF') {
      let iframe = document.getElementById('print-iframe');
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'print-iframe';
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        document.body.appendChild(iframe);
      }

      let html = `
        <html>
        <head>
          <title>&nbsp;</title>
          <style>
            @page {
              size: auto;
              margin: 0mm;
            }
            body {
              font-family: sans-serif;
              margin: 15mm;
              padding: 0;
            }
            table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            h2 { color: #27D68A; text-align: center; margin-bottom: 5px; }
            .sub-header { text-align: center; font-size: 13px; color: #555; margin: 4px 0; }
          </style>
        </head>
        <body>
          <h2>3 Month Absent List</h2>
          <p class="sub-header"><strong>Consequences:</strong> Absent/Leave taken in consecutive months: ${absentMonthsStr}</p>
          <p class="sub-header">Total Records: ${searchedCandidates.length}</p>
          <table>
            <thead>
              <tr>
                <th style="width: 50px; text-align: center;">Sr. No.</th>
                <th>Name</th>
                <th>Member Id</th>
                <th>UAN</th>
                <th>DOB</th>
                <th>Type Of Employee</th>
                <th>Contactor Name</th>
              </tr>
            </thead>
            <tbody>
      `;

      searchedCandidates.forEach((cand, index) => {
        html += `
          <tr>
            <td style="text-align: center;">${index + 1}</td>
            <td>${cand.memberName || ''}</td>
            <td>${cand.memberId || ''}</td>
            <td>${cand.uan || ''}</td>
            <td>${formatDate(cand.dob)}</td>
            <td>${cand.employeeType || ''}</td>
            <td>${cand.contractor || 'SELF'}</td>
          </tr>
        `;
      });

      html += `
            </tbody>
          </table>
          <script>
            window.onload = function() { 
              window.print();
            };
          </script>
        </body>
        </html>
      `;

      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(html);
      doc.close();
      iframe.contentWindow.focus();
      addToast({ type: 'success', message: `${type} document generated successfully!` });
    }
    else if (type === 'Copy') {
      const text = searchedCandidates.map((cand, index) =>
        `${index + 1}\t${cand.memberName || ''}\t${cand.memberId || ''}\t${cand.uan || ''}\t${formatDate(cand.dob)}\t${cand.employeeType || ''}\t${cand.contractor || 'SELF'}`
      ).join('\n');
      navigator.clipboard.writeText(text);
      addToast({ type: 'success', message: 'Copied absent list to clipboard!' });
    }

    setIsDropdownOpen(false);
  };

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.headerSection}>
        <div>
          <h2 className={styles.title}>3 Month Absent List</h2>
          <p className={styles.subtitle}>
            View, search, and audit employees who have been flagged as absent/taking leave for three consecutive months: {absentMonthsStr}.
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

      {/* Grid Table Card */}
      <div className={styles.tableCard}>
        {/* Controls Row */}
        <div className={styles.tableControls}>
          <div className={styles.totalRecords}>
            Total Flagged: {isLoading ? 'Loading...' : totalEntries}
          </div>

          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className={styles.searchInput}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Data Grid Table */}
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '100px', textAlign: 'center', paddingLeft: '8px', paddingRight: '8px' }}>Sr. No.</th>
                <th>Name</th>
                <th>Member Id</th>
                <th>UAN</th>
                <th>DOB</th>
                <th>Type Of Employee</th>
                <th>Contactor Name</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    Generating 3 Month Absent list... Please wait.
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No matching records found.
                  </td>
                </tr>
              ) : (
                paginatedData.map((cand, index) => (
                  <tr key={cand.id}>
                    <td style={{ textAlign: 'center', fontWeight: '500', paddingLeft: '8px', paddingRight: '8px' }}>
                      {startIndex + index + 1}
                    </td>
                    <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                      {cand.memberName}
                    </td>
                    <td>{cand.memberId}</td>
                    <td style={{ fontWeight: '500' }}>{cand.uan}</td>
                    <td>{formatDate(cand.dob)}</td>
                    <td>{cand.employeeType}</td>
                    <td>{cand.contractor}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile view cards layout */}
        <div className={styles.mobileCardsContainer}>
          {paginatedData.length > 0 ? (
            paginatedData.map((cand, index) => (
              <div key={cand.id} className={styles.mobileCard}>
                <div className={styles.mobileCardHeader}>
                  <span className={styles.mobileCardIndex}># {String(startIndex + index + 1).padStart(2, '0')}</span>
                  <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{cand.memberName}</span>
                </div>
                <div className={styles.mobileCardBody}>
                  <div className={styles.mobileCardRow}>
                    <span className={styles.mobileCardLabel}>Member ID:</span>
                    <span className={styles.mobileCardValue}>{cand.memberId}</span>
                  </div>
                  <div className={styles.mobileCardRow}>
                    <span className={styles.mobileCardLabel}>UAN:</span>
                    <span className={styles.mobileCardValue}>{cand.uan}</span>
                  </div>
                  <div className={styles.mobileCardRow}>
                    <span className={styles.mobileCardLabel}>DOB:</span>
                    <span className={styles.mobileCardValue}>{formatDate(cand.dob)}</span>
                  </div>
                  <div className={styles.mobileCardRow}>
                    <span className={styles.mobileCardLabel}>Type of Employee:</span>
                    <span className={styles.mobileCardValue}>{cand.employeeType}</span>
                  </div>
                  <div className={styles.mobileCardRow}>
                    <span className={styles.mobileCardLabel}>Contractor Name:</span>
                    <span className={styles.mobileCardValue}>{cand.contractor || '-'}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
              No matching records found.
            </div>
          )}
        </div>

        {/* Table Footer Controls */}
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
                disabled={isLoading}
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

export default AbsentListPage;
