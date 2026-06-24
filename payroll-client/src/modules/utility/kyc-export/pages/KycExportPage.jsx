import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Download, FileSpreadsheet, Copy, FileText, File, Printer } from 'lucide-react';
import { useToast } from '../../../../shared/components';
import Input from '../../../../shared/components/Input/Input';
import { getEmployees } from '../../../master/employee/services/employeeService';
import styles from '../components/KycExportPage.module.css';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

const KycExportPage = () => {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchTriggeredRange, setSearchTriggeredRange] = useState({ from: '', to: '' });
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

  // Map to Tall format as requested (P, A, B rows for every employee)
  const allKycRecords = useMemo(() => {
    const parsedKyc = [];

    dbEmployees.forEach((emp) => {
      const panDoc = emp.kycDetails?.find(k => k.documentType === 'PAN');
      const bankDoc = emp.kycDetails?.find(k => k.documentType === 'BANK PASSBOOK');
      const aadharNum = emp.aadhar || emp.kycDetails?.find(k => k.documentType === 'AADHAAR')?.documentNumber;

      const baseDetails = {
        employeeName: emp.memberName || '',
        uan: emp.uan || '',
        dateOfJoining: emp.dateOfJoining || ''
      };

      // 1. PAN Row (P)
      parsedKyc.push({
        id: `kyc_${emp.id}_P`,
        ...baseDetails,
        typeCode: 'P',
        docNumber: panDoc?.documentNumber || '',
        nameAsPerDoc: panDoc?.documentNumber ? emp.memberName : '',
        ifsc: '',
        expiryDate: ''
      });

      // 2. Aadhaar Row (A)
      parsedKyc.push({
        id: `kyc_${emp.id}_A`,
        ...baseDetails,
        typeCode: 'A',
        docNumber: aadharNum || '',
        nameAsPerDoc: aadharNum ? emp.memberName : '',
        ifsc: '',
        expiryDate: ''
      });

      // 3. Bank Row (B)
      parsedKyc.push({
        id: `kyc_${emp.id}_B`,
        ...baseDetails,
        typeCode: 'B',
        docNumber: bankDoc?.documentNumber || '',
        nameAsPerDoc: bankDoc?.documentNumber ? emp.memberName : '',
        ifsc: bankDoc?.ifsc || '',
        expiryDate: ''
      });
    });

    return parsedKyc;
  }, [dbEmployees]);

  // Filter based on Date of Joining Range
  const filteredData = useMemo(() => {
    if (!searchTriggeredRange.from && !searchTriggeredRange.to) {
      return allKycRecords;
    }

    return allKycRecords.filter(rec => {
      const recDate = rec.dateOfJoining;
      if (!recDate) return false; // Exclude if filtering by date and no DOJ exists
      
      if (searchTriggeredRange.from && recDate < searchTriggeredRange.from) {
        return false;
      }
      if (searchTriggeredRange.to && recDate > searchTriggeredRange.to) {
        return false;
      }
      return true;
    });
  }, [allKycRecords, searchTriggeredRange]);

  // Handle local text search query input
  const searchedData = useMemo(() => {
    const query = localSearch.toLowerCase().trim();
    if (!query) return filteredData;

    return filteredData.filter(rec => {
      return (
        rec.employeeName.toLowerCase().includes(query) ||
        rec.uan.toLowerCase().includes(query) ||
        rec.typeCode.toLowerCase().includes(query) ||
        rec.docNumber.toLowerCase().includes(query) ||
        rec.nameAsPerDoc.toLowerCase().includes(query) ||
        rec.ifsc.toLowerCase().includes(query)
      );
    });
  }, [filteredData, localSearch]);

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
  }, [searchTriggeredRange, localSearch, pageSize]);

  // Pagination bounds
  const totalEntries = searchedData.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);
  
  const paginatedData = useMemo(() => {
    return searchedData.slice(startIndex, endIndex);
  }, [searchedData, startIndex, endIndex]);

  const handleSearch = () => {
    setSearchTriggeredRange({ from: fromDate, to: toDate });
    const fromStr = fromDate ? formatDate(fromDate) : 'any';
    const toStr = toDate ? formatDate(toDate) : 'any';
    addToast({
      type: 'success',
      message: `Search query completed for DOJ range: ${fromStr} to ${toStr}`
    });
  };

  const handleClearFilters = () => {
    setFromDate('');
    setToDate('');
    setSearchTriggeredRange({ from: '', to: '' });
    setLocalSearch('');
    addToast({
      type: 'info',
      message: 'Search filters cleared.'
    });
  };

  const handleExport = (type) => {
    if (totalEntries === 0) {
      addToast({ type: 'error', message: 'No records available to export!' });
      setIsDropdownOpen(false);
      return;
    }

    const headers = ['SR .NO.', 'Employee Name', 'Universal Account NUMBER (UAN)', 'KYC Type Code', 'KYC Document Number', 'Name as on KYC document', 'IFSC', 'Expiry Date'];

    if (type === 'Excel' || type === 'CSV') {
      let csvContent = headers.join(',') + '\n';
      
      searchedData.forEach((rec, index) => {
        const row = [
          index + 1,
          `"${rec.employeeName}"`,
          `"${rec.uan}"`,
          `"${rec.typeCode}"`,
          `"${rec.docNumber}"`,
          `"${rec.nameAsPerDoc}"`,
          `"${rec.ifsc}"`,
          `"${rec.expiryDate}"`
        ];
        csvContent += row.join(',') + '\n';
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `kyc_export_${Date.now()}.csv`);
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
            <title>KYC Export Data</title>
            <style>
              body { font-family: sans-serif; padding: 20px; }
              table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; font-weight: bold; }
              h2 { color: #333; margin-bottom: 5px; }
            </style>
          </head>
          <body>
            <h2>KYC Export Data</h2>
            <p>Total Records: ${searchedData.length}</p>
            <table>
              <thead>
                <tr>
                  ${headers.map(h => `<th>${h}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
        `;
        
        searchedData.forEach((rec, index) => {
          html += `
            <tr>
              <td style="text-align: center;">${index + 1}</td>
              <td>${rec.employeeName}</td>
              <td>${rec.uan}</td>
              <td style="text-align: center;">${rec.typeCode}</td>
              <td>${rec.docNumber}</td>
              <td>${rec.nameAsPerDoc}</td>
              <td>${rec.ifsc}</td>
              <td>${rec.expiryDate}</td>
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
      const text = searchedData.map((rec, index) => 
        `${index + 1}\t${rec.employeeName}\t${rec.uan}\t${rec.typeCode}\t${rec.docNumber}\t${rec.nameAsPerDoc}\t${rec.ifsc}\t${rec.expiryDate}`
      ).join('\n');
      navigator.clipboard.writeText(headers.join('\t') + '\n' + text);
      addToast({ type: 'success', message: 'Copied filtered KYC records to clipboard!' });
    }

    setIsDropdownOpen(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerSection}>
        <div>
          <h2 className={styles.title}>KYC Export</h2>
          <p className={styles.subtitle}>
            Export employee Aadhaar, PAN card numbers, and bank account validation registers.
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

      <div className={styles.card}>
        <div className={styles.filterRow}>
          <div className={styles.filterGroup}>
            <span className={styles.label}>From Date</span>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className={styles.dateInput}
            />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.label}>To Date</span>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className={styles.dateInput}
            />
          </div>
          <button className={styles.searchBtn} onClick={handleSearch}>
            <Search size={18} /> Search
          </button>
          {(searchTriggeredRange.from || searchTriggeredRange.to) && (
            <button className={styles.clearBtn} onClick={handleClearFilters}>
              Clear
            </button>
          )}
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search..." 
              className={styles.searchInput}
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.tableWrapper}>
          {isLoading ? (
            <div className={styles.loadingState}>Loading KYC Records...</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>SR .NO.</th>
                  <th>Employee Name</th>
                  <th>Universal Account NUMBER (UAN)</th>
                  <th>KYC Type Code</th>
                  <th>KYC Document Number</th>
                  <th>Name as on KYC document</th>
                  <th>IFSC</th>
                  <th>Expiry Date</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((row, idx) => (
                    <tr key={row.id}>
                      <td style={{ textAlign: 'center' }}>{startIndex + idx + 1}</td>
                      <td className={styles.empName}>{row.employeeName}</td>
                      <td>{row.uan}</td>
                      <td style={{ textAlign: 'center', fontWeight: '500' }}>{row.typeCode}</td>
                      <td>{row.docNumber}</td>
                      <td>{row.nameAsPerDoc}</td>
                      <td>{row.ifsc}</td>
                      <td>{row.expiryDate}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className={styles.emptyState}>No KYC export data found for the selected criteria.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <div className={styles.pageInfo}>
              Showing {startIndex + 1} to {endIndex} of {totalEntries} entries
            </div>
            <div className={styles.pageControls}>
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Prev
              </button>
              <div className={styles.pageNumbers}>
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button 
                    key={idx + 1}
                    className={currentPage === idx + 1 ? styles.activePage : ''}
                    onClick={() => setCurrentPage(idx + 1)}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KycExportPage;
