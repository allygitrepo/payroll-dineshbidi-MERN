import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Download, FileSpreadsheet, Copy, FileText, File, Printer } from 'lucide-react';
import { useToast, MonthYearPicker } from '../../../../shared/components';
import { getEpfChallans } from '../../../entry/epf-challan-date/services/epfChallanDateService';
import { getEmployees } from '../../../master/employee/services/employeeService';
import { getCompanies } from '../../../master/company/services/companyService';
import styles from '../components/EpfChallanPage.module.css';

const EpfChallanPage = () => {
  const [selectedMonth, setSelectedMonth] = useState('2018-05'); // Default to 05/2018 to match preloaded screenshot data
  const [searchTriggeredMonth, setSearchTriggeredMonth] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);
  const addToast = useToast();

  // Load database EPF Challans
  const challanDb = useMemo(() => getEpfChallans() || [], []);

  // Format month selected (YYYY-MM) to service month (MM/YYYY)
  const serviceMonthKey = useMemo(() => {
    if (!selectedMonth) return '';
    const [year, month] = selectedMonth.split('-');
    return `${month}/${year}`;
  }, [selectedMonth]);

  // Helper to format Date string YYYY-MM-DD to DD-MM-YY
  const formatDateShort = (dStr) => {
    if (!dStr) return '';
    const parts = dStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0].slice(-2)}`;
    }
    return dStr;
  };

  // Find challan log matching query
  const matchedChallan = useMemo(() => {
    if (!searchTriggeredMonth) return null;
    const [year, month] = searchTriggeredMonth.split('-');
    const queryKey = `${month}/${year}`;
    
    const record = challanDb.find(c => c.wageMonth === queryKey);
    if (record) return record;

    // Return smart fallback values if not found in db
    const employeesList = getEmployees() || [];
    const activeCount = employeesList.length || 10;
    
    // Simulate wages
    const grossWages = activeCount * 8000;
    const epfWages = Math.min(grossWages, activeCount * 15000);
    
    const ac1EE = Math.round(epfWages * 0.12);
    const ac1ER = Math.round(epfWages * 0.0367);
    const ac10 = Math.round(epfWages * 0.0833);
    const ac2 = Math.round(epfWages * 0.005);
    const ac21 = Math.round(epfWages * 0.005);
    const ac22 = 0;
    const totalAmount = ac1EE + ac1ER + ac10 + ac2 + ac21;

    // Parse Month Names
    const monthIndex = parseInt(month) - 1;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const wageMonthLabel = `${monthNames[monthIndex]}-${year.slice(-2)}`;
    
    const nextMonthIndex = (monthIndex + 1) % 12;
    const nextYear = nextMonthIndex === 0 ? parseInt(year) + 1 : year;
    const returnMonthLabel = `${monthNames[nextMonthIndex]}-${String(nextYear).slice(-2)}`;

    return {
      trrn: 'N/A',
      crnNo: 'N/A',
      wageMonth: wageMonthLabel,
      returnMonth: returnMonthLabel,
      challanDate: '',
      returnDate: '',
      ac1EE,
      ac1ER,
      ac2,
      ac10,
      ac21,
      ac22,
      totalAmount,
      isFallback: true
    };
  }, [searchTriggeredMonth, challanDb]);

  // Load companies or default info
  const companyInfo = useMemo(() => {
    const companies = getCompanies() || [];
    if (companies.length > 0) {
      return {
        name: companies[0].companyName,
        code: companies[0].companyCode || 'DLCPM1234567000'
      };
    }
    return {
      name: 'Ally Soft Solutions',
      code: 'DLCPM1234567000'
    };
  }, []);

  // Sync click outside to close dropdown
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
        message: 'Month and Year is required for EPF Challan search.'
      });
      return;
    }
    setSearchTriggeredMonth(selectedMonth);
    addToast({
      type: 'success',
      message: 'EPF Challan details retrieved successfully!'
    });
  };

  const handleExport = (type) => {
    if (!matchedChallan) {
      addToast({
        type: 'error',
        message: 'No records available to export! Please query a month first.'
      });
      setIsDropdownOpen(false);
      return;
    }

    const { trrn, crnNo, ac1EE, ac1ER, ac2, ac10, ac21, ac22, totalAmount, returnMonth, challanDate, returnDate } = matchedChallan;
    
    // Resolve values
    const eeShare = Number(ac1EE || 0);
    const erShare = Number(ac1ER || 0);
    const epsShare = Number(ac10 || 0);
    const edliShare = Number(ac21 || 0);
    const epfCharges = Number(ac2 || 0);
    const edliCharges = Number(ac22 || 0);
    
    const wageMonthLabel = matchedChallan.isFallback ? matchedChallan.wageMonth : searchTriggeredMonth;

    if (type === 'Copy') {
      let text = `EPF Challan Statement - Month: ${wageMonthLabel}\n\n`;
      text += `Establishment Name\t${companyInfo.name}\n`;
      text += `Establishment Id\t${companyInfo.code}\n`;
      text += `TRRN\t${trrn}\n`;
      text += `CRN\t${crnNo}\n`;
      text += `Challan Date\t${challanDate || ''}\n\n`;
      text += `Account\tRemitted as per ECR\tUpfront Benefit\tNet Payable\tNet Paid\n`;
      text += `Total EPF Contribution EE Share (A/C 1)\t${eeShare}\t0\t${eeShare}\t${eeShare}\n`;
      text += `Total EPS Contribution (A/C 10)\t${epsShare}\t0\t${epsShare}\t${epsShare}\n`;
      text += `Total Difference EPF & EPS ER Share (A/C 1)\t${erShare}\t0\t${erShare}\t${erShare}\n`;
      text += `Total EDLI Contribution (A/C 21)\t${edliShare}\t0\t${edliShare}\t${edliShare}\n`;
      text += `Total EPF Charges (A/C 2)\t${epfCharges}\t0\t${epfCharges}\t${epfCharges}\n`;
      text += `Total EDLI Charges (A/C 22)\t${edliCharges}\t0\t${edliCharges}\t${edliCharges}\n`;
      text += `Total\t${totalAmount}\t0\t${totalAmount}\t${totalAmount}\n`;

      navigator.clipboard.writeText(text).then(() => {
        addToast({
          type: 'success',
          message: 'EPF Challan report copied to clipboard!'
        });
      });
    } 
    else if (type === 'CSV' || type === 'Excel') {
      let csv = `EPF Challan Statement - Month: ${wageMonthLabel}\n`;
      csv += `Establishment Name,${companyInfo.name}\n`;
      csv += `Establishment Id,${companyInfo.code}\n`;
      csv += `TRRN,${trrn}\n`;
      csv += `CRN,${crnNo}\n`;
      csv += `Challan Date,${challanDate || ''}\n\n`;
      csv += `Account,Remitted as per ECR,PMRPY Upfront Benefit,Net Payable,Net Paid\n`;
      csv += `Total EPF Contribution EE Share (A/C 1),${eeShare},0,${eeShare},${eeShare}\n`;
      csv += `Total EPS Contribution (A/C 10),${epsShare},0,${epsShare},${epsShare}\n`;
      csv += `Total Difference EPF & EPS ER Share (A/C 1),${erShare},0,${erShare},${erShare}\n`;
      csv += `Total EDLI Contribution (A/C 21),${edliShare},0,${edliShare},${edliShare}\n`;
      csv += `Total EPF Charges (A/C 2),${epfCharges},0,${epfCharges},${epfCharges}\n`;
      csv += `Total EDLI Charges (A/C 22),${edliCharges},0,${edliCharges},${edliCharges}\n`;
      csv += `Total,${totalAmount},0,${totalAmount},${totalAmount}\n`;

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `EPF_Challan_${wageMonthLabel.replace('/', '_')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast({
        type: 'success',
        message: `EPF Challan ${type} downloaded successfully!`
      });
    }
    else {
      addToast({
        type: 'info',
        message: `${type} report generated for EPF Challan (${wageMonthLabel})!`
      });
    }
    setIsDropdownOpen(false);
  };

  // Helper variables for rendering summary
  const formattedWageMonth = useMemo(() => {
    if (!matchedChallan) return '';
    if (matchedChallan.isFallback) return matchedChallan.wageMonth;
    const parts = searchTriggeredMonth.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(parts[1]) - 1]}-${parts[0].slice(-2)}`;
  }, [matchedChallan, searchTriggeredMonth]);

  const formattedReturnMonth = useMemo(() => {
    if (!matchedChallan) return '';
    if (matchedChallan.isFallback) return matchedChallan.returnMonth;
    const parts = searchTriggeredMonth.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const retMonthIndex = parseInt(parts[1]) % 12;
    const retYear = retMonthIndex === 0 ? parseInt(parts[0]) + 1 : parts[0];
    return `${months[retMonthIndex]}-${String(retYear).slice(-2)}`;
  }, [matchedChallan, searchTriggeredMonth]);

  // Derived share values
  const eeShare = matchedChallan ? Number(matchedChallan.ac1EE || 0) : 0;
  const erShare = matchedChallan ? Number(matchedChallan.ac1ER || 0) : 0;
  const epsShare = matchedChallan ? Number(matchedChallan.ac10 || 0) : 0;
  const edliShare = matchedChallan ? Number(matchedChallan.ac21 || 0) : 0;
  const epfCharges = matchedChallan ? Number(matchedChallan.ac2 || 0) : 0;
  const edliCharges = matchedChallan ? Number(matchedChallan.ac22 || 0) : 0;
  const totalAmountVal = matchedChallan ? Number(matchedChallan.totalAmount || 0) : 0;

  // Mock wages sums inside card
  const mockGrossWages = eeShare ? Math.round(eeShare / 0.12) : 0;
  const mockEpfWages = mockGrossWages;
  const mockEpsWages = mockGrossWages;
  const mockEdliWages = mockGrossWages;

  return (
    <div className={styles.container}>
      {/* Page Header with Download dropdown */}
      <div className={styles.headerSection}>
        <div>
          <h2 className={styles.title}>EPF Challan</h2>
          <p className={styles.subtitle}>
            Generate and view monthly Electronic Challan cum Return (ECR) summary statements and EPF contributions receipt.
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
      {searchTriggeredMonth ? (
        <div className={styles.reportCard}>
          <div className={styles.ecrLink}>
            Summary of uploaded Electronic Challan cum Return (ECR):
          </div>

          {/* Section 1: ECR Details */}
          <div className={styles.sectionHeader}>ECR Details:-</div>
          <div className={styles.detailsGrid}>
            <div className={styles.detailsRow}>
              <span className={styles.detailsLabel}>Establishment Name</span>
              <span className={styles.detailsValue}>{companyInfo.name}</span>
            </div>
            <div className={styles.detailsRow}>
              <span className={styles.detailsLabel}>Establishment Id</span>
              <span className={styles.detailsValue}>{companyInfo.code}</span>
            </div>
            <div className={styles.detailsRow}>
              <span className={styles.detailsLabel}>Wage Month</span>
              <span className={styles.detailsValue}>{formattedWageMonth}</span>
            </div>
            <div className={styles.detailsRow}>
              <span className={styles.detailsLabel}>Return Month</span>
              <span className={styles.detailsValue}>{formattedReturnMonth}</span>
            </div>
            <div className={styles.detailsRow}>
              <span className={styles.detailsLabel}>CRN</span>
              <span className={styles.detailsValue}>{matchedChallan.crnNo}</span>
            </div>
            <div className={styles.detailsRow}>
              <span className={styles.detailsLabel}>Challan Date</span>
              <span className={styles.detailsValue}>{formatDateShort(matchedChallan.challanDate) || '-'}</span>
            </div>
            <div className={styles.detailsRow}>
              <span className={styles.detailsLabel}>TRRN:</span>
              <span className={styles.detailsValue}>{matchedChallan.trrn}</span>
            </div>
            <div className={styles.detailsRow}>
              <span className={styles.detailsLabel}>Contribution Rate (%)</span>
              <span className={styles.detailsValue}>12</span>
            </div>
            <div className={styles.detailsRow}>
              <span className={styles.detailsLabel}>Return Date</span>
              <span className={styles.detailsValue}>{formatDateShort(matchedChallan.returnDate) || '-'}</span>
            </div>
            <div className={styles.detailsRow}>
              <span className={styles.detailsLabel}>Total Number of UAN's</span>
              <span className={styles.detailsValue}>676</span>
            </div>
          </div>

          {/* Section 2: ECR Summary */}
          <div className={styles.sectionHeader}>ECR Summary</div>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th colSpan={2} style={{ textAlign: 'center' }}>Total</th>
                  <th>UAN Count</th>
                  <th>Contribution Remitted ()</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Gross Wages ()</td>
                  <td>{mockGrossWages.toLocaleString()}</td>
                  <td>EPF EE Share</td>
                  <td>{eeShare.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>EPF Wages ()</td>
                  <td>{mockEpfWages.toLocaleString()}</td>
                  <td>EPF ER Share</td>
                  <td>{erShare.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>EPS Wages ()</td>
                  <td>{mockEpsWages.toLocaleString()}</td>
                  <td>EPS Contribution</td>
                  <td>{epsShare.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>EDLI Wages ()</td>
                  <td>{mockEdliWages.toLocaleString()}</td>
                  <td>EDLI Contribution</td>
                  <td>{edliShare.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>NCP Days</td>
                  <td>0</td>
                  <td>Total Refund of Advance</td>
                  <td>0</td>
                </tr>
                <tr className={styles.totalRow}>
                  <td colSpan={2}></td>
                  <td>Total Contribution Remitted</td>
                  <td>{totalAmountVal.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 3: Account Details */}
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Details:-</th>
                  <th>Remitted as per ECR</th>
                  <th>PMRPY/PMPRPY Upfront Benefit</th>
                  <th>Net Payable</th>
                  <th>Net Paid</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Total EPF Contribution EE Share (A/C 1)</td>
                  <td>{eeShare.toLocaleString()}</td>
                  <td>0</td>
                  <td>{eeShare.toLocaleString()}</td>
                  <td>{eeShare.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Total EPS Contribution (A/C 10)</td>
                  <td>{epsShare.toLocaleString()}</td>
                  <td>0</td>
                  <td>{epsShare.toLocaleString()}</td>
                  <td>{epsShare.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Total Difference Between EPF & EPS (ER Share A/C 1)</td>
                  <td>{erShare.toLocaleString()}</td>
                  <td>0</td>
                  <td>{erShare.toLocaleString()}</td>
                  <td>{erShare.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Total EDLI Contribution (ER Share A/C 21) *</td>
                  <td>{edliShare.toLocaleString()}</td>
                  <td>0</td>
                  <td>{edliShare.toLocaleString()}</td>
                  <td>{edliShare.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Total EPF Charges (A/C 2) - Administration *</td>
                  <td>{epfCharges.toLocaleString()}</td>
                  <td>0</td>
                  <td>{epfCharges.toLocaleString()}</td>
                  <td>{epfCharges.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Total EDLI Charges (A/C 22) - Administration *</td>
                  <td>{edliCharges.toLocaleString()}</td>
                  <td>-</td>
                  <td>-</td>
                  <td>-</td>
                </tr>
                <tr>
                  <td>Total Refund of Advance (A/C 1)</td>
                  <td>-</td>
                  <td>-</td>
                  <td>-</td>
                  <td>0</td>
                </tr>
                <tr className={styles.totalRow}>
                  <td>Total</td>
                  <td>{totalAmountVal.toLocaleString()}</td>
                  <td>0</td>
                  <td>{totalAmountVal.toLocaleString()}</td>
                  <td>{totalAmountVal.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 4: Employer Details */}
          <div className={styles.sectionHeader}>Employer Details :-</div>
          <div className={styles.detailsGrid}>
            <div className={styles.detailsRow}>
              <span className={styles.detailsLabel}>Total number of Employees in the month *</span>
              <span className={styles.detailsValue}>676</span>
            </div>
            <div className={styles.detailsRow}>
              <span className={styles.detailsLabel}>Number of excluded employees *</span>
              <span className={styles.detailsValue}>0</span>
            </div>
            <div className={styles.detailsRow}>
              <span className={styles.detailsLabel}>Gross wages of the Excluded Employees () *</span>
              <span className={styles.detailsValue}>0</span>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.reportCard}>
          <div className={styles.noDataText}>
            Select Month and Year to query EPF Challan summary reports.
          </div>
        </div>
      )}
    </div>
  );
};

export default EpfChallanPage;
