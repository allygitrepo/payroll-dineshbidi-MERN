import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  Search,
  Save,
  Download,
  FileSpreadsheet,
  Copy,
  FileText,
  File,
  Printer,
  Users,
  CalendarDays
} from 'lucide-react';
import styles from '../components/OfficeStaffEntryPage.module.css';
import { useToast, MonthYearPicker } from '../../../../shared/components';
import {
  getOfficeStaffEntry,
  saveOfficeStaffEntry,
  recalculateRow
} from '../services/officeStaffEntryService';

/* ---- Helpers ---- */
const formatMonthLabel = (monthYear) => {
  if (!monthYear) return '';
  const [year, month] = monthYear.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};

const getCurrentMonth = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

/* ================================================
   OFFICE STAFF ENTRY PAGE
   ================================================ */
const OfficeStaffEntryPage = () => {
  const addToast = useToast();
  const dropdownRef = useRef(null);

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [activeMonth, setActiveMonth] = useState('');
  const [rows, setRows] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState(null);

  /* Close dropdown outside click */
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  /* ---- Search / Load ---- */
  const handleSearch = useCallback(async () => {
    if (!selectedMonth) {
      addToast({ type: 'error', message: 'Please select a Month and Year.' });
      return;
    }
    setLoading(true);
    try {
      const response = await getOfficeStaffEntry(selectedMonth);
      if (response.status) {
        setRows(response.data || []);
        setConfig(response.config || null);
        setActiveMonth(selectedMonth);
        setHasSearched(true);
      } else {
        addToast({ type: 'error', message: response.message || 'Failed to load data' });
      }
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to load data from server' });
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, addToast]);

  /* ---- Handle editable cell change ---- */
  const handleFieldChange = useCallback((employeeId, field, value) => {
    setRows(prev => {
      const updated = prev.map(row => {
        if (row.employeeId !== employeeId) return row;
        const updatedRow = { ...row, [field]: value };
        // Recalculate on days or addition change
        if ((field === 'daysWorked' || field === 'addition') && config) {
          return recalculateRow(updatedRow, config);
        }
        return updatedRow;
      });
      return updated;
    });
  }, [config]);

  /* ---- Save ---- */
  const handleSave = useCallback(async () => {
    if (!activeMonth || rows.length === 0) {
      addToast({ type: 'error', message: 'No data to save. Please search first.' });
      return;
    }
    setLoading(true);
    try {
      const response = await saveOfficeStaffEntry(activeMonth, rows);
      if (response.status) {
        addToast({ type: 'success', message: `Office Staff Entry for ${formatMonthLabel(activeMonth)} saved successfully!` });
      } else {
        addToast({ type: 'error', message: response.message || 'Failed to save data' });
      }
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to save data to server' });
    } finally {
      setLoading(false);
    }
  }, [activeMonth, rows, addToast]);

  /* ---- Export ---- */
  const handleExport = (type) => {
    if (type === 'Copy') {
      const header = 'Employee\tDays\tLWP\tLwoP\tAddition\tBasic\tTotal\tPF\tPT\tESIC\tNet';
      const body = rows.map(r =>
        `${r.employeeName}\t${r.daysWorked}\t${r.leaveWithPay}\t${r.leaveWithoutPay}\t${r.addition}\t${r.basicSalary}\t${r.gross}\t${r.pf}\t${r.pt}\t${r.esic}\t${r.netWages}`
      ).join('\n');
      navigator.clipboard.writeText(`${header}\n${body}`);
      addToast({ type: 'success', message: 'Copied to clipboard!' });
    } else {
      addToast({ type: 'info', message: `${type} export started for ${rows.length} records!` });
    }
    setIsDropdownOpen(false);
  };

  /* ---- Totals ---- */
  const totals = useMemo(() => {
    return rows.reduce((acc, row) => ({
      daysWorked: acc.daysWorked + (parseInt(row.daysWorked) || 0),
      leaveWithPay: acc.leaveWithPay + (parseInt(row.leaveWithPay) || 0),
      leaveWithoutPay: acc.leaveWithoutPay + (parseInt(row.leaveWithoutPay) || 0),
      addition: acc.addition + (parseFloat(row.addition) || 0),
      basicSalary: acc.basicSalary + (parseFloat(row.basicSalary) || 0),
      gross: acc.gross + (parseFloat(row.gross) || 0),
      pf: acc.pf + (parseFloat(row.pf) || 0),
      pt: acc.pt + (parseFloat(row.pt) || 0),
      esic: acc.esic + (parseFloat(row.esic) || 0),
      netWages: acc.netWages + (parseFloat(row.netWages) || 0),
    }), {
      daysWorked: 0, leaveWithPay: 0, leaveWithoutPay: 0, addition: 0,
      basicSalary: 0, gross: 0, pf: 0, pt: 0, esic: 0, netWages: 0
    });
  }, [rows]);

  /* ================================================ */
  return (
    <div className={styles.container}>

      {/* ---- Header ---- */}
      <div className={styles.headerSection}>
        <h1 className={styles.title}>Office Staff Entry</h1>
        <div className={styles.headerActions}>
          <div className={styles.dropdownContainer} ref={dropdownRef}>
            <button
              className={styles.downloadBtn}
              onClick={() => setIsDropdownOpen(prev => !prev)}
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

      {/* ---- Month & Year Search Card ---- */}
      <div className={styles.searchCard}>
        <div className={styles.searchCardTitle}>
          <CalendarDays size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
          Month and Year
        </div>
        <div className={styles.searchRow}>
          <MonthYearPicker
            value={selectedMonth}
            onChange={setSelectedMonth}
            placeholder="Select Month & Year"
          />
          <button className={styles.searchBtn} onClick={handleSearch} disabled={loading}>
            <Search size={16} /> {loading ? 'Loading...' : 'Search'}
          </button>
        </div>
      </div>

      {/* ---- Entry Table ---- */}
      {!hasSearched ? (
        <div className={styles.tableCard}>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Users size={56} />
            </div>
            <h3>No Data Loaded</h3>
            <p>Select a Month &amp; Year above and click Search to load employee data.</p>
          </div>
        </div>
      ) : (
        <div className={styles.tableCard}>
          {/* Table Card Header */}
          <div className={styles.tableCardHeader}>
            <span className={styles.tableCardTitle}>
              Salary Entry — {rows.length} Employee{rows.length !== 1 ? 's' : ''}
            </span>
            <span className={styles.monthBadge}>{formatMonthLabel(activeMonth)}</span>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: 220 }}>Employee Name</th>
                  <th style={{ textAlign: 'right' }}>No. of Days Worked</th>
                  <th style={{ textAlign: 'right' }}>Leave With Pay</th>
                  <th style={{ textAlign: 'right' }}>Leave Without Pay</th>
                  <th style={{ textAlign: 'right' }}>Addition</th>
                  <th style={{ textAlign: 'right' }}>Basic Salary</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th style={{ textAlign: 'right' }}>PF</th>
                  <th style={{ textAlign: 'right' }}>PT</th>
                  <th style={{ textAlign: 'right' }}>ESIC</th>
                  <th style={{ textAlign: 'right' }}>Net Wages</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.employeeId}>
                    {/* Employee info */}
                    <td>
                      <div className={styles.empCell}>
                        <span className={styles.empName}>{row.employeeName}</span>
                        <span className={styles.empCode}>{row.employeeCode}</span>
                        <span className={styles.empAccount}>{row.accountNo}</span>
                      </div>
                    </td>

                    {/* Editable: Days Worked */}
                    <td style={{ textAlign: 'right' }}>
                      <input
                        type="number"
                        min={0}
                        max={31}
                        value={row.daysWorked}
                        onChange={e => handleFieldChange(row.employeeId, 'daysWorked', e.target.value)}
                        className={styles.tableInput}
                      />
                    </td>

                    {/* Leave With Pay (display only) */}
                    <td style={{ textAlign: 'right' }}>{row.leaveWithPay}</td>

                    {/* Leave Without Pay (display only) */}
                    <td style={{ textAlign: 'right' }}>{row.leaveWithoutPay}</td>

                    {/* Editable: Addition */}
                    <td style={{ textAlign: 'right' }}>
                      <input
                        type="number"
                        min={0}
                        value={row.addition}
                        onChange={e => handleFieldChange(row.employeeId, 'addition', e.target.value)}
                        className={styles.tableInput}
                      />
                    </td>

                    {/* Calculated fields */}
                    <td style={{ textAlign: 'right' }}>
                      {parseFloat(row.basicSalary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'right' }}>{row.gross?.toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right' }} className={styles.deductCol}>{row.pf}</td>
                    <td style={{ textAlign: 'right' }} className={styles.deductCol}>{row.pt}</td>
                    <td style={{ textAlign: 'right' }} className={styles.deductCol}>{row.esic}</td>
                    <td style={{ textAlign: 'right' }} className={styles.netCol}>
                      {row.netWages?.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}

                {/* Totals Row */}
                {rows.length > 0 && (
                  <tr className={styles.totalRow}>
                    <td><strong>Total</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{totals.daysWorked}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{totals.leaveWithPay}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{totals.leaveWithoutPay}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{Math.round(totals.addition)}</strong></td>
                    <td style={{ textAlign: 'right' }}>
                      <strong>{totals.basicSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                    </td>
                    <td style={{ textAlign: 'right' }}><strong>{Math.round(totals.gross).toLocaleString('en-IN')}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong className={styles.deductCol}>{totals.pf}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong className={styles.deductCol}>{totals.pt}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong className={styles.deductCol}>{totals.esic}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong className={styles.netCol}>{Math.round(totals.netWages).toLocaleString('en-IN')}</strong></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Save Button */}
          <div className={styles.saveSection}>
            <button className={styles.saveBtn} onClick={handleSave} disabled={loading}>
              <Save size={18} /> {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default OfficeStaffEntryPage;
