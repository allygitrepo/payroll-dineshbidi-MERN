import React, { useState, useMemo } from 'react';
import { Edit, Trash2, Search } from 'lucide-react';
import styles from './BidiRollerWagesPage.module.css';

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

const BidiRollerWagesTable = ({ data, searchTerm, onSearchChange, onEdit, onDelete }) => {
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset pagination on search or limit change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  const totalEntries = data.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);
  const paginatedData = useMemo(() => {
    return data.slice(startIndex, endIndex);
  }, [data, startIndex, endIndex]);

  return (
    <div className={styles.tableCard}>
      {/* Search Controls right-aligned */}
      <div className={styles.tableControls} style={{ justifyContent: 'flex-end' }}>
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
              <th style={{ width: '80px', textAlign: 'center' }}>Sr. No.</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Rate1</th>
              <th>HRA1</th>
              <th>Bonus1</th>
              <th>Rate2</th>
              <th>HRA2</th>
              <th>Bonus2</th>
              <th style={{ width: '120px', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  No matching records found.
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => (
                <tr key={item.id}>
                  <td style={{ textAlign: 'center', fontWeight: '500' }}>
                    {startIndex + index + 1}
                  </td>
                  <td>{formatDate(item.startDate)}</td>
                  <td>{formatDate(item.endDate)}</td>
                  <td>{item.rate1}</td>
                  <td>{item.hra1}</td>
                  <td>{item.bonus1}</td>
                  <td>{item.rate2}</td>
                  <td>{item.hra2}</td>
                  <td>{item.bonus2}</td>
                  <td>
                    <div className={styles.actionCell}>
                      <button 
                        onClick={() => onEdit(item)} 
                        title="Edit Record"
                        className={styles.editBtn}
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => onDelete(item.id)} 
                        title="Delete Record"
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

      {/* Footer controls: bottom-left limit controls and right page buttons */}
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
  );
};

export default BidiRollerWagesTable;
