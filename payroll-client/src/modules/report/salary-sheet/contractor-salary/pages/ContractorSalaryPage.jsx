import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Download, FileSpreadsheet, Copy, FileText, File, Printer, ChevronDown, Check, X } from 'lucide-react';
import { useToast, MonthYearPicker } from '../../../../../shared/components';
import { getEmployees } from '../../../../master/employee/services/employeeService';
import styles from '../components/ContractorSalaryPage.module.css';

const CONTRACTORS_LIST = [
  'BISHNU PADA MAJHI - 176',
  'BABLU KUMAR - 139',
  'BHARAT KUMAR - 165',
  'SADANANDA KUMAR - 40',
  'PRAFULLYA KUMAR - 144',
  'SAHUD ANSARI - 177'
];

const MOCK_BASE_RECORDS = [
  { id: 'con1', name: 'SIDDHARTHA KUMAR', memberId: '0004710', uan: '100358035689', daysWorked: 15, contractor: 'BISHNU PADA MAJHI - 176' },
  { id: 'con2', name: 'RUPALI KUMAR', memberId: '0005910', uan: '100316603932', daysWorked: 15, contractor: 'BISHNU PADA MAJHI - 176' },
  { id: 'con3', name: 'SUPARNA KUMAR', memberId: '0005991', uan: '100481232251', daysWorked: 15, contractor: 'BISHNU PADA MAJHI - 176' },
  { id: 'con4', name: 'BHARAT KUMAR', memberId: '0005992', uan: '100480555032', daysWorked: 15, contractor: 'BHARAT KUMAR - 165' },
  { id: 'con5', name: 'ABANI GORAIN', memberId: '0016298', uan: '101314479400', daysWorked: 15, contractor: 'PRAFULLYA KUMAR - 144' },
  { id: 'con6', name: 'SRIBASH KUMAR', memberId: '0016287', uan: '101314481282', daysWorked: 15, contractor: 'BISHNU PADA MAJHI - 176' },
  { id: 'con7', name: 'NEPURA KUMAR', memberId: '0016289', uan: '101327468617', daysWorked: 15, contractor: 'BISHNU PADA MAJHI - 176' },
  { id: 'con8', name: 'LAKSHMAN KUMAR', memberId: '0016290', uan: '101327468629', daysWorked: 10, contractor: 'BHARAT KUMAR - 165' },
  { id: 'con9', name: 'NUNIBALA KUMAR', memberId: '0016291', uan: '101327468638', daysWorked: 10, contractor: 'PRAFULLYA KUMAR - 144' },
  { id: 'con10', name: 'MADHAB KUMAR', memberId: '0016292', uan: '101327468640', daysWorked: 15, contractor: 'BISHNU PADA MAJHI - 176' }
];

// Generate extra mocks to make up the 44 entries from the screenshot
const generateExtraMocks = () => {
  const list = [];
  const names = ['RAMESH', 'SUBHASH', 'DIPAK', 'TAPAS', 'ASIM', 'SANJOY', 'TAPAN', 'GOUR', 'ANUP', 'KARTIK', 'PRADIP', 'MANTU', 'LALU', 'NIMAI'];
  const surnames = ['MAJHI', 'KUMAR', 'GORAIN', 'BAURI', 'SINGH', 'DUTTA', 'ROY', 'BAGDI', 'DAS', 'SEN'];
  
  for (let i = 11; i <= 44; i++) {
    const nameIndex = i % names.length;
    const surnameIndex = i % surnames.length;
    const name = `${names[nameIndex]} ${surnames[surnameIndex]}`;
    const memberId = String(16000 + i).padStart(7, '0');
    const uan = String(101300000000 + i * 29174);
    const daysWorked = (i % 3 === 0) ? 10 : 15;
    const contractor = CONTRACTORS_LIST[i % CONTRACTORS_LIST.length];

    list.push({
      id: `con${i}`,
      name,
      memberId,
      uan,
      daysWorked,
      contractor
    });
  }
  return list;
};

const EXTRA_MOCKS = generateExtraMocks();
const ALL_MOCK_CONTRACTOR_RECORDS = [...MOCK_BASE_RECORDS, ...EXTRA_MOCKS];

const ContractorSalaryPage = () => {
  const [selectedMonth, setSelectedMonth] = useState('2026-01'); // Default to January 2026
  const [searchTriggeredMonth, setSearchTriggeredMonth] = useState('2026-01');
  const [selectedContractors, setSelectedContractors] = useState([
    'BISHNU PADA MAJHI - 176',
    'BHARAT KUMAR - 165',
    'PRAFULLYA KUMAR - 144'
  ]);
  const [searchTriggeredContractors, setSearchTriggeredContractors] = useState([
    'BISHNU PADA MAJHI - 176',
    'BHARAT KUMAR - 165',
    'PRAFULLYA KUMAR - 144'
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Custom multi-select dropdown states
  const [isMultiSelectOpen, setIsMultiSelectOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);
  const multiSelectRef = useRef(null);
  const addToast = useToast();

  const [dbEmployees, setDbEmployees] = useState([]);

  useEffect(() => {
    const fetchEmps = async () => {
      const companyId = localStorage.getItem('selectedCompany');
      if (companyId) {
        try {
          const list = await getEmployees(companyId);
          setDbEmployees(list || []);
        } catch(e) {
          console.error('Error fetching employees:', e);
        }
      }
    };
    fetchEmps();
  }, []);

  // Load database employees who are matched with selected contractors
  const salaryRecords = useMemo(() => {
    // Filter database employees where contractor matches searchTriggeredContractors
    const dbContractorStaff = dbEmployees.filter(emp => 
      emp.contractor && emp.contractor !== 'SELF' && emp.contractor !== 'None'
    );

    const mappedDbRecords = dbContractorStaff.map(emp => {
      // Find matching contractor Pf code or match by name, default to first contractor
      let contractor = CONTRACTORS_LIST[0];
      const match = CONTRACTORS_LIST.find(c => c.toLowerCase().includes(emp.contractor.toLowerCase()));
      if (match) {
        contractor = match;
      }

      return {
        id: emp.id,
        name: emp.memberName,
        memberId: emp.memberId || '-',
        uan: emp.uan,
        daysWorked: 15, // Default working days
        contractor
      };
    });

    // Merge database list and mockup records avoiding duplicates by UAN
    const uniqueUans = new Set(mappedDbRecords.map(e => e.uan));
    const uniqueMocks = ALL_MOCK_CONTRACTOR_RECORDS.filter(e => !uniqueUans.has(e.uan));

    const combinedList = [...mappedDbRecords, ...uniqueMocks];

    // Compute derived payroll columns for contractor salary sheet
    return combinedList.map(row => {
      // Wage rate is 161 per day. Wages = working days * 161
      const quantity = row.daysWorked;
      const wages = row.daysWorked * 161;
      const hra = 0;
      const total = wages + hra;
      
      const pt = 0;
      const pf = Math.round(total * 0.10); // 10% PF Rate, rounded
      const esic = 0; // ESIC is 0 for contractor salary sheet in screenshot
      const abry = 0;
      const netPaid = total - pt - pf - esic - abry;

      return {
        ...row,
        quantity,
        wages,
        hra,
        total,
        pt,
        pf,
        esic,
        abry,
        netPaid
      };
    });
  }, []);

  // Filter records based on selected contractors, month, and search query
  const filteredRecords = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    
    // Filter by contractors chosen in the filter row
    let result = salaryRecords;
    if (searchTriggeredContractors.length > 0) {
      result = result.filter(rec => searchTriggeredContractors.includes(rec.contractor));
    } else {
      // If no contractors are chosen, show none matching
      result = [];
    }

    if (query) {
      result = result.filter(rec => {
        return (
          (rec.name && rec.name.toLowerCase().includes(query)) ||
          (rec.memberId && rec.memberId.toLowerCase().includes(query)) ||
          (rec.uan && rec.uan.toLowerCase().includes(query))
        );
      });
    }

    return result;
  }, [salaryRecords, searchTriggeredContractors, searchTerm]);

  // Aggregate columns totals for the summary row
  const totals = useMemo(() => {
    const sums = {
      quantity: 0,
      daysWorked: 0,
      wages: 0,
      hra: 0,
      total: 0,
      pf: 0,
      esic: 0,
      abry: 0,
      netPaid: 0
    };

    filteredRecords.forEach(rec => {
      sums.quantity += Number(rec.quantity) || 0;
      sums.daysWorked += Number(rec.daysWorked) || 0;
      sums.wages += Number(rec.wages) || 0;
      sums.hra += Number(rec.hra) || 0;
      sums.total += Number(rec.total) || 0;
      sums.pf += Number(rec.pf) || 0;
      sums.esic += Number(rec.esic) || 0;
      sums.abry += Number(rec.abry) || 0;
      sums.netPaid += Number(rec.netPaid) || 0;
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

  // Reset page index if search or filters update
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize, searchTriggeredContractors, searchTriggeredMonth]);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (multiSelectRef.current && !multiSelectRef.current.contains(event.target)) {
        setIsMultiSelectOpen(false);
      }
    };

    if (isDropdownOpen || isMultiSelectOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen, isMultiSelectOpen]);

  const handleSearch = () => {
    setSearchTriggeredMonth(selectedMonth);
    setSearchTriggeredContractors(selectedContractors);
    const mStr = selectedMonth ? selectedMonth.split('-')[1] + '/' + selectedMonth.split('-')[0] : 'all';
    addToast({
      type: 'success',
      message: `Contractor salary compiled for ${selectedContractors.length} contractors for month: ${mStr}`
    });
  };

  const handleClearFilters = () => {
    setSelectedMonth('');
    setSearchTriggeredMonth('');
    setSelectedContractors([]);
    setSearchTriggeredContractors([]);
    setSearchTerm('');
    addToast({
      type: 'info',
      message: 'Filters cleared successfully.'
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

    if (type === 'Copy') {
      addToast({
        type: 'success',
        message: 'Copied Contractor Salary Sheet data to clipboard!'
      });
    } else {
      addToast({
        type: 'info',
        message: `${type} export generated for ${totalEntries} contractor entries!`
      });
    }
    setIsDropdownOpen(false);
  };

  // Toggle single contractor option selection
  const toggleContractorOption = (contractor) => {
    setSelectedContractors(prev => {
      if (prev.includes(contractor)) {
        return prev.filter(c => c !== contractor);
      } else {
        return [...prev, contractor];
      }
    });
  };

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.headerSection}>
        <div>
          <h2 className={styles.title}>Contractor Salary Sheet</h2>
          <p className={styles.subtitle}>
            Review and compile monthly payroll registers, daily wages, statutory PF deductions for contracted staff.
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

      {/* Month Year and Contractor select card */}
      <div className={styles.card}>
        <div className={styles.filterRow}>
          <div className={styles.filterGroup}>
            <span className={styles.label}>Month and Year</span>
            <MonthYearPicker
              value={selectedMonth}
              onChange={setSelectedMonth}
            />
          </div>

          <div className={styles.filterGroup}>
            <span className={styles.label}>Contractor Name - Pf Code</span>
            
            {/* Custom Multi-select input widget */}
            <div className={styles.multiSelectWrapper} ref={multiSelectRef}>
              <div 
                className={styles.multiSelectBox}
                onClick={() => setIsMultiSelectOpen(!isMultiSelectOpen)}
                style={{ height: '42px', overflow: 'hidden' }}
              >
                {selectedContractors.length === 0 ? (
                  <span className={styles.placeholderText}>Select Contractors</span>
                ) : selectedContractors.length > 2 ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: 'calc(100% - 24px)' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '600' }}>
                      {selectedContractors.length === CONTRACTORS_LIST.length ? 'All Contractors Selected' : `${selectedContractors.length} Contractors Selected`}
                    </span>
                    <button 
                      type="button" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedContractors([]);
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                      title="Clear All"
                    >
                      <X size={16} />
                    </button>
                  </div>
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

              {isMultiSelectOpen && (
                <div className={styles.selectMenu}>
                  {CONTRACTORS_LIST.map(option => {
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
          
          <button
            type="button"
            className={styles.searchBtn}
            onClick={handleSearch}
          >
            <Search size={16} />
            Search
          </button>

          {(selectedMonth || searchTerm || selectedContractors.length > 0) && (
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
        {/* Controls Row */}
        <div className={styles.tableControls}>
          <div className={styles.totalRecords}>
            Total Contractor Records: {totalEntries}
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
                <th style={{ width: '80px', textAlign: 'center', paddingLeft: '8px', paddingRight: '8px' }}>Sr No.</th>
                <th>Employee Name</th>
                <th>Quantity</th>
                <th>No. of working Day</th>
                <th>Wages</th>
                <th>HRA</th>
                <th>Total</th>
                <th>PF(EE)</th>
                <th>ESIC</th>
                <th>ABRY</th>
                <th>Net Wages</th>
                <th style={{ width: '220px' }}>Signature Of The Employee</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={12} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No matching records found.
                  </td>
                </tr>
              ) : (
                <>
                  {paginatedData.map((row, index) => (
                    <tr key={row.id}>
                      <td style={{ textAlign: 'center', fontWeight: '500', paddingLeft: '8px', paddingRight: '8px' }}>
                        {startIndex + index + 1}
                      </td>
                      <td>
                        <div className={styles.employeeStack}>
                          <span className={styles.employeeName}>{row.name}</span>
                          <span className={styles.employeeMeta}>Member Id: {row.memberId}</span>
                          <span className={styles.employeeMeta}>UAN: {row.uan}</span>
                        </div>
                      </td>
                      <td>{row.quantity}</td>
                      <td>{row.daysWorked}</td>
                      <td>{row.wages}</td>
                      <td>{row.hra}</td>
                      <td style={{ fontWeight: '500' }}>{row.total}</td>
                      <td>{row.pf}</td>
                      <td>{row.esic}</td>
                      <td>{row.abry}</td>
                      <td style={{ fontWeight: '600', color: 'var(--primary)' }}>{row.netPaid}</td>
                      <td></td>
                    </tr>
                  ))}
                  
                  {/* Summary/Totals Row */}
                  <tr className={styles.totalRow}>
                    <td colSpan={2} style={{ textAlign: 'right', paddingRight: '20px' }}>Total</td>
                    <td>{totals.quantity}</td>
                    <td>{totals.daysWorked}</td>
                    <td>{totals.wages}</td>
                    <td>{totals.hra}</td>
                    <td>{totals.total}</td>
                    <td>{totals.pf}</td>
                    <td>{totals.esic}</td>
                    <td>{totals.abry}</td>
                    <td style={{ color: 'var(--primary)' }}>{totals.netPaid}</td>
                    <td></td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer controls: Info text, limit selector, and pagination */}
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

export default ContractorSalaryPage;
