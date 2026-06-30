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
  CalendarDays,
  Upload,
  ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import styles from '../components/OfficeStaffEntryPage.module.css';
import { useToast, MonthYearPicker, Pagination } from '../../../../shared/components';
import {
  getOfficeStaffEntry,
  saveOfficeStaffEntry,
  recalculateRow
} from '../services/officeStaffEntryService';
import { getAttendanceSummary } from '../../../attendance/attendanceService';

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
  const fileInputRef = useRef(null);

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [activeMonth, setActiveMonth] = useState('');
  const [rows, setRows] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState(null);

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
        setCurrentPage(1);
        setSearchQuery('');
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
          return config ? recalculateRow(updatedRow, config) : updatedRow;
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

  /* ---- Export ---- */
  const handleExport = (type) => {
    if (type === 'Excel' || type === 'Excel Template') {
      const isTemplate = type === 'Excel Template';
      const totalDays = config?.totalDaysInMonth || 30;
      const esicLimit = config?.esicWageLimit || 176;
      const esicRate = config?.esicShare || 0.0075;

      const aoa = [
        ['ID (Do Not Modify)', 'Employee Code', 'Employee Name', 'Days Worked', 'Addition', 'Leave With Pay', 'Leave Without Pay', 'Basic Salary', 'Gross', 'PF', 'PT', 'ESIC', 'Net Wages']
      ];

      filteredRows.forEach((r, idx) => {
        const rowNum = idx + 2;
        const pfRate = (r.gender === 'MALE' || r.gender === 'Male' || r.gender === 'M') ? (config?.pfRateMale || 0.12) : (config?.pfRateFemale || 0.12);

        const basic = r.basicSalary || 0;
        const lwp = r.leaveWithPay || 0;
        const ptConst = r.pt || 0; // PT is kept constant to avoid complex slab formulas in Excel

        const fG = `MAX(0, ${totalDays} - F${rowNum} - D${rowNum})`;
        const fI = `ROUND(H${rowNum} - (H${rowNum}/MAX(1, ${totalDays} - F${rowNum})) * G${rowNum}, 0) + E${rowNum}`;
        const fJ = `ROUND(MIN(I${rowNum}, 15000) * ${pfRate}, 0)`;
        const fL = `IF(I${rowNum}/MAX(1, D${rowNum} + F${rowNum}) <= ${esicLimit}, 0, CEILING(I${rowNum} * ${esicRate}, 1))`;
        const fM = `MAX(0, I${rowNum} - J${rowNum} - K${rowNum} - L${rowNum})`;

        aoa.push([
          r.employeeId,
          r.employeeCode || '',
          r.employeeName,
          isTemplate ? null : (r.daysWorked || 0),
          isTemplate ? null : (r.addition || 0),
          lwp,
          { t: 'n', f: fG, v: isTemplate ? 0 : r.leaveWithoutPay },
          basic,
          { t: 'n', f: fI, v: isTemplate ? 0 : r.gross },
          { t: 'n', f: fJ, v: isTemplate ? 0 : r.pf },
          ptConst,
          { t: 'n', f: fL, v: isTemplate ? 0 : r.esic },
          { t: 'n', f: fM, v: isTemplate ? 0 : r.netWages }
        ]);
      });

      const worksheet = XLSX.utils.aoa_to_sheet(aoa);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Office_Staff');
      XLSX.writeFile(workbook, `Office_Staff_${isTemplate ? 'Template' : 'Export'}_${formatMonthLabel(activeMonth) || ''}.xlsx`);
      addToast({ type: 'success', message: `${type} downloaded!` });
    } else if (type === 'Copy') {
      const header = 'Employee\tDays\tLWP\tLwoP\tAddition\tBasic\tTotal\tPF\tPT\tESIC\tNet';
      const body = filteredRows.map(r =>
        `${r.employeeName}\t${r.daysWorked}\t${r.leaveWithPay}\t${r.leaveWithoutPay}\t${r.addition}\t${r.basicSalary}\t${r.gross}\t${r.pf}\t${r.pt}\t${r.esic}\t${r.netWages}`
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

              if (importedRow['Days Worked'] !== undefined) {
                rowToUpdate.daysWorked = importedRow['Days Worked'];
                modified = true;
              }
              if (importedRow['Addition'] !== undefined) {
                rowToUpdate.addition = importedRow['Addition'];
                modified = true;
              }

              if (modified) {
                newRows[rowIndex] = config ? recalculateRow(rowToUpdate, config) : rowToUpdate;
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
    // Reset file input
    e.target.value = null;
  };

  /* ---- Derived State ---- */
  const filteredRows = useMemo(() => {
    if (!searchQuery) return rows;
    const lowerQuery = searchQuery.toLowerCase();
    return rows.filter(row => 
      row.employeeName?.toLowerCase().includes(lowerQuery) || 
      row.employeeCode?.toLowerCase().includes(lowerQuery) ||
      row.accountNo?.toLowerCase().includes(lowerQuery)
    );
  }, [rows, searchQuery]);

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

  /* ---- Totals ---- */
  const totals = useMemo(() => {
    return filteredRows.reduce((acc, row) => ({
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
  }, [filteredRows]);

  /* ================================================ */
  return (
    <div className={styles.container}>

      {/* ---- Header ---- */}
      <div className={styles.headerSection}>
        <h1 className={styles.title}>Office Staff Entry</h1>
        <div className={styles.headerActions}>
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            style={{ display: 'none' }} 
          />
          <button
            className={styles.downloadBtn}
            style={{ backgroundColor: 'var(--success-color, #10b981)' }}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={18} /> Upload Excel
          </button>
          
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
          {hasSearched && (
            <button 
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
              Salary Entry — {filteredRows.length} Employee{filteredRows.length !== 1 ? 's' : ''}
            </span>
            <span className={styles.monthBadge}>{formatMonthLabel(activeMonth)}</span>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th onClick={() => handleSort('employeeName')} style={{ width: 220, cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>Employee Name {renderSortIcon('employeeName')}</div>
                  </th>
                  <th onClick={() => handleSort('daysWorked')} style={{ textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>No. of Days Worked {renderSortIcon('daysWorked')}</div>
                  </th>
                  <th onClick={() => handleSort('leaveWithPay')} style={{ textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>Leave With Pay {renderSortIcon('leaveWithPay')}</div>
                  </th>
                  <th onClick={() => handleSort('leaveWithoutPay')} style={{ textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>Leave Without Pay {renderSortIcon('leaveWithoutPay')}</div>
                  </th>
                  <th onClick={() => handleSort('addition')} style={{ textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>Addition {renderSortIcon('addition')}</div>
                  </th>
                  <th onClick={() => handleSort('basicSalary')} style={{ textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>Basic Salary {renderSortIcon('basicSalary')}</div>
                  </th>
                  <th onClick={() => handleSort('gross')} style={{ textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>Total {renderSortIcon('gross')}</div>
                  </th>
                  <th onClick={() => handleSort('pf')} style={{ textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>PF {renderSortIcon('pf')}</div>
                  </th>
                  <th onClick={() => handleSort('pt')} style={{ textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>PT {renderSortIcon('pt')}</div>
                  </th>
                  <th onClick={() => handleSort('esic')} style={{ textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>ESIC {renderSortIcon('esic')}</div>
                  </th>
                  <th onClick={() => handleSort('netWages')} style={{ textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>Net Wages {renderSortIcon('netWages')}</div>
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
                {paginatedRows.length > 0 && (
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
