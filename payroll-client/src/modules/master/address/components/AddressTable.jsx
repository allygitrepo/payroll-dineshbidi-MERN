import { Pagination } from '../../../../shared/components';
import React, { useState, useMemo } from 'react';
import { Edit, Trash2, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import styles from './AddressPage.module.css';

const AddressTable = ({ data, searchTerm, onSearchChange, statusFilter, onStatusFilterChange, onEdit, onDelete }) => {
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Reset pagination if search filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

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
      {/* Table controls (Status Filter on left, Search on right) */}
      {/* Table controls containing Total Addresses on left, Search on right */}
      <div className={styles.tableControls}>
        <div style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Total Addresses: {totalEntries}
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

      {/* Data Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: '100px', textAlign: 'center' }}>Action</th>
              <th style={{ width: '60px', textAlign: 'center' }}>Sr. No.</th>
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
              <th onClick={() => handleSort('status')} style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Status {renderSortIcon('status')}</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  No matching records found.
                </td>
              </tr>
            ) : (
              paginatedData.map((addr, index) => (
                <tr
                  key={addr.id}
                  onClick={() => onEdit && onEdit(addr)}
                  style={{ cursor: onEdit ? 'pointer' : 'default' }}
                >
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className={styles.actionCell}>
                      {onEdit && (
                        <button
                          onClick={() => onEdit(addr)}
                          title="Edit Address"
                          className={styles.editBtn}
                        >
                          <Edit size={14} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(addr.id);
                          }}
                          title="Delete Address"
                          className={styles.deleteBtn}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: '500' }}>
                    {startIndex + index + 1}
                  </td>
                  <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                    {addr.address}
                  </td>
                  <td>{addr.postOffice}</td>
                  <td>{addr.district}</td>
                  <td>{addr.pincode}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      backgroundColor: addr.status === 'Active' ? '#dcfce7' : '#fee2e2',
                      color: addr.status === 'Active' ? '#16a34a' : '#ef4444'
                    }}>
                      {addr.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards View */}
      <div className={styles.mobileCardsContainer}>
        {paginatedData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            No matching records found.
          </div>
        ) : (
          paginatedData.map((addr, index) => (
            <div key={addr.id} className={styles.mobileCard} onClick={() => onEdit && onEdit(addr)}>
              <div className={styles.mobileCardHeader}>
                <span className={styles.mobileCardIndex}># {startIndex + index + 1}</span>
                <span style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  backgroundColor: addr.status === 'Active' ? '#dcfce7' : '#fee2e2',
                  color: addr.status === 'Active' ? '#16a34a' : '#ef4444'
                }}>
                  {addr.status}
                </span>
              </div>
              <div className={styles.mobileCardBody}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {addr.address}
                </h4>
                <div className={styles.mobileCardRow}>
                  <span className={styles.mobileCardLabel}>Post Office:</span>
                  <span className={styles.mobileCardValue}>{addr.postOffice || '-'}</span>
                </div>
                <div className={styles.mobileCardRow}>
                  <span className={styles.mobileCardLabel}>District:</span>
                  <span className={styles.mobileCardValue}>{addr.district || '-'}</span>
                </div>
                <div className={styles.mobileCardRow}>
                  <span className={styles.mobileCardLabel}>Pincode:</span>
                  <span className={styles.mobileCardValue}>{addr.pincode || '-'}</span>
                </div>
              </div>
              <div className={styles.mobileCardActions} onClick={(e) => e.stopPropagation()}>
                {onEdit && (
                  <button
                    onClick={() => onEdit(addr)}
                    title="Edit Address"
                    className={styles.editBtn}
                  >
                    <Edit size={14} />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(addr.id)}
                    title="Delete Address"
                    className={styles.deleteBtn}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer controls: bottom-left limit controls and page links */}
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

export default AddressTable;
