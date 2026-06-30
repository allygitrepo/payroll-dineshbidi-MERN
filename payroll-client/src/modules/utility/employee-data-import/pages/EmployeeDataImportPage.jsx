import React, { useState, useRef } from 'react';
import { FileUp, FileSpreadsheet, Download, Loader2, X, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../../../shared/components';
import * as XLSX from 'xlsx';
import { saveEmployee, getEmployees } from '../../../master/employee/services/employeeService';
import { getContractors, saveContractor } from '../../../master/contractor/services/contractorService';
import { getAddresses, saveAddress } from '../../../master/address/services/addressService';
import styles from '../components/EmployeeDataImportPage.module.css';



const EmployeeDataImportPage = () => {
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
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false, dateNF: 'yyyy-mm-dd' });

        const parseDate = (d) => {
          if (!d) return '';
          const str = String(d).trim();
          
          if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
            if (!isNaN(new Date(str).getTime())) return str;
            return '';
          }

          let parsedStr = str;
          const parts = str.split(/[\/\-]/);
          if (parts.length === 3) {
            let year = parts[2];
            if (year.length === 2) {
              year = parseInt(year, 10) > 30 ? '19' + year : '20' + year;
            }
            if (year.length === 4) {
              parsedStr = `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
              if (/^\d{4}-\d{2}-\d{2}$/.test(parsedStr)) {
                if (!isNaN(new Date(parsedStr).getTime())) return parsedStr;
                // Try swapping day and month for MM/DD/YYYY formats
                const swappedStr = `${year}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
                if (!isNaN(new Date(swappedStr).getTime())) return swappedStr;
              }
            }
          }
          
          // Excel serial date check
          if (!isNaN(str) && Number(str) > 20000) {
            const date = new Date(Math.round((Number(str) - 25569) * 86400 * 1000));
            if (!isNaN(date.getTime())) {
              return date.toISOString().split('T')[0];
            }
          }
          return ''; // Return empty string for invalid dates to trigger required error
        };

        const companyId = localStorage.getItem('selectedCompany');
        if (!companyId) throw new Error("No active company context. Please select a company first.");

        const totalRows = jsonData.length;
        if (totalRows === 0) throw new Error("Excel file is empty");

        const contractorsList = await getContractors(companyId);
        const addressesList = await getAddresses(companyId);
        const defaultAddressId = addressesList.length > 0 ? addressesList[0].id : null;

        const existingEmployees = await getEmployees(companyId);

        const missingContractorsMap = new Map();
        const missingAddressesMap = new Map();
        const summary = { added: [], updated: [], failed: [] };

        for (let i = 0; i < totalRows; i++) {
          const row = jsonData[i];
          const uan = String(row['Universal Account Number'] || '').replace(/\D/g, '');
          const memberName = String(row['Member Name'] || '');
          const dob = parseDate(row['Date Of Birth']);
          const doj = parseDate(row['Date Of Joining']);
          let ipNumber = String(row['IP Number'] || '').replace(/\D/g, '');
          const aadhar = String(row['Aadhaar Number'] || '').replace(/\D/g, '');
          let mobile = String(row['Mobile Number'] || '').replace(/\D/g, '');
          let email = String(row['Email Id'] || row['Email'] || '').trim().toUpperCase();
          if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            email = ''; // Clear invalid email to prevent validation failure
          }
          const contractorName = String(row['Contractor Name'] || 'SELF').trim().toUpperCase();
          const addressStr = String(row['Address'] || '').trim().toUpperCase();

          if (!uan || uan.length !== 12 || !memberName || !dob || !doj) {
            summary.failed.push({ rowNumber: i + 2, name: memberName || 'Unknown', reason: "Missing required fields or invalid date (Name, 12-digit UAN, DOB, DOJ)." });
            continue;
          }

          if (addressStr) {
            const match = addressesList.find(a => String(a.address).trim().toUpperCase() === addressStr);
            if (!match && !missingAddressesMap.has(addressStr)) {
              missingAddressesMap.set(addressStr, {
                address: addressStr,
                postOffice: String(row['Post Office'] || 'UNKNOWN').trim().toUpperCase(),
                district: String(row['District'] || 'UNKNOWN').trim().toUpperCase(),
                pincode: String(row['Pincode'] || '000000').trim()
              });
            }
          }

          if (contractorName !== 'SELF') {
            const match = contractorsList.find(c => String(c.name).trim().toUpperCase() === contractorName);
            if (!match && !missingContractorsMap.has(contractorName)) {
              missingContractorsMap.set(contractorName, addressStr);
            }
          }

          if (aadhar && aadhar.length !== 12) {
            summary.failed.push({ rowNumber: i + 2, name: memberName, reason: "Aadhaar Number must be exactly 12 digits." });
            continue;
          }
          
          if (mobile && (mobile.length < 10 || mobile.length > 15)) {
            mobile = ''; // Clear invalid optional field
          }
          if (ipNumber && (ipNumber.length < 10 || ipNumber.length > 20)) {
            ipNumber = ''; // Clear invalid optional field
          }

          const employeeObj = {
            rowNumber: i + 2,
            memberName,
            uan,
            ipNumber: ipNumber,
            memberId: String(row['Previous Member Id'] || ''),
            contractor: String(row['Contractor Name'] || 'SELF'),
            employeeType: String(row['Type Of Employee'] || 'BIDI MAKER'),
            gender: String(row['Gender'] || 'MALE').toUpperCase(),
            dob,
            dateOfJoining: doj,
            fatherHusbandName: String(row['Father/Husband Name'] || ''),
            relation: String(row['Relationship'] || ''),
            maritalStatus: String(row['Marital Status'] || 'SINGLE'),
            mobile: mobile,
            email: email || '',
            aadhaarCard: aadhar,
            nationality: String(row['Nationality'] || 'INDIAN'),
            pmrpy: (row['PMRPY'] || 'NO').toUpperCase(),
            address_id: defaultAddressId,
            status: (String(row['Status'] || '1').trim() === '0' || String(row['Status'] || '').trim().toUpperCase() === 'INACTIVE') ? 'Inactive' : 'Active',
            kycDetails: [
              { documentType: 'PAN', documentNumber: row['PAN'] || '' },
              { documentType: 'BANK PASSBOOK', documentNumber: row['Bank Account Number'] || '', ifsc: row['Bank IFSC'] || '' }
            ].filter(k => k.documentNumber),
            nomineeDetails: [],
            familyDetails: [],
            addressStr
          };

          const existingMatch = existingEmployees.find(emp => emp.uan === uan);
          if (existingMatch) {
            employeeObj.id = existingMatch.id;
            
            // Calculate changed columns
            const changes = [];
            const safeStr = (val) => String(val || '').trim().toLowerCase();
            if (safeStr(employeeObj.memberName) !== safeStr(existingMatch.memberName)) changes.push('Member Name');
            if (safeStr(employeeObj.ipNumber) !== safeStr(existingMatch.ipNumber)) changes.push('IP Number');
            if (safeStr(employeeObj.memberId) !== safeStr(existingMatch.memberId)) changes.push('Previous Member Id');
            if (safeStr(employeeObj.contractor) !== safeStr(existingMatch.contractor)) changes.push('Contractor Name');
            if (safeStr(employeeObj.employeeType) !== safeStr(existingMatch.employeeType)) changes.push('Type Of Employee');
            if (safeStr(employeeObj.gender) !== safeStr(existingMatch.gender)) changes.push('Gender');
            if (safeStr(employeeObj.dob) !== safeStr(existingMatch.dob)) changes.push('Date Of Birth');
            if (safeStr(employeeObj.dateOfJoining) !== safeStr(existingMatch.dateOfJoining)) changes.push('Date Of Joining');
            if (safeStr(employeeObj.fatherHusbandName) !== safeStr(existingMatch.fatherHusbandName)) changes.push('Father/Husband Name');
            if (safeStr(employeeObj.relation) !== safeStr(existingMatch.relation)) changes.push('Relationship');
            if (safeStr(employeeObj.maritalStatus) !== safeStr(existingMatch.maritalStatus)) changes.push('Marital Status');
            if (safeStr(employeeObj.mobile) !== safeStr(existingMatch.mobile)) changes.push('Mobile Number');
            if (safeStr(employeeObj.email) !== safeStr(existingMatch.email)) changes.push('Email Id');
            if (safeStr(employeeObj.aadhaarCard) !== safeStr(existingMatch.aadhaarCard)) changes.push('Aadhaar Number');
            if (safeStr(employeeObj.pmrpy) !== safeStr(existingMatch.pmrpy)) changes.push('PMRPY');
            if (safeStr(employeeObj.addressStr) !== safeStr(existingMatch.address)) changes.push('Address');
            
            employeeObj.changedColumns = changes;
            summary.updated.push(employeeObj);
          } else {
            summary.added.push(employeeObj);
          }
        }

        setAnalysisSummary({ 
          ...summary, 
          missingContractors: Array.from(missingContractorsMap.entries()),
          missingAddresses: Array.from(missingAddressesMap.values()),
          contractorsList, 
          addressesList, 
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
    let contractorsList = analysisSummary.contractorsList;

    // 1. Create a default address if the database is completely empty and no missing addresses are parsed
    if (addressesList.length === 0 && (!analysisSummary.missingAddresses || analysisSummary.missingAddresses.length === 0)) {
      try {
        await saveAddress({
          address: 'COMPANY HEADQUARTERS',
          postOffice: 'UNKNOWN',
          district: 'UNKNOWN',
          pincode: '000000',
          status: 'Active'
        }, companyId);
        addressesList = await getAddresses(companyId);
      } catch (e) {
        console.error("Failed to create fallback address", e);
      }
    }

    // 2. Auto-create missing addresses with real Excel details
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

    // 3. Auto-create missing contractors linked to their corresponding address
    if (analysisSummary.missingContractors && analysisSummary.missingContractors.length > 0) {
      for (const [cName, addressStr] of analysisSummary.missingContractors) {
        // Find corresponding address ID from newly created list
        let contractorAddressId = null;
        if (addressStr) {
          const matchedAddr = addressesList.find(a => String(a.address).trim().toUpperCase() === addressStr.trim().toUpperCase());
          contractorAddressId = matchedAddr?.id || null;
        }
        // Fallback to first available address if null
        if (!contractorAddressId && addressesList.length > 0) {
          contractorAddressId = addressesList[0].id;
        }

        try {
          await saveContractor({
            name: cName,
            ccode: 'AUTO-' + Math.floor(100000 + Math.random() * 900000),
            pfCode: 'N/A',
            dateOfJoining: new Date().toISOString().split('T')[0],
            status: 'Active',
            address_id: contractorAddressId
          }, companyId, addressesList);
        } catch (e) {
          console.error("Failed to auto-create contractor", cName, e);
        }
      }
      contractorsList = await getContractors(companyId);
    }

    const defaultAddressId = addressesList.length > 0 ? addressesList[0].id : null;
    const processList = [...analysisSummary.added, ...analysisSummary.updated];

    for (const emp of processList) {
      if (emp.addressStr) {
        const matchedAddress = addressesList.find(a => String(a.address).trim().toUpperCase() === emp.addressStr.trim().toUpperCase());
        if (matchedAddress) {
          emp.address_id = matchedAddress.id;
        } else {
          emp.address_id = defaultAddressId;
        }
      } else {
        emp.address_id = defaultAddressId;
      }

      try {
        await saveEmployee(emp, companyId, addressesList, contractorsList);
      } catch (err) {
        console.error("Failed to save employee", emp, JSON.stringify(err?.response?.data || err?.message));
        failCount++;
        failedReasons.push(`${emp.memberName}: ${err?.response?.data?.messageToShow || err?.response?.data?.message || err.message}`);
      }
      processed++;
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
        message: `Import finished with errors. Saved ${processed - failCount}. Failed ${failCount} (Check console for details).`
      });
      console.warn("Backend Import Failures:", failedReasons);
    } else {
      addToast({
        type: 'success',
        message: `Import complete! Processed ${processed} entries successfully.`
      });
    }
  };

  const handleDownloadTemplate = () => {
    const ws_data = [
      [
        'Universal Account Number', 'IP Number', 'Previous Member Id', 'Contractor Name', 
        'Type Of Employee', 'Member Name', 'Gender', 'Date Of Birth', 'Date Of Joining', 
        'Father/Husband Name', 'Relationship', 'Marital Status', 'Mobile Number', 
        'Email Id', 'Aadhaar Number', 'PAN', 'Bank Account Number', 'Nationality', 
        'PMRPY', 'Bank IFSC', 'Address', 'Post Office', 'District', 'Pincode', 'Status'
      ],
      [
        '100984728192', '3128471928', '', 'Self', 'BIDI MAKER', 'Dinesh Bidi', 'MALE', 
        '1988-08-15', '2018-04-01', 'Ramji Bidi', 'FATHER', 'MARRIED', '9876543210', 
        'test@example.com', '123456789012', 'ABCDE1234F', '123456789', 'INDIAN', 'NO', 'SBIN0001234',
        'Main Street', 'Central PO', 'City District', '123456', 1
      ]
    ];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    
    // Set some column widths
    ws['!cols'] = Array(25).fill({ wch: 20 });

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

        {/* Analysis Summary */}
        {analysisSummary && !isImporting && (
          <div className={styles.summaryContainer} style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#0f172a' }}>Import Analysis Summary</h3>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '15px', flexWrap: 'wrap' }}>
              <div style={{ padding: '10px 15px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '6px', fontWeight: '500' }}>
                ✓ {analysisSummary.added.length} New Entries
              </div>
              <div style={{ padding: '10px 15px', backgroundColor: '#fef08a', color: '#854d0e', borderRadius: '6px', fontWeight: '500' }}>
                ↻ {analysisSummary.updated.length} To Update (Existing UAN)
              </div>
              <div style={{ padding: '10px 15px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '6px', fontWeight: '500' }}>
                ✕ {analysisSummary.failed.length} Invalid Entries
              </div>
            </div>
            
            {analysisSummary.missingContractors?.length > 0 && (
              <div className={styles.notice}>
                <strong>Notice:</strong> {analysisSummary.missingContractors.length} missing contractors found in the Excel sheet. They will be automatically created in the database during import.
              </div>
            )}
            {analysisSummary.missingAddresses?.length > 0 && (
              <div className={styles.notice}>
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
                <strong style={{ display: 'block', marginBottom: '8px' }}>Updates Details (Existing UANs):</strong>
                <ul style={{ margin: '0 0 0 20px', padding: 0, maxHeight: '120px', overflowY: 'auto' }}>
                  {analysisSummary.updated.map((u, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>
                      Row {u.rowNumber} ({u.memberName}): {u.changedColumns.length > 0 
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

        {/* Action Button Group */}
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

export default EmployeeDataImportPage;
