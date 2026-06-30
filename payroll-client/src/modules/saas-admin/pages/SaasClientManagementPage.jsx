import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Building2 } from 'lucide-react';
import styles from './SaasClientManagementPage.module.css';
import { getSaasClients } from '../services/saasService';
import SaasClientModal from './SaasClientModal';

const SaasClientManagementPage = () => {
  const [clients, setClients] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

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
          <div className={styles.limitControl}>Total Clients: {clients.length}</div>
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
              {filteredClients.map((client) => (
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
