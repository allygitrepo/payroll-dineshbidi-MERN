import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Download, FileSpreadsheet, Copy, FileText, File, Printer } from 'lucide-react';
import { useToast, MonthYearPicker } from '../../../../shared/components';
import { getEmployees } from '../../../master/employee/services/employeeService';
import { getBidiRollerEntry } from '../../../entry/bidi-roller/services/bidiRollerEntryService';
import { getOfficeStaffEntry } from '../../../entry/office-staff/services/officeStaffEntryService';
import { getPackersEntry } from '../../../entry/packers/services/packersEntryService';
import { getBidiRollerWages } from '../../../setup/bidi-roller-wages/services/bidiRollerWagesService';
import { getOfficeStaffSalaries } from '../../../setup/office-staff-salary/services/officeStaffSalaryService';
import { getPackingWages } from '../../../setup/packing-wages/services/packingWagesService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import styles from '../components/BonusSheetPage.module.css';

const getMonthRangeList = (fromStr, toStr) => {
  if (!fromStr || !toStr) return [];
  const start = new Date(fromStr + '-01');
  const end = new Date(toStr + '-01');
  const list = [];
  let current = new Date(start);

  while (current <= end) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    list.push(`${year}-${month}`);
    current.setMonth(current.getMonth() + 1);
  }
  return list;
};

const formatMonthLabel = (mStr) => {
  const [year, month] = mStr.split('-');
  const d = new Date(parseInt(year), parseInt(month) - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

const BonusSheetPage = () => {
  const [fromMonth, setFromMonth] = useState('2025-06');
  const [toMonth, setToMonth] = useState('2026-06');
  const [employeeType, setEmployeeType] = useState('OFFICE STAFF');

  const [searchTriggeredFrom, setSearchTriggeredFrom] = useState('2025-06');
  const [searchTriggeredTo, setSearchTriggeredTo] = useState('2026-06');
  const [searchTriggeredType, setSearchTriggeredType] = useState('OFFICE STAFF');

  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);
  const addToast = useToast();

  // Generate dynamic month columns list
  const activeMonths = useMemo(() => {
    return getMonthRangeList(searchTriggeredFrom, searchTriggeredTo);
  }, [searchTriggeredFrom, searchTriggeredTo]);

  const [bonusData, setBonusData] = useState([]);

  // Aggregate monthly wages and compute bonuses
  useEffect(() => {
    const fetchData = async () => {
      if (activeMonths.length === 0) {
        setBonusData([]);
        return;
      }

      try {
        const companyId = localStorage.getItem('selectedCompany');
        const [dbEmployees, bidiWages, officeSalaries, packingWages] = await Promise.all([
          getEmployees(companyId).then(list => list ? list.filter(e => e.status === 'Active' || e.status === true) : []).catch(() => []),
          getBidiRollerWages(companyId).catch(() => []),
          getOfficeStaffSalaries(companyId).catch(() => []),
          getPackingWages(companyId).catch(() => [])
        ]);

        let targetEmployees = [];

        // Filter employees based on type
        if (searchTriggeredType === 'OFFICE STAFF') {
          targetEmployees = dbEmployees.filter(e => e.employeeType === 'OFFICE STAFF');
        } else if (searchTriggeredType === 'PACKING STAFF') {
          targetEmployees = dbEmployees.filter(e => e.employeeType === 'PACKING STAFF');
        } else {
          // BIDI MAKER
          targetEmployees = dbEmployees.filter(e => e.employeeType === 'BIDI MAKER' || e.employeeType === 'BIDI ROLLER');
        }

        // Prepare compiled list of employees
        const listMap = {};

        // Add master db employees first
        targetEmployees.forEach(emp => {
          listMap[emp.memberName] = {
            name: emp.memberName,
            memberId: emp.memberId || emp.id,
            employeeId: emp.id,
            uan: emp.uan || 'N/A',
            monthlyWages: {}
          };
        });

        // Now pull live local storage entry databases for each active month
        for (const m of activeMonths) {
          let monthlyRows = [];
          if (searchTriggeredType === 'OFFICE STAFF') {
            const res = await getOfficeStaffEntry(m, companyId).catch(() => ({ data: [] }));
            monthlyRows = res?.data || [];
          } else if (searchTriggeredType === 'PACKING STAFF') {
            const res = await getPackersEntry(m, companyId).catch(() => ({ data: [] }));
            monthlyRows = res?.data || [];
          } else {
            const res = await getBidiRollerEntry(m, companyId).catch(() => ({ data: [] }));
            monthlyRows = res?.data || [];
          }

          let bidiConfig = null;
          if (searchTriggeredType !== 'OFFICE STAFF' && searchTriggeredType !== 'PACKING STAFF') {
            bidiConfig = bidiWages.find(w => new Date(w.startDate) <= new Date(m + '-01')) || bidiWages[0] || { bonus1: 0, bonus2: 0 };
          }

          monthlyRows.forEach(row => {
            const empName = row.employeeName;

            if (!listMap[empName]) {
              listMap[empName] = {
                name: empName,
                memberId: row.employeeCode || 'N/A',
                employeeId: row.employeeId,
                uan: row.accountNo || 'N/A',
                monthlyWages: {}
              };
            }

            if (searchTriggeredType !== 'OFFICE STAFF' && searchTriggeredType !== 'PACKING STAFF') {
              const unit1 = parseFloat(row.unit1 || 0);
              const unit2 = parseFloat(row.unit2 || 0);
              const bonusVal = (unit1 * parseFloat(bidiConfig?.bonus1 || 0)) + (unit2 * parseFloat(bidiConfig?.bonus2 || 0));
              listMap[empName].monthlyWages[m] = bonusVal;
            } else {
              const amount = row.netWages || row.gross || row.wages || 0;
              listMap[empName].monthlyWages[m] = amount;
            }
          });
        }

        // Compile rows list and calculate bonus variables
        const mapped = Object.values(listMap).map(row => {
          const wages = {};
          let total = 0;

          activeMonths.forEach(m => {
            const amt = parseFloat(row.monthlyWages[m]) || 0;
            wages[m] = amt;
            total += amt;
          });

          let bonus = 0;
          let additionalBonus = 0;

          if (searchTriggeredType === 'OFFICE STAFF') {
            const config = officeSalaries.find(s => s.employeeId === row.employeeId) || { standardBonus: 8.33, additionalBonus: 2.78 };
            bonus = Math.round(total * (parseFloat(config.standardBonus) / 100));
            additionalBonus = Math.round(total * (parseFloat(config.additionalBonus) / 100));
          } else if (searchTriggeredType === 'PACKING STAFF') {
            const config = packingWages[0] || { bonus: 8.33 };
            bonus = Math.round(total * (parseFloat(config.bonus) / 100));
            additionalBonus = 0;
          } else {
            bonus = Math.round(total);
            additionalBonus = 0;
          }

          const totalPayment = bonus + additionalBonus;

          return {
            ...row,
            wages,
            total,
            bonus,
            additionalBonus,
            totalPayment
          };
        });

        setBonusData(mapped);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [activeMonths, searchTriggeredFrom, searchTriggeredTo, searchTriggeredType]);

  // Local Search Filter
  const filteredRows = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return bonusData;

    return bonusData.filter(row => {
      return (
        (row.name && row.name.toLowerCase().includes(query)) ||
        (row.memberId && row.memberId.includes(query)) ||
        (row.uan && row.uan.includes(query))
      );
    });
  }, [bonusData, searchTerm]);

  // Aggregate columns totals for footer summary
  const columnTotals = useMemo(() => {
    const totals = {
      wages: {},
      total: 0,
      bonus: 0,
      additionalBonus: 0,
      totalPayment: 0
    };

    activeMonths.forEach(m => {
      totals.wages[m] = 0;
    });

    filteredRows.forEach(row => {
      activeMonths.forEach(m => {
        totals.wages[m] += row.wages[m] || 0;
      });
      totals.total += row.total;
      totals.bonus += row.bonus;
      totals.additionalBonus += row.additionalBonus;
      totals.totalPayment += row.totalPayment;
    });

    return totals;
  }, [filteredRows, activeMonths]);

  // Pagination calculations
  const totalEntries = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);

  const paginatedData = useMemo(() => {
    return filteredRows.slice(startIndex, endIndex);
  }, [filteredRows, startIndex, endIndex]);

  // Reset pagination indexes on filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize, searchTriggeredFrom, searchTriggeredTo, searchTriggeredType]);

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
    if (!fromMonth || !toMonth) {
      addToast({
        type: 'error',
        message: 'From Month and To Month are required.'
      });
      return;
    }

    if (fromMonth > toMonth) {
      addToast({
        type: 'error',
        message: 'From Month cannot be greater than To Month.'
      });
      return;
    }

    setSearchTriggeredFrom(fromMonth);
    setSearchTriggeredTo(toMonth);
    setSearchTriggeredType(employeeType);

    addToast({
      type: 'success',
      message: `Bonus Sheet compiled successfully from ${fromMonth} to ${toMonth}.`
    });
  };

  const handleExport = (type) => {
    if (filteredRows.length === 0) {
      addToast({
        type: 'error',
        message: 'No records available to export!'
      });
      setIsDropdownOpen(false);
      return;
    }

    const rangeLabel = `${searchTriggeredFrom.replace('-', '')}_to_${searchTriggeredTo.replace('-', '')}`;

    if (type === 'Copy') {
      const monthHeaders = activeMonths.map(m => formatMonthLabel(m));
      const headers = ['Sr No.', 'Name', 'Member ID', 'UAN', ...monthHeaders, 'Total', 'Bonus', 'Additional Bonus', 'Total Payment'];
      let text = `Bonus Sheet Report (${searchTriggeredFrom} to ${searchTriggeredTo})\n\n`;
      text += headers.join('\t') + '\n';

      filteredRows.forEach((row, idx) => {
        const monthVals = activeMonths.map(m => row.wages[m] || 0);
        text += `${idx + 1}\t${row.name}\t${row.memberId}\t${row.uan}\t${monthVals.join('\t')}\t${row.total}\t${row.bonus}\t${row.additionalBonus}\t${row.totalPayment}\n`;
      });

      const totalMonthVals = activeMonths.map(m => columnTotals.wages[m]);
      text += `Total\t\t\t\t${totalMonthVals.join('\t')}\t${columnTotals.total}\t${columnTotals.bonus}\t${columnTotals.additionalBonus}\t${columnTotals.totalPayment}\n`;

      navigator.clipboard.writeText(text).then(() => {
        addToast({
          type: 'success',
          message: 'Bonus Sheet copied to clipboard!'
        });
      });
    }
    else if (type === 'CSV' || type === 'Excel') {
      const monthHeaders = activeMonths.map(m => formatMonthLabel(m));
      const headers = ['Sr No.', 'Name', 'Member ID', 'UAN', ...monthHeaders, 'Total', 'Bonus', 'Additional Bonus', 'Total Payment'];
      let csv = headers.join(',') + '\n';

      filteredRows.forEach((row, idx) => {
        const monthVals = activeMonths.map(m => row.wages[m] || 0);
        csv += `${idx + 1},"${row.name}",${row.memberId},${row.uan},${monthVals.join(',')},${row.total},${row.bonus},${row.additionalBonus},${row.totalPayment}\n`;
      });

      const totalMonthVals = activeMonths.map(m => columnTotals.wages[m]);
      csv += `Total,,,${totalMonthVals.join(',')},${columnTotals.total},${columnTotals.bonus},${columnTotals.additionalBonus},${columnTotals.totalPayment}\n`;

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Bonus_Sheet_${rangeLabel}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast({
        type: 'success',
        message: `Bonus Sheet ${type} downloaded successfully!`
      });
    }
    else if (type === 'PDF') {
      const doc = new jsPDF('landscape');
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFontSize(16);
      doc.text(`Bonus Sheet Report (${searchTriggeredFrom} to ${searchTriggeredTo})`, pageWidth / 2, 20, { align: 'center' });

      const monthHeaders = activeMonths.map(m => formatMonthLabel(m));
      const tableColumn = ['Sr No.', 'Name', 'Member ID', 'UAN', ...monthHeaders, 'Total', 'Bonus', 'Add. Bonus', 'Payment'];
      const tableRows = [];

      filteredRows.forEach((row, idx) => {
        const monthVals = activeMonths.map(m => row.wages[m] || 0);
        tableRows.push([idx + 1, row.name, row.memberId, row.uan, ...monthVals, row.total, row.bonus, row.additionalBonus, row.totalPayment]);
      });

      const totalMonthVals = activeMonths.map(m => columnTotals.wages[m]);
      tableRows.push(["", "", "", "Total", ...totalMonthVals, columnTotals.total, columnTotals.bonus, columnTotals.additionalBonus, columnTotals.totalPayment]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 30,
        theme: 'grid',
        headStyles: { fillColor: [243, 244, 246], textColor: [55, 65, 81], fontStyle: 'bold', fontSize: 8, halign: 'center' },
        bodyStyles: { textColor: [55, 65, 81], fontSize: 8, halign: 'right' },
        columnStyles: {
          1: { halign: 'left' },
          2: { halign: 'left' },
          3: { halign: 'left' }
        },
        didParseCell: function (data) {
          if (data.row.index === tableRows.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [243, 244, 246];
          }
        }
      });

      doc.save(`Bonus_Sheet_${rangeLabel}.pdf`);
      addToast({
        type: 'success',
        message: 'Bonus Sheet PDF downloaded successfully!'
      });
    }
    else {
      addToast({
        type: 'info',
        message: `${type} generated for Bonus Sheet (${searchTriggeredFrom} to ${searchTriggeredTo})!`
      });
    }
    setIsDropdownOpen(false);
  };

  return (
    <div className={styles.container}>
      {/* Page Header Section */}
      <div className={styles.headerSection}>
        <div>
          <h2 className={styles.title}>Bonus Sheet</h2>
          <p className={styles.subtitle}>
            Compute statutory annual bonuses (8.33% standard and 2.78% additional bonus) compiled over month wage ranges.
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

      {/* Filter Form Card */}
      <div className={styles.card}>
        <form onSubmit={handleSearch} className={styles.filterRow}>
          {/* From Month Year Selector */}
          <div className={styles.filterGroup}>
            <span className={styles.label}>From Month and Year <span className={styles.required}>*</span></span>
            <MonthYearPicker
              value={fromMonth}
              onChange={setFromMonth}
              placeholder="SELECT START DATE*"
            />
          </div>

          {/* To Month Year Selector */}
          <div className={styles.filterGroup}>
            <span className={styles.label}>To Month and Year <span className={styles.required}>*</span></span>
            <MonthYearPicker
              value={toMonth}
              onChange={setToMonth}
              placeholder="SELECT END DATE*"
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

          {/* Search trigger button */}
          <button type="submit" className={styles.searchBtn}>
            <Search size={16} />
            Search
          </button>
        </form>
      </div>

      {/* Results Table Card */}
      <div className={styles.tableCard}>
        {/* Table top controls */}
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
              disabled={filteredRows.length === 0 && !searchTerm}
            />
          </div>
        </div>

        {/* Scrollable Table Wrapper */}
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Sr No.</th>
                <th>Name</th>
                {activeMonths.map((m, i) => (
                  <th key={i} style={{ textAlign: 'right' }}>
                    {formatMonthLabel(m)}
                  </th>
                ))}
                <th style={{ textAlign: 'right' }}>Total</th>
                <th style={{ textAlign: 'right' }}>Bonus</th>
                <th style={{ textAlign: 'right' }}>Additional Bonus</th>
                <th style={{ textAlign: 'right' }}>Total Payment</th>
                <th style={{ textAlign: 'center', width: '150px' }}>Signature Of Employee</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7 + activeMonths.length} className={styles.noDataText}>
                    {!searchTriggeredFrom ? 'Select Month ranges and query Bonus Sheet records.' : 'No matching records found.'}
                  </td>
                </tr>
              ) : (
                <>
                  {paginatedData.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: '500' }}>{startIndex + idx + 1}</td>
                      <td>
                        <div className={styles.employeeInfo}>
                          <span className={styles.employeeName}>{row.name}</span>
                          <span className={styles.employeeMeta}>Member ID: {row.memberId}</span>
                          <span className={styles.employeeMeta}>UAN: {row.uan}</span>
                        </div>
                      </td>
                      {activeMonths.map((m, i) => (
                        <td key={i} style={{ textAlign: 'right' }}>
                          {row.wages[m] ? row.wages[m].toLocaleString() : '0'}
                        </td>
                      ))}
                      <td style={{ textAlign: 'right', fontWeight: '600' }}>
                        {row.total.toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '600', color: 'var(--primary)' }}>
                        {row.bonus.toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '600', color: 'var(--accent)' }}>
                        {row.additionalBonus.toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--primary-hover)' }}>
                        {row.totalPayment.toLocaleString()}
                      </td>
                      <td></td>
                    </tr>
                  ))}

                  {/* Summary Totals Row */}
                  <tr className={styles.totalRow}>
                    <td colSpan={2} style={{ fontWeight: '700' }}>Total</td>
                    {activeMonths.map((m, i) => (
                      <td key={i} style={{ textAlign: 'right', fontWeight: '700' }}>
                        {columnTotals.wages[m].toLocaleString()}
                      </td>
                    ))}
                    <td style={{ textAlign: 'right', fontWeight: '700' }}>
                      {columnTotals.total.toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '700' }}>
                      {columnTotals.bonus.toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '700' }}>
                      {columnTotals.additionalBonus.toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '700' }}>
                      {columnTotals.totalPayment.toLocaleString()}
                    </td>
                    <td></td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer controls: Info text and pagination */}
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
      </div>
    </div>
  );
};

export default BonusSheetPage;
