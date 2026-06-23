import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Download, FileSpreadsheet, Copy, FileText, File, Printer } from 'lucide-react';
import styles from '../components/UserManagementPage.module.css';
import UserManagementForm from '../components/UserManagementForm';
import UserManagementTable from '../components/UserManagementTable';
import {
  getUsers,
  saveUser,
  deleteUser
} from '../services/userManagementService';
import { useToast, ConfirmModal } from '../../../../shared/components';

const UserManagementPage = () => {
  const addToast = useToast();

  const [users, setUsers] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Search & dropdown states
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Delete modal states
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // Load initial data
  useEffect(() => {
    setUsers(getUsers());
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleAddNew = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = (id) => {
    setDeleteTargetId(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteTargetId) {
      const updated = deleteUser(deleteTargetId);
      setUsers(updated);
      addToast({ type: 'success', message: 'User account deleted successfully!' });
    }
    setIsConfirmOpen(false);
    setDeleteTargetId(null);
  };

  const handleCancelDelete = () => {
    setIsConfirmOpen(false);
    setDeleteTargetId(null);
  };

  const handleSave = (userData) => {
    const updated = saveUser(userData);
    setUsers(updated);
    setIsFormOpen(false);
    setEditingUser(null);
    addToast({
      type: 'success',
      message: userData.id ? 'User account updated successfully!' : 'User account created successfully!'
    });
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingUser(null);
  };

  // Filtered users data based on search term
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const search = searchTerm.toLowerCase();
      return (
        (u.userName && u.userName.toLowerCase().includes(search)) ||
        (u.userId && u.userId.toLowerCase().includes(search)) ||
        (u.designation && u.designation.toLowerCase().includes(search))
      );
    });
  }, [users, searchTerm]);

  const handleExport = (type) => {
    if (type === 'Copy') {
      const header = 'User Name\tUser ID\tPassword\tDesignation';
      const body = filteredUsers.map(u =>
        `${u.userName}\t${u.userId}\t${u.password}\t${u.designation}`
      ).join('\n');
      navigator.clipboard.writeText(`${header}\n${body}`);
      addToast({ type: 'success', message: 'Copied filtered user accounts to clipboard!' });
    } else {
      addToast({ type: 'info', message: `${type} export started for ${filteredUsers.length} records!` });
    }
    setIsDropdownOpen(false);
  };

  return (
    <div className={styles.container}>
      {/* Header section with page heading and action buttons */}
      <div className={styles.headerSection}>
        <h1 className={styles.title}>User Management</h1>
        <div className={styles.headerActions}>
          {!isFormOpen && (
            <button onClick={handleAddNew} className={styles.addBtn}>
              <Plus size={18} /> User Management
            </button>
          )}
          <div className={styles.dropdownContainer} ref={dropdownRef}>
            <button 
              className={styles.downloadBtn} 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <Download size={18} /> Download
            </button>
            {isDropdownOpen && (
              <div className={styles.dropdownMenu}>
                <button onClick={() => handleExport('Excel')}>
                  <FileSpreadsheet size={16} /> Excel
                </button>
                <button onClick={() => handleExport('Copy')}>
                  <Copy size={16} /> Copy
                </button>
                <button onClick={() => handleExport('CSV')}>
                  <FileText size={16} /> CSV
                </button>
                <button onClick={() => handleExport('PDF')}>
                  <File size={16} /> PDF
                </button>
                <button onClick={() => handleExport('Print')}>
                  <Printer size={16} /> Print
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Render form card if editing or adding */}
      {isFormOpen && (
        <UserManagementForm
          user={editingUser}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {/* Render table showing user accounts list */}
      <UserManagementTable
        data={filteredUsers}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete User Account"
        message="Are you sure you want to delete this user account? This action cannot be undone."
      />
    </div>
  );
};

export default UserManagementPage;
