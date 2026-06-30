import React, { useState, useMemo } from 'react';
import { Edit, Trash2, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
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
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Reset pagination if filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize, selectedType, selectedStatus]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

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

  const renderSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown size={14} style={{ opacity: 0.4, marginLeft: '4px' }} />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={14} style={{ marginLeft: '4px' }} /> : <ArrowDown size={14} style={{ marginLeft: '4px' }} />;
  };

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
            <option value="BIDI MAKER">BIDI MAKER</option>
            <option value="BIDI PACKER">BIDI PACKER</option>
            <option value="OFFICE STAFF">OFFICE STAFF</option>
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
              <th onClick={() => handleSort('abryApplicable')} style={{ width: '140px', textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>ABRY Applicable? {renderSortIcon('abryApplicable')}</div>
              </th>
              <th onClick={() => handleSort('uan')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>UAN {renderSortIcon('uan')}</div>
              </th>
              <th onClick={() => handleSort('ipNumber')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>IP Number {renderSortIcon('ipNumber')}</div>
              </th>
              <th onClick={() => handleSort('memberId')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>Member Id {renderSortIcon('memberId')}</div>
              </th>
              <th onClick={() => handleSort('memberName')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>Member Name {renderSortIcon('memberName')}</div>
              </th>
              <th onClick={() => handleSort('dob')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>Date Of Birth {renderSortIcon('dob')}</div>
              </th>
              <th onClick={() => handleSort('dateOfJoining')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>DateOfJoining {renderSortIcon('dateOfJoining')}</div>
              </th>
              <th onClick={() => handleSort('aadhaarCard')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>Aadhaar Card {renderSortIcon('aadhaarCard')}</div>
              </th>
              <th onClick={() => handleSort('gender')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>Gender {renderSortIcon('gender')}</div>
              </th>
              <th onClick={() => handleSort('fatherHusbandName')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>Father/Husband Name {renderSortIcon('fatherHusbandName')}</div>
              </th>
              <th onClick={() => handleSort('relation')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>Relation {renderSortIcon('relation')}</div>
              </th>
              <th onClick={() => handleSort('maritalStatus')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>Marital Status {renderSortIcon('maritalStatus')}</div>
              </th>
              <th onClick={() => handleSort('mobile')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>Mobile {renderSortIcon('mobile')}</div>
              </th>
              <th onClick={() => handleSort('qualification')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>Qualification {renderSortIcon('qualification')}</div>
              </th>
              <th onClick={() => handleSort('employeeType')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>Employee Type {renderSortIcon('employeeType')}</div>
              </th>
              <th onClick={() => handleSort('contractor')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>Contractor {renderSortIcon('contractor')}</div>
              </th>
              <th onClick={() => handleSort('address')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>Address {renderSortIcon('address')}</div>
              </th>
              <th onClick={() => handleSort('postOffice')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>Post Office {renderSortIcon('postOffice')}</div>
              </th>
              <th onClick={() => handleSort('district')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>District {renderSortIcon('district')}</div>
              </th>
              <th onClick={() => handleSort('pincode')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>Pincode {renderSortIcon('pincode')}</div>
              </th>
              <th onClick={() => handleSort('nationality')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>Nationality {renderSortIcon('nationality')}</div>
              </th>
              <th onClick={() => handleSort('email')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>Email {renderSortIcon('email')}</div>
              </th>
              <th onClick={() => handleSort('isInternationalWorker')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>Int. Worker {renderSortIcon('isInternationalWorker')}</div>
              </th>
              <th onClick={() => handleSort('physicalHandicap')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>Physical Handicap {renderSortIcon('physicalHandicap')}</div>
              </th>
              <th onClick={() => handleSort('pmrpy')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>PMRPY {renderSortIcon('pmrpy')}</div>
              </th>
              <th onClick={() => handleSort('status')} style={{ width: '100px', textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Status {renderSortIcon('status')}</div>
              </th>
              <th onClick={() => handleSort('faceDescriptorPath')} style={{ width: '130px', textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Face Status {renderSortIcon('faceDescriptorPath')}</div>
              </th>
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
