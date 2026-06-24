import React, { useState, useMemo } from 'react';
import { Edit, Trash2, Search } from 'lucide-react';
import { MonthYearPicker } from '../../../../shared/components';
import styles from './ResignationPage.module.css';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

const ResignationTable = ({
  data,
  selectedMonth,
  onMonthChange,
  searchTerm,
  onSearchChange,
  onEdit,
  onDelete
}) => {
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset pagination if search, month, or limit changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedMonth, pageSize]);

  // Pagination math
  const totalEntries = data.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);
  const paginatedData = useMemo(() => {
    return data.slice(startIndex, endIndex);
  }, [data, startIndex, endIndex]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className={styles.tableCard}>
      {/* Table Top Controls Bar */}
      <div className={styles.tableControls}>
        {/* Month Wise Search */}
        <div className={styles.monthFilterWrapper}>
          <span className={styles.monthFilterLabel}>Month Wise Search</span>
          <MonthYearPicker
            value={selectedMonth}
            onChange={onMonthChange}
            placeholder="Select Month"
          />
          {selectedMonth && (
            <button
              onClick={() => onMonthChange('')}
              className={styles.clearFilterBtn}
              title="Clear Month Filter"
            >
              Clear
            </button>
          )}
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
              <th>Account No.</th>
              <th>Date of Leaving</th>
              <th>Reason Of Leaving</th>
              <th style={{ textAlign: 'center', width: '90px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row) => (
                <tr key={row.id}>
                  {/* Account No */}
                  <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                    {row.accountNo}
                  </td>

                  {/* Date of Leaving */}
                  <td>{formatDate(row.dateOfLeaving)}</td>

                  {/* Reason of Leaving */}
                  <td style={{ fontSize: '0.82rem', fontWeight: '500', color: 'var(--text-secondary)' }}>
                    {row.reasonOfLeaving}
                  </td>

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
                <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  No matching resignation records found.
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
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={styles.pageBtn}
          >
            Previous
          </button>
          
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => handlePageChange(i + 1)}
              className={`${styles.pageBtn} ${currentPage === i + 1 ? styles.activePageBtn : ''}`}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={styles.pageBtn}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResignationTable;
