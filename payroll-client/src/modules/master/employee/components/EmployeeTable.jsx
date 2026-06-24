import React, { useState, useMemo } from 'react';
import { Edit, Trash2, Search } from 'lucide-react';
import styles from './EmployeePage.module.css';

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

const EmployeeTable = ({ data, searchTerm, onSearchChange, selectedType, onTypeFilterChange, onEdit, onDelete, onToggleAbry }) => {
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset pagination if filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize, selectedType]);

  // Pagination calculations
  const totalEntries = data.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);
  const paginatedData = useMemo(() => {
    return data.slice(startIndex, endIndex);
  }, [data, startIndex, endIndex]);

  return (
    <div className={styles.tableCard}>
      {/* Search Controls */}
      <div className={styles.tableControls}>
        <div style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Total Employees: {totalEntries}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <select
            value={selectedType || ''}
            onChange={(e) => onTypeFilterChange && onTypeFilterChange(e.target.value)}
            className={styles.limitSelect}
            style={{
              height: '42px',
              padding: '0 14px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              outline: 'none',
              backgroundColor: 'var(--card-bg)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            <option value="">ALL EMPLOYEE TYPES</option>
            <option value="OFFICE STAFF">OFFICE STAFF</option>
            <option value="PACKING STAFF">PACKING STAFF</option>
            <option value="BIDI ROLLER">BIDI ROLLER</option>
          </select>

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
      </div>

      {/* Data Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: '140px', textAlign: 'center' }}>ABRY Applicable?</th>
              <th>UAN</th>
              <th>IP Number</th>
              <th>Member Id</th>
              <th>Member Name</th>
              <th>Date Of Birth</th>
              <th>DateOfJoining</th>
              <th>Gender</th>
              <th>Father/Husband Name</th>
              <th style={{ width: '130px', textAlign: 'center' }}>Face Status</th>
              <th style={{ width: '100px', textAlign: 'center' }}>Action (Edit/Delete)</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  No matching records found.
                </td>
              </tr>
            ) : (
              paginatedData.map((employee) => (
                <tr key={employee.id}>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={employee.abryApplicable || false}
                      onChange={() => onToggleAbry && onToggleAbry(employee.id)}
                      className={styles.checkbox}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
                  <td style={{ fontWeight: '500' }}>{employee.uan}</td>
                  <td>{employee.ipNumber}</td>
                  <td>{employee.memberId || '-'}</td>
                  <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                    {employee.memberName}
                  </td>
                  <td>{formatDate(employee.dob)}</td>
                  <td>{formatDate(employee.dateOfJoining)}</td>
                  <td>{employee.gender}</td>
                  <td>{employee.fatherHusbandName || '-'}</td>
                  <td style={{ textAlign: 'center' }}>
                    {employee.faceDescriptorPath ? (
                      <span style={{
                        backgroundColor: 'rgba(39, 214, 138, 0.1)',
                        color: 'var(--primary)',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        display: 'inline-block'
                      }}>
                        Enrolled
                      </span>
                    ) : (
                      <span style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        display: 'inline-block'
                      }}>
                        Not Enrolled
                      </span>
                    )}
                  </td>
                  <td>
                    <div className={styles.actionCell}>
                      <button
                        onClick={() => onEdit(employee)}
                        title="Edit Employee"
                        className={styles.editBtn}
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => onDelete(employee.id)}
                        title="Delete Employee"
                        className={styles.deleteBtn}
                      >
                        <Trash2 size={14} />
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
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
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
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
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

export default EmployeeTable;
