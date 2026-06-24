import React, { useState, useMemo } from 'react';
import { Edit, Trash2, Search } from 'lucide-react';
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

  // Reset pagination if filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  // Pagination calculations
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
      <div className={styles.tableControls} style={{ justifyContent: 'flex-end' }}>
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
              <th>TRRN</th>
              <th>CRN No</th>
              <th>Wage Month</th>
              <th>Due Date</th>
              <th>Challan Date</th>
              <th style={{ textAlign: 'right' }}>A/C 1 (EE)</th>
              <th style={{ textAlign: 'right' }}>A/C 1 (ER)</th>
              <th style={{ textAlign: 'right' }}>A/C 2</th>
              <th style={{ textAlign: 'right' }}>A/C 10</th>
              <th style={{ textAlign: 'right' }}>A/C 21</th>
              <th style={{ textAlign: 'right' }}>A/C 22</th>
              <th style={{ textAlign: 'right' }}>Total Amount</th>
              <th>Return Date</th>
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

export default EpfChallanDateTable;
