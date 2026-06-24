import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  Search, Save, Download, FileSpreadsheet, Copy, FileText, File, Printer, Users, CalendarDays
} from 'lucide-react';
import styles from './PackersEntryPage.module.css';
import { useToast, MonthYearPicker } from '../../../../shared/components';
import { getPackersEntry, savePackersEntry, recalculateRow } from '../services/packersEntryService';

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
   PACKERS ENTRY PAGE
   ================================================ */
const PackersEntryPage = () => {
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
      const response = await getPackersEntry(selectedMonth);
      if (response && response.status) {
        setRows(response.data || []);
        setConfig(response.config || null);
        setActiveMonth(selectedMonth);
        setHasSearched(true);
        if (response.data?.length === 0) {
          addToast({ type: 'info', message: 'No Bidi Packers found for this month' });
        }
      } else {
        addToast({ type: 'error', message: response?.message || 'Failed to load data' });
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
        
        let val = value;
        if (val !== '') {
            // Allow numbers and single decimal
            val = val.replace(/[^0-9.]/g, '');
            const parts = val.split('.');
            if (parts.length > 2) {
                val = parts[0] + '.' + parts.slice(1).join('');
            }
        }
        
        const updatedRow = { ...row, [field]: val };
        
        // Recalculate on any field change if config exists
        if (config) {
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
      const response = await savePackersEntry(activeMonth, rows);
      if (response && response.status) {
        addToast({ type: 'success', message: `Packers Entry for ${formatMonthLabel(activeMonth)} saved successfully!` });
      } else {
        addToast({ type: 'error', message: response?.message || 'Failed to save data' });
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
      const header = 'Employee Name.\tNo. of days worked\tUnit-1\tUnit-2\tUnit-3\tUnit-4\tRate-1\tRate-2\tRate-3\tRate-4\tAdditional Paid Wages\tWages\tWeekly Leave\tTotal\tPF\tPT\tESIC\tNet Wages';
      const body = rows.map(r =>
        `${r.employeeName}\t${r.daysWorked}\t${r.unit1}\t${r.unit2}\t${r.unit3}\t${r.unit4}\t${config?.rate1 || 0}\t${config?.rate2 || 0}\t${config?.rate3 || 0}\t${config?.rate4 || 0}\t${r.addition}\t${r.wages}\t${r.weeklyLeave}\t${r.gross}\t${r.pf}\t${r.pt}\t${r.esic}\t${r.netWages}`
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
      daysWorked: acc.daysWorked + (parseFloat(row.daysWorked) || 0),
      unit1: acc.unit1 + (parseFloat(row.unit1) || 0),
      unit2: acc.unit2 + (parseFloat(row.unit2) || 0),
      unit3: acc.unit3 + (parseFloat(row.unit3) || 0),
      unit4: acc.unit4 + (parseFloat(row.unit4) || 0),
      rate1: acc.rate1 + (parseFloat(config?.rate1 || 0)),
      rate2: acc.rate2 + (parseFloat(config?.rate2 || 0)),
      rate3: acc.rate3 + (parseFloat(config?.rate3 || 0)),
      rate4: acc.rate4 + (parseFloat(config?.rate4 || 0)),
      addition: acc.addition + (parseFloat(row.addition) || 0),
      wages: acc.wages + (parseFloat(row.wages) || 0),
      weeklyLeave: acc.weeklyLeave + (parseFloat(row.weeklyLeave) || 0),
      gross: acc.gross + (parseFloat(row.gross) || 0),
      pf: acc.pf + (parseFloat(row.pf) || 0),
      pt: acc.pt + (parseFloat(row.pt) || 0),
      esic: acc.esic + (parseFloat(row.esic) || 0),
      netWages: acc.netWages + (parseFloat(row.netWages) || 0),
    }), {
      daysWorked: 0, unit1: 0, unit2: 0, unit3: 0, unit4: 0,
      rate1: 0, rate2: 0, rate3: 0, rate4: 0,
      addition: 0, wages: 0, weeklyLeave: 0, gross: 0, pf: 0, pt: 0, esic: 0, netWages: 0
    });
  }, [rows, config]);

  /* ================================================ */
  return (
    <div className={styles.container}>

      {/* ---- Header ---- */}
      <div className={styles.headerSection}>
        <h1 className={styles.title}>Packers Entry</h1>
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
              Wages Entry — {rows.length} Employee{rows.length !== 1 ? 's' : ''}
            </span>
            <span className={styles.monthBadge}>{formatMonthLabel(activeMonth)}</span>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: 180 }}>Employee Name.</th>
                  <th style={{ textAlign: 'right', width: 100 }}>No. of days worked</th>
                  <th style={{ textAlign: 'right' }}>Unit-1</th>
                  <th style={{ textAlign: 'right' }}>Unit-2</th>
                  <th style={{ textAlign: 'right' }}>Unit-3</th>
                  <th style={{ textAlign: 'right' }}>Unit-4</th>
                  <th style={{ textAlign: 'right' }}>Rate-1</th>
                  <th style={{ textAlign: 'right' }}>Rate-2</th>
                  <th style={{ textAlign: 'right' }}>Rate-3</th>
                  <th style={{ textAlign: 'right' }}>Rate-4</th>
                  <th style={{ textAlign: 'right', width: 120 }}>Additional Paid Wages</th>
                  <th style={{ textAlign: 'right' }}>Wages</th>
                  <th style={{ textAlign: 'right' }}>Weekly Leave</th>
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

                    {/* Days Worked */}
                    <td style={{ textAlign: 'right', minWidth: 70 }}>
                      <input type="text" value={row.daysWorked} onChange={e => handleFieldChange(row.employeeId, 'daysWorked', e.target.value)} className={styles.tableInput} />
                    </td>

                    {/* Unit 1 */}
                    <td style={{ textAlign: 'right', minWidth: 70 }}>
                      <input type="text" value={row.unit1} onChange={e => handleFieldChange(row.employeeId, 'unit1', e.target.value)} className={styles.tableInput} />
                    </td>
                    {/* Unit 2 */}
                    <td style={{ textAlign: 'right', minWidth: 70 }}>
                      <input type="text" value={row.unit2} onChange={e => handleFieldChange(row.employeeId, 'unit2', e.target.value)} className={styles.tableInput} />
                    </td>
                    {/* Unit 3 */}
                    <td style={{ textAlign: 'right', minWidth: 70 }}>
                      <input type="text" value={row.unit3} onChange={e => handleFieldChange(row.employeeId, 'unit3', e.target.value)} className={styles.tableInput} />
                    </td>
                    {/* Unit 4 */}
                    <td style={{ textAlign: 'right', minWidth: 70 }}>
                      <input type="text" value={row.unit4} onChange={e => handleFieldChange(row.employeeId, 'unit4', e.target.value)} className={styles.tableInput} />
                    </td>

                    {/* Rates (Read-only) */}
                    <td style={{ textAlign: 'right' }}>{parseFloat(config?.rate1 || 0).toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>{parseFloat(config?.rate2 || 0).toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>{parseFloat(config?.rate3 || 0).toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>{parseFloat(config?.rate4 || 0).toFixed(2)}</td>

                    {/* Additional Paid Wages */}
                    <td style={{ textAlign: 'right', minWidth: 80 }}>
                      <input type="text" value={row.addition} onChange={e => handleFieldChange(row.employeeId, 'addition', e.target.value)} className={styles.tableInput} />
                    </td>

                    {/* Calculated fields */}
                    <td style={{ textAlign: 'right' }}>{Math.round(row.wages)}</td>
                    <td style={{ textAlign: 'right' }}>{Math.round(row.weeklyLeave)}</td>
                    <td style={{ textAlign: 'right' }}>{row.gross?.toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right' }} className={styles.deductCol}>{row.pf}</td>
                    <td style={{ textAlign: 'right' }} className={styles.deductCol}>{row.pt}</td>
                    <td style={{ textAlign: 'right' }} className={styles.deductCol}>{row.esic}</td>
                    <td style={{ textAlign: 'right' }} className={styles.netCol}>{row.netWages?.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
                
                {/* Totals Row */}
                {rows.length > 0 && (
                  <tr className={styles.totalRow}>
                    <td><strong>Total</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{totals.daysWorked}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{totals.unit1}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{totals.unit2}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{totals.unit3}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{totals.unit4}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{totals.rate1}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{totals.rate2}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{totals.rate3}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{totals.rate4}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{Math.round(totals.addition)}</strong></td>
                    <td style={{ textAlign: 'right' }}>
                      <strong>{Math.round(totals.wages).toLocaleString('en-IN')}</strong>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <strong>{Math.round(totals.weeklyLeave).toLocaleString('en-IN')}</strong>
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

export default PackersEntryPage;
