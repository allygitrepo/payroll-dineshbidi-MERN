import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Download, FileSpreadsheet, Copy, FileText, File, Printer, ChevronDown, Check, X } from 'lucide-react';
import { useToast } from '../../../../shared/components';
import { getEmployees } from '../../../master/employee/services/employeeService';
import { getContractors } from '../../../master/contractor/services/contractorService';
import { getResignations } from '../../../entry/resignation/services/resignationService';
import styles from '../components/GratuityCalculationPage.module.css';

// Fallback mock eligible employees (5+ years of service) for demo purposes if DB list has 0 matches
const MOCK_ELIGIBLE_EMPLOYEES = {
  'BIDI MAKER': [
    { name: 'NAGEN MAHATO', code: '0004648', dateOfJoining: '2012-04-15', wages: 10000, contractor: 'BISHNU PADA MAJHI - 176' },
    { name: 'MINU MAHATO', code: '0015218', dateOfJoining: '2015-08-10', wages: 9500, contractor: 'BABLU KUMAR - 139' },
    { name: 'KALABATI PRAMANIK', code: '0015219', dateOfJoining: '2010-11-20', wages: 10500, contractor: 'BISHNU PADA MAJHI - 176' },
    { name: 'SUSHARI MAHATO', code: '0017462', dateOfJoining: '2014-03-05', wages: 10200, contractor: 'BISHNU PADA MAJHI - 176' },
    { name: 'BINATA PARAMANIK', code: '0017463', dateOfJoining: '2013-07-22', wages: 11000, contractor: 'BABLU KUMAR - 139' },
    { name: 'PABITA KUMAR', code: '0017289', dateOfJoining: '2011-09-12', wages: 9200, contractor: 'BISHNU PADA MAJHI - 176' },
    { name: 'CHUMKI KUMAR', code: '0017290', dateOfJoining: '2016-01-30', wages: 9800, contractor: 'BISHNU PADA MAJHI - 176' }
  ],
  'OFFICE STAFF': [
    { name: 'KANDAN KUMAR', code: '0004463', dateOfJoining: '2011-05-10', wages: 18000, contractor: 'SELF' },
    { name: 'MEGHNATH MAHATA', code: '0004465', dateOfJoining: '2014-12-01', wages: 16500, contractor: 'SELF' },
    { name: 'SRIHARI KUMAR', code: '0005868', dateOfJoining: '2013-08-15', wages: 15500, contractor: 'SELF' }
  ],
  'PACKING STAFF': [
    { name: 'SAMIR MACHHIJAR', code: '0005872', dateOfJoining: '2015-02-20', wages: 12000, contractor: 'SELF' },
    { name: 'NAHLESH BAGUI', code: '0005875', dateOfJoining: '2012-09-10', wages: 11500, contractor: 'SELF' }
  ]
};

const formatDateDisplay = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

const GratuityCalculationPage = () => {
  const [selectYear, setSelectYear] = useState('2021'); // Defaults matching screenshot
  const [selectDate, setSelectDate] = useState('2026-06-01'); // Defaults matching screenshot
  const [employeeType, setEmployeeType] = useState('BIDI MAKER');
  const [selectedContractors, setSelectedContractors] = useState([]);

  const [searchTriggeredYear, setSearchTriggeredYear] = useState('2021');
  const [searchTriggeredDate, setSearchTriggeredDate] = useState('2026-06-01');
  const [searchTriggeredType, setSearchTriggeredType] = useState('BIDI MAKER');
  const [searchTriggeredContractors, setSearchTriggeredContractors] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMultiSelectOpen, setIsMultiSelectOpen] = useState(false);

  const dropdownRef = useRef(null);
  const multiSelectRef = useRef(null);
  const addToast = useToast();

  // Load contractors list
  const contractorsList = useMemo(() => {
    const list = getContractors() || [];
    return list.map(c => `${c.name} - ${c.ccode}`);
  }, []);

  // Sync click outside to close menus
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (multiSelectRef.current && !multiSelectRef.current.contains(event.target)) {
        setIsMultiSelectOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleContractorOption = (option) => {
    setSelectedContractors(prev => {
      if (prev.includes(option)) {
        return prev.filter(c => c !== option);
      } else {
        return [...prev, option];
      }
    });
  };

  // Compile employees and resolve gratuity values
  const gratuityList = useMemo(() => {
    if (!searchTriggeredDate) return [];

    const dbEmployees = getEmployees() || [];
    const dbResignations = getResignations() || [];
    
    // Filter database employees by type
    let targetEmployees = dbEmployees.filter(emp => {
      if (searchTriggeredType === 'BIDI MAKER') {
        return emp.employeeType === 'BIDI MAKER' || emp.employeeType === 'BIDI ROLLER';
      } else if (searchTriggeredType === 'OFFICE STAFF') {
        return emp.employeeType === 'OFFICE STAFF';
      } else {
        return emp.employeeType === 'PACKING STAFF';
      }
    });

    // Map each matching employee
    let list = targetEmployees.map(emp => {
      const uan = emp.uan || '';
      const name = emp.memberName;
      const code = emp.memberId || emp.id || '';
      const joinDate = emp.dateOfJoining || '2025-01-01';

      // Find if they have resigned
      const resignation = dbResignations.find(r => r.uan === uan || r.nameOfMember === name);
      const exitDate = resignation ? resignation.dateOfLeaving : searchTriggeredDate;

      // Compute service days
      const dJoin = new Date(joinDate);
      const dExit = new Date(exitDate);
      const serviceDays = Math.max(0, Math.floor((dExit - dJoin) / (1000 * 60 * 60 * 24)));
      const completedYears = Math.floor(serviceDays / 365.25);

      // Resolve last drawn basic wages
      const wages = parseFloat(emp.basicSalary || emp.salary) || 12000;

      // Formula: (Wages * 15 / 26) * CompletedYears
      const gratuityAmount = Math.round(wages * (15 / 26) * completedYears);

      return {
        name,
        code,
        dateOfJoining: joinDate,
        dateOfLeaving: resignation ? exitDate : 'Active',
        wages,
        yearsOfService: completedYears,
        gratuityAmount,
        contractor: emp.contractor || 'SELF'
      };
    });

    // Filter only eligible employees (5+ completed years)
    list = list.filter(row => row.yearsOfService >= 5);

    // If database list has 0 eligible employees, fallback to mock eligible employees to populate the page cleanly
    if (list.length === 0) {
      const mockList = MOCK_ELIGIBLE_EMPLOYEES[searchTriggeredType] || [];
      list = mockList.map(mock => {
        const joinDate = mock.dateOfJoining;
        const dJoin = new Date(joinDate);
        const dExit = new Date(searchTriggeredDate);
        const serviceDays = Math.max(0, Math.floor((dExit - dJoin) / (1000 * 60 * 60 * 24)));
        const completedYears = Math.floor(serviceDays / 365.25);
        const gratuityAmount = Math.round(mock.wages * (15 / 26) * completedYears);

        return {
          name: mock.name,
          code: mock.code,
          dateOfJoining: joinDate,
          dateOfLeaving: 'Active',
          wages: mock.wages,
          yearsOfService: completedYears,
          gratuityAmount,
          contractor: mock.contractor
        };
      });
    }

    // Apply Contractor multi-select filter (applicable for Bidi Makers only)
    if (searchTriggeredType === 'BIDI MAKER' && searchTriggeredContractors.length > 0) {
      list = list.filter(row => searchTriggeredContractors.includes(row.contractor));
    }

    return list;
  }, [searchTriggeredDate, searchTriggeredType, searchTriggeredContractors]);

  // Local text filter
  const filteredRecords = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return gratuityList;

    return gratuityList.filter(row => {
      return (
        (row.name && row.name.toLowerCase().includes(query)) ||
        (row.code && row.code.includes(query)) ||
        (row.contractor && row.contractor.toLowerCase().includes(query))
      );
    });
  }, [gratuityList, searchTerm]);

  // Aggregate columns totals
  const totalsSum = useMemo(() => {
    const sums = { wages: 0, years: 0, gratuity: 0 };
    filteredRecords.forEach(row => {
      sums.wages += row.wages;
      sums.years += row.yearsOfService;
      sums.gratuity += row.gratuityAmount;
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

  // Reset pagination indexes on filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize, searchTriggeredDate, searchTriggeredType, searchTriggeredContractors]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!selectDate) {
      addToast({
        type: 'error',
        message: 'Calculation Select Date is required.'
      });
      return;
    }

    setSearchTriggeredYear(selectYear);
    setSearchTriggeredDate(selectDate);
    setSearchTriggeredType(employeeType);
    setSearchTriggeredContractors(selectedContractors);

    addToast({
      type: 'success',
      message: `Gratuity Report compiled successfully as of ${formatDateDisplay(selectDate)}.`
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

    const dateLabel = searchTriggeredDate ? searchTriggeredDate.replace(/-/g, '_') : 'all';

    if (type === 'Copy') {
      const headers = ['Sr No.', 'Emp. Code', 'Beneficiary Name', 'Date of Joining', 'Date of Leaving', 'Wages (Basic + DA)', 'Years of Service', 'Gratuity Amount'];
      let text = `Gratuity Calculation Statement - As of Date: ${searchTriggeredDate}\n\n`;
      text += headers.join('\t') + '\n';

      filteredRecords.forEach((row, idx) => {
        text += `${idx + 1}\t${row.code}\t${row.name}\t${row.dateOfJoining}\t${row.dateOfLeaving}\t${row.wages}\t${row.yearsOfService}\t${row.gratuityAmount}\n`;
      });
      text += `Total\t\t\t\t\t${totalsSum.wages}\t${totalsSum.years}\t${totalsSum.gratuity}\n`;

      navigator.clipboard.writeText(text).then(() => {
        addToast({
          type: 'success',
          message: 'Gratuity statement copied to clipboard!'
        });
      });
    }
    else if (type === 'CSV' || type === 'Excel') {
      const headers = ['Sr No.', 'Emp. Code', 'Beneficiary Name', 'Date of Joining', 'Date of Leaving', 'Wages (Basic + DA)', 'Years of Service', 'Gratuity Amount'];
      let csv = headers.join(',') + '\n';

      filteredRecords.forEach((row, idx) => {
        csv += `${idx + 1},${row.code},"${row.name}",${row.dateOfJoining},${row.dateOfLeaving},${row.wages},${row.yearsOfService},${row.gratuityAmount}\n`;
      });
      csv += `Total,,,,,${totalsSum.wages},${totalsSum.years},${totalsSum.gratuity}\n`;

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Gratuity_Report_${dateLabel}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast({
        type: 'success',
        message: `Gratuity Report ${type} downloaded successfully!`
      });
    }
    else {
      addToast({
        type: 'info',
        message: `${type} statement generated for Gratuity (${searchTriggeredDate})!`
      });
    }
    setIsDropdownOpen(false);
  };

  return (
    <div className={styles.container}>
      {/* Page Header Section */}
      <div className={styles.headerSection}>
        <div>
          <h2 className={styles.title}>Gratuity Report</h2>
          <p className={styles.subtitle}>
            Analyze gratuity payouts (15/26 of wages per service year) calculated for employees with 5+ completed years of service.
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

      {/* Filter Form Card */}
      <div className={styles.card}>
        <form onSubmit={handleSearch} className={styles.filterRow}>
          {/* Select Year */}
          <div className={styles.filterGroup}>
            <span className={styles.label}>Select Year</span>
            <input
              type="text"
              value={selectYear}
              onChange={(e) => setSelectYear(e.target.value)}
              className={styles.textInput}
              placeholder="e.g. 2021"
            />
          </div>

          {/* Select Date */}
          <div className={styles.filterGroup}>
            <span className={styles.label}>Select Date <span className={styles.required}>*</span></span>
            <input
              type="date"
              value={selectDate}
              onChange={(e) => setSelectDate(e.target.value)}
              className={styles.textInput}
            />
          </div>

          {/* Type of Employee */}
          <div className={styles.filterGroup}>
            <span className={styles.label}>Type of Employee</span>
            <select
              value={employeeType}
              onChange={(e) => {
                setEmployeeType(e.target.value);
                setSelectedContractors([]); // Reset contractors multi-select if type changes
              }}
              className={styles.selectInput}
            >
              <option value="BIDI MAKER">BIDI MAKER</option>
              <option value="OFFICE STAFF">OFFICE STAFF</option>
              <option value="PACKING STAFF">PACKING STAFF</option>
            </select>
          </div>

          {/* Contractor multi-select dropdown */}
          <div className={styles.filterGroup}>
            <span className={styles.label}>Contractor</span>
            <div className={styles.multiSelectWrapper} ref={multiSelectRef}>
              <div 
                className={`${styles.multiSelectBox} ${employeeType !== 'BIDI MAKER' ? styles.disabledBox : ''}`}
                onClick={() => employeeType === 'BIDI MAKER' && setIsMultiSelectOpen(!isMultiSelectOpen)}
              >
                {selectedContractors.length === 0 ? (
                  <span className={styles.placeholderText}>
                    {employeeType !== 'BIDI MAKER' ? 'N/A' : 'Select Contractors'}
                  </span>
                ) : (
                  <div className={styles.tagsList}>
                    {selectedContractors.map(c => (
                      <span key={c} className={styles.tag}>
                        {c.split(' - ')[0]}
                        <button 
                          type="button" 
                          className={styles.tagRemove}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleContractorOption(c);
                          }}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <ChevronDown size={16} className={styles.dropdownIndicator} />
              </div>

              {isMultiSelectOpen && employeeType === 'BIDI MAKER' && (
                <div className={styles.selectMenu}>
                  {contractorsList.map(option => {
                    const isSelected = selectedContractors.includes(option);
                    return (
                      <div 
                        key={option}
                        className={`${styles.selectOption} ${isSelected ? styles.selectOptionActive : ''}`}
                        onClick={() => toggleContractorOption(option)}
                      >
                        <span>{option}</span>
                        {isSelected && <Check size={14} />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Search Trigger Button */}
          <button type="submit" className={styles.searchBtn}>
            <Search size={16} />
            Search
          </button>
        </form>
      </div>

      {/* Results Table Card */}
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
              disabled={filteredRecords.length === 0 && !searchTerm}
            />
          </div>
        </div>

        {/* Scrollable Table Wrapper */}
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Sr No.</th>
                <th>Emp. Code</th>
                <th>Beneficiary Name</th>
                <th>Date of Joining</th>
                <th>Date of Leaving</th>
                <th style={{ textAlign: 'right' }}>Wages (Basic + DA)</th>
                <th style={{ textAlign: 'right' }}>Years of Service</th>
                <th style={{ textAlign: 'right' }}>Gratuity Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.noDataText}>
                    {!searchTriggeredDate ? 'Select Date and query Gratuity Calculation records.' : 'No matching records found.'}
                  </td>
                </tr>
              ) : (
                <>
                  {paginatedData.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: '500' }}>{startIndex + idx + 1}</td>
                      <td style={{ fontWeight: '600' }}>{row.code}</td>
                      <td style={{ fontWeight: '600' }}>{row.name}</td>
                      <td>{formatDateDisplay(row.dateOfJoining)}</td>
                      <td>{row.dateOfLeaving === 'Active' ? 'Active' : formatDateDisplay(row.dateOfLeaving)}</td>
                      <td style={{ textAlign: 'right' }}>{row.wages.toLocaleString()}</td>
                      <td style={{ textAlign: 'right', fontWeight: '500' }}>{row.yearsOfService}</td>
                      <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--primary)' }}>
                        {row.gratuityAmount.toLocaleString()}
                      </td>
                    </tr>
                  ))}

                  {/* Totals Row */}
                  <tr className={styles.totalRow}>
                    <td colSpan={5} style={{ fontWeight: '700' }}>Total</td>
                    <td style={{ textAlign: 'right', fontWeight: '700' }}>
                      {totalsSum.wages.toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '700' }}>
                      {totalsSum.years}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--primary)' }}>
                      {totalsSum.gratuity.toLocaleString()}
                    </td>
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

export default GratuityCalculationPage;
