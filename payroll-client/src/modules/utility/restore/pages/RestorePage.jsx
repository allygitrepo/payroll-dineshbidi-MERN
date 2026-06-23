import React, { useState, useRef } from 'react';
import { RefreshCw, UploadCloud, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';
import { useToast, ConfirmModal } from '../../../../shared/components';
import styles from '../components/RestorePage.module.css';

const RestorePage = () => {
  const addToast = useToast();
  const fileInputRef = useRef(null);

  // Loaded file states
  const [selectedFile, setSelectedFile] = useState(null);
  const [backupMetadata, setBackupMetadata] = useState(null);
  const [parsedData, setParsedData] = useState(null);

  // Modal confirm state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleZoneClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.sql')) {
      addToast({
        type: 'error',
        message: 'Invalid format! Please upload a valid SQL backup file (.sql).'
      });
      clearFile();
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const lines = text.split('\n');

        // Verify signature in the file
        const hasSignature = lines.some(line => line.includes('-- SIGNATURE: payroll_dineshbidi_mern_v1'));
        if (!hasSignature) {
          addToast({
            type: 'error',
            message: 'Signature mismatch! This file is not a valid payroll database backup SQL dump.'
          });
          clearFile();
          return;
        }

        // Parse dataset embedded in comments
        const dataMap = {};
        let foundKeys = 0;

        lines.forEach(line => {
          const trimmed = line.trim();
          if (trimmed.startsWith('-- DATA:')) {
            try {
              const jsonStr = trimmed.substring(8).trim();
              const payload = JSON.parse(jsonStr);
              if (payload && payload.key && payload.value) {
                dataMap[payload.key] = payload.value;
                foundKeys++;
              }
            } catch (err) {
              console.error('Error parsing line:', err);
            }
          }
        });

        if (foundKeys === 0) {
          addToast({
            type: 'error',
            message: 'No data tables discovered in the SQL file.'
          });
          clearFile();
          return;
        }

        setParsedData(dataMap);

        // Sum statistics
        const stats = {
          employeesCount: dataMap.payroll_employees ? dataMap.payroll_employees.length : 0,
          companiesCount: dataMap.payroll_companies ? dataMap.payroll_companies.length : 0,
          challansCount: dataMap.payroll_epf_challans ? dataMap.payroll_epf_challans.length : 0,
          resignationsCount: dataMap.payroll_resignations ? dataMap.payroll_resignations.length : 0,
          monthlyEntriesCount: Object.keys(dataMap).filter(
            k => k.startsWith('payroll_packers_') || k.startsWith('payroll_bidi_') || k.startsWith('payroll_office_')
          ).length
        };

        // Extract export timestamp from comments if possible
        let exportedAt = 'Unknown';
        const exportedLine = lines.find(line => line.includes('-- Exported on:'));
        if (exportedLine) {
          exportedAt = exportedLine.replace('-- Exported on:', '').trim();
        }

        setBackupMetadata({
          name: file.name,
          size: (file.size / 1024).toFixed(2) + ' KB',
          exportedAt,
          summary: stats
        });

        addToast({
          type: 'success',
          message: 'SQL database backup loaded successfully! Ready to import.'
        });
      } catch (err) {
        addToast({
          type: 'error',
          message: 'Failed to read SQL backup file.'
        });
        clearFile();
      }
    };
    reader.readAsText(file);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setBackupMetadata(null);
    setParsedData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportClick = () => {
    if (!parsedData) return;
    setIsConfirmOpen(true);
  };

  const handleConfirmImport = () => {
    try {
      // Overwrite corresponding LocalStorage items
      Object.keys(parsedData).forEach(key => {
        const val = parsedData[key];
        localStorage.setItem(key, typeof val === 'object' ? JSON.stringify(val) : val);
      });

      addToast({
        type: 'success',
        message: 'SQL database restored successfully! Reloading workspace to apply...'
      });

      setIsConfirmOpen(false);

      // Force a system reload to refresh local memory state
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (err) {
      addToast({
        type: 'error',
        message: 'Failed to restore database from SQL backup.'
      });
      console.error(err);
    }
  };

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.headerSection}>
        <div>
          <h2 className={styles.title}>Database Restore</h2>
          <p className={styles.subtitle}>
            Upload or import SQL backup archives to roll back employee, company, or attendance logs.
          </p>
        </div>
      </div>

      {/* Main card panel */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <RefreshCw size={20} style={{ color: 'var(--primary)' }} />
          <h3 className={styles.cardTitle}>Upload Restore File</h3>
        </div>

        {/* Dash zone wrapper */}
        {!selectedFile ? (
          <div className={styles.uploadZone} onClick={handleZoneClick}>
            <UploadCloud size={48} className={styles.uploadIcon} />
            <h4 className={styles.uploadTitle}>Choose an SQL database backup file</h4>
            <p className={styles.uploadSubtitle}>Supported format: SQL database backup (.sql)</p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".sql"
              className={styles.fileInput}
            />
          </div>
        ) : (
          /* Visual file metadata inspector */
          <div className={styles.fileDetailsCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', marginBottom: '8px' }}>
              <CheckCircle2 size={18} />
              <strong style={{ fontSize: '0.95rem' }}>SQL Backup Loaded Successfully</strong>
            </div>

            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>File Name</span>
              <span className={styles.detailValue}>{backupMetadata?.name}</span>
            </div>

            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>File Size</span>
              <span className={styles.detailValue}>{backupMetadata?.size}</span>
            </div>

            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Exported On</span>
              <span className={styles.detailValue}>{backupMetadata?.exportedAt}</span>
            </div>

            {backupMetadata?.summary && (
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                  RECORDS TO IMPORT:
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '0.8rem' }}>
                  <div>Employees: <strong>{backupMetadata.summary.employeesCount}</strong></div>
                  <div>Companies: <strong>{backupMetadata.summary.companiesCount}</strong></div>
                  <div>Challan Dates: <strong>{backupMetadata.summary.challansCount}</strong></div>
                  <div>Resignations: <strong>{backupMetadata.summary.resignationsCount}</strong></div>
                </div>
              </div>
            )}

            <button type="button" className={styles.clearFileLink} onClick={clearFile}>
              Clear File
            </button>
          </div>
        )}

        {/* Overwrite danger notice */}
        <div className={styles.warningBox}>
          <ShieldAlert size={28} style={{ color: 'var(--danger)', flexShrink: 0 }} />
          <div className={styles.warningContent}>
            <h4>Overwriting Pre-Existing Records</h4>
            <p>
              Restoring a database will completely overwrite all current employee lists, company establishments, 
              resignation records, and monthly attendance sheets. Ensure you have backed up any unsaved data 
              before confirming this import.
            </p>
          </div>
        </div>

        <div className={styles.actionRow}>
          <button
            type="button"
            className={styles.importBtn}
            onClick={handleImportClick}
            disabled={!parsedData}
          >
            <FileText size={16} />
            Import Database
          </button>
        </div>
      </div>

      {/* Confirmation modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmImport}
        title="Overwrite & Restore Database?"
        message="Are you sure you want to restore the selected SQL database backup? This will overwrite all current employees, establishments, and attendance registers. The application will reload automatically upon completion."
      />
    </div>
  );
};

export default RestorePage;
