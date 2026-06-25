import React, { useState, useRef } from 'react';
import { FileSpreadsheet, Upload, Download, Copy, FileText, X } from 'lucide-react';
import { useToast } from '../../../../shared/components';
import * as XLSX from 'xlsx';
import styles from '../components/ExcelToTextPage.module.css';

const ExcelToTextPage = () => {
  const [file, setFile] = useState(null);
  const [fileHeaders, setFileHeaders] = useState([]);
  const [fileData, setFileData] = useState([]);
  const [convertedText, setConvertedText] = useState('');
  const fileInputRef = useRef(null);
  const addToast = useToast();

  const generateFormatText = (headers, dataRows) => {
    const resultLines = dataRows.map((row) => {
        const formattedRow = headers.map((_, colIdx) => {
            const cellVal = row[colIdx];
            return cellVal !== undefined && cellVal !== null ? String(cellVal).trim() : '';
        });
        return formattedRow.join('#~#');
    });
    return resultLines.join('\n');
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
      if (['xlsx', 'xls', 'csv'].includes(fileExtension)) {
        setFile(selectedFile);
        setConvertedText('');
        setFileHeaders([]);
        setFileData([]);

        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
            const rows = jsonData.filter(row => row.some(cell => cell !== ''));
            
            if (rows.length > 0) {
              const headers = rows[0];
              const dataRows = rows.length > 1 ? rows.slice(1) : [];
              
              setFileHeaders(headers);
              setFileData(dataRows);
              
              // Instantly generate and set the converted text
              const generatedOutput = generateFormatText(headers, dataRows);
              setConvertedText(generatedOutput);

              addToast({
                type: 'info',
                message: `Parsed file: ${selectedFile.name}`
              });
            } else {
              addToast({
                type: 'warning',
                message: 'The uploaded file appears to be empty.'
              });
            }
          } catch (err) {
            console.error(err);
            addToast({
              type: 'error',
              message: 'Failed to parse Excel file.'
            });
          }
        };
        reader.readAsArrayBuffer(selectedFile);

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
    setFileHeaders([]);
    setFileData([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    addToast({
      type: 'info',
      message: 'File selection cleared.'
    });
  };

  const triggerTxtDownload = (textData) => {
    if (!textData) return;
    const filename = file ? `${file.name.substring(0, file.name.lastIndexOf('.'))}_converted.txt` : `converted_output.txt`;
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
      <div className={styles.headerSection}>
        <div>
          <h2 className={styles.title}>Excel To Text</h2>
          <p className={styles.subtitle}>
            Upload your spreadsheet files and instantly convert them to raw `#~#` delimited text.
          </p>
        </div>
      </div>

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
          </div>
        </div>

        {file && fileHeaders.length > 0 && (
          <div>
            <div className={styles.previewTitle}>
              File Data Preview
              <span className={styles.previewBadge}>{fileData.length} rows loaded</span>
            </div>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: '60px', textAlign: 'center', paddingLeft: '8px', paddingRight: '8px' }}>Sr No.</th>
                    {fileHeaders.map((header, idx) => (
                      <th key={idx}>{header || `Col ${idx + 1}`}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fileData.slice(0, 50).map((row, rowIdx) => (
                    <tr key={rowIdx}>
                      <td style={{ textAlign: 'center', fontWeight: '500', paddingLeft: '8px', paddingRight: '8px', color: 'var(--text-muted)' }}>
                        {rowIdx + 1}
                      </td>
                      {fileHeaders.map((_, colIdx) => (
                        <td key={colIdx} style={{ color: 'var(--text-primary)' }}>
                          {row[colIdx] !== undefined && row[colIdx] !== null ? String(row[colIdx]) : ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {fileData.length > 50 && (
                     <tr>
                        <td colSpan={fileHeaders.length + 1} style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', padding: '10px' }}>
                           ...and {fileData.length - 50} more rows hidden in preview...
                        </td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {convertedText && (
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
              style={{ fontFamily: 'monospace', whiteSpace: 'pre', overflowX: 'auto', minHeight: '150px' }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ExcelToTextPage;
