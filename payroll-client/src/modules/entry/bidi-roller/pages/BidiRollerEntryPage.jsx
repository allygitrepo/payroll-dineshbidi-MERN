import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  Search, Save, Download, FileSpreadsheet, Copy, FileText, File, Printer, Users, CalendarDays, ChevronDown, Check, X, Upload, ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import styles from './BidiRollerEntryPage.module.css';
import { useToast, MonthYearPicker, Pagination, Loader } from '../../../../shared/components';
import { getContractors } from '../../../master/contractor/services/contractorService';
import { getBidiRollerEntry, saveBidiRollerEntry, recalculateBidiRollerRow } from '../services/bidiRollerEntryService';
import { getAttendanceSummary } from '../../../attendance/attendanceService';
import { usePermissions } from '../../../../shared/hooks/usePermissions';

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
  const fileInputRef = useRef(null);
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

  const { canCreate, canEdit } = usePermissions('bidi-roller');

  // Pagination & Search
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

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
        setCurrentPage(1);
        setSearchQuery('');
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

  /* ---- Sync Attendance ---- */
  const handleSyncAttendance = useCallback(async () => {
    if (!activeMonth || rows.length === 0) {
      addToast({ type: 'warning', message: 'Please search and load data for a month before syncing.' });
      return;
    }
    const companyId = localStorage.getItem('selectedCompany');
    if (!companyId) {
      addToast({ type: 'error', message: 'No company selected.' });
      return;
    }
    setLoading(true);
    try {
      const summaryMap = await getAttendanceSummary(companyId, activeMonth);
      if (Object.keys(summaryMap).length === 0) {
        addToast({ type: 'info', message: 'No attendance records found for this month.' });
        return;
      }
      
      setRows(prev => prev.map(row => {
        const presentDays = summaryMap[row.employeeId];
        if (presentDays !== undefined) {
          const updatedRow = { ...row, daysWorked: presentDays };
          return config ? recalculateBidiRollerRow(updatedRow, config) : updatedRow;
        }
        return row;
      }));
      addToast({ type: 'success', message: 'Attendance synced successfully! Review the changes before saving.' });
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to sync attendance data.' });
    } finally {
      setLoading(false);
    }
  }, [activeMonth, rows.length, config, addToast]);

  /* ---- Displayed Rows ---- */
  const displayedRows = useMemo(() => {
    return rows.filter(r => selectedContractors.includes(r.contractorId || 'SELF'));
  }, [rows, selectedContractors]);

  /* ---- Derived State ---- */
  const filteredRows = useMemo(() => {
    if (!searchQuery) return displayedRows;
    const lowerQuery = searchQuery.toLowerCase();
    return displayedRows.filter(row => 
      row.employeeName?.toLowerCase().includes(lowerQuery) || 
      row.employeeCode?.toLowerCase().includes(lowerQuery) ||
      row.accountNo?.toLowerCase().includes(lowerQuery)
    );
  }, [displayedRows, searchQuery]);

  const sortedRows = useMemo(() => {
    let sortableItems = [...filteredRows];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];
        
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredRows, sortConfig]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, currentPage, pageSize]);

  const renderSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown size={14} style={{ opacity: 0.4, marginLeft: '4px' }} />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={14} style={{ marginLeft: '4px' }} /> : <ArrowDown size={14} style={{ marginLeft: '4px' }} />;
  };

  /* ---- Export ---- */
  const handleExport = (type) => {
    if (type === 'Excel' || type === 'Excel Template') {
      const isTemplate = type === 'Excel Template';
      const esicLimit = config?.esicWageLimit || 176;
      const esicRate = config?.esicShare || 0.0075;
      
      const r1 = config?.rate1 || 0;
      const r2 = config?.rate2 || 0;
      const b1 = config?.bonus1 || 0;
      const b2 = config?.bonus2 || 0;

      const aoa = [
        ['ID (Do Not Modify)', 'Employee Code', 'Employee Name', 'Unit 1', 'Unit 2', 'Days Worked', 'Leave With Pay', 'Rate 1', 'Rate 2', 'Bonus 1', 'Bonus 2', 'Wages', 'Bonus', 'Total', 'PF', 'PT', 'ESIC', 'Net Wages']
      ];

      filteredRows.forEach((r, idx) => {
        const rowNum = idx + 2;
        const pfRate = (r.gender === 'MALE' || r.gender === 'Male' || r.gender === 'M') ? (config?.pfRateMale || 0.12) : (config?.pfRateFemale || 0.12);
        
        const ptConst = r.pt || 0;

        const fL = `ROUND(D${rowNum}*H${rowNum} + E${rowNum}*I${rowNum} + IF(F${rowNum}>0, ((D${rowNum}*H${rowNum} + E${rowNum}*I${rowNum}) / F${rowNum}) * G${rowNum}, 0), 0)`;
        const fM = `ROUND(D${rowNum}*J${rowNum} + E${rowNum}*K${rowNum}, 0)`;
        const fN = `ROUND(L${rowNum} + M${rowNum}, 0)`;
        const fO = `ROUND(L${rowNum} * ${pfRate}, 0)`;
        const fQ = `IF(N${rowNum}/MAX(1, F${rowNum} + G${rowNum}) <= ${esicLimit}, 0, CEILING(N${rowNum} * ${esicRate}, 1))`;
        const fR = `MAX(0, N${rowNum} - O${rowNum} - P${rowNum} - Q${rowNum})`;

        aoa.push([
          r.employeeId,
          r.employeeCode || '',
          r.employeeName,
          isTemplate ? null : (r.unit1 || 0),
          isTemplate ? null : (r.unit2 || 0),
          isTemplate ? null : (r.daysWorked || 0),
          isTemplate ? null : (r.leaveWithPay || 0),
          r1, r2, b1, b2,
          { t: 'n', f: fL, v: isTemplate ? 0 : r.wages },
          { t: 'n', f: fM, v: isTemplate ? 0 : r.bonus },
          { t: 'n', f: fN, v: isTemplate ? 0 : r.gross },
          { t: 'n', f: fO, v: isTemplate ? 0 : r.pf },
          ptConst,
          { t: 'n', f: fQ, v: isTemplate ? 0 : r.esic },
          { t: 'n', f: fR, v: isTemplate ? 0 : r.netWages }
        ]);
      });

      const worksheet = XLSX.utils.aoa_to_sheet(aoa);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Bidi_Roller');
      XLSX.writeFile(workbook, `Bidi_Roller_${isTemplate ? 'Template' : 'Export'}_${formatMonthLabel(activeMonth) || ''}.xlsx`);
      addToast({ type: 'success', message: `${type} downloaded!` });
    } else if (type === 'Copy') {
      const header = 'Employee Name.\tNo. of days\tUnit-1\tUnit-2\tLeave with pay\tRate-1\tRate-2\tBonus-1\tBonus-2\tWages\tBonus\tTotal\tPF\tPT\tESIC\tNet Wages';
      const body = filteredRows.map(r =>
        `${r.employeeName}\t${r.daysWorked}\t${r.unit1}\t${r.unit2}\t${r.leaveWithPay}\t${config?.rate1 || 0}\t${config?.rate2 || 0}\t${config?.bonus1 || 0}\t${config?.bonus2 || 0}\t${r.wages}\t${r.bonus}\t${r.gross}\t${r.pf}\t${r.pt}\t${r.esic}\t${r.netWages}`
      ).join('\n');
      navigator.clipboard.writeText(`${header}\n${body}`);
      addToast({ type: 'success', message: 'Copied to clipboard!' });
    } else {
      addToast({ type: 'info', message: `${type} export started for ${filteredRows.length} records!` });
    }
    setIsDropdownOpen(false);
  };

  /* ---- Import ---- */
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const importedData = XLSX.utils.sheet_to_json(worksheet);

        let updateCount = 0;
        setRows(prev => {
          const newRows = [...prev];
          importedData.forEach(importedRow => {
            const empId = importedRow['ID (Do Not Modify)'];
            if (!empId) return; // Skip invalid rows
            
            const rowIndex = newRows.findIndex(r => r.employeeId === empId);
            if (rowIndex !== -1) {
              const rowToUpdate = { ...newRows[rowIndex] };
              let modified = false;

              const mapField = (excelCol, objKey) => {
                if (importedRow[excelCol] !== undefined) {
                  let val = String(importedRow[excelCol]).replace(/[^0-9.]/g, '');
                  const parts = val.split('.');
                  if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
                  rowToUpdate[objKey] = val;
                  modified = true;
                }
              };

              mapField('Unit 1', 'unit1');
              mapField('Unit 2', 'unit2');
              mapField('Days Worked', 'daysWorked');
              mapField('Leave With Pay', 'leaveWithPay');

              if (modified) {
                newRows[rowIndex] = config ? recalculateBidiRollerRow(rowToUpdate, config) : rowToUpdate;
                updateCount++;
              }
            }
          });
          return newRows;
        });

        addToast({ type: 'success', message: `Successfully updated ${updateCount} records from Excel.` });
      } catch (error) {
        console.error('Error importing Excel:', error);
        addToast({ type: 'error', message: 'Failed to import Excel file. Please check the format.' });
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = null;
  };

  /* ---- Totals ---- */
  const totals = useMemo(() => {
    return filteredRows.reduce((acc, row) => ({
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
  }, [filteredRows, config]);

  /* ================================================ */
  return (
    <div className={styles.container}>
      {loading && <Loader fullPage={true} />}

      {/* ---- Header ---- */}
      <div className={styles.headerSection}>
        <h1 className={styles.title}>Bidi Roller Entry</h1>
        <div className={styles.headerActions}>
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            style={{ display: 'none' }} 
          />
          {canCreate && (
            <button
              className={styles.downloadBtn}
              style={{ backgroundColor: 'var(--success-color, #10b981)' }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={18} /> Upload Excel
            </button>
          )}
          
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
                <button onClick={() => handleExport('Excel Template')}>
                  <FileSpreadsheet size={16} /> Excel Template
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
          {hasSearched && canEdit && (
            <button 
              type="button"
              className={styles.searchBtn} 
              style={{ backgroundColor: 'var(--success-color, #10b981)' }} 
              onClick={handleSyncAttendance} 
              disabled={loading}
              title="Auto-fill No. of Days Worked from Attendance records"
            >
              Sync from Attendance
            </button>
          )}
        </div>
      </div>

      {/* ---- Search & Filter Row ---- */}
      {hasSearched && (
        <div className={styles.tableCard} style={{ marginBottom: 16 }}>
          <div className={styles.searchRow} style={{ padding: '16px' }}>
            <div className={styles.searchContainer} style={{ width: '100%', maxWidth: '400px', display: 'flex', alignItems: 'center', position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, color: '#666' }} />
              <input
                type="text"
                placeholder="Search by Employee Name or Code..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>
        </div>
      )}

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
              Bidi Roller Wages Entry — {filteredRows.length} Employee{filteredRows.length !== 1 ? 's' : ''}
            </span>
            <span className={styles.monthBadge}>{formatMonthLabel(activeMonth)}</span>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th onClick={() => handleSort('employeeName')} style={{ width: 180, cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>Employee Name {renderSortIcon('employeeName')}</div>
                  </th>
                  <th onClick={() => handleSort('unit1')} style={{ textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No. of Unit worked {renderSortIcon('unit1')}</div>
                  </th>
                  <th onClick={() => handleSort('unit2')} style={{ textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No. of Unit worked {renderSortIcon('unit2')}</div>
                  </th>
                  <th onClick={() => handleSort('daysWorked')} style={{ textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No. of Days worked {renderSortIcon('daysWorked')}</div>
                  </th>
                  <th onClick={() => handleSort('leaveWithPay')} style={{ textAlign: 'center', width: 100, cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Leave With Pay {renderSortIcon('leaveWithPay')}</div>
                  </th>
                  <th onClick={() => handleSort('wages')} style={{ textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Wages {renderSortIcon('wages')}</div>
                  </th>
                  <th onClick={() => handleSort('bonus')} style={{ textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Bonus {renderSortIcon('bonus')}</div>
                  </th>
                  <th onClick={() => handleSort('gross')} style={{ textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Total {renderSortIcon('gross')}</div>
                  </th>
                  <th onClick={() => handleSort('pf')} style={{ textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>PF {renderSortIcon('pf')}</div>
                  </th>
                  <th onClick={() => handleSort('pt')} style={{ textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>PT {renderSortIcon('pt')}</div>
                  </th>
                  <th onClick={() => handleSort('esic')} style={{ textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>ESIC {renderSortIcon('esic')}</div>
                  </th>
                  <th onClick={() => handleSort('netWages')} style={{ textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Net Wages {renderSortIcon('netWages')}</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map(row => (
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
                      <input type="text" value={row.unit1} onChange={e => handleFieldChange(row.employeeId, 'unit1', e.target.value)} className={styles.tableInput} style={{ textAlign: 'center' }} disabled={!canEdit} />
                    </td>
                    <td style={{ textAlign: 'center', minWidth: 70 }}>
                      <input type="text" value={row.unit2} onChange={e => handleFieldChange(row.employeeId, 'unit2', e.target.value)} className={styles.tableInput} style={{ textAlign: 'center' }} disabled={!canEdit} />
                    </td>

                    {/* Days Worked */}
                    <td style={{ textAlign: 'center', minWidth: 70 }}>
                      <input type="text" value={row.daysWorked} onChange={e => handleFieldChange(row.employeeId, 'daysWorked', e.target.value)} className={styles.tableInput} style={{ textAlign: 'center', backgroundColor: '#f0f4f8' }} disabled={!canEdit} />
                    </td>

                    {/* Additional Paid Wages */}
                    <td style={{ textAlign: 'center', minWidth: 80 }}>
                      <input type="text" value={row.addition} onChange={e => handleFieldChange(row.employeeId, 'addition', e.target.value)} className={styles.tableInput} style={{ textAlign: 'center' }} disabled={!canEdit} />
                    </td>

                    {/* Leave With Pay */}
                    <td style={{ textAlign: 'center', minWidth: 70 }}>
                      <input type="text" value={row.leaveWithPay} onChange={e => handleFieldChange(row.employeeId, 'leaveWithPay', e.target.value)} className={styles.tableInput} style={{ textAlign: 'center' }} disabled={!canEdit} />
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
                {paginatedRows.length > 0 && (
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

          {/* Mobile Card List */}
          <div className={styles.mobileCardsContainer}>
            {paginatedRows.map(row => (
              <div key={row.employeeId} className={styles.mobileCard}>
                <div className={styles.mobileCardHeader}>
                  <div className={styles.empCell}>
                    <span className={styles.empName}>{row.employeeName}</span>
                    <span className={styles.empCode}>{row.employeeCode} (A/C: {row.accountNo})</span>
                  </div>
                </div>
                <div className={styles.mobileCardBody}>
                  <div className={styles.mobileCardRow}>
                    <span className={styles.mobileCardLabel}>Unit-1 Worked:</span>
                    <input type="text" value={row.unit1} onChange={e => handleFieldChange(row.employeeId, 'unit1', e.target.value)} className={styles.tableInput} style={{ width: '120px', textAlign: 'right' }} disabled={!canEdit} />
                  </div>
                  <div className={styles.mobileCardRow}>
                    <span className={styles.mobileCardLabel}>Unit-2 Worked:</span>
                    <input type="text" value={row.unit2} onChange={e => handleFieldChange(row.employeeId, 'unit2', e.target.value)} className={styles.tableInput} style={{ width: '120px', textAlign: 'right' }} disabled={!canEdit} />
                  </div>
                  <div className={styles.mobileCardRow}>
                    <span className={styles.mobileCardLabel}>Days Worked:</span>
                    <input type="text" value={row.daysWorked} onChange={e => handleFieldChange(row.employeeId, 'daysWorked', e.target.value)} className={styles.tableInput} style={{ width: '120px', textAlign: 'right', backgroundColor: '#f0f4f8' }} disabled={!canEdit} />
                  </div>
                  <div className={styles.mobileCardRow}>
                    <span className={styles.mobileCardLabel}>Addition:</span>
                    <input type="text" value={row.addition} onChange={e => handleFieldChange(row.employeeId, 'addition', e.target.value)} className={styles.tableInput} style={{ width: '120px', textAlign: 'right' }} disabled={!canEdit} />
                  </div>
                  <div className={styles.mobileCardRow}>
                    <span className={styles.mobileCardLabel}>Leave With Pay:</span>
                    <input type="text" value={row.leaveWithPay} onChange={e => handleFieldChange(row.employeeId, 'leaveWithPay', e.target.value)} className={styles.tableInput} style={{ width: '120px', textAlign: 'right' }} disabled={!canEdit} />
                  </div>
                  
                  {/* Totals & calculations */}
                  <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '8px 0' }} />
                  
                  <div className={styles.mobileCardRow}>
                    <span className={styles.mobileCardLabel}>Gross Wages:</span>
                    <span className={styles.mobileCardValue}>₹{Math.round(row.gross || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className={styles.mobileCardRow}>
                    <span className={styles.mobileCardLabel}>PF / PT / ESIC:</span>
                    <span className={styles.mobileCardValue} style={{ color: 'var(--danger)' }}>
                      ₹{row.pf || 0} / ₹{row.pt || 0} / ₹{row.esic || 0}
                    </span>
                  </div>
                  <div className={styles.mobileCardRow} style={{ fontWeight: '700' }}>
                    <span className={styles.mobileCardLabel}>Net Pay:</span>
                    <span className={styles.mobileCardValue} style={{ color: 'var(--primary)' }}>₹{Math.round(row.netWages || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredRows.length / pageSize)}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />

          {/* Save Button */}
          {canEdit && (
            <div className={styles.saveSection}>
              <button className={styles.saveBtn} onClick={handleSave} disabled={loading}>
                <Save size={18} /> {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default BidiRollerEntryPage;
