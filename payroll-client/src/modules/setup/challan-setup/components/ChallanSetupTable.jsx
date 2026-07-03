import { Pagination } from '../../../../shared/components';
import React, { useState, useMemo } from 'react';
import { Edit, Trash2, Search } from 'lucide-react';
import styles from './ChallanSetupPage.module.css';

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

const ChallanSetupTable = ({ data, searchTerm, onSearchChange, onEdit, onDelete }) => {
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
      {/* Table controls containing Total Records count on left, Search on right */}
      <div className={styles.tableControls}>
        <div style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Total Challan Setup: {totalEntries}
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
              <th>Start Date</th>
              <th>End Date</th>
              <th>Salary Limit</th>
              <th>EDLI Wages</th>
              <th>A/c No.1 EE (Male)</th>
              <th>A/c No.1 EE (Female)</th>
              <th>A/c No.1 ER</th>
              <th>A/c No.2</th>
              <th>A/c No.10</th>
              <th>A/c No.21</th>
              <th>A/c No.22</th>
              <th>A/c No.2 Min</th>
              <th>A/c No.22 Min</th>
              <th>PMRPY</th>
              <th>ESIC Wages</th>
              <th>Employee Share (%)</th>
              <th>Employer Share</th>
              {(onEdit || onDelete) && <th style={{ width: '120px', textAlign: 'center' }}>Action</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={(onEdit || onDelete) ? 19 : 18} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
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
                  <td>{item.salaryLimit}</td>
                  <td>{item.edliWages}</td>
                  <td>{item.accNo1EEMale}</td>
                  <td>{item.accNo1EEFemale}</td>
                  <td>{item.accNo1ER}</td>
                  <td>{item.accNo2}</td>
                  <td>{item.accNo10}</td>
                  <td>{item.accNo21}</td>
                  <td>{item.accNo22}</td>
                  <td>{item.accNo2Min}</td>
                  <td>{item.accNo22Min}</td>
                  <td>{item.pmrpy}</td>
                  <td>{item.esicWages}</td>
                  <td>{item.employeeShare}</td>
                  <td>{item.employerShare}</td>
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
                  <span className={styles.mobileCardLabel}>Salary Limit:</span>
                  <span className={styles.mobileCardValue}>{item.salaryLimit}</span>
                </div>
                <div className={styles.mobileCardRow}>
                  <span className={styles.mobileCardLabel}>EDLI Wages:</span>
                  <span className={styles.mobileCardValue}>{item.edliWages}</span>
                </div>
                <div className={styles.mobileCardRow}>
                  <span className={styles.mobileCardLabel}>A/c 1 EE Male:</span>
                  <span className={styles.mobileCardValue}>{item.accNo1EEMale}</span>
                </div>
                <div className={styles.mobileCardRow}>
                  <span className={styles.mobileCardLabel}>A/c 1 EE Female:</span>
                  <span className={styles.mobileCardValue}>{item.accNo1EEFemale}</span>
                </div>
                <div className={styles.mobileCardRow}>
                  <span className={styles.mobileCardLabel}>A/c 1 ER:</span>
                  <span className={styles.mobileCardValue}>{item.accNo1ER}</span>
                </div>
                <div className={styles.mobileCardRow}>
                  <span className={styles.mobileCardLabel}>A/c 2:</span>
                  <span className={styles.mobileCardValue}>{item.accNo2}</span>
                </div>
                <div className={styles.mobileCardRow}>
                  <span className={styles.mobileCardLabel}>A/c 10:</span>
                  <span className={styles.mobileCardValue}>{item.accNo10}</span>
                </div>
                <div className={styles.mobileCardRow}>
                  <span className={styles.mobileCardLabel}>A/c 21:</span>
                  <span className={styles.mobileCardValue}>{item.accNo21}</span>
                </div>
                <div className={styles.mobileCardRow}>
                  <span className={styles.mobileCardLabel}>A/c 22:</span>
                  <span className={styles.mobileCardValue}>{item.accNo22}</span>
                </div>
                <div className={styles.mobileCardRow}>
                  <span className={styles.mobileCardLabel}>A/c 2 Min:</span>
                  <span className={styles.mobileCardValue}>{item.accNo2Min}</span>
                </div>
                <div className={styles.mobileCardRow}>
                  <span className={styles.mobileCardLabel}>A/c 22 Min:</span>
                  <span className={styles.mobileCardValue}>{item.accNo22Min}</span>
                </div>
                <div className={styles.mobileCardRow}>
                  <span className={styles.mobileCardLabel}>PMRPY:</span>
                  <span className={styles.mobileCardValue}>{item.pmrpy}</span>
                </div>
                <div className={styles.mobileCardRow}>
                  <span className={styles.mobileCardLabel}>ESIC Wages:</span>
                  <span className={styles.mobileCardValue}>{item.esicWages}</span>
                </div>
                <div className={styles.mobileCardRow}>
                  <span className={styles.mobileCardLabel}>Employee Share (%):</span>
                  <span className={styles.mobileCardValue}>{item.employeeShare}</span>
                </div>
                <div className={styles.mobileCardRow}>
                  <span className={styles.mobileCardLabel}>Employer Share:</span>
                  <span className={styles.mobileCardValue}>{item.employerShare}</span>
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

export default ChallanSetupTable;
