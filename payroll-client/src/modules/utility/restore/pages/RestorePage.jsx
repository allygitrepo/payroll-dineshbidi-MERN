import React, { useState, useRef } from 'react';
import { RefreshCw, UploadCloud, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';
import { useToast, ConfirmModal } from '../../../../shared/components';
import { uploadForPreview, executeRestore } from '../services/restoreService';
import styles from '../components/RestorePage.module.css';

const RestorePage = () => {
  const addToast = useToast();
  const fileInputRef = useRef(null);

  // States
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleZoneClick = () => {
    if (fileInputRef.current && !isUploading && !isRestoring) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
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
    setIsUploading(true);

    try {
      const result = await uploadForPreview(file);
      if (result.status && result.data) {
        setPreviewData({
          name: file.name,
          size: (file.size / 1024).toFixed(2) + ' KB',
          tempFilename: result.data.tempFilename,
          summary: result.data.summary,
          tables: result.data.tables
        });
        addToast({
          type: 'success',
          message: 'SQL database backup loaded successfully! Ready to import.'
        });
      } else {
        throw new Error(result.message || 'Unknown error during preview');
      }
    } catch (err) {
      addToast({
        type: 'error',
        message: err.message || 'Failed to analyze SQL backup file.'
      });
      clearFile();
    } finally {
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportClick = () => {
    if (!previewData) return;
    setIsConfirmOpen(true);
  };

  const handleConfirmImport = async () => {
    try {
      setIsRestoring(true);
      await executeRestore(previewData.tempFilename);

      addToast({
        type: 'success',
        message: 'SQL database restored successfully! Reloading workspace to apply...'
      });

      setIsConfirmOpen(false);

      // Force a system reload to refresh state and reconnect
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (err) {
      addToast({
        type: 'error',
        message: err.message || 'Failed to restore database from SQL backup.'
      });
      console.error(err);
      setIsRestoring(false);
      setIsConfirmOpen(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.headerSection}>
        <div>
          <h2 className={styles.title}>Database Restore</h2>
          <p className={styles.subtitle}>
            Upload or import SQL backup archives to securely roll back all database records.
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
          <div className={styles.uploadZone} onClick={handleZoneClick} style={{ opacity: isUploading ? 0.6 : 1, cursor: isUploading ? 'wait' : 'pointer' }}>
            <UploadCloud size={48} className={styles.uploadIcon} />
            <h4 className={styles.uploadTitle}>{isUploading ? 'Analyzing File...' : 'Choose an SQL database backup file'}</h4>
            <p className={styles.uploadSubtitle}>Supported format: SQL database backup (.sql)</p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".sql"
              className={styles.fileInput}
              disabled={isUploading || isRestoring}
            />
          </div>
        ) : (
          /* Visual file metadata inspector */
          <div className={styles.fileDetailsCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', marginBottom: '8px' }}>
              <CheckCircle2 size={18} />
              <strong style={{ fontSize: '0.95rem' }}>SQL Backup Analyzed Successfully</strong>
            </div>

            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>File Name</span>
              <span className={styles.detailValue}>{previewData?.name}</span>
            </div>

            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>File Size</span>
              <span className={styles.detailValue}>{previewData?.size}</span>
            </div>

            {previewData?.summary && (
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                  MYSQL DUMP PREVIEW:
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '0.9rem' }}>
                  <div>Tables Found: <strong>{previewData.summary.tablesFound}</strong></div>
                  <div>Rows To Restore: <strong>{previewData.summary.totalRows}</strong></div>
                </div>
                {previewData.tables && previewData.tables.length > 0 && (
                  <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-tertiary)', maxHeight: '100px', overflowY: 'auto' }}>
                    {previewData.tables.map((t, idx) => (
                      <div key={idx} style={{ padding: '2px 0' }}>
                        • `{t.tableName}` ({t.rowsCount} rows)
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button type="button" className={styles.clearFileLink} onClick={clearFile} disabled={isRestoring}>
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
              Restoring a database will completely drop existing tables and overwrite all current records including employees, companies, and historical data. Ensure you have backed up any unsaved data before confirming this import.
            </p>
          </div>
        </div>

        <div className={styles.actionRow}>
          <button
            type="button"
            className={styles.importBtn}
            onClick={handleImportClick}
            disabled={!previewData || isRestoring}
            style={{ opacity: (!previewData || isRestoring) ? 0.7 : 1, cursor: isRestoring ? 'wait' : 'pointer' }}
          >
            <FileText size={16} />
            {isRestoring ? 'Restoring Database...' : 'Proceed with Restore'}
          </button>
        </div>
      </div>

      {/* Confirmation modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmImport}
        title="Overwrite & Restore MySQL Database?"
        message="Are you absolutely sure you want to execute this SQL dump? This will drop current tables and overwrite all data permanently. The system will reload automatically upon completion."
      />
    </div>
  );
};

export default RestorePage;
