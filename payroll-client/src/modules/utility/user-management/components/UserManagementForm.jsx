import React, { useState, useEffect } from 'react';
import styles from './UserManagementPage.module.css';

import { menuItems, nameToSlug } from '../../../../shared/components/Sidebar/Sidebar';

const READ_ONLY_SLUGS = [
  'dashboard', 'face-attendance-self', 'ecr-report', 'esic-report', 'pmrpy-report', 
  'pf-challan-yearly', 'esic-challan-yearly', 'epf-challan', 'pf-summary', 'payment-advice', 
  'bonus-sheet', 'gratuity-calculation', 'employee-data-import', 
  'employee-data-export', 'kyc-export', 'attendance-printing', 
  'missing-information', 'delete-month-entry', 'backup', 'restore', 
  '3-month-absent-list', '58-years-of-age', 'excel-to-text', 'whatsapp-gateway',
  'uan-to-ip-mapping'
];

const SLUG_OVERRIDES = {
  'Report_Professional Tax': 'report-pt',
  'Report_Salary Sheet': 'salary-sheet',
  'Report_Forms': 'forms'
};

const generatePermissionGroups = () => {
  const groups = [];
  
  menuItems.forEach(group => {
    // Top-level item like Dashboard
    if (!group.subItems && !group.nestedItems) {
      const slug = nameToSlug(group.name);
      groups.push({
        title: group.name,
        items: [{ 
          slug: slug, 
          label: group.name, 
          readOnly: READ_ONLY_SLUGS.includes(slug) || group.name.toLowerCase().includes('report') 
        }]
      });
      return;
    }

    // Has subItems (like Master, Setup, Utility)
    if (group.subItems) {
      const items = [];
      group.subItems.forEach(sub => {
        // Handle nested items like "Forms" or "Salary Sheet" inside Report
        // For backwards compatibility, we map the parent itself if it's a known folder
        const overrideKey = `${group.name}_${sub.name}`;
        if (SLUG_OVERRIDES[overrideKey]) {
           items.push({
             slug: SLUG_OVERRIDES[overrideKey],
             label: sub.name,
             readOnly: true
           });
        } else if (sub.nestedItems) {
          sub.nestedItems.forEach(nested => {
            const nestedSlug = nameToSlug(nested.name);
            items.push({
              slug: nestedSlug,
              label: nested.name,
              readOnly: READ_ONLY_SLUGS.includes(nestedSlug) || group.name === 'Report'
            });
          });
        } else {
          const subSlug = nameToSlug(sub.name);
          items.push({
            slug: subSlug,
            label: sub.name,
            readOnly: READ_ONLY_SLUGS.includes(subSlug) || group.name === 'Report' || group.name === 'Convert Excel To Text'
          });
        }
      });
      
      groups.push({
        title: group.name,
        items
      });
    }
  });
  
  return groups;
};

const PERMISSION_GROUPS = generatePermissionGroups();
const ALL_PERMISSION_SLUGS = PERMISSION_GROUPS.flatMap(g => g.items.map(i => i.slug));

const UserManagementForm = ({ user, roles = [], onSave, onCancel }) => {
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [formData, setFormData] = useState({
    userName: '',
    userId: '',
    password: '',
    designation: roles.length > 0 ? roles[0].name : '',
    role_id: roles.length > 0 ? roles[0].id : null,
    permissions: {}
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    let initialPerms = {};
    if (user && user.permissions) {
      initialPerms = normalizePermissions(user.permissions);
    } else if (roles.length > 0 && roles[0].permissions) {
      initialPerms = normalizePermissions(roles[0].permissions);
    } else {
      ALL_PERMISSION_SLUGS.forEach(slug => {
        initialPerms[slug] = { read: false, create: false, edit: false, delete: false };
      });
    }

    setFormData({
      userName: user ? user.userName || '' : '',
      userId: user ? user.userId || '' : '',
      password: user ? user.password || '' : '',
      designation: user ? user.designation || (roles[0]?.name || '') : (roles[0]?.name || ''),
      role_id: user ? user.role_id || (roles[0]?.id || null) : (roles[0]?.id || null),
      permissions: initialPerms
    });
    setErrors({});
    setTouched({});
  }, [user, roles]);

  const normalizePermissions = (perms) => {
    const normalized = {};
    ALL_PERMISSION_SLUGS.forEach(slug => {
      const val = perms[slug];
      if (typeof val === 'boolean') {
        normalized[slug] = { read: val, create: val, edit: val, delete: val };
      } else if (val && typeof val === 'object') {
        normalized[slug] = {
          read: !!val.read,
          create: !!val.create,
          edit: !!val.edit,
          delete: !!val.delete
        };
      } else {
        normalized[slug] = { read: false, create: false, edit: false, delete: false };
      }
    });
    return normalized;
  };

  const validateField = (name, value) => {
    let error = '';
    if (name === 'userName') {
      if (!value.trim()) error = 'User Name is required.';
    } else if (name === 'userId') {
      if (!value.trim()) {
        error = 'User Id is required.';
      } else if (!/^[a-z0-9]+$/.test(value)) {
        error = 'User Id must contain only lowercase letters and numbers.';
      }
    } else if (name === 'password') {
      if (!value.trim()) error = 'Password is required.';
    }
    return error;
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalVal = value;

    if (name === 'userId') {
      finalVal = value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    }

    if (name === 'designation') {
      const selectedRole = roles.find(r => r.name === value);
      if (selectedRole) {
        setFormData(prev => ({
          ...prev,
          designation: selectedRole.name,
          role_id: selectedRole.id,
          permissions: normalizePermissions(selectedRole.permissions || {})
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          designation: value,
          role_id: null
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: finalVal }));
    }

    if (touched[name]) {
      const error = validateField(name, finalVal);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handlePermissionChange = (slug, action) => {
    setFormData(prev => {
      const currentPerms = prev.permissions[slug] || { read: false, create: false, edit: false, delete: false };
      const newValue = !currentPerms[action];

      const newPerms = { ...currentPerms, [action]: newValue };

      // If setting create, edit, or delete to true, ensure read is also true
      if (newValue && action !== 'read') {
        newPerms.read = true;
      }

      // If setting read to false, ensure others are false
      if (!newValue && action === 'read') {
        newPerms.create = false;
        newPerms.edit = false;
        newPerms.delete = false;
      }

      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [slug]: newPerms
        }
      };
    });
  };

  const handleGroupToggle = (groupItems, checked) => {
    const updated = { ...formData.permissions };
    groupItems.forEach(item => {
      updated[item.slug] = {
        read: checked,
        create: item.readOnly ? false : checked,
        edit: item.readOnly ? false : checked,
        delete: item.readOnly ? false : checked,
      };
    });
    setFormData(prev => ({
      ...prev,
      permissions: updated
    }));
  };

  const handleToggleAllPermissions = (select) => {
    const updated = {};
    PERMISSION_GROUPS.forEach(group => {
      group.items.forEach(item => {
        updated[item.slug] = {
          read: select,
          create: item.readOnly ? false : select,
          edit: item.readOnly ? false : select,
          delete: item.readOnly ? false : select,
        };
      });
    });
    setFormData(prev => ({
      ...prev,
      permissions: updated
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};
    ['userName', 'userId', 'password'].forEach(key => {
      const err = validateField(key, formData[key] || '');
      if (err) newErrors[key] = err;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const allTouched = {};
      ['userName', 'userId', 'password'].forEach(key => {
        allTouched[key] = true;
      });
      setTouched(allTouched);
      return;
    }

    onSave({
      ...user,
      ...formData
    });
  };

  return (
    <div className={styles.formCard}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '20px', color: 'var(--text-primary)' }}>
        {user ? 'Edit User Credentials & Access' : 'New User Setup'}
      </h3>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          {/* User Name */}
          <div className={styles.field}>
            <label className={styles.label}>
              User Name <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="userName"
              value={formData.userName}
              onChange={handleChange}
              placeholder="ENTER USER NAME"
              className={`${styles.input} ${errors.userName && touched.userName ? styles.inputError : ''}`}
              onBlur={handleBlur}
            />
            {errors.userName && touched.userName && (
              <span className={styles.errorText}>{errors.userName}</span>
            )}
          </div>

          {/* User ID */}
          <div className={styles.field}>
            <label className={styles.label}>
              User Id <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="userId"
              value={formData.userId}
              onChange={handleChange}
              placeholder="ENTER USER ID"
              className={`${styles.input} ${errors.userId && touched.userId ? styles.inputError : ''}`}
              onBlur={handleBlur}
            />
            {errors.userId && touched.userId && (
              <span className={styles.errorText}>{errors.userId}</span>
            )}
          </div>

          {/* Password */}
          <div className={styles.field}>
            <label className={styles.label}>
              Password <span className={styles.required}>*</span>
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="ENTER PASSWORD"
              className={`${styles.input} ${errors.password && touched.password ? styles.inputError : ''}`}
              onBlur={handleBlur}
            />
            {errors.password && touched.password && (
              <span className={styles.errorText}>{errors.password}</span>
            )}
          </div>

          {/* Designation */}
          <div className={styles.field}>
            <label className={styles.label}>
              Designation <span className={styles.required}>*</span>
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {isCreatingRole ? (
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Enter new designation..."
                  onBlur={handleBlur}
                />
              ) : (
                <select
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  className={styles.input}
                  onBlur={handleBlur}
                >
                  <option value="" disabled>Select Designation</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsCreatingRole(!isCreatingRole);
                  setFormData(prev => ({ ...prev, designation: '', role_id: null }));
                }}
                className={styles.saveBtn}
                style={{ padding: '8px 12px', whiteSpace: 'nowrap', minWidth: '100px' }}
              >
                {isCreatingRole ? 'Cancel New' : '+ Add New'}
              </button>
            </div>
          </div>

          {/* Permissions Grid */}
          <div className={styles.permissionsSection}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>User Access Permissions</span>
              <div style={{ display: 'flex', gap: '16px' }}>
                <button
                  type="button"
                  onClick={() => handleToggleAllPermissions(true)}
                  className={styles.toggleAllBtn}
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleAllPermissions(false)}
                  className={styles.toggleAllBtn}
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className={styles.permissionsGrid}>
              {PERMISSION_GROUPS.map(group => {
                const isAllSelected = group.items.every(item => formData.permissions[item.slug]?.read);
                const isSomeSelected = group.items.some(item => formData.permissions[item.slug]?.read) && !isAllSelected;

                return (
                  <div key={group.title} className={styles.permissionGroup}>
                    <div className={styles.groupHeader}>
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        ref={el => { if (el) el.indeterminate = isSomeSelected; }}
                        onChange={(e) => handleGroupToggle(group.items, e.target.checked)}
                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                      />
                      <span style={{ fontWeight: '600' }}>{group.title}</span>
                    </div>
                    <div className={styles.groupBody}>
                      <table className={styles.permissionsTable}>
                        <thead>
                          <tr>
                            <th>Module</th>
                            <th>Read</th>
                            <th>Create</th>
                            <th>Edit</th>
                            <th>Delete</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.items.map(item => {
                            const perms = formData.permissions[item.slug] || {};
                            return (
                              <tr key={item.slug}>
                                <td>
                                  {item.label}
                                </td>
                                <td>
                                  <input
                                    type="checkbox"
                                    checked={!!perms.read}
                                    onChange={() => handlePermissionChange(item.slug, 'read')}
                                    className={styles.permissionCheckbox}
                                  />
                                </td>
                                <td>
                                  {!item.readOnly && (
                                    <input
                                      type="checkbox"
                                      checked={!!perms.create}
                                      onChange={() => handlePermissionChange(item.slug, 'create')}
                                      className={styles.permissionCheckbox}
                                    />
                                  )}
                                </td>
                                <td>
                                  {!item.readOnly && (
                                    <input
                                      type="checkbox"
                                      checked={!!perms.edit}
                                      onChange={() => handlePermissionChange(item.slug, 'edit')}
                                      className={styles.permissionCheckbox}
                                    />
                                  )}
                                </td>
                                <td>
                                  {!item.readOnly && (
                                    <input
                                      type="checkbox"
                                      checked={!!perms.delete}
                                      onChange={() => handlePermissionChange(item.slug, 'delete')}
                                      className={styles.permissionCheckbox}
                                    />
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Buttons Group */}
        <div className={styles.buttonGroup}>
          <button type="button" onClick={onCancel} className={styles.cancelBtn}>
            Cancel
          </button>
          <button type="submit" className={styles.saveBtn}>
            Save
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserManagementForm;

