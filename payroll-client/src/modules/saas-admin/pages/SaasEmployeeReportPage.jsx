import React, { useState, useEffect } from 'react';
import { Users, User, Loader2, ChevronDown, Search } from 'lucide-react';
import { getEmployeeReports } from '../services/saasService';
import { Pagination } from '../../../shared/components';
import styles from './SaasEmployeeReportPage.module.css';

const SaasEmployeeReportPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedUsers, setExpandedUsers] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await getEmployeeReports();
      setReports(data || []);
      
      // Auto-expand the first user if data exists
      if (data && data.length > 0) {
        setExpandedUsers({ [data[0].userId]: true });
      }
      
      setError('');
    } catch (err) {
      console.error('Failed to fetch employee reports:', err);
      setError('Failed to load employee reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (userId) => {
    setExpandedUsers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const filteredReports = reports.filter(user => 
    user.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.companies.some(company => company.companyName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Pagination calculation
  const totalEntries = filteredReports.length;
  const totalPages = Math.ceil(totalEntries / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalEntries);
  const currentReports = filteredReports.slice(startIndex, endIndex);

  return (
    <div className={styles.container}>
      <div className={styles.headerSection}>
        <h2 className={styles.title}>Employee Statistics</h2>
      </div>

      <div className={styles.toolbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Show</span>
          <select 
            className={styles.limitSelect}
            value={itemsPerPage}
            onChange={e => setItemsPerPage(Number(e.target.value))}
            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>entries</span>
        </div>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search users or companies..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingState}>
          <Loader2 className="animate-spin" size={32} style={{ marginBottom: '16px' }} />
          <p>Loading employee data...</p>
        </div>
      ) : error ? (
        <div className={styles.emptyState}>
          <p style={{ color: 'var(--danger)' }}>{error}</p>
          <button 
            onClick={fetchReports}
            style={{ marginTop: '12px', padding: '8px 16px', borderRadius: '6px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className={styles.emptyState}>
          <Users size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
          <p>No user or company data found matching your search.</p>
        </div>
      ) : (
        <div className={styles.userList}>
          {currentReports.map((user) => {
            const isExpanded = !!expandedUsers[user.userId];
            
            return (
              <div key={user.userId} className={`${styles.userSection} ${isExpanded ? styles.expanded : ''}`}>
                <div 
                  className={styles.userHeader} 
                  onClick={() => toggleUser(user.userId)}
                >
                  <div className={styles.userHeaderLeft}>
                    <User size={20} className={styles.primaryIcon} />
                    <span className={styles.userName}>{user.userName}</span>
                  </div>
                  <div className={styles.userStats}>
                    <span className={styles.statBadge}>{user.totalCompanies} Companies</span>
                    <span className={styles.statBadge}>{user.totalEmployees} Employees</span>
                    <ChevronDown size={20} className={styles.expandIcon} />
                  </div>
                </div>

                {isExpanded && (
                  <div className={styles.companyContent}>
                    {user.companies.map(company => (
                      <div key={company.companyId} className={styles.companyCard}>
                        <div className={styles.companyHeader}>
                          <span className={styles.companyName}>{company.companyName}</span>
                          <div className={styles.companyOverallStats}>
                            <span className={styles.totalBadge}>Total: {company.employeesTotal}</span>
                            <span className={styles.activeBadge}>Active: {company.employeesActive}</span>
                            <span className={styles.inactiveBadge}>Inactive: {company.employeesInactive}</span>
                          </div>
                        </div>

                        {company.employeesTotal > 0 ? (
                          <div className={styles.typeGrid}>
                            {Object.entries(company.typeBreakdown).map(([typeName, stats]) => (
                              <div key={typeName} className={styles.typeCard}>
                                <div className={styles.typeTitle}>{typeName}</div>
                                <div className={styles.typeStats}>
                                  <span className={styles.typeLabel}>Total:</span>
                                  <span className={styles.typeValue}>{stats.total}</span>
                                </div>
                                <div className={styles.typeStats}>
                                  <span className={styles.typeLabel}>Active:</span>
                                  <span className={`${styles.typeValue} ${styles.active}`}>{stats.active}</span>
                                </div>
                                <div className={styles.typeStats}>
                                  <span className={styles.typeLabel}>Inactive:</span>
                                  <span className={`${styles.typeValue} ${styles.inactive}`}>{stats.inactive}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>
                            No employees assigned to this company.
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && !error && filteredReports.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', marginTop: '16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Showing {totalEntries > 0 ? startIndex + 1 : 0} to {endIndex} of {totalEntries} entries
          </div>
          <div className={styles.pagination}>
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SaasEmployeeReportPage;
