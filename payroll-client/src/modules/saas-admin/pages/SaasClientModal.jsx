import React, { useState, useEffect } from 'react';
import { X, Loader } from 'lucide-react';
import styles from './SaasClientManagementPage.module.css';
import { createSaasClient } from '../services/saasService';

// Module/Permission Definitions
const PERMISSION_GROUPS = [
  {
    title: 'Dashboard',
    items: [{ slug: 'dashboard', label: 'Dashboard', readOnly: true }]
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
      { slug: 'attendence-list', label: 'Attendance List' },
      { slug: 'leave-management', label: 'Leave Management' },
      { slug: 'face-attendance-self', label: 'Face Attendance (Self)', readOnly: true }
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
      { slug: 'salary-sheet', label: 'Salary Sheet', readOnly: true },
      { slug: 'form-2', label: 'Form 2', readOnly: true },
      { slug: 'ecr-report', label: 'ECR Report', readOnly: true },
      { slug: 'esic-report', label: 'ESIC Report', readOnly: true },
      { slug: 'pmrpy-report', label: 'PMRPY Report', readOnly: true },
      { slug: 'pf-challan-yearly', label: 'PF Challan Yearly', readOnly: true },
      { slug: 'epf-challan', label: 'EPF Challan', readOnly: true },
      { slug: 'pf-summary', label: 'PF Summary', readOnly: true },
      { slug: 'payment-advice', label: 'Payment Advice', readOnly: true },
      { slug: 'bonus-sheet', label: 'Bonus Sheet', readOnly: true },
      { slug: 'gratuity-calculation', label: 'Gratuity Calculation', readOnly: true },
      { slug: 'report-pt', label: 'Professional Tax', readOnly: true }
    ]
  },
  {
    title: 'Utility',
    items: [
      { slug: 'calender', label: 'Calender' },
      { slug: 'user-management', label: 'User Management' },
      { slug: 'employee-data-import', label: 'Employee Data Import', readOnly: true },
      { slug: 'employee-data-export', label: 'Employee Data Export', readOnly: true },
      { slug: 'kyc-export', label: 'KYC Export', readOnly: true },
      { slug: 'attendance-printing', label: 'Attendance Printing', readOnly: true },
      { slug: 'missing-information', label: 'Missing Information', readOnly: true },
      { slug: 'delete-month-entry', label: 'Delete Month Entry', readOnly: true },
      { slug: 'backup', label: 'Backup', readOnly: true },
      { slug: 'restore', label: 'Restore', readOnly: true }
    ]
  },
  {
    title: 'Todo List',
    items: [
      { slug: '3-month-absent-list', label: '3 Month Absent List', readOnly: true },
      { slug: '58-years-of-age', label: '58 Years of age', readOnly: true },
      { slug: 'notes', label: 'Notes' }
    ]
  },
  {
    title: 'Convert Excel To Text',
    items: [
      { slug: 'excel-to-text', label: 'Excel To Text', readOnly: true }
    ]
  }
];

const ALL_PERMISSION_SLUGS = PERMISSION_GROUPS.flatMap(g => g.items.map(i => i.slug));

const SaasClientModal = ({ isOpen, onClose, editingClient, onSuccess }) => {
  const [formData, setFormData] = useState({
    user_name: editingClient ? editingClient.user_name : '',
    user_id: editingClient ? editingClient.user_id : '',
    password: '',
    
    // Company Fields
    establishment_id: '',
    company_name: editingClient ? editingClient.company_name : '',
    company_type: 'Proprietorship',
    epfo_office: '',
    lin_number: '',
    esic_id: '',
    address_line: '',
    post_office: '',
    district: '',
    pincode: '',
    pan: '',
    tan: '',
    professional_tax_reg_no: '',
    email_id: '',
    phone: '',
    website: '',

    permissions: {}
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  // Initialize permissions
  useEffect(() => {
    let initialPerms = {};
    ALL_PERMISSION_SLUGS.forEach(slug => {
        initialPerms[slug] = { read: true, create: true, edit: true, delete: true };
    });
    setFormData(prev => ({ ...prev, permissions: initialPerms }));
  }, []);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
    setFormData(prev => ({ ...prev, permissions: updated }));
  };

  const handlePermissionChange = (slug, action) => {
    setFormData(prev => {
      const currentPerms = prev.permissions[slug] || { read: false, create: false, edit: false, delete: false };
      const newValue = !currentPerms[action];
      const newPerms = { ...currentPerms, [action]: newValue };
      
      if (newValue && action !== 'read') newPerms.read = true;
      if (!newValue && action === 'read') {
        newPerms.create = false;
        newPerms.edit = false;
        newPerms.delete = false;
      }
      return { ...prev, permissions: { ...prev.permissions, [slug]: newPerms } };
    });
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
    setFormData(prev => ({ ...prev, permissions: updated }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (editingClient) {
        alert("Edit functionality pending for SaaS Client");
      } else {
        await createSaasClient(formData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.messageToShow || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent} style={{ maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className={styles.modalHeader} style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 10, padding: '16px 20px', margin: '-20px -20px 20px -20px' }}>
          <h3 className={styles.modalTitle}>
            {editingClient ? 'Edit Client & Master Profile' : 'Add New Client & Master Profile'}
          </h3>
          <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalBody}>
          {error && <div style={{ color: 'red', marginBottom: '16px', padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px' }}>{error}</div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* User Details */}
            <section>
              <h4 style={{ marginBottom: '16px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px', color: 'var(--primary)' }}>1. Client Admin Credentials</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Admin Name *</label>
                  <input type="text" name="user_name" value={formData.user_name} onChange={handleChange} className={styles.formInput} required />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Login ID *</label>
                  <input type="text" name="user_id" value={formData.user_id} onChange={handleChange} className={styles.formInput} required disabled={!!editingClient} />
                </div>
                {!editingClient && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Password *</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type={showPassword ? "text" : "password"} 
                        name="password" 
                        value={formData.password} 
                        onChange={handleChange} 
                        className={styles.formInput} 
                        required 
                        style={{ paddingRight: '40px' }} 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}
                      >
                        {showPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Company Details */}
            <section>
              <h4 style={{ marginBottom: '16px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px', color: 'var(--primary)' }}>2. Company Master Profile</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Company Name *</label>
                  <input type="text" name="company_name" value={formData.company_name} onChange={handleChange} className={styles.formInput} required />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Establishment ID *</label>
                  <input type="text" name="establishment_id" value={formData.establishment_id} onChange={handleChange} className={styles.formInput} required />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Company Type</label>
                  <select name="company_type" value={formData.company_type} onChange={handleChange} className={styles.formInput} required>
                    <option value="Proprietorship">Proprietorship</option>
                    <option value="Partnership">Partnership</option>
                    <option value="Private Limited">Private Limited</option>
                    <option value="Public">Public</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>PAN *</label>
                  <input type="text" name="pan" value={formData.pan} onChange={handleChange} className={styles.formInput} maxLength="10" required />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>TAN *</label>
                  <input type="text" name="tan" value={formData.tan} onChange={handleChange} className={styles.formInput} maxLength="10" required />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Professional Tax Reg No.</label>
                  <input type="text" name="professional_tax_reg_no" value={formData.professional_tax_reg_no} onChange={handleChange} className={styles.formInput} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>EPFO Office *</label>
                  <input type="text" name="epfo_office" value={formData.epfo_office} onChange={handleChange} className={styles.formInput} required />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>LIN Number</label>
                  <input type="text" name="lin_number" value={formData.lin_number} onChange={handleChange} className={styles.formInput} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>ESIC ID</label>
                  <input type="text" name="esic_id" value={formData.esic_id} onChange={handleChange} className={styles.formInput} />
                </div>
              </div>

              <h5 style={{ marginTop: '24px', marginBottom: '12px', color: '#475569' }}>Contact & Address</h5>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Address Line *</label>
                  <input type="text" name="address_line" value={formData.address_line} onChange={handleChange} className={styles.formInput} required />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Post Office *</label>
                  <input type="text" name="post_office" value={formData.post_office} onChange={handleChange} className={styles.formInput} required />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>District *</label>
                  <input type="text" name="district" value={formData.district} onChange={handleChange} className={styles.formInput} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Pincode *</label>
                  <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} className={styles.formInput} required />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email *</label>
                  <input type="email" name="email_id" value={formData.email_id} onChange={handleChange} className={styles.formInput} required />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Phone *</label>
                  <input type="text" name="phone" value={formData.phone} onChange={handleChange} className={styles.formInput} required />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Website</label>
                  <input type="text" name="website" value={formData.website} onChange={handleChange} className={styles.formInput} />
                </div>
              </div>
            </section>

            {/* Module Licensing */}
            <section className={styles.permissionsSection}>
              <div className={styles.sectionHeader} style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '8px', marginBottom: '16px' }}>
                <h4 style={{ margin: 0, color: 'var(--primary)' }}>3. Module Access Configuration</h4>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <button type="button" onClick={() => handleToggleAllPermissions(true)} className={styles.toggleAllBtn}>Grant All Modules</button>
                  <button type="button" onClick={() => handleToggleAllPermissions(false)} className={styles.toggleAllBtn} style={{ color: '#94a3b8' }}>Revoke All</button>
                </div>
              </div>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>Select which modules this Client will be able to access and use. This generates their custom Root Role.</p>
              
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
                                  <td>{item.label}</td>
                                  <td><input type="checkbox" checked={!!perms.read} onChange={() => handlePermissionChange(item.slug, 'read')} className={styles.permissionCheckbox}/></td>
                                  <td>{!item.readOnly && <input type="checkbox" checked={!!perms.create} onChange={() => handlePermissionChange(item.slug, 'create')} className={styles.permissionCheckbox}/>}</td>
                                  <td>{!item.readOnly && <input type="checkbox" checked={!!perms.edit} onChange={() => handlePermissionChange(item.slug, 'edit')} className={styles.permissionCheckbox}/>}</td>
                                  <td>{!item.readOnly && <input type="checkbox" checked={!!perms.delete} onChange={() => handlePermissionChange(item.slug, 'delete')} className={styles.permissionCheckbox}/>}</td>
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
            </section>

          </div>

          <div className={styles.modalFooter} style={{ marginTop: '32px', position: 'sticky', bottom: '-20px', backgroundColor: 'white', padding: '16px 0', borderTop: '1px solid #e2e8f0', margin: '0 -20px -20px -20px', paddingRight: '20px' }}>
            <button type="button" className={styles.btnCancel} onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className={styles.btnSubmit} disabled={loading} style={{ padding: '10px 24px', fontSize: '15px' }}>
              {loading ? <Loader size={18} className={styles.spinner} /> : 'Create Client & Company'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SaasClientModal;
