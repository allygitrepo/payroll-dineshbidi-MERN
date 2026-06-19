import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import styles from './ConfirmModal.module.css';

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Deletion',
  message = 'Are you sure you want to delete this record? This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel'
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        
        {/* Close Button */}
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close dialog">
          <X size={18} />
        </button>

        {/* Warning Icon and Message */}
        <div className={styles.content}>
          <div className={styles.iconWrapper}>
            <AlertTriangle size={36} className={styles.icon} />
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
