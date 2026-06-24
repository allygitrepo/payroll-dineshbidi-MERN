import React, { useState, useRef } from 'react';
import { FileSpreadsheet, Upload, Download, Loader2, CheckCircle2, Copy, FileText, X } from 'lucide-react';
import { useToast } from '../../../../shared/components';
import styles from '../components/ExcelToTextPage.module.css';

const MOCK_SALARY_PREVIEW = [
  { srNo: 1, name: 'Dinesh Bidi', accountNo: '482019482938', ifsc: 'HDFC0000123', amount: 18500, bankName: 'HDFC Bank' },
  { srNo: 2, name: 'Jenil Patel', accountNo: '918273948572', ifsc: 'SBIN0004829', amount: 22400, bankName: 'State Bank of India' },
  { srNo: 3, name: 'Ramesh Sen', accountNo: '302910384729', ifsc: 'ICIC0000045', amount: 15600, bankName: 'ICICI Bank' },
  { srNo: 4, name: 'Pooja Sharma', accountNo: '582910492810', ifsc: 'UTIB0000234', amount: 19800, bankName: 'Axis Bank' },
  { srNo: 5, name: 'Amit Verma', accountNo: '729103847291', ifsc: 'BARB0COLLEG', amount: 24500, bankName: 'Bank of Baroda' }
];

const ExcelToTextPage = () => {
  const [file, setFile] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [convertedText, setConvertedText] = useState('');
  const fileInputRef = useRef(null);
  const addToast = useToast();

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
      if (['xlsx', 'xls', 'csv'].includes(fileExtension)) {
        setFile(selectedFile);
        setConvertedText('');
        addToast({
          type: 'info',
          message: `Selected file: ${selectedFile.name}`
        });
      } else {
        addToast({
          type: 'error',
          message: 'Unsupported format! Please select an Excel file (.xlsx, .xls) or CSV file.'
        });
      }
    }
  };

  const handleChooseFileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    setFile(null);
    setConvertedText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    addToast({
      type: 'info',
      message: 'File selection cleared.'
    });
  };

  const generateFormatText = () => {
    let resultLines = [];
    MOCK_SALARY_PREVIEW.forEach((row) => {
      resultLines.push(`${row.accountNo}\t${row.name}\t${row.amount}\t${row.ifsc}`);
    });
    return resultLines.join('\n');
  };

  const handleConvert = () => {
    if (!file) {
      addToast({
        type: 'error',
        message: 'Please choose an Excel file first!'
      });
      return;
    }

    setIsConverting(true);
    setProgress(0);
    setConvertedText('');

    const duration = 1800; // 1.8s conversion simulation
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
          setIsConverting(false);
          const generatedOutput = generateFormatText();
          setConvertedText(generatedOutput);
          
          addToast({
            type: 'success',
            message: 'Excel converted successfully!'
          });

          // Trigger automatic file download
          triggerTxtDownload(generatedOutput);
        }, 300);
      }
    }, intervalTime);
  };

  const triggerTxtDownload = (textData) => {
    if (!textData) return;
    const filename = file ? `${file.name.substring(0, file.name.lastIndexOf('.'))}_converted.txt` : `salary_disbursement.txt`;
    const element = document.createElement('a');
    const fileObj = new Blob([textData], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(fileObj);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    addToast({
      type: 'success',
      message: `Downloaded converted text file: ${filename}`
    });
  };

  const handleCopyText = () => {
    if (!convertedText) return;
    navigator.clipboard.writeText(convertedText);
    addToast({
      type: 'success',
      message: 'Converted text copied to clipboard!'
    });
  };

  return (
    <div className={styles.container}>
      {/* Header section */}
      <div className={styles.headerSection}>
        <div>
          <h2 className={styles.title}>Excel To Text</h2>
          <p className={styles.subtitle}>
            Upload your payroll spreadsheet files and convert them to formatted text dumps for bank uploads.
          </p>
        </div>
      </div>

      {/* Main card controls */}
      <div className={styles.card}>
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Select Excel File For Convert <span className={styles.required}>*</span>
          </label>
          
          <div className={styles.converterControls}>
            <div className={styles.fileInputWrapper}>
              <input 
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <button 
                type="button" 
                onClick={handleChooseFileClick}
                className={styles.customFileBtn}
                disabled={isConverting}
              >
                <Upload size={16} />
                Choose File
              </button>
              
              {file ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={styles.fileName}>{file.name}</span>
                  <button 
                    type="button" 
                    onClick={handleRemoveFile}
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    title="Remove file"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <span className={styles.fileName}>No file chosen</span>
              )}
            </div>

            <button 
              type="button"
              onClick={handleConvert}
              className={styles.convertBtn}
              disabled={!file || isConverting}
            >
              {isConverting ? (
                <>
                  <Loader2 size={16} className={styles.spinner} />
                  Converting...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Convert
                </>
              )}
            </button>
          </div>
        </div>

        {/* Progress simulation container */}
        {isConverting && (
          <div className={styles.progressContainer}>
            <div className={styles.progressHeader}>
              <span className={styles.progressTitle}>Converting to bank text format...</span>
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

        {/* Mock Spreadsheet Preview */}
        {file && !isConverting && (
          <div>
            <div className={styles.previewTitle}>
              File Data Preview
              <span className={styles.previewBadge}>Spreadsheet rows loaded</span>
            </div>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: '100px', textAlign: 'center', paddingLeft: '8px', paddingRight: '8px' }}>Sr No.</th>
                    <th>Employee Name</th>
                    <th>Account Number</th>
                    <th>IFSC Code</th>
                    <th>Salary Amount</th>
                    <th>Bank Name</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_SALARY_PREVIEW.map((row) => (
                    <tr key={row.srNo}>
                      <td style={{ textAlign: 'center', fontWeight: '500', paddingLeft: '8px', paddingRight: '8px' }}>{row.srNo}</td>
                      <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{row.name}</td>
                      <td>{row.accountNo}</td>
                      <td>{row.ifsc}</td>
                      <td style={{ fontWeight: '500', color: 'var(--primary)' }}>₹{row.amount.toLocaleString('en-IN')}</td>
                      <td>{row.bankName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Converted Output Text Area */}
        {convertedText && !isConverting && (
          <div className={styles.resultSection}>
            <div className={styles.resultTitle}>
              <FileText size={18} style={{ color: 'var(--primary)' }} />
              Formatted Text Output
            </div>
            
            <div className={styles.resultActions}>
              <button 
                type="button" 
                className={styles.downloadTxtBtn}
                onClick={() => triggerTxtDownload(convertedText)}
              >
                <Download size={16} />
                Download .txt File
              </button>
              <button 
                type="button" 
                className={styles.copyBtn}
                onClick={handleCopyText}
              >
                <Copy size={16} />
                Copy to Clipboard
              </button>
            </div>

            <textarea 
              readOnly 
              value={convertedText} 
              className={styles.textPreview}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ExcelToTextPage;
