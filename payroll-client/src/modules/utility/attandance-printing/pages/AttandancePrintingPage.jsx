import React, { useState, useEffect, useMemo } from 'react';
import { Printer, Search, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '../../../../shared/components';
import { getContractors } from '../../../master/contractor/services/contractorService';
import { getEmployees } from '../../../master/employee/services/employeeService';
import apiClient from '../../../../shared/services/apiClient';
import styles from './AttandancePrintingPage.module.css';

const AttandancePrintingPage = () => {
  const addToast = useToast();

  // Inputs State
  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth); // "YYYY-MM"
  const [selectedContractorId, setSelectedContractorId] = useState('');

  // Data State
  const [contractors, setContractors] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);

  // Search Results & Pagination
  const [hasSearched, setHasSearched] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Fetch contractors and employees on mount
  useEffect(() => {
    const companyId = localStorage.getItem('selectedCompany');
    if (!companyId) {
      addToast({ type: 'warning', message: 'No company selected! Please select a company on login.' });
      return;
    }

    const loadData = async () => {
      try {
        const [loadedContractors, loadedEmployees] = await Promise.all([
          getContractors(companyId),
          getEmployees(companyId)
        ]);
        setContractors(loadedContractors);
        setEmployees(loadedEmployees);
      } catch (err) {
        console.error('Error loading printing data:', err);
        addToast({ type: 'error', message: 'Failed to load initial contractors/employees data.' });
      }
    };

    loadData();
  }, [addToast]);

  // Parse Year and Month
  const { year, month } = useMemo(() => {
    if (!selectedMonth) return { year: today.getFullYear(), month: today.getMonth() + 1 };
    const [y, m] = selectedMonth.split('-').map(Number);
    return { year: y, month: m };
  }, [selectedMonth]);

  // Get active days in month (01 to 28/29/30/31)
  const daysInMonth = useMemo(() => {
    return new Date(year, month, 0).getDate();
  }, [year, month]);

  const daysArray = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, '0'));
  }, [daysInMonth]);

  // Filter employees under the selected contractor
  const currentContractor = useMemo(() => {
    return contractors.find(c => c.id === selectedContractorId);
  }, [contractors, selectedContractorId]);

  const contractorEmployees = useMemo(() => {
    if (!selectedContractorId) return [];
    return employees.filter(emp => emp.contractor_id === selectedContractorId);
  }, [employees, selectedContractorId]);

  // Lookup for quick attendance rendering
  const attendanceLookup = useMemo(() => {
    const lookup = {};
    attendanceLogs.forEach(log => {
      const dateParts = log.date.split('-');
      const dayKey = dateParts[2]; // e.g. "07"
      const empId = log.employee_id;
      if (!lookup[empId]) {
        lookup[empId] = {};
      }
      const isPresent = log.status === true || String(log.status).toLowerCase() === 'present';
      lookup[empId][dayKey] = isPresent ? 'P' : '';
    });
    return lookup;
  }, [attendanceLogs]);

  // Calculate Present Days
  const getPresentDaysCount = (empId) => {
    const empAtt = attendanceLookup[empId];
    if (!empAtt) return 0;
    return Object.values(empAtt).filter(v => v === 'P').length;
  };

  // Check if a day is Sunday
  // Check if a day is Sunday (weekly off) - always 7th, 14th, 21st, 28th of the month
  const isSunday = (dayStr) => {
    const d = parseInt(dayStr, 10);
    return d === 7 || d === 14 || d === 21 || d === 28;
  };

  // Search logic on Search Click
  const handleSearch = async () => {
    if (!selectedContractorId) {
      addToast({ type: 'warning', message: 'Please select a contractor!' });
      return;
    }

    const companyId = localStorage.getItem('selectedCompany');
    try {
      // Fetch attendance logs for the selected month and year
      const response = await apiClient.get(`attendance/company/${companyId}?month=${month}&year=${year}`);
      if ((response.data?.status || response.data?.success) && response.data?.data) {
        setAttendanceLogs(response.data.data);
      } else {
        setAttendanceLogs([]);
      }
      setHasSearched(true);
      setCurrentPage(1);
      addToast({ type: 'success', message: 'Attendance fetched successfully!' });
    } catch (err) {
      console.error('Error fetching attendance logs:', err);
      addToast({ type: 'error', message: 'Failed to fetch attendance.' });
    }
  };

  // Export/Print logic
  const handlePrint = () => {
    if (!selectedContractorId) {
      addToast({ type: 'warning', message: 'Please select a contractor and run search first!' });
      return;
    }

    if (contractorEmployees.length === 0) {
      addToast({ type: 'warning', message: 'No employees found under this contractor!' });
      return;
    }

    const contractorName = currentContractor ? currentContractor.name : '';
    const displayMonthYear = `${String(month).padStart(2, '0')}-${year}`;

    // Chunk employees into pages of max 20 records
    const chunks = [];
    for (let i = 0; i < contractorEmployees.length; i += 20) {
      chunks.push(contractorEmployees.slice(i, i + 20));
    }

    const pagesHtml = chunks.map((chunk, chunkIndex) => {
      const rowsHtml = chunk.map((emp, index) => {
        const srNo = chunkIndex * 20 + index + 1;
        const presentDays = getPresentDaysCount(emp.id);

        const cellsHtml = daysArray.map(dayKey => {
          const isSun = isSunday(dayKey);
          if (isSun) {
            return `<td style="background-color: red !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; color: white; font-weight: bold; text-align: center;">*</td>`;
          } else {
            const val = attendanceLookup[emp.id]?.[dayKey] || '';
            return `<td style="text-align: center;">${val}</td>`;
          }
        }).join('');

        return `
          <tr>
            <td style="text-align: center;">${srNo}</td>
            <td style="padding-left: 8px;">${emp.memberName}</td>
            ${cellsHtml}
            <td style="text-align: center;">${presentDays || ''}</td>
          </tr>
        `;
      }).join('');

      const isLastPage = chunkIndex === chunks.length - 1;

      return `
        <div class="print-page" style="${!isLastPage ? 'page-break-after: always; break-after: page;' : ''}">
          <table class="header-table">
            <tr>
              <td align="left">Contractor : ${contractorName}</td>
              <td align="right">Month Year :${displayMonthYear}</td>
            </tr>
          </table>
          <table class="attendance-table">
            <thead>
              <tr>
                <th width="35">Sr No.</th>
                <th align="left" style="padding-left: 8px;">Employee Name</th>
                ${daysArray.map(d => `<th width="22">${d}</th>`).join('')}
                <th width="90">Total Days Of Work</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <div class="signature-container">
            Signature of Contractor
          </div>
        </div>
      `;
    }).join('');

    // Create an invisible iframe for printing if it doesn't exist
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
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Attendance Sheet - ${contractorName}</title>
          <style>
            @media print {
              @page {
                size: landscape;
                margin: 0.5cm;
              }
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .no-print {
                display: none;
              }
              .print-page {
                page-break-after: always;
                break-after: page;
              }
              .print-page:last-child {
                page-break-after: avoid;
                break-after: avoid;
              }
            }
            body {
              font-family: Arial, sans-serif;
              color: #000;
              margin: 0;
              padding: 10px;
              font-size: 11px;
            }
            .header-table {
              width: 100%;
              margin-bottom: 12px;
              font-size: 12px;
              font-weight: bold;
              border-collapse: collapse;
            }
            .header-table td {
              padding: 4px 0;
            }
            .attendance-table {
              width: 100%;
              border-collapse: collapse;
            }
            .attendance-table th, .attendance-table td {
              border: 1px solid #000;
              padding: 4px 1px;
              height: 22px;
            }
            .attendance-table th {
              background-color: #f2f2f2;
              font-weight: bold;
              text-align: center;
              font-size: 10px;
            }
            .signature-container {
              margin-top: 40px;
              text-align: right;
              font-weight: bold;
              font-size: 12px;
              padding-right: 20px;
            }
          </style>
        </head>
        <body>
          ${pagesHtml}
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    doc.close();
    iframe.contentWindow.focus();
  };

  // Local inline search filter
  const searchedEmployees = useMemo(() => {
    if (!searchKeyword) return contractorEmployees;
    return contractorEmployees.filter(emp => 
      emp.memberName.toLowerCase().includes(searchKeyword.toLowerCase())
    );
  }, [contractorEmployees, searchKeyword]);

  // Pagination Logic
  const totalPages = Math.ceil(searchedEmployees.length / rowsPerPage);
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return searchedEmployees.slice(start, start + rowsPerPage);
  }, [searchedEmployees, currentPage, rowsPerPage]);

  return (
    <div className={styles.pageContainer}>
      {/* Title Header */}
      <div className={styles.headerSection}>
        <div className={styles.headerIcon}>
          <Printer size={24} />
        </div>
        <h2 className={styles.pageTitle}>Attendance Sheet Printing</h2>
      </div>

      {/* Inputs Selector Card */}
      <div className={styles.formCard}>
        <div className={styles.inputsGroup}>
          <div className={styles.field}>
            <label className={styles.label}>Select Month</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setHasSearched(false); // Reset results state on input change
              }}
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Contractor</label>
            <select
              value={selectedContractorId}
              onChange={(e) => {
                setSelectedContractorId(e.target.value);
                setHasSearched(false); // Reset results state on input change
              }}
              className={styles.select}
            >
              <option value="">Select Contractor</option>
              {contractors.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.buttonsGroup}>
          <button onClick={handleSearch} className={`${styles.btn} ${styles.btnSearch}`}>
            <Search size={16} /> Search Attendance
          </button>
          <button onClick={handlePrint} className={`${styles.btn} ${styles.btnPrint}`}>
            <Printer size={16} /> Print Attendance
          </button>
        </div>
      </div>

      {/* Grid List Card */}
      {hasSearched && (
        <div className={styles.resultsCard}>
          <div className={styles.toolbar}>
            <div className={styles.searchWrapper} style={{ marginLeft: 'auto' }}>
              <Search size={14} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search all columns:"
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value);
                  setCurrentPage(1);
                }}
                className={styles.searchBarInput}
              />
            </div>
          </div>

          {/* Grid Table */}
          <div className={styles.tableResponsive}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>SR .NO.</th>
                  <th>Employee Name</th>
                  {daysArray.map(d => (
                    <th key={d} style={{ width: '28px' }}>{d}</th>
                  ))}
                  <th style={{ width: '120px' }}>Total Days Of Work</th>
                </tr>
              </thead>
              <tbody>
                {/* Spanning Contractor Row */}
                <tr className={styles.groupRow}>
                  <td colSpan={daysInMonth + 3} className={styles.groupCell}>
                    {currentContractor ? currentContractor.name : ''}
                  </td>
                </tr>

                {paginatedEmployees.length > 0 ? (
                  paginatedEmployees.map((emp, index) => {
                    const srNo = (currentPage - 1) * rowsPerPage + index + 1;
                    const presentDays = getPresentDaysCount(emp.id);

                    return (
                      <tr key={emp.id}>
                        <td>{srNo}</td>
                        <td style={{ fontWeight: 600 }}>{emp.memberName}</td>
                        {daysArray.map(dayKey => {
                          const isSun = isSunday(dayKey);
                          if (isSun) {
                            return <td key={dayKey} className={styles.sundayCell}>*</td>;
                          } else {
                            const val = attendanceLookup[emp.id]?.[dayKey] || '';
                            return <td key={dayKey}>{val}</td>;
                          }
                        })}
                        <td style={{ fontWeight: 700 }}>{presentDays || ''}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={daysInMonth + 3} className={styles.emptyTable}>
                      No employees found matching the search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Info & Pagination */}
          <div className={styles.tableFooter}>
            <div className={styles.footerLeft}>
              <div className={styles.limitControl}>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className={styles.limitSelect}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                </select>
                <span>records per page</span>
              </div>
              <div className={styles.infoText}>
                Showing {searchedEmployees.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} to{' '}
                {Math.min(currentPage * rowsPerPage, searchedEmployees.length)} of {searchedEmployees.length} entries
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
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  className={`${styles.pageBtn} ${currentPage === p ? styles.activePageBtn : ''}`}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
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
        </div>
      )}
    </div>
  );
};

export default AttandancePrintingPage;
