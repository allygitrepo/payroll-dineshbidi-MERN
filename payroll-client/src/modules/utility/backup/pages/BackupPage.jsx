import React, { useState } from 'react';
import { Database, Download } from 'lucide-react';
import { useToast } from '../../../../shared/components';
import { exportDatabase } from '../services/backupService';
import styles from '../components/BackupPage.module.css';

const BackupPage = () => {
  const addToast = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportDatabase = async () => {
    try {
      setIsExporting(true);
      const blob = await exportDatabase();
      const url = URL.createObjectURL(blob);

      // Create download element
      const link = document.createElement('a');
      const now = new Date();
      const dateString = now.getFullYear() + 
        '_' + String(now.getMonth() + 1).padStart(2, '0') + 
        '_' + String(now.getDate()).padStart(2, '0');
      
      link.href = url;
      link.download = `payroll_database_backup_${dateString}.sql`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast({
        type: 'success',
        message: 'Database backup file (.sql) exported successfully!'
      });
    } catch (err) {
      addToast({
        type: 'error',
        message: 'Failed to generate SQL backup from server.'
      });
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Page header */}
      <div className={styles.headerSection}>
        <div>
          <h2 className={styles.title}>Database Backup</h2>
          <p className={styles.subtitle}>
            Safely download secure SQL database dumps for full data preservation.
          </p>
        </div>
      </div>

      {/* Database status and action card */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <Database size={20} style={{ color: 'var(--primary)' }} />
          <h3 className={styles.cardTitle}>MySQL Database Export</h3>
        </div>

        <div style={{ padding: '20px 0', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          This will generate a complete `.sql` dump of the entire Payroll backend database, including all establishments, employees, and historical attendance entries.
        </div>

        <div className={styles.actionRow}>
          <button
            type="button"
            className={styles.exportBtn}
            onClick={handleExportDatabase}
            disabled={isExporting}
            style={{ opacity: isExporting ? 0.7 : 1, cursor: isExporting ? 'wait' : 'pointer' }}
          >
            <Download size={18} />
            {isExporting ? 'Generating Backup...' : 'Export Database (.sql)'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackupPage;
