import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  Search, Save, Download, FileSpreadsheet, Copy, FileText, File, Printer, Users, CalendarDays, ChevronDown, Check, X
} from 'lucide-react';
import styles from './BidiRollerEntryPage.module.css';
import { useToast, MonthYearPicker } from '../../../../shared/components';
import { getContractors } from '../../../master/contractor/services/contractorService';
import { getBidiRollerEntry, saveBidiRollerEntry, recalculateBidiRollerRow } from '../services/bidiRollerEntryService';

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
   BIDI ROLLER ENTRY PAGE
   ================================================ */
const BidiRollerEntryPage = () => {
  const addToast = useToast();
  const dropdownRef = useRef(null);
  const companyId = localStorage.getItem('selectedCompany');

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [selectedContractors, setSelectedContractors] = useState([]);
  const [isMultiSelectOpen, setIsMultiSelectOpen] = useState(false);
  const multiSelectRef = useRef(null);
  const [contractorsList, setContractorsList] = useState([]);

  const [activeMonth, setActiveMonth] = useState('');
  const [rows, setRows] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState(null);

  /* Load Contractors list on mount */
  useEffect(() => {
    const loadContractors = async () => {
      if (companyId) {
        try {
          const list = await getContractors(companyId);
          const activeList = list.filter(c => c.status === 'Active');
          const selfContractor = { id: 'SELF', name: 'SELF', pfCode: 'N/A' };
          const extendedList = [selfContractor, ...activeList];
          setContractorsList(extendedList);
          setSelectedContractors(extendedList.map(c => c.id));
        } catch (error) {
          console.error("Failed to load contractors", error);
        }
      }
    };
    loadContractors();
  }, [companyId]);

  /* Close dropdown outside click */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
      if (multiSelectRef.current && !multiSelectRef.current.contains(e.target)) {
        setIsMultiSelectOpen(false);
      }
    };
    if (isDropdownOpen || isMultiSelectOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen, isMultiSelectOpen]);

  const toggleContractorOption = (id) => {
    setSelectedContractors(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  /* ---- Search / Load ---- */
  const handleSearch = useCallback(async () => {
    if (!selectedMonth) {
      addToast({ type: 'error', message: 'Please select a Month and Year.' });
      return;
    }
    setLoading(true);
    try {
      const response = await getBidiRollerEntry(selectedMonth);
      if (response && response.status) {
        setRows(response.data || []);
        setConfig(response.config || null);
        setActiveMonth(selectedMonth);
        setHasSearched(true);
        if (response.data?.length === 0) {
          addToast({ type: 'info', message: 'No Bidi Rollers found for this month' });
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
          return recalculateBidiRollerRow(updatedRow, config);
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
      const response = await saveBidiRollerEntry(activeMonth, rows);
      if (response && response.status) {
        addToast({ type: 'success', message: `Bidi Roller Entry for ${formatMonthLabel(activeMonth)} saved successfully!` });
      } else {
        addToast({ type: 'error', message: response?.message || 'Failed to save data' });
      }
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to save data to server' });
    } finally {
      setLoading(false);
    }
  }, [activeMonth, rows, addToast]);

  /* ---- Displayed Rows ---- */
  const displayedRows = useMemo(() => {
    return rows.filter(r => selectedContractors.includes(r.contractorId || 'SELF'));
  }, [rows, selectedContractors]);

  /* ---- Export ---- */
  const handleExport = (type) => {
    if (type === 'Copy') {
      const header = 'Employee Name.\tNo. of days\tUnit-1\tUnit-2\tLeave with pay\tRate-1\tRate-2\tBonus-1\tBonus-2\tWages\tBonus\tTotal\tPF\tPT\tESIC\tNet Wages';
      const body = displayedRows.map(r =>
        `${r.employeeName}\t${r.daysWorked}\t${r.unit1}\t${r.unit2}\t${r.leaveWithPay}\t${config?.rate1 || 0}\t${config?.rate2 || 0}\t${config?.bonus1 || 0}\t${config?.bonus2 || 0}\t${r.wages}\t${r.bonus}\t${r.gross}\t${r.pf}\t${r.pt}\t${r.esic}\t${r.netWages}`
      ).join('\n');
      navigator.clipboard.writeText(`${header}\n${body}`);
      addToast({ type: 'success', message: 'Copied to clipboard!' });
    } else {
      addToast({ type: 'info', message: `${type} export started for ${displayedRows.length} records!` });
    }
    setIsDropdownOpen(false);
  };

  /* ---- Totals ---- */
  const totals = useMemo(() => {
    return displayedRows.reduce((acc, row) => ({
      daysWorked: acc.daysWorked + (parseFloat(row.daysWorked) || 0),
      unit1: acc.unit1 + (parseFloat(row.unit1) || 0),
      unit2: acc.unit2 + (parseFloat(row.unit2) || 0),
      leaveWithPay: acc.leaveWithPay + (parseFloat(row.leaveWithPay) || 0),
      rate1: acc.rate1 + (parseFloat(config?.rate1 || 0)),
      rate2: acc.rate2 + (parseFloat(config?.rate2 || 0)),
      bonus1: acc.bonus1 + (parseFloat(config?.bonus1 || 0)),
      bonus2: acc.bonus2 + (parseFloat(config?.bonus2 || 0)),
      wages: acc.wages + (parseFloat(row.wages) || 0),
      bonus: acc.bonus + (parseFloat(row.bonus) || 0),
      gross: acc.gross + (parseFloat(row.gross) || 0),
      pf: acc.pf + (parseFloat(row.pf) || 0),
      pt: acc.pt + (parseFloat(row.pt) || 0),
      esic: acc.esic + (parseFloat(row.esic) || 0),
      netWages: acc.netWages + (parseFloat(row.netWages) || 0),
    }), {
      daysWorked: 0, unit1: 0, unit2: 0, leaveWithPay: 0,
      rate1: 0, rate2: 0, bonus1: 0, bonus2: 0,
      wages: 0, bonus: 0, gross: 0, pf: 0, pt: 0, esic: 0, netWages: 0
    });
  }, [displayedRows, config]);

  /* ================================================ */
  return (
    <div className={styles.container}>

      {/* ---- Header ---- */}
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

      {/* ---- Search & Filter Card ---- */}
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
            <div className={styles.multiSelectWrapper} ref={multiSelectRef}>
              <div 
                className={styles.multiSelectBox}
                onClick={() => setIsMultiSelectOpen(!isMultiSelectOpen)}
              >
                {selectedContractors.length === 0 ? (
                  <span className={styles.placeholderText}>Select Contractors</span>
                ) : selectedContractors.length > 2 ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '600' }}>
                      {selectedContractors.length === contractorsList.length ? 'All Contractors Selected' : `${selectedContractors.length} Contractors Selected`}
                    </span>
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); setSelectedContractors([]); }}
                      style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', padding: 0 }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className={styles.tagsList}>
                    {selectedContractors.map(id => {
                      const c = contractorsList.find(x => x.id === id);
                      if (!c) return null;
                      return (
                        <span key={id} className={styles.tag}>
                          {c.name.split(' ')[0]}
                          <button type="button" className={styles.tagRemove} onClick={(e) => { e.stopPropagation(); toggleContractorOption(id); }}>
                            <X size={12} />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
                <ChevronDown size={16} className={styles.dropdownIndicator} />
              </div>

              {isMultiSelectOpen && (
                <div className={styles.selectMenu}>
                  {contractorsList.map(c => {
                    const isSelected = selectedContractors.includes(c.id);
                    return (
                      <div 
                        key={c.id}
                        onClick={() => toggleContractorOption(c.id)}
                        className={`${styles.selectOption} ${isSelected ? styles.selectOptionActive : ''}`}
                      >
                        <span>{`${c.name} - ${c.pfCode}`}</span>
                        {isSelected && <Check size={14} />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          
          <button type="button" className={styles.searchBtn} onClick={handleSearch} disabled={loading}>
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
              Bidi Roller Wages Entry — {displayedRows.length} Employee{displayedRows.length !== 1 ? 's' : ''}
            </span>
            <span className={styles.monthBadge}>{formatMonthLabel(activeMonth)}</span>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: 180 }}>Employee Name.</th>
                  <th style={{ textAlign: 'center' }}>No. of Unit worked</th>
                  <th style={{ textAlign: 'center' }}>No. of Unit worked</th>
                  <th style={{ textAlign: 'center' }}>No. of Days worked</th>
                  <th style={{ textAlign: 'center', width: 100 }}>Leave With Pay</th>
                  <th style={{ textAlign: 'center' }}>Wages</th>
                  <th style={{ textAlign: 'center' }}>Bonus</th>
                  <th style={{ textAlign: 'center' }}>Total</th>
                  <th style={{ textAlign: 'center' }}>PF</th>
                  <th style={{ textAlign: 'center' }}>PT</th>
                  <th style={{ textAlign: 'center' }}>ESIC</th>
                  <th style={{ textAlign: 'center' }}>Net Wages</th>
                </tr>
              </thead>
              <tbody>
                {displayedRows.map(row => (
                  <tr key={row.employeeId}>
                    {/* Employee info */}
                    <td>
                      <div className={styles.empCell}>
                        <span className={styles.empName}>{row.employeeName}</span>
                        <span className={styles.empCode}>{row.employeeCode}</span>
                        <span className={styles.empAccount}>{row.accountNo}</span>
                      </div>
                    </td>

                    {/* Units */}
                    <td style={{ textAlign: 'center', minWidth: 70 }}>
                      <input type="text" value={row.unit1} onChange={e => handleFieldChange(row.employeeId, 'unit1', e.target.value)} className={styles.tableInput} style={{ textAlign: 'center' }} />
                    </td>
                    <td style={{ textAlign: 'center', minWidth: 70 }}>
                      <input type="text" value={row.unit2} onChange={e => handleFieldChange(row.employeeId, 'unit2', e.target.value)} className={styles.tableInput} style={{ textAlign: 'center' }} />
                    </td>

                    {/* Days Worked */}
                    <td style={{ textAlign: 'center', minWidth: 70 }}>
                      <input type="text" value={row.daysWorked} onChange={e => handleFieldChange(row.employeeId, 'daysWorked', e.target.value)} className={styles.tableInput} style={{ textAlign: 'center', backgroundColor: '#f0f4f8' }} />
                    </td>

                    {/* Leave With Pay */}
                    <td style={{ textAlign: 'center', minWidth: 70 }}>
                      <input type="text" value={row.leaveWithPay} onChange={e => handleFieldChange(row.employeeId, 'leaveWithPay', e.target.value)} className={styles.tableInput} style={{ textAlign: 'center' }} />
                    </td>

                    {/* Calculated fields */}
                    <td style={{ textAlign: 'center' }}>{Math.round(row.wages)}</td>
                    <td style={{ textAlign: 'center' }}>{Math.round(row.bonus)}</td>
                    <td style={{ textAlign: 'center' }}>{row.gross?.toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'center' }} className={styles.deductCol}>{row.pf}</td>
                    <td style={{ textAlign: 'center' }} className={styles.deductCol}>{row.pt}</td>
                    <td style={{ textAlign: 'center' }} className={styles.deductCol}>{row.esic}</td>
                    <td style={{ textAlign: 'center' }} className={styles.netCol}>{row.netWages?.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
                
                {/* Totals Row */}
                {displayedRows.length > 0 && (
                  <tr className={styles.totalRow}>
                    <td><strong>Total</strong></td>
                    <td style={{ textAlign: 'center' }}><strong>{totals.unit1}</strong></td>
                    <td style={{ textAlign: 'center' }}><strong>{totals.unit2}</strong></td>
                    <td style={{ textAlign: 'center' }}><strong>{totals.daysWorked}</strong></td>
                    <td style={{ textAlign: 'center' }}><strong>{totals.leaveWithPay}</strong></td>
                    <td style={{ textAlign: 'center' }}>
                      <strong>{Math.round(totals.wages).toLocaleString('en-IN')}</strong>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <strong>{Math.round(totals.bonus).toLocaleString('en-IN')}</strong>
                    </td>
                    <td style={{ textAlign: 'center' }}><strong>{Math.round(totals.gross).toLocaleString('en-IN')}</strong></td>
                    <td style={{ textAlign: 'center' }}><strong className={styles.deductCol}>{totals.pf}</strong></td>
                    <td style={{ textAlign: 'center' }}><strong className={styles.deductCol}>{totals.pt}</strong></td>
                    <td style={{ textAlign: 'center' }}><strong className={styles.deductCol}>{totals.esic}</strong></td>
                    <td style={{ textAlign: 'center' }}><strong className={styles.netCol}>{Math.round(totals.netWages).toLocaleString('en-IN')}</strong></td>
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

export default BidiRollerEntryPage;
