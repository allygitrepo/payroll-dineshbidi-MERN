import React, { useState, useRef } from 'react';
import { FileUp, FileSpreadsheet, Download, Loader2, X, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../../../shared/components';
import * as XLSX from 'xlsx';
import { saveEmployee } from '../../../master/employee/services/employeeService';
import { getContractors } from '../../../master/contractor/services/contractorService';
import { getAddresses } from '../../../master/address/services/addressService';
import styles from '../components/EmployeeDataImportPage.module.css';



const EmployeeDataImportPage = () => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewData, setPreviewData] = useState({ columns: [], rows: [] });
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

      // Parse for preview
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
          
          if (jsonData.length > 0) {
            const columns = Object.keys(jsonData[0]);
            const rows = jsonData.slice(0, 5);
            setPreviewData({ columns, rows });
          } else {
             setPreviewData({ columns: [], rows: [] });
          }
        } catch (err) {
          console.error("Preview parsing failed", err);
        }
      };
      reader.readAsArrayBuffer(selectedFile);

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
    setPreviewData({ columns: [], rows: [] });
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

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const companyId = localStorage.getItem('selectedCompany');
        if (!companyId) throw new Error("No active company context. Please select a company first.");

        const totalRows = jsonData.length;
        if (totalRows === 0) throw new Error("Excel file is empty");

        const contractorsList = await getContractors(companyId);
        const addressesList = await getAddresses(companyId);
        const defaultAddressId = addressesList.length > 0 ? addressesList[0].id : undefined;

        if (!defaultAddressId) {
          throw new Error("No addresses found for this company. Please create at least one address first.");
        }

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < totalRows; i++) {
          const row = jsonData[i];
          try {
            const employeeObj = {
              memberName: row['Member Name'] || '',
              uan: row['Universal Account Number'] || '',
              ipNumber: row['IP Number'] || '',
              memberId: row['Previous Member Id'] || '',
              contractor: row['Contractor Name'] || 'SELF',
              employeeType: row['Type Of Employee'] || 'BIDI MAKER',
              gender: (row['Gender'] || 'MALE').toUpperCase(),
              dob: row['Date Of Birth'] || '',
              dateOfJoining: row['Date Of Joining'] || '',
              fatherHusbandName: row['Father/Husband Name'] || '',
              relation: row['Relationship'] || '',
              maritalStatus: row['Marital Status'] || 'SINGLE',
              mobile: row['Mobile Number'] || '',
              email: row['Email Id'] || '',
              aadhaarCard: row['Aadhaar Number'] || '',
              nationality: row['Nationality'] || 'INDIAN',
              pmrpy: (row['PMRPY'] || 'NO').toUpperCase(),
              address_id: defaultAddressId,
              kycDetails: [
                { documentType: 'PAN', documentNumber: row['PAN'] || '' },
                { documentType: 'BANK PASSBOOK', documentNumber: row['Bank Account Number'] || '', ifsc: row['Bank IFSC'] || '' }
              ].filter(k => k.documentNumber), // filter out empty
              nomineeDetails: [],
              familyDetails: []
            };

            await saveEmployee(employeeObj, companyId, addressesList, contractorsList);
            successCount++;
          } catch (err) {
            console.error("Failed to import row", row, err);
            failCount++;
          }
          setProgress(Math.round(((i + 1) / totalRows) * 100));
        }

        setIsImporting(false);
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';

        addToast({
          type: 'success',
          message: `Import complete! Successfully created ${successCount} employees. ${failCount > 0 ? `Failed: ${failCount}` : ''}`
        });
      } catch (error) {
        setIsImporting(false);
        setProgress(0);
        addToast({
          type: 'error',
          message: 'Failed to parse Excel file: ' + error.message
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDownloadTemplate = () => {
    const ws_data = [
      [
        'Universal Account Number', 'IP Number', 'Previous Member Id', 'Contractor Name', 
        'Type Of Employee', 'Member Name', 'Gender', 'Date Of Birth', 'Date Of Joining', 
        'Father/Husband Name', 'Relationship', 'Marital Status', 'Mobile Number', 
        'Email Id', 'Aadhaar Number', 'PAN', 'Bank Account Number', 'Nationality', 
        'PMRPY', 'Bank IFSC'
      ],
      [
        '100984728192', '3128471928', '', 'Self', 'BIDI MAKER', 'Dinesh Bidi', 'MALE', 
        '1988-08-15', '2018-04-01', 'Ramji Bidi', 'FATHER', 'MARRIED', '9876543210', 
        'test@example.com', '123456789012', 'ABCDE1234F', '123456789', 'INDIAN', 'NO', 'SBIN0001234'
      ]
    ];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    
    // Set some column widths
    ws['!cols'] = Array(20).fill({ wch: 20 });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employees");
    XLSX.writeFile(wb, "Employee_Import_Template.xlsx");

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
        {file && !isImporting && previewData.columns.length > 0 && (
          <>
            <div className={styles.previewTitle}>
              File Data Preview
              <span className={styles.previewBadge}>First {previewData.rows.length} rows found</span>
            </div>
            <div className={styles.tableContainer} style={{ overflowX: 'auto' }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: '70px', textAlign: 'center', whiteSpace: 'nowrap' }}>Sr No.</th>
                    {previewData.columns.map((col, idx) => (
                      <th key={idx} style={{ whiteSpace: 'nowrap' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.rows.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{ textAlign: 'center', fontWeight: '500' }}>{idx + 1}</td>
                      {previewData.columns.map((col, colIdx) => (
                        <td key={colIdx} style={{ whiteSpace: 'nowrap' }}>{row[col]}</td>
                      ))}
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
