import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search, ShieldCheck } from 'lucide-react';
import styles from '../../../modules/utility/user-management/components/UserManagementPage.module.css';
import { getCoAdmins } from '../services/saasService';
import CoAdminModal from './CoAdminModal';

const SaasCoAdminsPage = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        <div className={styles.tableToolbar}>
          <div className={styles.searchBox}>
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
                filteredAdmins.map((admin) => (
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
                        <button className={`${styles.actionBtn} ${styles.deleteBtn}`} title="Delete Admin">
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
