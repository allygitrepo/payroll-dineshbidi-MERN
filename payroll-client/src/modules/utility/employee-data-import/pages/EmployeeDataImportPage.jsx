import React, { useState, useRef } from 'react';
import { FileUp, FileSpreadsheet, Download, Loader2, X, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../../../shared/components';
import styles from '../components/EmployeeDataImportPage.module.css';

const MOCK_PREVIEW_RECORDS = [
  { srNo: 1, name: 'Dinesh Bidi', fatherName: 'Ramji Bidi', gender: 'MALE', uan: '100984728192', ipNo: '3128471928', dob: '15/08/1988', doj: '01/04/2018' },
  { srNo: 2, name: 'Jenil Patel', fatherName: 'Arvind Patel', gender: 'MALE', uan: '101273849182', ipNo: '3147284910', dob: '23/11/1995', doj: '10/05/2021' },
  { srNo: 3, name: 'Ramesh Sen', fatherName: 'Gopal Sen', gender: 'MALE', uan: '100482910482', ipNo: '3109384721', dob: '04/02/1985', doj: '15/06/2019' },
  { srNo: 4, name: 'Pooja Sharma', fatherName: 'Vijay Sharma', gender: 'FEMALE', uan: '100582910492', ipNo: '3105739104', dob: '12/05/1992', doj: '01/01/2020' },
  { srNo: 5, name: 'Amit Verma', fatherName: 'Sanjay Verma', gender: 'MALE', uan: '101293847201', ipNo: '3149281038', dob: '30/09/1990', doj: '01/10/2022' }
];

const EmployeeDataImportPage = () => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);
  const addToast = useToast();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    if (!selectedFile) return;

    const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
    if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      setFile(selectedFile);
      addToast({
        type: 'info',
        message: `Selected file: ${selectedFile.name}`
      });
    } else {
      addToast({
        type: 'error',
        message: 'Unsupported file format! Please upload an Excel file (.xlsx or .xls).'
      });
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    addToast({
      type: 'info',
      message: 'File selection cleared.'
    });
  };

  const handleUploadZoneClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImport = () => {
    if (!file) {
      addToast({
        type: 'error',
        message: 'Please choose or drag an Excel file first!'
      });
      return;
    }

    setIsImporting(true);
    setProgress(0);

    const duration = 2000; // 2 seconds total simulation
    const intervalTime = 100;
    const steps = duration / intervalTime;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const currentProgress = Math.min(Math.round((currentStep / steps) * 100), 100);
      setProgress(currentProgress);

      if (currentStep >= steps) {
        clearInterval(interval);
        setTimeout(() => {
          setIsImporting(false);
          setFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          addToast({
            type: 'success',
            message: 'Database imported successfully! 15 employees created.'
          });
        }, 300);
      }
    }, intervalTime);
  };

  const handleDownloadTemplate = () => {
    addToast({
      type: 'success',
      message: 'Excel import template format downloaded successfully.'
    });
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={styles.container}>
      {/* Header section */}
      <div className={styles.headerSection}>
        <div>
          <h2 className={styles.title}>Employee Data Import</h2>
          <p className={styles.subtitle}>
            Upload, validate, and parse Excel sheets to import employee databases into the system.
          </p>
        </div>
      </div>

      {/* Main card */}
      <div className={styles.card}>
        <label className={styles.label}>
          Employee File Import
          <span className={styles.required}>*</span>
        </label>

        {/* Upload Zone */}
        <div
          className={`${styles.uploadZone} ${dragActive ? styles.uploadZoneActive : ''}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={handleUploadZoneClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {!file ? (
            <>
              <FileUp size={48} className={styles.uploadIcon} />
              <div className={styles.uploadText}>
                Drag & drop Excel file here, or <span style={{ color: 'var(--primary)', fontWeight: '600' }}>click to browse</span>
              </div>
              <div className={styles.uploadSubtext}>Supports .xlsx and .xls formats</div>
            </>
          ) : (
            <div className={styles.fileDetailsContainer}>
              <div className={styles.fileDetails} onClick={(e) => e.stopPropagation()}>
                <FileSpreadsheet size={32} className={styles.fileIcon} />
                <div className={styles.fileInfo}>
                  <div className={styles.fileName}>{file.name}</div>
                  <div className={styles.fileSize}>{formatBytes(file.size)}</div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className={styles.removeBtn}
                  title="Remove selected file"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Progress loader if importing */}
        {isImporting && (
          <div className={styles.progressContainer}>
            <div className={styles.progressHeader}>
              <span className={styles.progressTitle}>Processing import database...</span>
              <span className={styles.progressPercent}>{progress}%</span>
            </div>
            <div className={styles.progressBarBg}>
              <div
                className={styles.progressBarFill}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Preview of file content before import */}
        {file && !isImporting && (
          <>
            <div className={styles.previewTitle}>
              File Data Preview
              <span className={styles.previewBadge}>First 5 rows found</span>
            </div>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: '70px', textAlign: 'center' }}>Sr No.</th>
                    <th>Member Name</th>
                    <th>Father/Husband Name</th>
                    <th>Gender</th>
                    <th>UAN</th>
                    <th>ESIC IP Number</th>
                    <th>Date Of Birth</th>
                    <th>Date Of Joining</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_PREVIEW_RECORDS.map((row) => (
                    <tr key={row.srNo}>
                      <td style={{ textAlign: 'center', fontWeight: '500' }}>{row.srNo}</td>
                      <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{row.name}</td>
                      <td>{row.fatherName}</td>
                      <td>{row.gender}</td>
                      <td>{row.uan}</td>
                      <td>{row.ipNo}</td>
                      <td>{row.dob}</td>
                      <td>{row.doj}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Action Button Group */}
        <div className={styles.buttonGroup}>
          <button
            type="button"
            className={styles.importBtn}
            onClick={handleImport}
            disabled={!file || isImporting}
          >
            {isImporting ? (
              <>
                <Loader2 size={18} className={styles.spinner} />
                Importing...
              </>
            ) : (
              <>
                <CheckCircle2 size={18} />
                Import Data
              </>
            )}
          </button>

          <button
            type="button"
            className={styles.downloadBtn}
            onClick={handleDownloadTemplate}
            disabled={isImporting}
          >
            <Download size={18} />
            Download Excel Format
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDataImportPage;
