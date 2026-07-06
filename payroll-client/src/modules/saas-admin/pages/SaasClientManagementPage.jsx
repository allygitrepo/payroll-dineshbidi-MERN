import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Building2 } from 'lucide-react';
import styles from './SaasClientManagementPage.module.css';
import { getSaasClients } from '../services/saasService';
import SaasClientModal from './SaasClientModal';
import { Pagination } from '../../../shared/components';

const SaasClientManagementPage = () => {
  const [clients, setClients] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const data = await getSaasClients();
      setClients(data);
    } catch (err) {
      console.error("Failed to fetch clients", err);
    }
  };

  const handleCreate = () => {
    setEditingClient(null);
    setIsModalOpen(true);
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    // Delete API call here
    alert("Delete functionality pending");
  };

  const filteredClients = clients.filter(c => 
    c.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.user_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination calculation
  const totalEntries = filteredClients.length;
  const totalPages = Math.ceil(totalEntries / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalEntries);
  const currentClients = filteredClients.slice(startIndex, endIndex);

  return (
    <div className={styles.container}>
      <div className={styles.headerSection}>
        <h2 className={styles.title}>Client Management</h2>
        <div className={styles.headerActions}>
          <button className={styles.addBtn} onClick={handleCreate}>
            <Plus size={16} /> New Client
          </button>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableControls}>
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
            <Search size={16} className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search clients..." 
              className={styles.searchInput}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>CLIENT NAME</th>
                <th>LOGIN ID</th>
                <th>PRIMARY COMPANY</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {currentClients.map((client) => (
                <tr key={client.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{client.user_name}</div>
                  </td>
                  <td>{client.user_id}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Building2 size={14} color="#64748b" />
                      {client.company_name || 'Not Setup Yet'}
                    </div>
                  </td>
                  <td>
                    <span style={{ color: client.status ? 'var(--primary)' : 'var(--text-muted)' }}>
                      {client.status ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actionCell}>
                      <button className={styles.editBtn} onClick={() => handleEdit(client)}>
                        <Edit2 size={14} />
                      </button>
                      <button className={styles.deleteBtn} onClick={() => handleDelete(client.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No clients found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className={styles.mobileCardsContainer}>
          {currentClients.map((client, index) => (
            <div key={client.id} className={styles.mobileCard}>
              <div className={styles.mobileCardHeader}>
                <span className={styles.mobileCardIndex}>#{startIndex + index + 1}</span>
                <span style={{ 
                  color: client.status ? 'var(--primary)' : 'var(--text-muted)', 
                  fontWeight: '600',
                  fontSize: '0.85rem' 
                }}>
                  {client.status ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className={styles.mobileCardBody}>
                <div className={styles.mobileCardRow}>
                  <span className={styles.mobileCardLabel}>Client Name</span>
                  <span className={styles.mobileCardValue} style={{ fontWeight: 500 }}>{client.user_name}</span>
                </div>
                <div className={styles.mobileCardRow}>
                  <span className={styles.mobileCardLabel}>Login ID</span>
                  <span className={styles.mobileCardValue}>{client.user_id}</span>
                </div>
                <div className={styles.mobileCardRow}>
                  <span className={styles.mobileCardLabel}>Primary Company</span>
                  <span className={styles.mobileCardValue}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Building2 size={12} color="#64748b" />
                      {client.company_name || 'Not Setup Yet'}
                    </span>
                  </span>
                </div>
              </div>
              <div className={styles.mobileCardActions}>
                <button className={styles.editBtn} onClick={() => handleEdit(client)} title="Edit Client">
                  <Edit2 size={14} />
                </button>
                <button className={styles.deleteBtn} onClick={() => handleDelete(client.id)} title="Delete Client">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {filteredClients.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', backgroundColor: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              No clients found.
            </div>
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

      {isModalOpen && (
        <SaasClientModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          editingClient={editingClient}
          onSuccess={fetchClients}
        />
      )}
    </div>
  );
};

export default SaasClientManagementPage;
