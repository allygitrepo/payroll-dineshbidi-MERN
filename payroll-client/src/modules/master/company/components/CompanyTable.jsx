import { Pagination } from '../../../../shared/components';
import React, { useState, useMemo } from 'react';
import { Edit, Trash2, Search, ArrowUpDown, ArrowUp, ArrowDown, Star } from 'lucide-react';
import styles from './CompanyPage.module.css';
import { useToast } from '../../../../shared/components';

const CompanyTable = ({ data, searchTerm, onSearchChange, selectedStatus, onStatusFilterChange, onEdit, onDelete, onSetDefault }) => {
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Reset pagination if filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize, selectedStatus]);

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
        
        // Ensure values are strings for safe string methods, or handle booleans
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
          Total Companies: {totalEntries}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
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
              <th style={{ width: '100px', textAlign: 'center' }}>Actions</th>
              <th style={{ width: '60px', textAlign: 'center' }}>Sr. No.</th>
              <th onClick={() => handleSort('estbId')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>Estb ID {renderSortIcon('estbId')}</div>
              </th>
              <th onClick={() => handleSort('estbName')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>Establishment Name {renderSortIcon('estbName')}</div>
              </th>
              <th onClick={() => handleSort('estbType')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>Establishment Type {renderSortIcon('estbType')}</div>
              </th>
              <th onClick={() => handleSort('epfoOffice')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>Under EPFO Office {renderSortIcon('epfoOffice')}</div>
              </th>
              <th onClick={() => handleSort('linNo')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>LIN No. {renderSortIcon('linNo')}</div>
              </th>
              <th onClick={() => handleSort('esicId')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>ESIC ID {renderSortIcon('esicId')}</div>
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
              <th onClick={() => handleSort('pan')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>PAN {renderSortIcon('pan')}</div>
              </th>
              <th onClick={() => handleSort('cstatus')} style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Status {renderSortIcon('cstatus')}</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={13} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  No matching records found.
                </td>
              </tr>
            ) : (
              paginatedData.map((company, index) => (
                <tr 
                  key={company.id}
                  onClick={() => onEdit && onEdit(company)}
                  style={{ cursor: onEdit ? 'pointer' : 'default' }}
                >
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className={styles.actionCell}>
                      {onEdit && (
                        <button 
                          onClick={() => onEdit(company)} 
                          title="Edit Company"
                          className={styles.editBtn}
                        >
                          <Edit size={16} />
                        </button>
                      )}
                      {onDelete && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(company.id);
                          }} 
                          title="Delete Company"
                          className={styles.deleteBtn}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                      {onSetDefault && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSetDefault(company.id);
                          }}
                          title="Set as Default Company"
                          className={styles.editBtn}
                          style={{ color: company.id === localStorage.getItem('selectedCompany') ? '#f59e0b' : 'var(--text-secondary)' }}
                        >
                          <Star size={16} fill={company.id === localStorage.getItem('selectedCompany') ? '#f59e0b' : 'none'} />
                        </button>
                      )}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: '500' }}>
                    {startIndex + index + 1}
                  </td>
                  <td>{company.estbId}</td>
                  <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                    {company.estbName}
                  </td>
                  <td>{company.estbType}</td>
                  <td>{company.epfoOffice}</td>
                  <td>{company.linNo}</td>
                  <td>{company.esicId || '-'}</td>
                  <td>{company.address}</td>
                  <td>{company.postOffice}</td>
                  <td>{company.district}</td>
                  <td>{company.pincode}</td>
                  <td>{company.pan}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      backgroundColor: company.cstatus ? '#dcfce7' : '#fee2e2',
                      color: company.cstatus ? '#16a34a' : '#ef4444'
                    }}>
                      {company.cstatus ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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

export default CompanyTable;
