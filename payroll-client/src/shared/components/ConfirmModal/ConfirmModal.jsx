import React from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import styles from './ConfirmModal.module.css';

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Deletion',
  message = 'Are you sure you want to delete this record? This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  theme = 'danger' // 'danger' | 'success' | 'warning' | 'info'
}) => {
  if (!isOpen) return null;

  let icon = <AlertTriangle size={36} className={styles.icon} />;
  let themeClass = styles.dangerTheme;

  if (theme === 'success') {
    icon = <CheckCircle2 size={36} className={styles.icon} />;
    themeClass = styles.successTheme;
  } else if (theme === 'warning') {
    icon = <AlertTriangle size={36} className={styles.icon} />;
    themeClass = styles.warningTheme;
  } else if (theme === 'info') {
    icon = <Info size={36} className={styles.icon} />;
    themeClass = styles.infoTheme;
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={`${styles.modal} ${themeClass}`} onClick={(e) => e.stopPropagation()}>
        
        {/* Close Button */}
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close dialog">
          <X size={18} />
        </button>

        {/* Warning Icon and Message */}
        <div className={styles.content}>
          <div className={styles.iconWrapper}>
            {icon}
          </div>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.message}>{message}</p>
        </div>

        {/* Action Buttons */}
        <div className={styles.actions}>
          <button onClick={onClose} className={styles.cancelBtn}>
            {cancelText}
          </button>
          <button onClick={onConfirm} className={styles.confirmBtn}>
            {confirmText}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ConfirmModal;
