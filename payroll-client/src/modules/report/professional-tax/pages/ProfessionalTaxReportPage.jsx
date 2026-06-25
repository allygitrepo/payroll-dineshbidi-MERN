import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Download, FileSpreadsheet, Copy, FileText, File, Printer } from 'lucide-react';
import { useToast, YearPicker } from '../../../../shared/components';
import { getProfessionalTax } from '../../../setup/professional-tax/services/professionalTaxService';
import { getOfficeStaffEntry } from '../../../entry/office-staff/services/officeStaffEntryService';
import { getPackersEntry } from '../../../entry/packers/services/packersEntryService';
import { getBidiRollerEntry } from '../../../entry/bidi-roller/services/bidiRollerEntryService';
import styles from '../components/ProfessionalTaxReportPage.module.css';

const monthNames = [
  'April', 'May', 'June', 'July', 'August', 'September', 
  'October', 'November', 'December', 'January', 'February', 'March'
];

const ProfessionalTaxReportPage = () => {
  const [selectYear, setSelectYear] = useState('2026');
  const [searchTriggeredYear, setSearchTriggeredYear] = useState('2026');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);
  const addToast = useToast();

  // Close dropdown when clicking outside
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

  const [resolvedMonths, setResolvedMonths] = useState([]);

  // Compute month-wise professional tax slabs and counts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const companyId = localStorage.getItem('selectedCompany');
        const yr = parseInt(searchTriggeredYear) || 2026;
        const ptSlabs = await getProfessionalTax(companyId) || [];

        const mapped = await Promise.all(monthNames.map(async (mName, idx) => {
      let monthYearKey = '';
      if (idx < 9) {
        // April to December
        const mStr = String(idx + 4).padStart(2, '0');
        monthYearKey = `${yr}-${mStr}`;
      } else {
        // January to March of next calendar year
        const mStr = String(idx - 8).padStart(2, '0');
        monthYearKey = `${yr + 1}-${mStr}`;
      }

      // Fetch active monthly entry lists for office staff, packers
      const officeRes = await getOfficeStaffEntry(monthYearKey, companyId).catch(() => ({ data: [] }));
      const packerRes = await getPackersEntry(monthYearKey, companyId).catch(() => ({ data: [] }));
      
      const officeRows = officeRes?.data || [];
      const packerRows = packerRes?.data || [];

      // Combine all gross salaries
      const grossSalaries = [];
      officeRows.forEach(r => {
        const gross = parseFloat(r.gross) || 0;
        if (gross > 0) grossSalaries.push(gross);
      });
      packerRows.forEach(r => {
        const gross = parseFloat(r.total) || 0;
        if (gross > 0) grossSalaries.push(gross);
      });

      // Map employee counts to slabs
      const slabsData = ptSlabs.map(slab => {
        const fromVal = parseFloat(slab.from) || 0;
        const toVal = parseFloat(slab.to) || 0;
        const rateVal = parseFloat(slab.taxRate) || 0;

        // Count employees falling within range [from, to]
        const count = grossSalaries.filter(sal => sal >= fromVal && sal <= toVal).length;
        const taxAmount = count * rateVal;

        return {
          from: slab.from,
          to: slab.to,
          taxRate: slab.taxRate,
          employeeCount: count,
          taxAmount
        };
      });

      const totalTax = slabsData.reduce((sum, item) => sum + item.taxAmount, 0);

      return {
        monthName: mName,
        monthKey: monthYearKey,
        slabs: slabsData,
        totalTax
      };
    }));
        setResolvedMonths(mapped);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [searchTriggeredYear]);

  // Local filtering
  const filteredMonths = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return resolvedMonths;

    return resolvedMonths.filter(m => {
      const nameMatch = m.monthName.toLowerCase().includes(query);
      const slabMatch = m.slabs.some(s =>
        s.from.includes(query) ||
        s.to.includes(query) ||
        s.taxRate.includes(query) ||
        String(s.employeeCount).includes(query) ||
        String(s.taxAmount).includes(query)
      );
      return nameMatch || slabMatch;
    });
  }, [resolvedMonths, searchTerm]);

  // Total entries calculation (7 rows per month: 5 slabs + 1 spacer + 1 total)
  const totalEntriesCount = filteredMonths.length * 7;

  const handleSearch = (e) => {
    e.preventDefault();
    if (!selectYear || selectYear.trim().length !== 4 || isNaN(selectYear)) {
      addToast({
        type: 'error',
        message: 'Please enter a valid 4-digit search year.'
      });
      return;
    }
    setSearchTriggeredYear(selectYear);
    addToast({
      type: 'success',
      message: `Professional Tax Report retrieved for financial year ${selectYear}-${parseInt(selectYear) + 1}.`
    });
  };

  const handleExport = (type) => {
    if (filteredMonths.length === 0) {
      addToast({
        type: 'error',
        message: 'No records available to export!'
      });
      setIsDropdownOpen(false);
      return;
    }

    const yr = parseInt(searchTriggeredYear) || 2026;
    const filenameLabel = `${yr}_${yr + 1}`;

    if (type === 'Copy') {
      let text = `Professional Tax Report - Financial Year ${yr}-${yr + 1}\n\n`;
      
      filteredMonths.forEach(m => {
        text += `${m.monthName}\n`;
        text += `From\tTo\tTax Rate\tNo of employee\tTax Amount\n`;
        m.slabs.forEach(s => {
          text += `${parseFloat(s.from).toFixed(2)}\t${parseFloat(s.to).toFixed(2)}\t${parseFloat(s.taxRate).toFixed(2)}\t${s.employeeCount}\t${s.taxAmount}\n`;
        });
        text += `\t\t\tTotal :\t${m.totalTax}\n\n`;
      });

      navigator.clipboard.writeText(text).then(() => {
        addToast({
          type: 'success',
          message: 'Professional Tax Report copied to clipboard!'
        });
      });
    }
    else if (type === 'CSV' || type === 'Excel') {
      let csv = `Professional Tax Report - Financial Year ${yr}-${yr + 1}\n\n`;
      
      filteredMonths.forEach(m => {
        csv += `"${m.monthName}"\n`;
        csv += `From,To,Tax Rate,No of employee,Tax Amount\n`;
        m.slabs.forEach(s => {
          csv += `${parseFloat(s.from).toFixed(2)},${parseFloat(s.to).toFixed(2)},${parseFloat(s.taxRate).toFixed(2)},${s.employeeCount},${s.taxAmount}\n`;
        });
        csv += `,,,Total :,${m.totalTax}\n\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Professional_Tax_Report_${filenameLabel}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast({
        type: 'success',
        message: `Professional Tax Report downloaded as ${type} successfully!`
      });
    }
    else {
      addToast({
        type: 'info',
        message: `${type} print preview launched for Professional Tax Report!`
      });
    }
    setIsDropdownOpen(false);
  };

  const endYearLabel = parseInt(searchTriggeredYear) ? parseInt(searchTriggeredYear) + 1 : '2027';

  return (
    <div className={styles.container}>
      {/* Header Section */}
      <div className={styles.headerSection}>
        <div>
          <h2 className={styles.title}>Month Wise Professional Tax</h2>
          <p className={styles.subtitle}>
            Analyze month-wise professional tax deductions based on configured slab groups.
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
          <div className={styles.filterGroup}>
            <span className={styles.label}>Select Year <span className={styles.required}>*</span></span>
            <YearPicker
              value={selectYear}
              onChange={setSelectYear}
              placeholder="e.g. 2026"
            />
          </div>
          <button type="submit" className={styles.searchBtn}>
            <Search size={16} />
            Search
          </button>
        </form>
      </div>

      {/* Table Card */}
      <div className={styles.tableCard}>
        <div className={styles.tableControls}>
          <div className={styles.totalRecords}>
            Financial Year: {searchTriggeredYear}-{endYearLabel}
          </div>
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search month or rate..."
              className={styles.searchInput}
            />
          </div>
        </div>

        <h3 className={styles.tableTitle}>Professional Tax Report - {searchTriggeredYear}-{endYearLabel}</h3>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>From</th>
                <th>To</th>
                <th>Tax Rate</th>
                <th>No of employee</th>
                <th>Tax Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredMonths.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.noDataText}>
                    No records found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredMonths.map((m, mIdx) => (
                  <React.Fragment key={mIdx}>
                    {/* Month Header Banner */}
                    <tr className={styles.monthHeaderRow}>
                      <td colSpan={5}>{m.monthName}</td>
                    </tr>
                    
                    {/* Slab Records */}
                    {m.slabs.map((s, sIdx) => (
                      <tr key={sIdx}>
                        <td>{parseFloat(s.from).toFixed(2)}</td>
                        <td>{parseFloat(s.to).toFixed(2)}</td>
                        <td>{parseFloat(s.taxRate).toFixed(2)}</td>
                        <td style={{ fontWeight: s.employeeCount > 0 ? '600' : 'normal' }}>
                          {s.employeeCount}
                        </td>
                        <td style={{ fontWeight: s.taxAmount > 0 ? '600' : 'normal' }}>
                          {s.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </td>
                      </tr>
                    ))}

                    {/* Spacer Row */}
                    <tr className={styles.spacerRow}>
                      <td colSpan={5}></td>
                    </tr>

                    {/* Total Row */}
                    <tr className={styles.totalRow}>
                      <td colSpan={3}></td>
                      <td style={{ textAlign: 'right', paddingRight: '24px' }}>Total :</td>
                      <td style={{ color: 'var(--primary)', fontWeight: '700' }}>
                        {m.totalTax.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </td>
                    </tr>
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.tableFooter}>
          <div className={styles.infoText}>
            Showing 1 to {totalEntriesCount} of {totalEntriesCount} entries
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalTaxReportPage;
