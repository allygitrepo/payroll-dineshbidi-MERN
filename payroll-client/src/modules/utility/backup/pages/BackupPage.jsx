import React, { useMemo } from 'react';
import { Database, Download, Users, Building2, UserMinus, CalendarCheck, ClipboardList } from 'lucide-react';
import { useToast } from '../../../../shared/components';
import styles from '../components/BackupPage.module.css';

const BackupPage = () => {
  const addToast = useToast();

  // Load database object counts
  const dbStats = useMemo(() => {
    let employeesCount = 0;
    let companiesCount = 0;
    let resignationsCount = 0;
    let challansCount = 0;
    let monthlyEntriesCount = 0;

    try {
      const empData = localStorage.getItem('payroll_employees');
      if (empData) employeesCount = JSON.parse(empData).length;

      const compData = localStorage.getItem('payroll_companies');
      if (compData) companiesCount = JSON.parse(compData).length;

      const resData = localStorage.getItem('payroll_resignations');
      if (resData) resignationsCount = JSON.parse(resData).length;

      const chalData = localStorage.getItem('payroll_epf_challans');
      if (chalData) challansCount = JSON.parse(chalData).length;

      // Count payroll logs per month
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith('payroll_packers_entry_') ||
          key.startsWith('payroll_bidi_roller_entry_') ||
          key.startsWith('payroll_office_staff_entry_')
        )) {
          monthlyEntriesCount++;
        }
      }
    } catch (e) {
      console.error('Error counting database records:', e);
    }

    return {
      employeesCount,
      companiesCount,
      resignationsCount,
      challansCount,
      monthlyEntriesCount
    };
  }, []);

  const handleExportDatabase = () => {
    try {
      let sql = `-- ------------------------------------------------------\n`;
      sql += `-- Payroll Database Backup SQL Dump\n`;
      sql += `-- Exported on: ${new Date().toLocaleString()}\n`;
      sql += `-- Database Engine: LocalStorage Mock\n`;
      sql += `-- SIGNATURE: payroll_dineshbidi_mern_v1\n`;
      sql += `-- ------------------------------------------------------\n\n`;

      const dumpTable = (tableName, key) => {
        const dataStr = localStorage.getItem(key);
        if (!dataStr) return;

        let items = [];
        try {
          items = JSON.parse(dataStr);
          if (!Array.isArray(items)) items = [items];
        } catch (e) {
          return;
        }

        sql += `-- Table structure for table \`${tableName}\`\n`;
        sql += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
        sql += `CREATE TABLE \`${tableName}\` (\n`;
        sql += `  \`id\` VARCHAR(50) PRIMARY KEY,\n`;
        sql += `  \`data_json\` TEXT\n`;
        sql += `);\n\n`;

        sql += `-- Dumping data for table \`${tableName}\`\n`;
        items.forEach(item => {
          const id = item.id || Math.random().toString(36).substring(2, 9);
          const cleanVal = JSON.stringify(item).replace(/'/g, "''");
          sql += `INSERT INTO \`${tableName}\` VALUES ('${id}', '${cleanVal}');\n`;
        });

        sql += `\n`;
        
        // Structured metadata comment for Javascript parsing
        sql += `-- DATA: ${JSON.stringify({ key, value: items })}\n\n`;
      };

      // Dump core tables
      dumpTable('companies', 'payroll_companies');
      dumpTable('employees', 'payroll_employees');
      dumpTable('resignations', 'payroll_resignations');
      dumpTable('epf_challans', 'payroll_epf_challans');

      // Dump monthly entries
      sql += `-- Attendance logs and monthly records\n`;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith('payroll_packers_entry_') ||
          key.startsWith('payroll_bidi_roller_entry_') ||
          key.startsWith('payroll_office_staff_entry_')
        )) {
          try {
            const val = JSON.parse(localStorage.getItem(key));
            sql += `-- Table: ${key}\n`;
            sql += `-- DATA: ${JSON.stringify({ key, value: val })}\n\n`;
          } catch (e) {
            // ignore
          }
        }
      }

      const blob = new Blob([sql], { type: 'text/plain;charset=utf-8' });
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
        message: 'Failed to generate SQL backup.'
      });
      console.error(err);
    }
  };

  return (
    <div className={styles.container}>
      {/* Page header */}
      <div className={styles.headerSection}>
        <div>
          <h2 className={styles.title}>Database Backup</h2>
          <p className={styles.subtitle}>
            Safely download secure local SQL database dumps for data preservation.
          </p>
        </div>
      </div>

      {/* Database status and summary stats card */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <Database size={20} style={{ color: 'var(--primary)' }} />
          <h3 className={styles.cardTitle}>Local Database Summary</h3>
        </div>

        <div className={styles.statsGrid}>
          
          <div className={styles.statItem}>
            <div className={styles.statIconWrapper}>
              <Users size={20} />
            </div>
            <div className={styles.statDetails}>
              <span className={styles.statValue}>{dbStats.employeesCount}</span>
              <span className={styles.statLabel}>Total Employees</span>
            </div>
          </div>

          <div className={styles.statItem}>
            <div className={styles.statIconWrapper}>
              <Building2 size={20} />
            </div>
            <div className={styles.statDetails}>
              <span className={styles.statValue}>{dbStats.companiesCount}</span>
              <span className={styles.statLabel}>Establishments</span>
            </div>
          </div>

          <div className={styles.statItem}>
            <div className={styles.statIconWrapper}>
              <ClipboardList size={20} />
            </div>
            <div className={styles.statDetails}>
              <span className={styles.statValue}>{dbStats.challansCount}</span>
              <span className={styles.statLabel}>EPF Challan Dates</span>
            </div>
          </div>

          <div className={styles.statItem}>
            <div className={styles.statIconWrapper}>
              <UserMinus size={20} />
            </div>
            <div className={styles.statDetails}>
              <span className={styles.statValue}>{dbStats.resignationsCount}</span>
              <span className={styles.statLabel}>Resignation Logs</span>
            </div>
          </div>

          <div className={styles.statItem}>
            <div className={styles.statIconWrapper}>
              <CalendarCheck size={20} />
            </div>
            <div className={styles.statDetails}>
              <span className={styles.statValue}>{dbStats.monthlyEntriesCount}</span>
              <span className={styles.statLabel}>Monthly Attendance Registers</span>
            </div>
          </div>

        </div>

        <div className={styles.actionRow}>
          <button
            type="button"
            className={styles.exportBtn}
            onClick={handleExportDatabase}
          >
            <Download size={18} />
            Export Database (.sql)
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackupPage;
