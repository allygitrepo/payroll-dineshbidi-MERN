import React, { useState, useRef } from 'react';
import { FileUp, FileSpreadsheet, Download, Loader2, X, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../../../shared/components';
import * as XLSX from 'xlsx';
import { getContractors, saveContractor, createContractorLogin } from '../../../master/contractor/services/contractorService';
import { getAddresses, saveAddress } from '../../../master/address/services/addressService';
import styles from '../components/ContractorDataImportPage.module.css';

const parseExcelDate = (excelVal) => {
  if (!excelVal) return '';
  if (excelVal instanceof Date) {
    return excelVal.toISOString().split('T')[0];
  }
  const str = String(excelVal).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  const parts = str.split(/[\/\-]/);
  if (parts.length === 3) {
    let year = parts[2];
    if (year.length === 2) {
      year = parseInt(year, 10) > 30 ? '19' + year : '20' + year;
    }
    if (year.length === 4) {
      // Check for DD/MM/YYYY
      const parsedStr = `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      if (!isNaN(new Date(parsedStr).getTime())) {
        return parsedStr;
      }
    }
  }
  if (!isNaN(str) && Number(str) > 20000) {
    const date = new Date(Math.round((Number(str) - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  return '';
};

const ContractorDataImportPage = () => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewData, setPreviewData] = useState({ columns: [], rows: [] });
  const [analysisSummary, setAnalysisSummary] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
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
    setAnalysisSummary(null);
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

  const handleAnalyze = () => {
    if (!file) {
      addToast({ type: 'error', message: 'Please choose or drag an Excel file first!' });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisSummary(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });

        const companyId = localStorage.getItem('selectedCompany');
        if (!companyId) throw new Error("No active company context. Please select a company first.");

        const totalRows = jsonData.length;
        if (totalRows === 0) throw new Error("Excel file is empty");

        const existingContractors = await getContractors(companyId);
        const addressesList = await getAddresses(companyId);

        const missingAddressesMap = new Map();
        const summary = { added: [], updated: [], failed: [] };

        for (let i = 0; i < totalRows; i++) {
          const row = jsonData[i];

          const safeVal = (val) => {
            const str = val ? String(val).trim() : '';
            if (str.toUpperCase() === 'NA' || str.toUpperCase() === 'N/A' || str === '-') return '';
            return str;
          };

          const name = safeVal(row['Name']);
          if (!name) {
            summary.failed.push({ rowNumber: i + 2, name: 'Unknown', reason: "Missing required field: Name." });
            continue;
          }

          const addressStr = safeVal(row['Address']).toUpperCase();
          if (addressStr) {
            const match = addressesList.find(a => String(a.address).trim().toUpperCase() === addressStr);
            if (!match && !missingAddressesMap.has(addressStr)) {
              missingAddressesMap.set(addressStr, {
                address: addressStr,
                postOffice: safeVal(row['Post Office'] || 'UNKNOWN').toUpperCase(),
                district: safeVal(row['District'] || 'UNKNOWN').toUpperCase(),
                pincode: safeVal(row['Pincode'] || '000000')
              });
            }
          }

          const contractorObj = {
            rowNumber: i + 2,
            ccode: row['Code'] ? String(row['Code']) : '',
            name,
            address: addressStr,
            postOffice: safeVal(row['Post Office']),
            district: safeVal(row['District']),
            pincode: safeVal(row['Pincode']),
            pfCode: safeVal(row['PF Code']),
            dateOfJoining: parseExcelDate(row['Date of Joining']),
            pan: safeVal(row['PAN']),
            aadhaar: safeVal(row['Aadhaar']),
            gstNo: safeVal(row['GST No']),
            bankAccount: safeVal(row['Bank Account']),
            bankName: safeVal(row['Bank Name']),
            ifsc: safeVal(row['IFSC']),
            whatsappNumber: safeVal(row['WhatsApp Number'] || row['whatsapp_number'] || row['whatsappNumber'] || row['WhatsApp'] || row['whatsapp'] || ''),
            status: (String(row['Status'] || '1').trim() === '0' || String(row['Status'] || '').trim().toUpperCase() === 'INACTIVE') ? 'Inactive' : 'Active',
            loginIdVal: safeVal(row['Login ID'] || row['Login id'] || row['login id'] || row['Username'] || row['username'] || ''),
            passwordVal: safeVal(row['Password'] || row['password'] || ''),
            sendToWhatsappVal: safeVal(row['Send to WhatsApp'] || row['Send to whatsapp'] || row['send to whatsapp'] || 'NO').toUpperCase(),
            addressStr
          };

          // Find match by ID or Code
          let existingMatch = null;
          if (row['ID (Do Not Modify)']) {
            existingMatch = existingContractors.find(c => String(c.id).toLowerCase() === String(row['ID (Do Not Modify)']).toLowerCase());
          }
          if (!existingMatch && contractorObj.ccode) {
            existingMatch = existingContractors.find(c => String(c.ccode).trim().toLowerCase() === String(contractorObj.ccode).trim().toLowerCase());
          }

          if (existingMatch) {
            contractorObj.id = existingMatch.id;
            
            // Calculate changed fields
            const changes = [];
            const safeStr = (val) => String(val || '').trim().toLowerCase();
            if (safeStr(contractorObj.ccode) !== safeStr(existingMatch.ccode)) changes.push('Code');
            if (safeStr(contractorObj.name) !== safeStr(existingMatch.name)) changes.push('Name');
            if (safeStr(contractorObj.addressStr) !== safeStr(existingMatch.address)) changes.push('Address');
            if (safeStr(contractorObj.postOffice) !== safeStr(existingMatch.postOffice)) changes.push('Post Office');
            if (safeStr(contractorObj.district) !== safeStr(existingMatch.district)) changes.push('District');
            if (safeStr(contractorObj.pincode) !== safeStr(existingMatch.pincode)) changes.push('Pincode');
            if (safeStr(contractorObj.pfCode) !== safeStr(existingMatch.pfCode)) changes.push('PF Code');
            if (safeStr(contractorObj.dateOfJoining) !== safeStr(existingMatch.dateOfJoining)) changes.push('Date of Joining');
            if (safeStr(contractorObj.pan) !== safeStr(existingMatch.pan)) changes.push('PAN');
            if (safeStr(contractorObj.aadhaar) !== safeStr(existingMatch.aadhaar)) changes.push('Aadhaar');
            if (safeStr(contractorObj.gstNo) !== safeStr(existingMatch.gstNo)) changes.push('GST No');
            if (safeStr(contractorObj.bankAccount) !== safeStr(existingMatch.bankAccount)) changes.push('Bank Account');
            if (safeStr(contractorObj.bankName) !== safeStr(existingMatch.bankName)) changes.push('Bank Name');
            if (safeStr(contractorObj.ifsc) !== safeStr(existingMatch.ifsc)) changes.push('IFSC');
            if (safeStr(contractorObj.whatsappNumber) !== safeStr(existingMatch.whatsappNumber)) changes.push('WhatsApp Number');
            if (safeStr(contractorObj.status) !== safeStr(existingMatch.status)) changes.push('Status');
            
            contractorObj.changedColumns = changes;
            summary.updated.push(contractorObj);
          } else {
            summary.added.push(contractorObj);
          }
        }

        setAnalysisSummary({
          ...summary,
          missingAddresses: Array.from(missingAddressesMap.values()),
          addressesList,
          existingContractors,
          companyId
        });
        setIsAnalyzing(false);
      } catch (error) {
        setIsAnalyzing(false);
        addToast({ type: 'error', message: 'Failed to analyze Excel file: ' + error.message });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirmImport = async () => {
    if (!analysisSummary) return;

    setIsImporting(true);
    setProgress(0);

    const totalToProcess = analysisSummary.added.length + analysisSummary.updated.length;
    if (totalToProcess === 0) {
      setIsImporting(false);
      addToast({ type: 'info', message: 'No valid entries to process.' });
      return;
    }

    let processed = 0;
    let failCount = 0;
    const failedReasons = [];
    const { companyId } = analysisSummary;
    let addressesList = analysisSummary.addressesList;

    // 1. Auto-create missing addresses with real Excel details
    if (analysisSummary.missingAddresses && analysisSummary.missingAddresses.length > 0) {
      for (const addr of analysisSummary.missingAddresses) {
        try {
          await saveAddress({
            address: addr.address,
            postOffice: addr.postOffice,
            district: addr.district,
            pincode: addr.pincode,
            status: 'Active'
          }, companyId);
        } catch (e) {
          console.error("Failed to auto-create address", addr.address, e);
        }
      }
      addressesList = await getAddresses(companyId);
    }

    const defaultAddressId = addressesList.length > 0 ? addressesList[0].id : null;
    const processList = [...analysisSummary.added, ...analysisSummary.updated];

    for (const c of processList) {
      if (c.addressStr) {
        const matchedAddress = addressesList.find(a => String(a.address).trim().toUpperCase() === c.addressStr.trim().toUpperCase());
        if (matchedAddress) {
          c.address_id = matchedAddress.id;
        } else {
          c.address_id = defaultAddressId;
        }
      } else {
        c.address_id = defaultAddressId;
      }

      try {
        const updatedList = await saveContractor(c, companyId, addressesList);
        processed++;

        if (c.loginIdVal) {
          const savedContractor = updatedList.find(item => {
            if (c.ccode && item.ccode) {
              return String(item.ccode).trim().toLowerCase() === String(c.ccode).trim().toLowerCase();
            }
            return String(item.name).trim().toLowerCase() === String(c.name).trim().toLowerCase();
          });

          if (savedContractor) {
            const hasExplicitPassword = !!c.passwordVal;
            const shouldSendWhatsapp = (c.sendToWhatsappVal === 'YES' || c.sendToWhatsappVal === 'TRUE' || c.sendToWhatsappVal === '1') && hasExplicitPassword;
            await createContractorLogin(savedContractor.id, {
              username: c.loginIdVal,
              password: c.passwordVal || 'Pass1234!',
              sendWhatsapp: shouldSendWhatsapp
            });
          }
        }
      } catch (err) {
        console.error("Failed to save contractor", c, err);
        failCount++;
        failedReasons.push(`${c.name}: ${err?.response?.data?.messageToShow || err?.response?.data?.message || err.message}`);
      }
      setProgress(Math.round((processed / totalToProcess) * 100));
    }

    setIsImporting(false);
    setFile(null);
    setAnalysisSummary(null);
    setPreviewData({ columns: [], rows: [] });
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (failCount > 0) {
      addToast({
        type: 'error',
        message: `Import finished with errors. Saved ${processed - failCount}. Failed ${failCount}.`
      });
      console.warn("Backend Import Failures:", failedReasons);
    } else {
      addToast({
        type: 'success',
        message: `Import complete! Processed ${processed} contractors successfully.`
      });
    }
  };

  const handleDownloadTemplate = () => {
    const ws_data = [
      [
        'ID (Do Not Modify)', 'Code', 'Name', 'Address', 'Post Office', 'District', 
        'Pincode', 'PF Code', 'Date of Joining', 'PAN', 'Aadhaar', 'GST No', 
        'Bank Account', 'Bank Name', 'IFSC', 'Status', 'WhatsApp Number', 
        'Login ID', 'Password', 'Send to WhatsApp'
      ],
      [
        '', 'CONT-001', 'John Doe Services', 'Green Villa', 'Central PO', 'District A', 
        '123456', 'PF12345', '2020-01-01', 'ABCDE1234F', '123456789012', '22AAAAA0000A1Z5',
        '9876543210', 'State Bank of India', 'SBIN0001234', 'Active', '9876543210', 
        'john_doe_portal', 'Pass1234!', 'YES'
      ]
    ];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    ws['!cols'] = Array(20).fill({ wch: 18 });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contractors");
    XLSX.writeFile(wb, "Contractor_Import_Template.xlsx");

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
      <div className={styles.headerSection}>
        <div>
          <h2 className={styles.title}>Contractor Data Import</h2>
          <p className={styles.subtitle}>
            Upload, validate, and parse Excel sheets to import contractor databases into the system.
          </p>
        </div>
      </div>

      <div className={styles.card}>
        <label className={styles.label}>
          Contractor File Import
          <span className={styles.required}>*</span>
        </label>

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

        {analysisSummary && !isImporting && (
          <div className={styles.summaryContainer} style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#0f172a' }}>Import Analysis Summary</h3>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '15px', flexWrap: 'wrap' }}>
              <div style={{ padding: '10px 15px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '6px', fontWeight: '500' }}>
                ✓ {analysisSummary.added.length} New Entries
              </div>
              <div style={{ padding: '10px 15px', backgroundColor: '#fef08a', color: '#854d0e', borderRadius: '6px', fontWeight: '500' }}>
                ↻ {analysisSummary.updated.length} To Update
              </div>
              <div style={{ padding: '10px 15px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '6px', fontWeight: '500' }}>
                ✕ {analysisSummary.failed.length} Invalid Entries
              </div>
            </div>
            
            {analysisSummary.missingAddresses?.length > 0 && (
              <div className={styles.notice} style={{ backgroundColor: '#eff6ff', color: '#1e40af', padding: '10px', borderRadius: '6px', marginBottom: '10px', fontSize: '13px' }}>
                <strong>Notice:</strong> {analysisSummary.missingAddresses.length} missing addresses found in the Excel sheet. They will be automatically created in the database during import.
              </div>
            )}

            {analysisSummary.failed.length > 0 && (
              <div style={{ marginTop: '10px', fontSize: '13px', color: '#7f1d1d' }}>
                <strong>Issues detected:</strong>
                <ul style={{ margin: '5px 0 0 20px', padding: 0 }}>
                  {analysisSummary.failed.slice(0, 3).map((f, i) => (
                    <li key={i}>Row {f.rowNumber} ({f.name}): {f.reason}</li>
                  ))}
                  {analysisSummary.failed.length > 3 && (
                    <li>...and {analysisSummary.failed.length - 3} more.</li>
                  )}
                </ul>
              </div>
            )}

            {analysisSummary.updated.length > 0 && (
              <div style={{ marginTop: '15px', fontSize: '13px', color: '#854d0e', backgroundColor: '#fef9c3', padding: '12px', borderRadius: '6px' }}>
                <strong style={{ display: 'block', marginBottom: '8px' }}>Updates Details:</strong>
                <ul style={{ margin: '0 0 0 20px', padding: 0, maxHeight: '120px', overflowY: 'auto' }}>
                  {analysisSummary.updated.map((u, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>
                      Row {u.rowNumber} ({u.name}): {u.changedColumns.length > 0 
                        ? <span style={{ color: '#16a34a' }}>Updating {u.changedColumns.join(', ')}</span> 
                        : <span style={{ color: '#94a3b8' }}>No fields changed</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <p style={{ margin: '15px 0 0 0', fontWeight: '500', color: '#334155' }}>
              Do you want to continue and store valid entries into the database?
            </p>
          </div>
        )}

        <div className={styles.buttonGroup}>
          {!analysisSummary ? (
            <button
              type="button"
              className={styles.importBtn}
              onClick={handleAnalyze}
              disabled={!file || isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 size={18} className={styles.spinner} />
                  Analyzing...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  Analyze Data
                </>
              )}
            </button>
          ) : (
            <>
              <button
                type="button"
                className={styles.importBtn}
                onClick={handleConfirmImport}
                disabled={isImporting || (analysisSummary.added.length === 0 && analysisSummary.updated.length === 0)}
              >
                {isImporting ? (
                  <>
                    <Loader2 size={18} className={styles.spinner} />
                    Importing...
                  </>
                ) : (
                  <>
                    <FileUp size={18} />
                    Confirm & Save to DB
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setAnalysisSummary(null)}
                style={{ marginLeft: '10px', padding: '10px 20px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}
                disabled={isImporting}
              >
                Cancel
              </button>
            </>
          )}

          <button
            type="button"
            className={styles.downloadBtn}
            onClick={handleDownloadTemplate}
            disabled={isImporting || isAnalyzing}
          >
            <Download size={18} />
            Download Excel Format
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContractorDataImportPage;
