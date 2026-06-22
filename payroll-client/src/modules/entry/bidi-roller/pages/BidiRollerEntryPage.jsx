import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  Search,
  Save,
  Download,
  FileSpreadsheet,
  Copy,
  FileText,
  File,
  Printer,
  User,
  CalendarDays,
  Briefcase
} from 'lucide-react';
import styles from '../components/BidiRollerEntryPage.module.css';
import { useToast, MonthYearPicker } from '../../../../shared/components';
import { getContractors } from '../../../master/contractor/services/contractorService';
import {
  getBidiRollerEntry,
  saveBidiRollerEntry,
  recalculateBidiRollerRow
} from '../services/bidiRollerEntryService';

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

const BidiRollerEntryPage = () => {
  const addToast = useToast();
  const dropdownRef = useRef(null);

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [selectedContractor, setSelectedContractor] = useState('ALL');
  const [contractorsList, setContractorsList] = useState([]);
  
  const [activeMonth, setActiveMonth] = useState('');
  const [activeContractor, setActiveContractor] = useState('ALL');
  const [rows, setRows] = useState([]);
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [localSearch, setLocalSearch] = useState('');

  /* Load Contractors list on mount */
  useEffect(() => {
    const list = getContractors();
    setContractorsList(list);
  }, []);

  /* Close download dropdown on click outside */
  useEffect(() => {
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
    const data = getBidiRollerEntry(selectedMonth);
    setRows(data);
    setActiveMonth(selectedMonth);
    setActiveContractor(selectedContractor);
    setHasSearched(true);
  }, [selectedMonth, selectedContractor, addToast]);

  /* ---- Input field change handler ---- */
  const handleFieldChange = useCallback((employeeId, field, value) => {
    setRows(prev =>
      prev.map(row => {
        if (row.employeeId !== employeeId) return row;
        const updatedRow = { ...row, [field]: value };
        const editableFields = ['unit1', 'unit2', 'leaveWithPay'];
        if (editableFields.includes(field)) {
          return recalculateBidiRollerRow(updatedRow, activeMonth);
        }
        return updatedRow;
      })
    );
  }, [activeMonth]);

  /* ---- Save handler ---- */
  const handleSave = useCallback(() => {
    if (!activeMonth || rows.length === 0) {
      addToast({ type: 'error', message: 'No data to save.' });
      return;
    }
    saveBidiRollerEntry(activeMonth, rows);
    addToast({
      type: 'success',
      message: `Bidi Roller Entry for ${formatMonthLabel(activeMonth)} saved successfully!`
    });
  }, [activeMonth, rows, addToast]);

  /* ---- Filter rows by contractor selection and search text ---- */
  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      // 1. Contractor Filter
      if (activeContractor !== 'ALL' && row.contractor !== activeContractor) {
        return false;
      }
      // 2. Text Search Filter
      const search = localSearch.toLowerCase();
      return (
        row.employeeName.toLowerCase().includes(search) ||
        row.employeeCode.includes(search) ||
        row.accountNo.includes(search)
      );
    });
  }, [rows, activeContractor, localSearch]);

  /* ---- Calculate Totals ---- */
  const totals = useMemo(() => {
    return filteredRows.reduce((acc, row) => ({
      unit1:        acc.unit1        + (parseFloat(row.unit1)        || 0),
      unit2:        acc.unit2        + (parseFloat(row.unit2)        || 0),
      daysWorked:   acc.daysWorked   + (parseInt(row.daysWorked)     || 0),
      leaveWithPay: acc.leaveWithPay + (parseFloat(row.leaveWithPay) || 0),
      wages:        acc.wages        + (parseFloat(row.wages)        || 0),
      bonus:        acc.bonus        + (parseFloat(row.bonus)        || 0),
      total:        acc.total        + (parseFloat(row.total)        || 0),
      pf:           acc.pf           + (parseFloat(row.pf)           || 0),
      pt:           acc.pt           + (parseFloat(row.pt)           || 0),
      esic:         acc.esic         + (parseFloat(row.esic)         || 0),
      netWages:     acc.netWages     + (parseFloat(row.netWages)     || 0),
    }), {
      unit1: 0, unit2: 0, daysWorked: 0, leaveWithPay: 0,
      wages: 0, bonus: 0, total: 0, pf: 0, pt: 0, esic: 0, netWages: 0
    });
  }, [filteredRows]);

  /* ---- Export handler ---- */
  const handleExport = (type) => {
    if (type === 'Copy') {
      const header = 'Employee Name\tUnit1 Worked\tUnit2 Worked\tDays Worked\tLeave With Pay\tWages\tBonus\tTotal\tPF\tPT\tESIC\tNet Wages';
      const body = filteredRows.map(r =>
        `${r.employeeName}\t${r.unit1}\t${r.unit2}\t${r.daysWorked}\t${r.leaveWithPay}\t${r.wages}\t${r.bonus}\t${r.total}\t${r.pf}\t${r.pt}\t${r.esic}\t${r.netWages}`
      ).join('\n');
      navigator.clipboard.writeText(`${header}\n${body}`);
      addToast({ type: 'success', message: 'Copied filtered list to clipboard!' });
    } else {
      addToast({ type: 'info', message: `${type} export started for ${filteredRows.length} records!` });
    }
    setIsDropdownOpen(false);
  };

  return (
    <div className={styles.container}>
      {/* ---- Header Section ---- */}
      <div className={styles.headerSection}>
        <h1 className={styles.title}>Bidi Roller Entry</h1>
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

      {/* ---- Filter Panel ---- */}
      <div className={styles.searchCard}>
        <div className={styles.searchRow}>
          {/* Month & Year Selection */}
          <div className={styles.formField}>
            <span className={styles.formLabel}>
              <CalendarDays size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
              Month and Year
            </span>
            <MonthYearPicker
              value={selectedMonth}
              onChange={setSelectedMonth}
              placeholder="Select Month & Year"
            />
          </div>

          {/* Contractor Selection */}
          <div className={styles.formField}>
            <span className={styles.formLabel}>
              <Briefcase size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
              Contractor Name - Pf Code
            </span>
            <select
              value={selectedContractor}
              onChange={e => setSelectedContractor(e.target.value)}
              className={styles.selectInput}
            >
              <option value="ALL">ALL</option>
              {contractorsList.map(c => (
                <option key={c.id} value={`${c.name} - ${c.pfCode}`}>
                  {c.name} - {c.pfCode}
                </option>
              ))}
            </select>
          </div>

          {/* Search Trigger */}
          <button className={styles.searchBtn} onClick={handleSearch}>
            <Search size={16} /> Search
          </button>
        </div>
      </div>

      {/* ---- Data Entry Table ---- */}
      {!hasSearched ? (
        <div className={styles.tableCard}>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <User size={56} />
            </div>
            <h3>No Data Loaded</h3>
            <p>Select Month/Year and Contractor above and click Search to load roller records.</p>
          </div>
        </div>
      ) : (
        <div className={styles.tableCard}>
          {/* Table Header Controls */}
          <div className={styles.tableCardHeader}>
            <span className={styles.tableCardTitle}>
              Bidi Roller Entries — {filteredRows.length} Employee{filteredRows.length !== 1 ? 's' : ''}
            </span>
            <span className={styles.monthBadge}>{formatMonthLabel(activeMonth)}</span>
          </div>

          {/* Table Controls (Search filter & count display) */}
          <div className={styles.tableControls}>
            <div className={styles.entriesInfo}>
              Showing 1 to {filteredRows.length} of {filteredRows.length} entries
            </div>
            <div className={styles.searchWrapper}>
              <Search size={14} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search..."
                value={localSearch}
                onChange={e => setLocalSearch(e.target.value)}
                className={styles.localSearchInput}
              />
            </div>
          </div>

          {/* Core Table Grid */}
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: 220 }}>Employee Name.</th>
                  <th style={{ textAlign: 'right' }}>No. of Unit worked</th>
                  <th style={{ textAlign: 'right' }}>No. of Unit worked</th>
                  <th style={{ textAlign: 'right' }}>No. of Days worked</th>
                  <th style={{ textAlign: 'right' }}>Leave With Pay</th>
                  <th style={{ textAlign: 'right' }}>Wages</th>
                  <th style={{ textAlign: 'right' }}>Bonus</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th style={{ textAlign: 'right' }}>PF</th>
                  <th style={{ textAlign: 'right' }}>PT</th>
                  <th style={{ textAlign: 'right' }}>ESIC</th>
                  <th style={{ textAlign: 'right' }}>Net Wages</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map(row => (
                  <tr key={row.employeeId}>
                    {/* Employee Info Block */}
                    <td>
                      <div className={styles.empCell}>
                        <span className={styles.empName}>{row.employeeName}</span>
                        <span className={styles.empCode}>{row.employeeCode}</span>
                        <span className={styles.empAccount}>{row.accountNo}</span>
                      </div>
                    </td>

                    {/* Editable: Unit Worked 1 */}
                    <td style={{ textAlign: 'right' }}>
                      <input
                        type="number" min={0}
                        value={row.unit1}
                        onChange={e => handleFieldChange(row.employeeId, 'unit1', e.target.value)}
                        className={styles.tableInput}
                      />
                    </td>

                    {/* Editable: Unit Worked 2 */}
                    <td style={{ textAlign: 'right' }}>
                      <input
                        type="number" min={0}
                        value={row.unit2}
                        onChange={e => handleFieldChange(row.employeeId, 'unit2', e.target.value)}
                        className={styles.tableInput}
                      />
                    </td>

                    {/* Read-only Computed Days worked */}
                    <td style={{ textAlign: 'right' }}>
                      <input
                        type="text"
                        value={row.daysWorked}
                        disabled
                        className={styles.tableInput}
                      />
                    </td>

                    {/* Editable: Leave with Pay */}
                    <td style={{ textAlign: 'right' }}>
                      <input
                        type="number" min={0}
                        value={row.leaveWithPay}
                        onChange={e => handleFieldChange(row.employeeId, 'leaveWithPay', e.target.value)}
                        className={styles.tableInput}
                      />
                    </td>

                    {/* Calculated Columns */}
                    <td style={{ textAlign: 'right' }}>{row.wages}</td>
                    <td style={{ textAlign: 'right' }}>{row.bonus}</td>
                    <td style={{ textAlign: 'right' }}>{row.total}</td>
                    <td style={{ textAlign: 'right' }}>{row.pf}</td>
                    <td style={{ textAlign: 'right' }}>{row.pt}</td>
                    <td style={{ textAlign: 'right' }}>{row.esic}</td>
                    <td style={{ textAlign: 'right' }}>{row.netWages}</td>
                  </tr>
                ))}

                {/* Totals Row */}
                {filteredRows.length > 0 && (
                  <tr className={styles.totalRow}>
                    <td><strong>Total</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{totals.unit1}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{totals.unit2}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{totals.daysWorked}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{totals.leaveWithPay}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{Math.round(totals.wages)}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{Math.round(totals.bonus)}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{Math.round(totals.total)}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{totals.pf}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{totals.pt}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{totals.esic}</strong></td>
                    <td style={{ textAlign: 'right' }}><strong>{Math.round(totals.netWages)}</strong></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Centered Save Action Button */}
          <div className={styles.saveSection} style={{ justifyContent: 'center' }}>
            <button className={styles.saveBtn} onClick={handleSave}>
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BidiRollerEntryPage;
