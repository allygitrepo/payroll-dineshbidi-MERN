import { Pagination } from '../../../../shared/components';
import React, { useState, useMemo } from 'react';
import { Edit, Trash2, Search, Key, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import styles from './ContractorPage.module.css';

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

const ContractorTable = ({
  data,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onEdit,
  onDelete,
  onCreateLogin
}) => {
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Reset pagination if filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize, statusFilter]);

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
      {/* Table Controls containing Status Filter on left, Search on right */}
      <div className={styles.tableControls}>
        <div style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Total Contractors: {totalEntries}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
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
            <option value="Active">ACTIVE</option>
            <option value="Inactive">INACTIVE</option>
            <option value="All">ALL STATUSES</option>
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
              <th style={{ width: '60px', textAlign: 'center' }}>Sr No.</th>
              <th onClick={() => handleSort('ccode')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>Ccode {renderSortIcon('ccode')}</div>
              </th>
              <th onClick={() => handleSort('name')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>Name {renderSortIcon('name')}</div>
              </th>
              <th onClick={() => handleSort('address')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>Address {renderSortIcon('address')}</div>
              </th>
              <th onClick={() => handleSort('postOffice')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>Postoffice {renderSortIcon('postOffice')}</div>
              </th>
              <th onClick={() => handleSort('district')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>District {renderSortIcon('district')}</div>
              </th>
              <th onClick={() => handleSort('pincode')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>Pincode {renderSortIcon('pincode')}</div>
              </th>
              <th onClick={() => handleSort('pfCode')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>Pf Code {renderSortIcon('pfCode')}</div>
              </th>
              <th onClick={() => handleSort('dateOfJoining')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>Date of Joining {renderSortIcon('dateOfJoining')}</div>
              </th>
              <th onClick={() => handleSort('pan')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>PAN {renderSortIcon('pan')}</div>
              </th>
              <th onClick={() => handleSort('aadhaar')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>Adhar {renderSortIcon('aadhaar')}</div>
              </th>
              <th onClick={() => handleSort('gstNo')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>GST No. {renderSortIcon('gstNo')}</div>
              </th>
              <th onClick={() => handleSort('bankAccount')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>Bank A/c {renderSortIcon('bankAccount')}</div>
              </th>
              <th onClick={() => handleSort('bankName')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>Bank Name {renderSortIcon('bankName')}</div>
              </th>
              <th onClick={() => handleSort('ifsc')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>IFSC {renderSortIcon('ifsc')}</div>
              </th>
              <th onClick={() => handleSort('status')} style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Status {renderSortIcon('status')}</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={17} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  No matching records found.
                </td>
              </tr>
            ) : (
              paginatedData.map((contractor, index) => (
                <tr 
                  key={contractor.id}
                  onClick={() => onEdit(contractor)}
                  style={{ cursor: 'pointer' }}
                >
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className={styles.actionCell}>
                      <button
                        onClick={() => onEdit(contractor)}
                        title="Edit Contractor"
                        className={styles.editBtn}
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => onCreateLogin(contractor)}
                        title="Create Login"
                        className={styles.editBtn}
                        style={{ color: '#0ea5e9', border: '1px solid #bae6fd', backgroundColor: '#f0f9ff' }}
                      >
                        <Key size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(contractor.id);
                        }}
                        title="Delete Contractor"
                        className={styles.deleteBtn}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: '500' }}>
                    {startIndex + index + 1}
                  </td>
                  <td>{contractor.ccode}</td>
                  <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                    {contractor.name}
                  </td>
                  <td>{contractor.address}</td>
                  <td>{contractor.postOffice}</td>
                  <td>{contractor.district}</td>
                  <td>{contractor.pincode}</td>
                  <td>{contractor.pfCode}</td>
                  <td>{formatDate(contractor.dateOfJoining)}</td>
                  <td>{contractor.pan || '-'}</td>
                  <td>{contractor.aadhaar || '-'}</td>
                  <td>{contractor.gstNo || '-'}</td>
                  <td>{contractor.bankAccount || '-'}</td>
                  <td>{contractor.bankName || '-'}</td>
                  <td>{contractor.ifsc || '-'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      backgroundColor: contractor.status === 'Active' ? '#dcfce7' : '#fee2e2',
                      color: contractor.status === 'Active' ? '#16a34a' : '#ef4444'
                    }}>
                      {contractor.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Controls */}
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

export default ContractorTable;
