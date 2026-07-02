import React, { useState } from 'react';
import styles from '../../../../shared/components/ConfirmModal/ConfirmModal.module.css';

const ContractorLoginModal = ({ isOpen, onClose, onSave, contractorName, existingLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [sendWhatsapp, setSendWhatsapp] = useState(true);

  React.useEffect(() => {
    if (isOpen) {
      if (existingLogin) {
        setUsername(existingLogin.user_id || '');
      } else {
        setUsername('');
      }
      setPassword('');
      setSendWhatsapp(true);
    }
  }, [isOpen, existingLogin]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!username.trim()) {
      alert("Username is required.");
      return;
    }
    if (!existingLogin && !password.trim()) {
      alert("Password is required for new logins.");
      return;
    }
    onSave({ username, password, sendWhatsapp });
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} style={{ maxWidth: '400px' }}>
        <h3 className={styles.title} style={{ marginBottom: '16px', fontSize: '1.25rem', color: 'var(--text-primary)' }}>
          {existingLogin ? `Update Login for ${contractorName}` : `Create Login for ${contractorName}`}
        </h3>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)' }}>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px', outline: 'none' }}
            placeholder="Enter username"
            autoComplete="new-password"
          />
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)' }}>Password {existingLogin && '(Leave blank to keep current)'}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px', outline: 'none' }}
            placeholder={existingLogin ? "Enter new password (optional)" : "Enter password"}
            autoComplete="new-password"
          />
        </div>

        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input 
            type="checkbox" 
            id="sendWhatsappCheckbox" 
            checked={sendWhatsapp}
            onChange={(e) => setSendWhatsapp(e.target.checked)}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          <label htmlFor="sendWhatsappCheckbox" style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            Send WhatsApp Message
          </label>
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.confirmBtn} style={{ backgroundColor: 'var(--primary)', color: 'white', borderColor: 'var(--primary)' }} onClick={handleSave}>
            {existingLogin ? 'Update Login' : 'Create Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContractorLoginModal;
