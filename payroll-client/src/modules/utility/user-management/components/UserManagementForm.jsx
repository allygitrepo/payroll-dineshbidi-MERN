import React, { useState, useEffect } from 'react';
import styles from './UserManagementPage.module.css';

const DESIGNATIONS = ['OWNER', 'DATA ENTRY OPERATOR'];

const PERMISSION_GROUPS = [
  {
    title: 'Dashboard',
    items: [
      { slug: 'dashboard', label: 'Dashboard' }
    ]
  },
  {
    title: 'Master',
    items: [
      { slug: 'company', label: 'Company' },
      { slug: 'employee', label: 'Employee' },
      { slug: 'kyc-update', label: 'KYC Update' },
      { slug: 'contractor', label: 'Contractor' },
      { slug: 'address', label: 'Address' }
    ]
  },
  {
    title: 'Setup',
    items: [
      { slug: 'packing-wages', label: 'Packing Wages' },
      { slug: 'bidi-roller-wages', label: 'Bidi Roller Wages' },
      { slug: 'professional-tax', label: 'Professional Tax' },
      { slug: 'office-staff-salary', label: 'Office Staff Salary' },
      { slug: 'challan-setup', label: 'Challan Setup' }
    ]
  },
  {
    title: 'Attendance',
    items: [
      { slug: 'office-attendance', label: 'Office Attendance' },
      { slug: 'packing-attendance', label: 'Packing Attendance' },
      { slug: 'bidi-roller-attendance', label: 'Bidi Roller Attendance' }
    ]
  },
  {
    title: 'Entry',
    items: [
      { slug: 'office-staff', label: 'Office Staff' },
      { slug: 'packers', label: 'Packers' },
      { slug: 'bidi-roller', label: 'Bidi Roller' },
      { slug: 'epf-challan-date', label: 'EPF Challan Date' },
      { slug: 'resignation', label: 'Resignation' }
    ]
  },
  {
    title: 'Report',
    items: [
      { slug: 'salary-sheet', label: 'Salary Sheet' },
      { slug: 'form-2', label: 'Form 2' },
      { slug: 'ecr-report', label: 'ECR Report' },
      { slug: 'esic-report', label: 'ESIC Report' },
      { slug: 'pmrpy-report', label: 'PMRPY Report' },
      { slug: 'pf-challan-yearly', label: 'PF Challan Yearly' },
      { slug: 'epf-challan', label: 'EPF Challan' },
      { slug: 'pf-summary', label: 'PF Summary' },
      { slug: 'payment-advice', label: 'Payment Advice' },
      { slug: 'bonus-sheet', label: 'Bonus Sheet' },
      { slug: 'gratuity-calculation', label: 'Gratuity Calculation' },
      { slug: 'report-pt', label: 'Professional Tax' }
    ]
  },
  {
    title: 'Utility',
    items: [
      { slug: 'calender', label: 'Calender' },
      { slug: 'user-management', label: 'User Management' },
      { slug: 'employee-data-import', label: 'Employee Data Import' },
      { slug: 'employee-data-export', label: 'Employee Data Export' },
      { slug: 'kyc-export', label: 'KYC Export' },
      { slug: 'attendance-printing', label: 'Attendance Printing' },
      { slug: 'missing-information', label: 'Missing Information' },
      { slug: 'delete-month-entry', label: 'Delete Month Entry' },
      { slug: 'backup', label: 'Backup' },
      { slug: 'restore', label: 'Restore' }
    ]
  },
  {
    title: 'Todo List',
    items: [
      { slug: '3-month-absent-list', label: '3 Month Absent List' },
      { slug: '58-years-of-age', label: '58 Years of age' },
      { slug: 'notes', label: 'Notes' }
    ]
  },
  {
    title: 'Convert Excel To Text',
    items: [
      { slug: 'excel-to-text', label: 'Excel To Text' }
    ]
  }
];

const ALL_PERMISSION_SLUGS = [
  'dashboard',
  'company', 'employee', 'kyc-update', 'contractor', 'address',
  'packing-wages', 'bidi-roller-wages', 'professional-tax', 'office-staff-salary', 'challan-setup',
  'office-attendance', 'packing-attendance', 'bidi-roller-attendance',
  'office-staff', 'packers', 'bidi-roller', 'epf-challan-date', 'resignation',
  'salary-sheet', 'form-2', 'ecr-report', 'esic-report', 'pmrpy-report', 'pf-challan-yearly', 'epf-challan', 'pf-summary', 'payment-advice', 'bonus-sheet', 'gratuity-calculation', 'report-pt',
  'calender', 'user-management', 'employee-data-import', 'employee-data-export', 'kyc-export', 'attendance-printing', 'missing-information', 'delete-month-entry', 'backup', 'restore',
  '3-month-absent-list', '58-years-of-age', 'notes',
  'excel-to-text'
];

const UserManagementForm = ({ user, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    userName: '',
    userId: '',
    password: '',
    designation: 'DATA ENTRY OPERATOR',
    permissions: {}
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        userName: user.userName || '',
        userId: user.userId || '',
        password: user.password || '',
        designation: user.designation || 'DATA ENTRY OPERATOR',
        permissions: user.permissions || {}
      });
      setErrors({});
      setTouched({});
    } else {
      // Create empty permissions map
      const initialPerms = {};
      ALL_PERMISSION_SLUGS.forEach(slug => {
        initialPerms[slug] = false;
      });
      setFormData({
        userName: '',
        userId: '',
        password: '',
        designation: 'DATA ENTRY OPERATOR',
        permissions: initialPerms
      });
      setErrors({});
      setTouched({});
    }
  }, [user]);

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
      // Lowercase alphanumeric only
      finalVal = value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    }

    setFormData(prev => ({ ...prev, [name]: finalVal }));
    if (touched[name]) {
      const error = validateField(name, finalVal);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handlePermissionChange = (slug) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [slug]: !prev.permissions[slug]
      }
    }));
  };

  const handleToggleAllPermissions = (select) => {
    const updated = {};
    ALL_PERMISSION_SLUGS.forEach(slug => {
      updated[slug] = select;
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
            <select
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              className={styles.input}
              onBlur={handleBlur}
            >
              {DESIGNATIONS.map(role => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
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
              {PERMISSION_GROUPS.map(group => (
                <div key={group.title} className={styles.permissionGroup}>
                  <div className={styles.groupHeader}>{group.title}</div>
                  <div className={styles.groupBody}>
                    {group.items.map(item => (
                      <label key={item.slug} className={styles.permissionLabel}>
                        <input
                          type="checkbox"
                          checked={!!formData.permissions[item.slug]}
                          onChange={() => handlePermissionChange(item.slug)}
                          className={styles.permissionCheckbox}
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
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
