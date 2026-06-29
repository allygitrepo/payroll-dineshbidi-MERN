import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Download, FileSpreadsheet, Copy, FileText, File, Printer, UserCheck } from 'lucide-react';
import { useToast } from '../../../../shared/components';
import { getEmployees } from '../../../master/employee/services/employeeService';
import styles from '../components/RetirementListPage.module.css';

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

const calculateAge = (dobString) => {
  if (!dobString) return 0;
  const birthDate = new Date(dobString);
  if (isNaN(birthDate.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const RetirementListPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
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

  // Load database employees who are 58 or older
  const candidates = useMemo(() => {
    // Filter database employees who are 58 or older
    const dbRetirees = dbEmployees.filter(emp => calculateAge(emp.dob) >= 58);
    
    // Map them to match the grid structure
    return dbRetirees.map(emp => ({
      id: emp.id,
      memberName: emp.memberName,
      memberId: emp.memberId || '-',
      uan: emp.uan,
      dob: emp.dob,
      employeeType: emp.employeeType || 'OFFICE STAFF',
      contractor: emp.contractor || 'SELF'
    }));
  }, [dbEmployees]);

  // Filter local data using text search queries
  const searchedCandidates = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return candidates;

    return candidates.filter(cand => {
      return (
        (cand.memberName && cand.memberName.toLowerCase().includes(query)) ||
        (cand.memberId && cand.memberId.toLowerCase().includes(query)) ||
        (cand.uan && cand.uan.toLowerCase().includes(query)) ||
        (cand.employeeType && cand.employeeType.toLowerCase().includes(query)) ||
        (cand.contractor && cand.contractor.toLowerCase().includes(query)) ||
        (formatDate(cand.dob).toLowerCase().includes(query))
      );
    });
  }, [candidates, searchTerm]);

  // Pagination bounds
  const totalEntries = searchedCandidates.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);

  const paginatedData = useMemo(() => {
    return searchedCandidates.slice(startIndex, endIndex);
  }, [searchedCandidates, startIndex, endIndex]);

  // Reset pagination if filters/page size changes
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
      addToast({
        type: 'error',
        message: 'No records available to export!'
      });
      setIsDropdownOpen(false);
      return;
    }

    if (type === 'Excel' || type === 'CSV') {
      const headers = ['Sr No.', 'Name', 'Member Id', 'UAN', 'Date of Birth', 'Type of Employee', 'Contractor Name'];
      let csvContent = headers.join(',') + '\n';
      
      searchedCandidates.forEach((cand, index) => {
        const row = [
          index + 1,
          `"${cand.memberName || ''}"`,
          `"${cand.memberId || ''}"`,
          `"${cand.uan || ''}"`,
          `"${formatDate(cand.dob)}"`,
          `"${cand.employeeType || ''}"`,
          `"${cand.contractor || '-'}"`
        ];
        csvContent += row.join(',') + '\n';
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `retirement_list_${Date.now()}.csv`);
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
            <title>Retirement List Data</title>
            <style>
              body { font-family: sans-serif; padding: 20px; }
              table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; font-weight: bold; }
              h2 { color: #333; margin-bottom: 5px; }
            </style>
          </head>
          <body>
            <h2>58 Years of Age List</h2>
            <p>Total Records: ${searchedCandidates.length}</p>
            <table>
              <thead>
                <tr>
                  <th style="width: 50px; text-align: center;">Sr No.</th>
                  <th>Name</th>
                  <th>Member Id</th>
                  <th>UAN</th>
                  <th>Date of Birth</th>
                  <th>Type of Employee</th>
                  <th>Contractor Name</th>
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
              <td>${cand.contractor || '-'}</td>
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
      const text = searchedCandidates.map((cand, index) => 
        `${index + 1}\t${cand.memberName || ''}\t${cand.memberId || ''}\t${cand.uan || ''}\t${formatDate(cand.dob)}\t${cand.employeeType || ''}\t${cand.contractor || '-'}`
      ).join('\n');
      navigator.clipboard.writeText(text);
      addToast({ type: 'success', message: 'Copied retirement list to clipboard!' });
    }

    setIsDropdownOpen(false);
  };

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.headerSection}>
        <div>
          <h2 className={styles.title}>58 Years of Age List</h2>
          <p className={styles.subtitle}>
            Register of active employees who have reached or are approaching the retirement age of 58 years.
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
            Total Candidates: {totalEntries}
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

        {/* Data Grid Table */}
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '100px', textAlign: 'center', paddingLeft: '8px', paddingRight: '8px' }}>Sr No.</th>
                <th>Name</th>
                <th>Member Id</th>
                <th>UAN</th>
                <th>Date of Birth</th>
                <th>Type of Employee</th>
                <th>Contractor Name</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
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
                    <td>{cand.contractor || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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

export default RetirementListPage;
