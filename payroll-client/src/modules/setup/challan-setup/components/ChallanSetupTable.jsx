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
              <th style={{ width: '120px', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={19} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
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

export default ChallanSetupTable;
