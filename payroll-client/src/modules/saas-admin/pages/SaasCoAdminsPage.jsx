import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search, ShieldCheck } from 'lucide-react';
import styles from '../../../modules/utility/user-management/components/UserManagementPage.module.css';
import { getCoAdmins } from '../services/saasService';
import CoAdminModal from './CoAdminModal';
import { Pagination } from '../../../shared/components';

const SaasCoAdminsPage = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, itemsPerPage]);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const data = await getCoAdmins();
      setAdmins(data || []);
    } catch (err) {
      console.error("Failed to fetch Co-Admins", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const filteredAdmins = admins.filter(admin => 
    (admin.user_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (admin.user_id?.toLowerCase() || '').includes(search.toLowerCase())
  );

  // Pagination calculation
  const totalEntries = filteredAdmins.length;
  const totalPages = Math.ceil(totalEntries / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalEntries);
  const currentAdmins = filteredAdmins.slice(startIndex, endIndex);

  return (
    <div className={styles.container}>
      <div className={styles.headerSection}>
        <h2 className={styles.title}>System Co-Admins</h2>
        <div className={styles.headerActions}>
          <button className={styles.addBtn} onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> New Co-Admin
          </button>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div className={styles.limitControl}>
            <span>Show</span>
            <select 
              className={styles.limitSelect}
              value={itemsPerPage}
              onChange={e => setItemsPerPage(Number(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>entries</span>
          </div>
          <div className={styles.searchWrapper}>
            <Search size={18} className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search Admins..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Admin Name</th>
                <th>Login ID</th>
                <th>Access Level</th>
                <th>Status</th>
                <th>Joined Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{textAlign: 'center', padding: '2rem'}}>Loading...</td></tr>
              ) : filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{textAlign: 'center', padding: '3rem', color: '#64748b'}}>
                    <ShieldCheck size={48} style={{opacity: 0.2, marginBottom: '1rem', display: 'block', margin: '0 auto'}} />
                    <p>No Co-Admins found.</p>
                  </td>
                </tr>
              ) : (
                currentAdmins.map((admin) => (
                  <tr key={admin.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                          {admin.user_name ? admin.user_name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <span style={{ fontWeight: '500', color: '#0f172a' }}>{admin.user_name}</span>
                      </div>
                    </td>
                    <td>{admin.user_id}</td>
                    <td><span style={{ background: '#fef3c7', color: '#d97706', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>FULL ACCESS</span></td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500',
                        background: admin.status ? '#dcfce7' : '#fee2e2',
                        color: admin.status ? '#16a34a' : '#ef4444'
                      }}>
                        {admin.status ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{new Date(admin.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button className={`${styles.actionBtn} ${styles.deleteBtn}`} title="Delete Admin" onClick={() => alert("Delete functionality pending")}>
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

        {/* Mobile Card View */}
        <div className={styles.mobileCardsContainer}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Loading...</div>
          ) : filteredAdmins.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', backgroundColor: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              No Co-Admins found.
            </div>
          ) : (
            currentAdmins.map((admin, index) => (
              <div key={admin.id} className={styles.mobileCard}>
                <div className={styles.mobileCardHeader}>
                  <span className={styles.mobileCardIndex}>#{startIndex + index + 1}</span>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '500',
                    background: admin.status ? '#dcfce7' : '#fee2e2',
                    color: admin.status ? '#16a34a' : '#ef4444'
                  }}>
                    {admin.status ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className={styles.mobileCardBody}>
                  <div className={styles.mobileCardRow}>
                    <span className={styles.mobileCardLabel}>Admin Name</span>
                    <span className={styles.mobileCardValue} style={{ fontWeight: '500', color: '#0f172a' }}>{admin.user_name}</span>
                  </div>
                  <div className={styles.mobileCardRow}>
                    <span className={styles.mobileCardLabel}>Login ID</span>
                    <span className={styles.mobileCardValue}>{admin.user_id}</span>
                  </div>
                  <div className={styles.mobileCardRow}>
                    <span className={styles.mobileCardLabel}>Access Level</span>
                    <span className={styles.mobileCardValue}>
                      <span style={{ background: '#fef3c7', color: '#d97706', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>FULL ACCESS</span>
                    </span>
                  </div>
                  <div className={styles.mobileCardRow}>
                    <span className={styles.mobileCardLabel}>Joined Date</span>
                    <span className={styles.mobileCardValue}>{new Date(admin.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className={styles.mobileCardActions}>
                  <button className={`${styles.actionBtn} ${styles.deleteBtn}`} title="Delete Admin" onClick={() => alert("Delete functionality pending")}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
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
      </div>

      <CoAdminModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchAdmins} 
      />
    </div>
  );
};

export default SaasCoAdminsPage;
