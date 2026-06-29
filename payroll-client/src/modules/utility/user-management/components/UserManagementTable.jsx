import React, { useState, useMemo } from 'react';
import { Edit, Trash2, Search } from 'lucide-react';
import styles from './UserManagementPage.module.css';

const UserManagementTable = ({ data, searchTerm, onSearchChange, onEdit, onDelete }) => {
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset pagination if filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  // Pagination math
  const totalEntries = data.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);
  const paginatedData = useMemo(() => {
    return data.slice(startIndex, endIndex);
  }, [data, startIndex, endIndex]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className={styles.tableCard}>
      {/* Table controls containing Total Records count on left, Search on right */}
      <div className={styles.tableControls}>
        <div style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Total Users: {totalEntries}
        </div>

        {/* Local Search box */}
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

      {/* Main Grid Table Container */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: '70px', textAlign: 'center' }}>Sr No.</th>
              <th>User Name</th>
              <th>User Id</th>
              <th>Password</th>
              <th>Designation</th>
              <th style={{ textAlign: 'center', width: '90px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, idx) => (
                <tr key={row.id}>
                  {/* Sr No */}
                  <td style={{ textAlign: 'center', fontWeight: '500' }}>
                    {startIndex + idx + 1}
                  </td>

                  {/* User Name */}
                  <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                    {row.userName}
                  </td>

                  {/* User ID */}
                  <td style={{ fontWeight: '500' }}>{row.userId}</td>

                  {/* Password */}
                  <td>{row.password}</td>

                  {/* Designation */}
                  <td style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--primary)' }}>
                    {row.designation}
                  </td>

                  {/* Actions Column */}
                  <td style={{ textAlign: 'center' }}>
                    <div className={styles.actionCell}>
                      <button
                        onClick={() => onEdit(row)}
                        className={styles.editBtn}
                        title="Edit User"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => onDelete(row.id)}
                        className={styles.deleteBtn}
                        title="Delete User"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  No matching user accounts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer Navigation */}
      <div className={styles.tableFooter}>
        <div className={styles.footerLeft}>
          <div className={styles.limitControl}>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className={styles.limitSelect}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
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

export default UserManagementTable;
