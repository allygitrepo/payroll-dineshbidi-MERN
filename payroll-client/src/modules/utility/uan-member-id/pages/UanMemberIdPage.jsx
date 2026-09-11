import React, { useState, useRef } from 'react';
import { Download, Eye, Save } from 'lucide-react';
import { useToast, Loader } from '../../../../shared/components';
import { getEmployees } from '../../../master/employee/services/employeeService';
import { bulkUpdateMemberIdMapping } from '../services/uanMemberIdService';
import * as XLSX from 'xlsx';
import styles from '../components/UanMemberIdPage.module.css';

const UanMemberIdPage = () => {
  const addToast = useToast();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
      addToast({
        type: 'error',
        message: 'Invalid file format! Please upload an Excel spreadsheet (.xlsx, .xls) or CSV.'
      });
      setSelectedFile(null);
      setShowPreview(false);
      setPreviewData([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
    setShowPreview(false);
    setPreviewData([]);
  };

  const handlePreview = () => {
    if (!selectedFile) {
      addToast({ type: 'error', message: 'Please choose an Excel spreadsheet to preview.' });
      return;
    }

    const companyId = localStorage.getItem('selectedCompany');
    if (!companyId) {
      addToast({ type: 'error', message: 'No active company context. Please select a company first.' });
      return;
    }

    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Expecting Column A -> UAN, Column B -> Member ID (or header names)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Remove empty rows
        const rows = jsonData.filter(row => row.length >= 2 && row[0] && row[1]);
        
        // Skip header row if it contains text like "UAN" or "Universal"
        let dataRows = rows;
        if (rows.length > 0 && String(rows[0][0]).toLowerCase().includes('uan')) {
            dataRows = rows.slice(1);
        }

        if (dataRows.length === 0) {
            throw new Error("No data found in the spreadsheet.");
        }

        // Fetch live employees to cross-reference
        const dbEmployees = await getEmployees(companyId);
        const dbMap = new Map();
        
        dbEmployees.forEach(emp => {
            if (emp.uan) {
                // Ensure uan is a string without decimals
                dbMap.set(String(emp.uan).replace('.0', ''), emp);
            }
        });

        const mappedPreview = dataRows.map((row, idx) => {
          const rowUan = String(row[0]).trim().replace('.0', '');
          const rowMemberId = String(row[1]).trim().replace('.0', '');

          const employee = dbMap.get(rowUan);
          
          let employeeName = 'Employee Not Found';
          let status = 'INVALID UAN';
          let badgeStyle = styles.badgeWarning;

          if (employee) {
            employeeName = employee.memberName;
            if (employee.memberId === rowMemberId) {
              status = 'CURRENT MATCH';
              badgeStyle = styles.badgeInfo;
            } else {
              status = 'READY TO MAP';
              badgeStyle = styles.badgeSuccess;
            }
          }

          return {
            id: `row_${idx}`,
            employeeId: employee ? employee.id : null,
            uan: rowUan,
            memberId: rowMemberId,
            employeeName,
            status,
            badgeStyle
          };
        });

        setPreviewData(mappedPreview);
        setShowPreview(true);
        addToast({
          type: 'success',
          message: 'Excel spreadsheet parsed successfully. Review Member ID mappings below.'
        });

      } catch (err) {
        addToast({ type: 'error', message: err.message || 'Failed to parse Excel file.' });
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleDownloadTemplate = () => {
    try {
      const csvContent = "Universal Account Number (UAN),Member ID\n100188684022,17291\n100247084817,0005870";
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'uan_member_id_mapping_template.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast({ type: 'success', message: 'UAN Member ID mapping template downloaded successfully.' });
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to download template file.' });
    }
  };

  const handleImport = async () => {
    if (previewData.length === 0) return;

    const companyId = localStorage.getItem('selectedCompany');
    if (!companyId) return;

    const payload = previewData
        .filter(row => row.status === 'READY TO MAP')
        .map(row => ({
            employeeId: row.employeeId,
            uan: row.uan,
            memberId: row.memberId
        }));

    if (payload.length === 0) {
        addToast({ type: 'info', message: 'No new mappings found to import.' });
        return;
    }

    try {
        setIsProcessing(true);
        const res = await bulkUpdateMemberIdMapping(companyId, payload);
        
        addToast({
            type: 'success',
            message: res.message || 'Successfully bulk-updated Member ID details in database.'
        });

        // Reset controls
        setSelectedFile(null);
        setShowPreview(false);
        setPreviewData([]);
        if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (err) {
        addToast({
            type: 'error',
            message: err.message || 'Failed to update database mappings.'
        });
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className={styles.container}>
      {isProcessing && <Loader fullPage={true} />}
      <div className={styles.headerSection}>
        <div>
          <h2 className={styles.title}>UAN Member ID</h2>
          <p className={styles.subtitle}>
            Bulk map and update employee Member IDs from universal registers.
          </p>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          Upload Excel Sheet (UAN and Member ID columns)
        </div>

        <div className={styles.selectorRow}>
          
          <div className={styles.formGroup}>
            <span className={styles.label}>Select Excel File</span>
            <div className={styles.fileInputWrapper}>
              <span className={styles.fileButton}>Choose File</span>
              <span className={styles.fileName}>
                {selectedFile ? selectedFile.name : 'NO FILE CHOSEN'}
              </span>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx, .xls, .csv"
                className={styles.realInput}
                disabled={isProcessing}
              />
            </div>
          </div>

          <div className={styles.buttonsGroup}>
            <button
              type="button"
              className={styles.previewBtn}
              onClick={handlePreview}
              disabled={!selectedFile || isProcessing}
            >
              <Eye size={16} />
              {isProcessing ? 'Analyzing...' : 'Preview'}
            </button>

            <button
              type="button"
              className={styles.templateBtn}
              onClick={handleDownloadTemplate}
              disabled={isProcessing}
            >
              <Download size={16} />
              Download Template
            </button>
            
            {showPreview && previewData.some(r => r.status === 'READY TO MAP') && (
              <button
                type="button"
                className={styles.importBtn}
                onClick={handleImport}
                disabled={isProcessing}
              >
                <Save size={16} />
                {isProcessing ? 'Saving...' : 'Import Mapping'}
              </button>
            )}
          </div>
        </div>
      </div>

      {showPreview && (
        <div className={styles.tableCard}>
          <h3 className={styles.tableTitle}>Data Grid Preview</h3>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: '80px', textAlign: 'center' }}>Sr. No.</th>
                  <th>Employee Name</th>
                  <th>Universal Account Number (UAN)</th>
                  <th>Member ID</th>
                  <th style={{ width: '150px', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {previewData.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No data to preview. Choose a valid mapping file first.
                    </td>
                  </tr>
                ) : (
                  previewData.map((row, index) => (
                    <tr key={row.id}>
                      <td style={{ textAlign: 'center', fontWeight: '500' }}>{index + 1}</td>
                      <td style={{ fontWeight: '600', color: row.status === 'INVALID UAN' ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                        {row.employeeName}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{row.uan}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{row.memberId}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`${styles.badge} ${row.badgeStyle}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile view cards layout */}
          <div className={styles.mobileCardsContainer}>
            {previewData.length > 0 ? (
              previewData.map((row, index) => (
                <div key={row.id} className={styles.mobileCard}>
                  <div className={styles.mobileCardHeader}>
                    <span className={styles.mobileCardIndex}># {String(index + 1).padStart(2, '0')}</span>
                    <span>
                      <span className={`${styles.badge} ${row.badgeStyle}`}>
                        {row.status}
                      </span>
                    </span>
                  </div>
                  <div className={styles.mobileCardBody}>
                    <div className={styles.mobileCardRow}>
                      <span className={styles.mobileCardLabel}>Employee:</span>
                      <span className={styles.mobileCardValue} style={{ fontWeight: '600' }}>{row.employeeName}</span>
                    </div>
                    <div className={styles.mobileCardRow}>
                      <span className={styles.mobileCardLabel}>UAN:</span>
                      <span className={styles.mobileCardValue}>{row.uan}</span>
                    </div>
                    <div className={styles.mobileCardRow}>
                      <span className={styles.mobileCardLabel}>Member ID:</span>
                      <span className={styles.mobileCardValue}>{row.memberId}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                No data to preview. Choose a valid mapping file first.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UanMemberIdPage;
