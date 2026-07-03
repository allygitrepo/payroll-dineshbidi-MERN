import { Pagination } from '../../../../shared/components';
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
      {/* Table controls containing Total Records count on left, Search on right */}
      <div className={styles.tableControls}>
        <div style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Total Bidi Roller Wages: {totalEntries}
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
              <th style={{ width: '80px', textAlign: 'center' }}>Sr. No.</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Rate1</th>
              <th>HRA1</th>
              <th>Bonus1</th>
              <th>Rate2</th>
              <th>HRA2</th>
              <th>Bonus2</th>
              {(onEdit || onDelete) && <th style={{ width: '120px', textAlign: 'center' }}>Action</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={(onEdit || onDelete) ? 10 : 9} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
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
                  {(onEdit || onDelete) && (
                    <td>
                      <div className={styles.actionCell}>
                        {onEdit && (
                          <button 
                            onClick={() => onEdit(item)} 
                            title="Edit Record"
                            className={styles.editBtn}
                          >
                            <Edit size={16} />
                          </button>
                        )}
                        {onDelete && (
                          <button 
                            onClick={() => onDelete(item.id)} 
                            title="Delete Record"
                            className={styles.deleteBtn}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout for smaller screens */}
      <div className={styles.mobileCardsContainer}>
        {paginatedData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
            No matching records found.
          </div>
        ) : (
          paginatedData.map((item, index) => (
            <div key={item.id} className={styles.mobileCard} onClick={() => onEdit ? onEdit(item) : null}>
              <div className={styles.mobileCardHeader}>
                <span className={styles.mobileCardIndex}># {startIndex + index + 1}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: '500', color: 'var(--text-secondary)' }}>
                  {formatDate(item.startDate)} - {formatDate(item.endDate)}
                </span>
              </div>
              <div className={styles.mobileCardBody}>
                <div className={styles.mobileCardRow}>
                  <span className={styles.mobileCardLabel}>Rate 1:</span>
                  <span className={styles.mobileCardValue}>{item.rate1}</span>
                </div>
                <div className={styles.mobileCardRow}>
                  <span className={styles.mobileCardLabel}>HRA 1:</span>
                  <span className={styles.mobileCardValue}>{item.hra1}</span>
                </div>
                <div className={styles.mobileCardRow}>
                  <span className={styles.mobileCardLabel}>Bonus 1:</span>
                  <span className={styles.mobileCardValue}>{item.bonus1}</span>
                </div>
                <div className={styles.mobileCardRow}>
                  <span className={styles.mobileCardLabel}>Rate 2:</span>
                  <span className={styles.mobileCardValue}>{item.rate2}</span>
                </div>
                <div className={styles.mobileCardRow}>
                  <span className={styles.mobileCardLabel}>HRA 2:</span>
                  <span className={styles.mobileCardValue}>{item.hra2}</span>
                </div>
                <div className={styles.mobileCardRow}>
                  <span className={styles.mobileCardLabel}>Bonus 2:</span>
                  <span className={styles.mobileCardValue}>{item.bonus2}</span>
                </div>
              </div>
              {(onEdit || onDelete) && (
                <div className={styles.mobileCardActions} onClick={(e) => e.stopPropagation()}>
                  {onEdit && (
                    <button 
                      onClick={() => onEdit(item)} 
                      title="Edit Record"
                      className={styles.editBtn}
                    >
                      <Edit size={16} />
                    </button>
                  )}
                  {onDelete && (
                    <button 
                      onClick={() => onDelete(item.id)} 
                      title="Delete Record"
                      className={styles.deleteBtn}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
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

export default BidiRollerWagesTable;
