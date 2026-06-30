import { Pagination } from '../../../../shared/components';
import React, { useState, useMemo } from 'react';
import { Edit, Trash2, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import styles from './EpfChallanDatePage.module.css';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

const EpfChallanDateTable = ({ data, searchTerm, onSearchChange, onEdit, onDelete }) => {
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Reset pagination if filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  const sortedData = useMemo(() => {
    let sortableItems = [...data];
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
  }, [data, sortConfig]);

  // Pagination calculations
  const totalEntries = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);
  const paginatedData = useMemo(() => {
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, startIndex, endIndex]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const renderSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown size={14} style={{ opacity: 0.4, marginLeft: '4px' }} />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={14} style={{ marginLeft: '4px' }} /> : <ArrowDown size={14} style={{ marginLeft: '4px' }} />;
  };

  return (
    <div className={styles.tableCard}>
      {/* Table controls containing Total Records count on left, Search on right */}
      <div className={styles.tableControls}>
        <div style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Total EPF Challan Date Entries: {totalEntries}
        </div>

        {/* Local Search box */}
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search..."
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* Main Grid Table Container */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: '70px' }}>Sr No.</th>
              <th onClick={() => handleSort('trrn')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>TRRN {renderSortIcon('trrn')}</div>
              </th>
              <th onClick={() => handleSort('crnNo')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>CRN No {renderSortIcon('crnNo')}</div>
              </th>
              <th onClick={() => handleSort('wageMonth')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>Wage Month {renderSortIcon('wageMonth')}</div>
              </th>
              <th onClick={() => handleSort('dueDate')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>Due Date {renderSortIcon('dueDate')}</div>
              </th>
              <th onClick={() => handleSort('challanDate')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>Challan Date {renderSortIcon('challanDate')}</div>
              </th>
              <th style={{ textAlign: 'right' }}>A/C 1 (EE)</th>
              <th style={{ textAlign: 'right' }}>A/C 1 (ER)</th>
              <th style={{ textAlign: 'right' }}>A/C 2</th>
              <th style={{ textAlign: 'right' }}>A/C 10</th>
              <th style={{ textAlign: 'right' }}>A/C 21</th>
              <th style={{ textAlign: 'right' }}>A/C 22</th>
              <th onClick={() => handleSort('totalAmount')} style={{ textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>Total Amount {renderSortIcon('totalAmount')}</div>
              </th>
              <th onClick={() => handleSort('returnDate')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>Return Date {renderSortIcon('returnDate')}</div>
              </th>
              <th style={{ textAlign: 'center', width: '90px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, idx) => (
                <tr key={row.id}>
                  {/* Sr No. */}
                  <td>{startIndex + idx + 1}</td>

                  {/* Fields */}
                  <td>{row.trrn}</td>
                  <td>{row.crnNo}</td>
                  <td>{row.wageMonth}</td>
                  <td>{formatDate(row.dueDate)}</td>
                  <td>{formatDate(row.challanDate)}</td>
                  <td style={{ textAlign: 'right' }}>{row.ac1EE}</td>
                  <td style={{ textAlign: 'right' }}>{row.ac1ER}</td>
                  <td style={{ textAlign: 'right' }}>{row.ac2}</td>
                  <td style={{ textAlign: 'right' }}>{row.ac10}</td>
                  <td style={{ textAlign: 'right' }}>{row.ac21}</td>
                  <td style={{ textAlign: 'right' }}>{row.ac22}</td>
                  <td style={{ textAlign: 'right', fontWeight: '600', color: 'var(--primary)' }}>
                    {row.totalAmount}
                  </td>
                  <td>{formatDate(row.returnDate)}</td>

                  {/* Actions Column */}
                  <td style={{ textAlign: 'center' }}>
                    <div className={styles.actionCell}>
                      <button
                        onClick={() => onEdit(row)}
                        className={styles.editBtn}
                        title="Edit Record"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => onDelete(row.id)}
                        className={styles.deleteBtn}
                        title="Delete Record"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="15" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  No matching records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer Navigation */}
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
              <option value={100}>100</option>
            </select>
            <span>records per page</span>
          </div>
          <div className={styles.infoText}>
            Showing {totalEntries > 0 ? startIndex + 1 : 0} to {endIndex} of {totalEntries} entries
          </div>
        </div>

        <div className={styles.pagination}>
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
      </div>
    </div>
  );
};

export default EpfChallanDateTable;
