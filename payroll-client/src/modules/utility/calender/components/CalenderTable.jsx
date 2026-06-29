import { Pagination } from '../../../../shared/components';
import React, { useState, useMemo } from 'react';
import { Edit, Trash2, Search } from 'lucide-react';
import styles from './CalenderPage.module.css';

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
};

const CalenderTable = ({ data, searchTerm, onSearchChange, onEdit, onDelete }) => {
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  const totalEntries = data.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);
  const paginatedData = useMemo(() => data.slice(startIndex, endIndex), [data, startIndex, endIndex]);

  return (
    <div className={styles.tableCard}>
      {/* Search and Export controls */}
      <div className={styles.tableControls}>
        <div style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Total Holiday Entries: {totalEntries}
        </div>

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

      {/* Table Data */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: '70px', textAlign: 'center' }}>Sr. No.</th>
              <th>Date</th>
              <th>Year</th>
              <th>Type</th>
              <th>Week Day</th>
              <th>Remark</th>
              <th style={{ width: '120px', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  No matching records found.
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => (
                <tr key={item.id}>
                  <td style={{ textAlign: 'center', fontWeight: '500' }}>
                    {startIndex + index + 1}
                  </td>
                  <td>{item.holidayType === 'COMPANY' ? formatDate(item.holidayDate) : '-'}</td>
                  <td>{item.year || '-'}</td>
                  <td style={{ fontWeight: '600' }}>{item.holidayType}</td>
                  <td>{item.holidayType === 'WEEKLY' ? item.weekDay : '-'}</td>
                  <td>{item.remark || ''}</td>
                  <td>
                    <div className={styles.actionCell}>
                      <button
                        onClick={() => onEdit(item)}
                        title="Edit Holiday"
                        className={styles.editBtn}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => onDelete(item.id)}
                        title="Delete Holiday"
                        className={styles.deleteBtn}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer controls */}
      <div className={styles.tableFooter}>
        <div className={styles.footerLeft}>
          <div className={styles.limitControl}>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
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

export default CalenderTable;
