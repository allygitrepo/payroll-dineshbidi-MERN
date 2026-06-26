import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Download, FileSpreadsheet, Copy, FileText, File, Printer } from 'lucide-react';
import { useToast, MonthYearPicker } from '../../../../shared/components';
import { getEmployees } from '../../../master/employee/services/employeeService';
import styles from '../components/EmployeeDataExportPage.module.css';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

const EmployeeDataExportPage = () => {
  const [selectedMonth, setSelectedMonth] = useState('2026-04'); // default to match screenshot 04/2026
  const [searchTriggeredMonth, setSearchTriggeredMonth] = useState('2026-04');
  const [localSearch, setLocalSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const addToast = useToast();

  const [dbEmployees, setDbEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      setIsLoading(true);
      try {
        const companyId = localStorage.getItem('selectedCompany');
        if (companyId) {
          const res = await getEmployees(companyId);
          setDbEmployees(res || []);
        } else {
          setDbEmployees([]);
          addToast({ type: 'warning', message: 'No company selected! Please select a company on login.' });
        }
      } catch (err) {
        addToast({ type: 'error', message: 'Failed to fetch employees' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  // Filter employees based on joining date <= selected month
  const filteredByMonth = useMemo(() => {
    if (!searchTriggeredMonth) return dbEmployees;

    // Filter joining dates up to the selected searchTriggeredMonth
    const result = dbEmployees.filter(emp => {
      if (!emp.dateOfJoining) return true;
      const joinMonth = emp.dateOfJoining.substring(0, 7);
      return joinMonth <= searchTriggeredMonth;
    });

    return result;
  }, [dbEmployees, searchTriggeredMonth]);

  // Handle local text search query input
  const searchedData = useMemo(() => {
    const query = localSearch.toLowerCase().trim();
    if (!query) return filteredByMonth;

    return filteredByMonth.filter(emp => {
      const formattedDob = formatDate(emp.dob).toLowerCase();
      const formattedDoj = formatDate(emp.dateOfJoining).toLowerCase();
      const mobileStr = (emp.mobile || emp.mobileNumber || '').toLowerCase();
      const emailStr = (emp.email || emp.emailId || '').toLowerCase();
      const genderStr = (emp.gender || '').toLowerCase();

      return (
        (emp.uan && emp.uan.toLowerCase().includes(query)) ||
        (emp.ipNumber && emp.ipNumber.toLowerCase().includes(query)) ||
        (emp.memberName && emp.memberName.toLowerCase().includes(query)) ||
        (emp.fatherHusbandName && emp.fatherHusbandName.toLowerCase().includes(query)) ||
        (emp.relation && emp.relation.toLowerCase().includes(query)) ||
        (emp.memberId && emp.memberId.toLowerCase().includes(query)) ||
        (formattedDob && formattedDob.includes(query)) ||
        (formattedDoj && formattedDoj.includes(query)) ||
        (mobileStr && mobileStr.includes(query)) ||
        (emailStr && emailStr.includes(query)) ||
        (genderStr && genderStr.includes(query))
      );
    });
  }, [filteredByMonth, localSearch]);

  // Close dropdown on outside click
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

  // Reset pagination if filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTriggeredMonth, localSearch, pageSize]);

  // Pagination bounds
  const totalEntries = searchedData.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);

  const paginatedData = useMemo(() => {
    return searchedData.slice(startIndex, endIndex);
  }, [searchedData, startIndex, endIndex]);

  const handleSearch = () => {
    setSearchTriggeredMonth(selectedMonth);
    const mStr = selectedMonth ? selectedMonth.split('-')[1] + '/' + selectedMonth.split('-')[0] : 'all';
    addToast({
      type: 'success',
      message: `Search query completed for wage month: ${mStr}`
    });
  };

  const handleClearFilters = () => {
    setSelectedMonth('');
    setSearchTriggeredMonth('');
    setLocalSearch('');
    addToast({
      type: 'info',
      message: 'Search filters cleared.'
    });
  };

  const handleExport = (type) => {
    if (totalEntries === 0) {
      addToast({
        type: 'error',
        message: 'No records available to export!'
      });
      setIsDropdownOpen(false);
      return;
    }

    if (type === 'Excel' || type === 'CSV') {
      const headers = ['UAN', 'IP Number', 'Previous Member Id', 'Member Name', 'Date Of Birth', 'DateOfJoining', 'Gender', 'Father/Husband Name', 'Relationship with the Member', 'Mobile Number', 'EmailId', 'Status'];
      let csvContent = headers.join(',') + '\n';

      searchedData.forEach(emp => {
        const row = [
          `"${emp.uan || ''}"`,
          `"${emp.ipNumber || ''}"`,
          `"${emp.memberId || ''}"`,
          `"${emp.memberName || ''}"`,
          `"${formatDate(emp.dob)}"`,
          `"${formatDate(emp.dateOfJoining)}"`,
          `"${emp.gender || ''}"`,
          `"${emp.fatherHusbandName || ''}"`,
          `"${emp.relation || 'FATHER'}"`,
          `"${emp.mobile || emp.mobileNumber || ''}"`,
          `"${emp.email || emp.emailId || ''}"`,
          `"${(!emp.status || emp.status === '0') ? 1 : emp.status}"`
        ];
        csvContent += row.join(',') + '\n';
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `employee_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      addToast({ type: 'success', message: `${type} file downloaded successfully!` });
    }
    else if (type === 'Print' || type === 'PDF') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        let html = `
          <html>
          <head>
            <title>Employee Export Data</title>
            <style>
              body { font-family: sans-serif; padding: 20px; }
              table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; font-weight: bold; }
              h2 { color: #333; margin-bottom: 5px; }
            </style>
          </head>
          <body>
            <h2>Employee Export Data</h2>
            <p>Total Records: ${searchedData.length}</p>
            <table>
              <thead>
                <tr>
                  <th>UAN</th><th>IP Number</th><th>Member Name</th><th>Date Of Birth</th><th>Date Of Joining</th>
                  <th>Gender</th><th>Father/Husband Name</th><th>Relation</th><th>Mobile</th><th>Email</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
        `;

        searchedData.forEach(emp => {
          html += `
            <tr>
              <td>${emp.uan || ''}</td>
              <td>${emp.ipNumber || ''}</td>
              <td>${emp.memberName || ''}</td>
              <td>${formatDate(emp.dob)}</td>
              <td>${formatDate(emp.dateOfJoining)}</td>
              <td>${emp.gender || ''}</td>
              <td>${emp.fatherHusbandName || ''}</td>
              <td>${emp.relation || 'FATHER'}</td>
              <td>${emp.mobile || emp.mobileNumber || ''}</td>
              <td>${emp.email || emp.emailId || ''}</td>
              <td>${(!emp.status || emp.status === '0') ? 1 : emp.status}</td>
            </tr>
          `;
        });

        html += `
              </tbody>
            </table>
            <script>
              window.onload = function() { 
                setTimeout(function() { window.print(); window.close(); }, 500);
              };
            </script>
          </body>
          </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
        addToast({ type: 'success', message: `${type} document generated successfully!` });
      } else {
        addToast({ type: 'error', message: 'Pop-up blocker prevented printing.' });
      }
    }
    else if (type === 'Copy') {
      const text = searchedData.map(emp =>
        `${emp.uan || ''}\t${emp.ipNumber || ''}\t${emp.memberName || ''}\t${formatDate(emp.dob)}\t${formatDate(emp.dateOfJoining)}\t${emp.mobile || emp.mobileNumber || ''}\t${(!emp.status || emp.status === '0') ? 1 : emp.status}`
      ).join('\n');
      navigator.clipboard.writeText(text);
      addToast({ type: 'success', message: 'Copied filtered employees list to clipboard!' });
    }

    setIsDropdownOpen(false);
  };

  return (
    <div className={styles.container}>
      {/* Page Header with download actions dropdown */}
      <div className={styles.headerSection}>
        <div>
          <h2 className={styles.title}>Employee Export</h2>
          <p className={styles.subtitle}>
            Configure, filter, and export employee data registers into customized Excel formats.
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

      {/* Month Year Selector Card */}
      <div className={styles.card}>
        <div className={styles.filterRow}>
          <div className={styles.filterGroup}>
            <span className={styles.label}>Month and Year</span>
            <MonthYearPicker
              value={selectedMonth}
              onChange={setSelectedMonth}
            />
          </div>

          <button
            type="button"
            className={styles.searchBtn}
            onClick={handleSearch}
          >
            <Search size={16} />
            Search
          </button>

          {(selectedMonth || localSearch) && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={handleClearFilters}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Grid Table Card */}
      <div className={styles.tableCard}>
        {/* Controls Row - Search input aligned right */}
        <div className={styles.tableControls} style={{ justifyContent: 'flex-end' }}>
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search..."
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* Data Grid Table */}
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>UAN</th>
                <th>IP Number</th>
                <th>Previous Member Id</th>
                <th>Member Name</th>
                <th>Date Of Birth</th>
                <th>DateOfJoining</th>
                <th>Gender</th>
                <th>Father/Husband Name</th>
                <th>Relationship with the Member</th>
                <th>Mobile Number</th>
                <th>EmailId</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    Loading...
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No matching records found.
                  </td>
                </tr>
              ) : (
                paginatedData.map((emp) => (
                  <tr key={emp.id}>
                    <td style={{ color: 'var(--text-primary)' }}>{emp.uan}</td>
                    <td>{emp.ipNumber}</td>
                    <td>{emp.memberId || '-'}</td>
                    <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{emp.memberName}</td>
                    <td>{formatDate(emp.dob)}</td>
                    <td>{formatDate(emp.dateOfJoining)}</td>
                    <td>{emp.gender}</td>
                    <td>{emp.fatherHusbandName}</td>
                    <td>{emp.relation || 'FATHER'}</td>
                    <td>{emp.mobile || emp.mobileNumber || '-'}</td>
                    <td>{emp.email || emp.emailId || '-'}</td>
                    <td>{(!emp.status || emp.status === '0') ? 1 : emp.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer controls: Info text, limit control and pagination */}
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

export default EmployeeDataExportPage;
