import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Download, FileSpreadsheet, Copy, FileText, File, Printer } from 'lucide-react';
import styles from '../components/UserManagementPage.module.css';
import UserManagementForm from '../components/UserManagementForm';
import UserManagementTable from '../components/UserManagementTable';
import {
  getUsers,
  saveUser,
  deleteUser,
  getRoles,
  saveRole
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

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedUsers, fetchedRoles] = await Promise.all([
        getUsers(),
        getRoles()
      ]);
      // Map backend fields to frontend fields for backwards compatibility
      const mappedUsers = fetchedUsers.map(u => {
        let rawPerms = u.role ? u.role.permissions : {};
        if (typeof rawPerms === 'string') {
          try {
            rawPerms = JSON.parse(rawPerms);
          } catch (e) {
            rawPerms = {};
          }
        }
        return {
          ...u,
          id: u.id,
          userName: u.user_name,
          userId: u.user_id,
          designation: u.role ? u.role.name : 'Unknown',
          role_id: u.role_id,
          permissions: rawPerms
        };
      });
      setUsers(mappedUsers);

      const mappedRoles = fetchedRoles.map(r => {
        let rawPerms = r.permissions || {};
        if (typeof rawPerms === 'string') {
          try {
            rawPerms = JSON.parse(rawPerms);
          } catch (e) {
            rawPerms = {};
          }
        }
        return {
          ...r,
          permissions: rawPerms
        };
      });
      setRoles(mappedRoles);

    } catch (err) {
      console.error(err);
      addToast({ type: 'error', message: 'Failed to load user management data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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

  const handleConfirmDelete = async () => {
    if (deleteTargetId) {
      try {
        await deleteUser(deleteTargetId);
        await loadData();
        addToast({ type: 'success', message: 'User account deleted successfully!' });
      } catch (err) {
        addToast({ type: 'error', message: 'Failed to delete user.' });
      }
    }
    setIsConfirmOpen(false);
    setDeleteTargetId(null);
  };

  const handleCancelDelete = () => {
    setIsConfirmOpen(false);
    setDeleteTargetId(null);
  };

  const handleSave = async (userData) => {
    try {
      // Create or update Role first
      const rolePayload = {
        id: userData.role_id,
        name: userData.designation,
        permissions: userData.permissions
      };
      const updatedRole = await saveRole(rolePayload);

      const payload = {
        id: userData.id,
        user_name: userData.userName,
        user_id: userData.userId,
        password: userData.password,
        role_id: updatedRole.id
      };
      
      await saveUser(payload);
      await loadData();
      setIsFormOpen(false);
      setEditingUser(null);
      addToast({
        type: 'success',
        message: userData.id ? 'User account updated successfully!' : 'User account created successfully!'
      });
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.messageToShow || 'Failed to save user.' });
    }
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
          roles={roles}
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
