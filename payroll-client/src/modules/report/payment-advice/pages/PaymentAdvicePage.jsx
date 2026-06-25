import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Download, FileSpreadsheet, Copy, FileText, File, Printer } from 'lucide-react';
import { useToast, MonthYearPicker } from '../../../../shared/components';
import { getEmployees } from '../../../master/employee/services/employeeService';
import { getContractors } from '../../../master/contractor/services/contractorService';
import { getBidiRollerEntry } from '../../../entry/bidi-roller/services/bidiRollerEntryService';
import { getOfficeStaffEntry } from '../../../entry/office-staff/services/officeStaffEntryService';
import { getPackersEntry } from '../../../entry/packers/services/packersEntryService';
import { getCompanies } from '../../../master/company/services/companyService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import styles from '../components/PaymentAdvicePage.module.css';

const PaymentAdvicePage = () => {
  const [selectedMonth, setSelectedMonth] = useState('2026-03'); // Default matching screenshot 03/2026
  const [employeeType, setEmployeeType] = useState('BIDI MAKER');
  const [contractor, setContractor] = useState('ALL');
  
  const [searchTriggeredMonth, setSearchTriggeredMonth] = useState('2026-03');
  const [searchTriggeredType, setSearchTriggeredType] = useState('BIDI MAKER');
  const [searchTriggeredContractor, setSearchTriggeredContractor] = useState('ALL');

  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);
  const addToast = useToast();

  const [contractorsList, setContractorsList] = useState([]);
  const [companyInfo, setCompanyInfo] = useState({
    name: 'BRIJBASHI TRADERS',
    address: 'BANDHA GHAT, P.O. JHALDA, PURULIA, PIN - 723202'
  });
  const [resolvedRecords, setResolvedRecords] = useState([]);

  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const companyId = localStorage.getItem('selectedCompany');
        const cList = await getContractors(companyId) || [];
        setContractorsList(cList);

        const companies = await getCompanies() || [];
        if (companies.length > 0) {
          const c = companies[0];
          const name = c.estbName || 'BRIJBASHI TRADERS';
          const addrParts = [
            c.address,
            c.postOffice ? `P.O. ${c.postOffice}` : '',
            c.district,
            c.pincode ? `PIN - ${c.pincode}` : ''
          ].filter(Boolean);
          setCompanyInfo({ name, address: addrParts.join(', ') });
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchMasters();
  }, []);

  // Get current date formatted like 23/6/2026
  const printDate = useMemo(() => {
    const today = new Date();
    return `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
  }, []);

  // Resolve and filter list based on month, type, and contractor
  useEffect(() => {
    const fetchRecords = async () => {
      if (!searchTriggeredMonth) {
        setResolvedRecords([]);
        return;
      }

      const companyId = localStorage.getItem('selectedCompany');
      let rawEntries = [];
      try {
        if (searchTriggeredType === 'BIDI MAKER') {
          const res = await getBidiRollerEntry(searchTriggeredMonth, companyId);
          rawEntries = res?.data || [];
          if (searchTriggeredContractor !== 'ALL') {
            rawEntries = rawEntries.filter(row => row.contractorId === searchTriggeredContractor || row.contractor === searchTriggeredContractor);
          }
        } 
        else if (searchTriggeredType === 'OFFICE STAFF') {
          const res = await getOfficeStaffEntry(searchTriggeredMonth, companyId);
          rawEntries = res?.data || [];
        } 
        else if (searchTriggeredType === 'PACKING STAFF') {
          const res = await getPackersEntry(searchTriggeredMonth, companyId);
          rawEntries = res?.data || [];
        }

        const dbEmployees = await getEmployees(companyId) || [];

        // Map rows to retrieve bank account and IFSC from kycDetails
        const mapped = rawEntries.map(row => {
          const empName = row.employeeName;
          const empCode = row.employeeCode || '';
          const uan = row.accountNo || ''; 

          let bankAccount = null;
          let ifsc = null;

          // Attempt to match with master employee database using UAN or name
          const masterEmp = dbEmployees.find(emp => emp.uan === uan || emp.memberName === empName);
          if (masterEmp && masterEmp.kycDetails) {
            const bankDoc = masterEmp.kycDetails.find(doc => 
              doc.documentType === 'BANK PASSBOOK' || doc.documentType === 'BANK'
            );
            if (bankDoc) {
              bankAccount = bankDoc.documentNumber;
              ifsc = bankDoc.ifsc;
            }
          }

          return {
            name: empName,
            code: empCode,
            bankAccount,
            ifsc,
            amount: Math.round(row.netWages || 0)
          };
        }).filter(row => row.bankAccount && row.bankAccount.trim() !== '' && row.amount > 0);

        setResolvedRecords(mapped);
      } catch (err) {
        console.error(err);
      }
    };
    fetchRecords();
  }, [searchTriggeredMonth, searchTriggeredType, searchTriggeredContractor]);

  // Local text filter
  const filteredRecords = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return resolvedRecords;

    return resolvedRecords.filter(rec => {
      return (
        (rec.name && rec.name.toLowerCase().includes(query)) ||
        (rec.code && rec.code.toLowerCase().includes(query)) ||
        (rec.bankAccount && rec.bankAccount.includes(query)) ||
        (rec.ifsc && rec.ifsc.toLowerCase().includes(query))
      );
    });
  }, [resolvedRecords, searchTerm]);

  // Compute total amount sum
  const totalAmount = useMemo(() => {
    return filteredRecords.reduce((sum, rec) => sum + rec.amount, 0);
  }, [filteredRecords]);

  // Pagination bounds
  const totalEntries = filteredRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);

  const paginatedData = useMemo(() => {
    return filteredRecords.slice(startIndex, endIndex);
  }, [filteredRecords, startIndex, endIndex]);

  // Reset page pagination index on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize, searchTriggeredMonth, searchTriggeredType, searchTriggeredContractor]);

  // Sync click outside to close dropdown menu
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
        message: 'Month and Year is required for Payment Advice search.'
      });
      return;
    }

    setSearchTriggeredMonth(selectedMonth);
    setSearchTriggeredType(employeeType);
    setSearchTriggeredContractor(contractor);

    const mStr = selectedMonth.split('-')[1] + '/' + selectedMonth.split('-')[0];
    addToast({
      type: 'success',
      message: `Payment Advice compiled successfully for Month: ${mStr}`
    });
  };

  const handleExport = (type) => {
    if (filteredRecords.length === 0) {
      addToast({
        type: 'error',
        message: 'No records available to export! Please query a month first.'
      });
      setIsDropdownOpen(false);
      return;
    }

    const monthLabel = searchTriggeredMonth ? searchTriggeredMonth.replace('-', '_') : 'all';

    if (type === 'Copy') {
      const headers = ['Beneficiary Name', 'Emp. Code', 'Beneficiary Account Number', 'IFSC', 'Amount'];
      let text = `Payment Advice Report - Month: ${searchTriggeredMonth}\n`;
      text += `Company: ${companyInfo.name}\n`;
      text += `Address: ${companyInfo.address}\n\n`;
      text += headers.join('\t') + '\n';

      filteredRecords.forEach(rec => {
        text += `${rec.name}\t${rec.code}\t${rec.bankAccount}\t${rec.ifsc}\t${rec.amount}\n`;
      });
      text += `Total\t\t\t\t${totalAmount}\n`;

      navigator.clipboard.writeText(text).then(() => {
        addToast({
          type: 'success',
          message: 'Payment Advice copied to clipboard!'
        });
      });
    } 
    else if (type === 'CSV' || type === 'Excel') {
      const headers = ['Beneficiary Name', 'Emp. Code', 'Beneficiary Account Number', 'IFSC', 'Amount'];
      let csv = headers.join(',') + '\n';

      filteredRecords.forEach(rec => {
        csv += `"${rec.name}",${rec.code},${rec.bankAccount},${rec.ifsc},${rec.amount}\n`;
      });
      csv += `Total,,,,${totalAmount}\n`;

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Payment_Advice_${monthLabel}_${searchTriggeredType.replace(' ', '_')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast({
        type: 'success',
        message: `Payment Advice ${type} downloaded successfully!`
      });
    }
    else if (type === 'PDF') {
      const doc = new jsPDF('landscape');
      const pageWidth = doc.internal.pageSize.getWidth();
      
      doc.setFontSize(16);
      doc.text(`Payment Advice Report - Month: ${searchTriggeredMonth}`, pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(11);
      doc.text(`Company: ${companyInfo.name}`, 15, 30);
      doc.text(`Address: ${companyInfo.address}`, 15, 36);

      const tableColumn = ['Sr No.', 'Beneficiary Name', 'Emp. Code', 'Beneficiary Account Number', 'IFSC', 'Amount'];
      const tableRows = [];
      
      filteredRecords.forEach((rec, idx) => {
        tableRows.push([idx + 1, rec.name, rec.code, rec.bankAccount, rec.ifsc, rec.amount]);
      });
      tableRows.push(["", "", "", "", "Total", totalAmount]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 45,
        theme: 'grid',
        headStyles: { fillColor: [243, 244, 246], textColor: [55, 65, 81], fontStyle: 'bold', fontSize: 9, halign: 'center' },
        bodyStyles: { textColor: [55, 65, 81], fontSize: 9, halign: 'center' },
        didParseCell: function(data) {
          if (data.row.index === tableRows.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [243, 244, 246];
          }
        }
      });

      doc.save(`Payment_Advice_${monthLabel}_${searchTriggeredType.replace(' ', '_')}.pdf`);
      addToast({
        type: 'success',
        message: 'Payment Advice PDF downloaded successfully!'
      });
    }
    else {
      addToast({
        type: 'info',
        message: `${type} generated for Payment Advice (${searchTriggeredMonth})!`
      });
    }
    setIsDropdownOpen(false);
  };

  return (
    <div className={styles.container}>
      {/* Page Header Section */}
      <div className={styles.headerSection}>
        <div>
          <h2 className={styles.title}>Payment Advice Report</h2>
          <p className={styles.subtitle}>
            Compile cheque transfer letters and bank beneficiary payouts formatted for employee salary distributions.
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

      {/* Form Filters Card */}
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

          {/* Type of Employee */}
          <div className={styles.filterGroup}>
            <span className={styles.label}>Type of Employee <span className={styles.required}>*</span></span>
            <select
              value={employeeType}
              onChange={(e) => setEmployeeType(e.target.value)}
              className={styles.selectInput}
            >
              <option value="BIDI MAKER">BIDI MAKER</option>
              <option value="OFFICE STAFF">OFFICE STAFF</option>
              <option value="PACKING STAFF">PACKING STAFF</option>
            </select>
          </div>

          {/* Contractor (Active only when Bidi Maker is selected) */}
          <div className={styles.filterGroup}>
            <span className={styles.label}>Contractor</span>
            <select
              value={contractor}
              onChange={(e) => setContractor(e.target.value)}
              className={styles.selectInput}
              disabled={employeeType !== 'BIDI MAKER'}
            >
              <option value="ALL">ALL</option>
              {contractorsList.map((c, i) => (
                <option key={i} value={`${c.name} - ${c.ccode}`}>
                  {c.name} - {c.ccode}
                </option>
              ))}
            </select>
          </div>

          {/* Search trigger button */}
          <button type="submit" className={styles.searchBtn}>
            <Search size={16} />
            Search
          </button>
        </form>
      </div>

      {/* Results Document View Card */}
      <div className={styles.tableCard}>
        {/* Letter details header */}
        <div className={styles.letterHeader}>
          <div className={styles.companyInfoBlock}>
            <div className={styles.companyLabel}>Company Name :</div>
            <div className={styles.companyValue}>{companyInfo.name}</div>
            <div className={styles.companyLabel} style={{ marginTop: '8px' }}>Company Address :</div>
            <div className={styles.companyValue}>{companyInfo.address}</div>
          </div>
          <div className={styles.letterDate}>
            {printDate}
          </div>
        </div>

        {/* Salutations and text */}
        <div className={styles.letterSalutation}>Sir/Madam,</div>
        <div className={styles.letterBody}>
          I am sending you the cheque of amount <strong>₹{totalAmount.toLocaleString()}</strong> so please transfer the amount in the accounts as per details given below
        </div>

        {/* Grid controls */}
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

        {/* Beneficiary Table */}
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Sr No.</th>
                <th>Beneficiary Name</th>
                <th>Emp. Code</th>
                <th>Beneficiary Account Number</th>
                <th>IFSC</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.noDataText}>
                    {!searchTriggeredMonth ? 'Select Month and query Payment Advice reports.' : 'No matching records found.'}
                  </td>
                </tr>
              ) : (
                <>
                  {paginatedData.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: '500' }}>{startIndex + idx + 1}</td>
                      <td style={{ fontWeight: '600' }}>{row.name}</td>
                      <td>{row.code}</td>
                      <td>{row.bankAccount}</td>
                      <td>{row.ifsc}</td>
                      <td style={{ textAlign: 'right', fontWeight: '600', color: 'var(--primary)' }}>
                        {row.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  <tr className={styles.totalRow}>
                    <td colSpan={5} style={{ fontWeight: '700' }}>Total</td>
                    <td style={{ textAlign: 'right', fontWeight: '700' }}>
                      {totalAmount.toLocaleString()}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Table pagination footer controls */}
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

        {/* Letter Close */}
        <div className={styles.letterFooterClose}>
          <div>Thanks,</div>
          <div style={{ marginTop: '12px' }}>with regards,</div>
        </div>
      </div>
    </div>
  );
};

export default PaymentAdvicePage;
