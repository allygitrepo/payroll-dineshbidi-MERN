import React, { useState } from 'react';
import { X, Loader } from 'lucide-react';
import styles from './SaasClientManagementPage.module.css'; // Reuse existing styles
import { createCoAdmin } from '../services/saasService';

const CoAdminModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    user_name: '',
    user_id: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await createCoAdmin(formData);
      onSuccess();
      setFormData({ user_name: '', user_id: '', password: '' });
      onClose();
    } catch (err) {
      setError(err.response?.data?.messageToShow || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent} style={{ maxWidth: '500px', width: '95%' }}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Create System Co-Admin</h3>
          <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalBody}>
          {error && <div style={{ color: 'red', marginBottom: '16px', padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px' }}>{error}</div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Admin Name *</label>
              <input type="text" name="user_name" value={formData.user_name} onChange={handleChange} className={styles.formInput} required />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Login ID *</label>
              <input type="text" name="user_id" value={formData.user_id} onChange={handleChange} className={styles.formInput} required />
            </div>
            
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
          </div>

          <div className={styles.modalFooter} style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
            <button type="button" className={styles.btnCancel} onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className={styles.btnSubmit} disabled={loading}>
              {loading ? <Loader size={18} className={styles.spinner} /> : 'Create Co-Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CoAdminModal;
