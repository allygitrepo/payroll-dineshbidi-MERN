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

const EmployeeTable = ({ data, searchTerm, onSearchChange, selectedType, onTypeFilterChange, selectedStatus, onStatusFilterChange, onEdit, onDelete, onToggleAbry }) => {
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset pagination if filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize, selectedType, selectedStatus]);

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

          <select
            value={selectedStatus || ''}
            onChange={(e) => onStatusFilterChange && onStatusFilterChange(e.target.value)}
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
            <option value="">ALL STATUS</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
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
              <th style={{ width: '100px', textAlign: 'center' }}>Action</th>
              <th style={{ width: '140px', textAlign: 'center' }}>ABRY Applicable?</th>
              <th>UAN</th>
              <th>IP Number</th>
              <th>Member Id</th>
              <th>Member Name</th>
              <th>Date Of Birth</th>
              <th>DateOfJoining</th>
              <th>Aadhaar Card</th>
              <th>Gender</th>
              <th>Father/Husband Name</th>
              <th>Relation</th>
              <th>Marital Status</th>
              <th>Mobile</th>
              <th>Qualification</th>
              <th>Employee Type</th>
              <th>Contractor</th>
              <th>Address</th>
              <th>Post Office</th>
              <th>District</th>
              <th>Pincode</th>
              <th>Nationality</th>
              <th>Email</th>
              <th>Int. Worker</th>
              <th>Physical Handicap</th>
              <th>PMRPY</th>
              <th style={{ width: '100px', textAlign: 'center' }}>Status</th>
              <th style={{ width: '130px', textAlign: 'center' }}>Face Status</th>
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
                <tr 
                  key={employee.id} 
                  onClick={() => onEdit(employee)}
                  style={{ cursor: 'pointer' }}
                >
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className={styles.actionCell}>
                      <button
                        onClick={() => onEdit(employee)}
                        title="Edit Employee"
                        className={styles.editBtn}
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(employee.id);
                        }}
                        title="Delete Employee"
                        className={styles.deleteBtn}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={employee.abryApplicable || false}
                      onChange={(e) => {
                        e.stopPropagation();
                        onToggleAbry && onToggleAbry(employee.id);
                      }}
                      className={styles.checkbox}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
                  <td style={{ fontWeight: '500' }}>{employee.uan || '-'}</td>
                  <td>{employee.ipNumber || '-'}</td>
                  <td>{employee.memberId || '-'}</td>
                  <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                    {employee.memberName}
                  </td>
                  <td>{formatDate(employee.dob)}</td>
                  <td>{formatDate(employee.dateOfJoining)}</td>
                  <td>{employee.aadhaarCard || '-'}</td>
                  <td>{employee.gender || '-'}</td>
                  <td>{employee.fatherHusbandName || '-'}</td>
                  <td>{employee.relation || '-'}</td>
                  <td>{employee.maritalStatus || '-'}</td>
                  <td>{employee.mobile || '-'}</td>
                  <td>{employee.qualification || '-'}</td>
                  <td>{employee.employeeType || '-'}</td>
                  <td>{employee.contractor || '-'}</td>
                  <td>{employee.address || '-'}</td>
                  <td>{employee.postOffice || '-'}</td>
                  <td>{employee.district || '-'}</td>
                  <td>{employee.pincode || '-'}</td>
                  <td>{employee.nationality || '-'}</td>
                  <td>{employee.email || '-'}</td>
                  <td>{employee.isInternationalWorker || '-'}</td>
                  <td>{employee.physicalHandicap || '-'}</td>
                  <td>{employee.pmrpy || '-'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{
                      backgroundColor: employee.status ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: employee.status ? '#10B981' : '#EF4444',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      display: 'inline-block'
                    }}>
                      {employee.status ? 'Active' : 'Inactive'}
                    </span>
                  </td>
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

          {(() => {
            const pages = [];
            if (totalPages <= 7) {
              for (let i = 1; i <= totalPages; i++) pages.push(i);
            } else {
              if (currentPage <= 4) {
                for (let i = 1; i <= 5; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
              } else if (currentPage >= totalPages - 3) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
              } else {
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
              }
            }
            return pages.map((p, i) => (
              <button
                key={i}
                onClick={() => p !== '...' && setCurrentPage(p)}
                disabled={p === '...'}
                className={`${styles.pageBtn} ${currentPage === p ? styles.activePageBtn : ''} ${p === '...' ? styles.dotsBtn : ''}`}
                style={p === '...' ? { border: 'none', background: 'transparent', cursor: 'default' } : {}}
              >
                {p}
              </button>
            ));
          })()}

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
