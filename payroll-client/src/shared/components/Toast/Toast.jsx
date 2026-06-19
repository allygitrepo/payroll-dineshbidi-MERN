import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import styles from './Toast.module.css';

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const TITLES = {
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
  info: 'Info',
};

let idCounter = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ type = 'info', message, title, duration = 4000 }) => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, type, message, title: title || TITLES[type], duration }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className={styles.toastContainer}>
        {toasts.map((toast) => {
          const IconComp = ICONS[toast.type];
          return (
            <div key={toast.id} className={`${styles.toast} ${styles[toast.type]}`}>
              <div className={styles.iconBox}>
                <IconComp size={18} />
              </div>
              <div className={styles.content}>
                <div className={styles.toastTitle}>{toast.title}</div>
                {toast.message && <div className={styles.toastMsg}>{toast.message}</div>}
              </div>
              <button className={styles.closeBtn} onClick={() => removeToast(toast.id)}>
                <X size={14} />
              </button>
              <div
                className={styles.progressBar}
                style={{ animationDuration: `${toast.duration}ms` }}
              />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx.addToast;
};

export default ToastProvider;
