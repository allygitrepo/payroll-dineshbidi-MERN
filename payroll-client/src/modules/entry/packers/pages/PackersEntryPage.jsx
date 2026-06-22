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
  Package,
  CalendarDays
} from 'lucide-react';
import styles from '../components/PackersEntryPage.module.css';
import { useToast, MonthYearPicker } from '../../../../shared/components';
import {
  getPackersEntry,
  savePackersEntry,
  recalculatePackerRow
} from '../services/packersEntryService';

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

  /* Close dropdown on outside click */
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
  const handleSearch = useCallback(() => {
    if (!selectedMonth) {
      addToast({ type: 'error', message: 'Please select a Month and Year.' });
      return;
    }
    const data = getPackersEntry(selectedMonth);
    setRows(data);
    setActiveMonth(selectedMonth);
    setHasSearched(true);
  }, [selectedMonth, addToast]);

  /* ---- Editable field change ---- */
  const handleFieldChange = useCallback((employeeId, field, value) => {
    setRows(prev =>
      prev.map(row => {
        if (row.employeeId !== employeeId) return row;
        const updatedRow = { ...row, [field]: value };
        // Recalculate on any editable field change
        const editableFields = ['daysWorked', 'unit1', 'unit2', 'unit3', 'unit4', 'additionalPaidWages'];
        if (editableFields.includes(field)) {
          return recalculatePackerRow(updatedRow, activeMonth);
        }
        return updatedRow;
      })
    );
  }, [activeMonth]);

  /* ---- Save ---- */
  const handleSave = useCallback(() => {
    if (!activeMonth || rows.length === 0) {
      addToast({ type: 'error', message: 'No data to save. Please search first.' });
      return;
    }
    savePackersEntry(activeMonth, rows);
    addToast({
      type: 'success',
      message: `Packers Entry for ${formatMonthLabel(activeMonth)} saved successfully!`
    });
  }, [activeMonth, rows, addToast]);

  /* ---- Export ---- */
  const handleExport = (type) => {
    if (type === 'Copy') {
      const header = 'Employee\tDays\tUnit1\tUnit2\tUnit3\tUnit4\tRate1\tRate2\tRate3\tRate4\tAdditional\tWages\tWeeklyLeave\tTotal\tPF\tPT\tESIC\tNet';
      const body = rows.map(r =>
        `${r.employeeName}\t${r.daysWorked}\t${r.unit1}\t${r.unit2}\t${r.unit3}\t${r.unit4}\t${r.rate1}\t${r.rate2}\t${r.rate3}\t${r.rate4}\t${r.additionalPaidWages}\t${r.wages}\t${r.weeklyLeave}\t${r.total}\t${r.pf}\t${r.pt}\t${r.esic}\t${r.netWages}`
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
      daysWorked:          acc.daysWorked          + (parseInt(row.daysWorked)            || 0),
      unit1:               acc.unit1               + (parseFloat(row.unit1)               || 0),
      unit2:               acc.unit2               + (parseFloat(row.unit2)               || 0),
      unit3:               acc.unit3               + (parseFloat(row.unit3)               || 0),
      unit4:               acc.unit4               + (parseFloat(row.unit4)               || 0),
      rate1:               acc.rate1               + (parseFloat(row.rate1)               || 0),
      rate2:               acc.rate2               + (parseFloat(row.rate2)               || 0),
      rate3:               acc.rate3               + (parseFloat(row.rate3)               || 0),
      rate4:               acc.rate4               + (parseFloat(row.rate4)               || 0),
      additionalPaidWages: acc.additionalPaidWages + (parseFloat(row.additionalPaidWages) || 0),
      wages:               acc.wages               + (parseFloat(row.wages)               || 0),
      weeklyLeave:         acc.weeklyLeave         + (parseFloat(row.weeklyLeave)         || 0),
      total:               acc.total               + (parseFloat(row.total)               || 0),
      pf:                  acc.pf                  + (parseFloat(row.pf)                  || 0),
      pt:                  acc.pt                  + (parseFloat(row.pt)                  || 0),
      esic:                acc.esic                + (parseFloat(row.esic)                || 0),
      netWages:            acc.netWages            + (parseFloat(row.netWages)            || 0),
    }), {
      daysWorked: 0, unit1: 0, unit2: 0, unit3: 0, unit4: 0,
      rate1: 0, rate2: 0, rate3: 0, rate4: 0,
      additionalPaidWages: 0, wages: 0, weeklyLeave: 0,
      total: 0, pf: 0, pt: 0, esic: 0, netWages: 0
    });
  }, [rows]);

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
          <button className={styles.searchBtn} onClick={handleSearch}>
            <Search size={16} /> Search
          </button>
        </div>
      </div>

      {/* ---- Entry Table ---- */}
      {!hasSearched ? (
        <div className={styles.tableCard}>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Package size={56} />
            </div>
            <h3>No Data Loaded</h3>
            <p>Select a Month &amp; Year above and click Search to load packer data.</p>
          </div>
        </div>
      ) : (
        <div className={styles.tableCard}>
          {/* Table Card Header */}
          <div className={styles.tableCardHeader}>
            <span className={styles.tableCardTitle}>
              Packers Entry — {rows.length} Employee{rows.length !== 1 ? 's' : ''}
            </span>
            <span className={styles.monthBadge}>{formatMonthLabel(activeMonth)}</span>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: 200 }}>Employee Name</th>
                  <th style={{ textAlign: 'right' }}>No. of Days Worked</th>
                  <th style={{ textAlign: 'right' }}>Unit-1</th>
                  <th style={{ textAlign: 'right' }}>Unit-2</th>
                  <th style={{ textAlign: 'right' }}>Unit-3</th>
                  <th style={{ textAlign: 'right' }}>Unit-4</th>
                  <th style={{ textAlign: 'right' }}>Rate-1</th>
                  <th style={{ textAlign: 'right' }}>Rate-2</th>
                  <th style={{ textAlign: 'right' }}>Rate-3</th>
                  <th style={{ textAlign: 'right' }}>Rate-4</th>
                  <th style={{ textAlign: 'right' }}>Additional Paid Wages</th>
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

                    {/* Editable: Days Worked */}
                    <td style={{ textAlign: 'right' }}>
                      <input
                        type="number" min={0} max={31}
                        value={row.daysWorked}
                        onChange={e => handleFieldChange(row.employeeId, 'daysWorked', e.target.value)}
                        className={styles.tableInput}
                      />
                    </td>

                    {/* Editable: Unit 1–4 */}
                    {['unit1', 'unit2', 'unit3', 'unit4'].map(field => (
                      <td key={field} style={{ textAlign: 'right' }}>
                        <input
                          type="number" min={0}
                          value={row[field]}
                          onChange={e => handleFieldChange(row.employeeId, field, e.target.value)}
                          className={styles.tableInput}
                        />
                      </td>
                    ))}

                    {/* Rate 1–4 (read-only from setup) */}
                    <td style={{ textAlign: 'right' }} className={styles.rateCol}>{row.rate1}</td>
                    <td style={{ textAlign: 'right' }} className={styles.rateCol}>{row.rate2}</td>
                    <td style={{ textAlign: 'right' }} className={styles.rateCol}>{row.rate3}</td>
                    <td style={{ textAlign: 'right' }} className={styles.rateCol}>{row.rate4}</td>

                    {/* Editable: Additional Paid Wages */}
                    <td style={{ textAlign: 'right' }}>
                      <input
                        type="number" min={0}
                        value={row.additionalPaidWages}
                        onChange={e => handleFieldChange(row.employeeId, 'additionalPaidWages', e.target.value)}
                        className={styles.tableInput}
                      />
                    </td>

                    {/* Calculated */}
                    <td style={{ textAlign: 'right' }}>{row.wages?.toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right' }}>{row.weeklyLeave?.toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right' }}>{row.total?.toLocaleString('en-IN')}</td>
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
                    <td style={{ textAlign: 'right' }}><strong>{totals.unit1}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{totals.unit2}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{totals.unit3}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{totals.unit4}</strong></td>
                    <td style={{ textAlign: 'right' }} className={styles.rateCol}><strong>{totals.rate1.toFixed(2)}</strong></td>
                    <td style={{ textAlign: 'right' }} className={styles.rateCol}><strong>{totals.rate2.toFixed(2)}</strong></td>
                    <td style={{ textAlign: 'right' }} className={styles.rateCol}><strong>{totals.rate3.toFixed(2)}</strong></td>
                    <td style={{ textAlign: 'right' }} className={styles.rateCol}><strong>{totals.rate4.toFixed(2)}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{Math.round(totals.additionalPaidWages)}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{Math.round(totals.wages).toLocaleString('en-IN')}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{Math.round(totals.weeklyLeave).toLocaleString('en-IN')}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{Math.round(totals.total).toLocaleString('en-IN')}</strong></td>
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
            <button className={styles.saveBtn} onClick={handleSave}>
              <Save size={18} /> Save
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default PackersEntryPage;
