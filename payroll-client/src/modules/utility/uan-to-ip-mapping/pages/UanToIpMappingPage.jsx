import React, { useState, useMemo } from 'react';
import { Link, Download, FileSpreadsheet, Eye, Save, AlertCircle } from 'lucide-react';
import { useToast } from '../../../../shared/components';
import { getEmployees, saveEmployee } from '../../../master/employee/services/employeeService';
import styles from '../components/UanToIpMappingPage.module.css';

// Preloaded mock Excel records for simulation
const MOCK_TEMPLATE_RECORDS = [
  { uan: '100188684022', ipNumber: '7431081699' }, // Kandan Kumar (Update)
  { uan: '102008788327', ipNumber: '7431095833' }, // Sadhana Mahato (Update)
  { uan: '102318950034', ipNumber: '7431102938' }, // Namita Mahato (New mapping)
  { uan: '102318088496', ipNumber: '7431109938' }, // Rekha Kumar (New mapping)
  { uan: '102318063813', ipNumber: '7431108273' }, // Niyati Machhuar (New mapping)
  { uan: '101556427344', ipNumber: '7431103982' }, // Rahul Kumar (New mapping)
  { uan: '999999999999', ipNumber: '7431999999' }  // Invalid/Not found employee
];

const UanToIpMappingPage = () => {
  const addToast = useToast();

  const [selectedFile, setSelectedFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

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
      return;
    }

    setSelectedFile(file);
    setShowPreview(false);
  };

  // Compile preview mapping records matching live employees database
  const previewData = useMemo(() => {
    if (!selectedFile) return [];

    const dbEmployees = getEmployees() || [];
    const dbMap = new Map(dbEmployees.map(emp => [emp.uan, emp]));

    return MOCK_TEMPLATE_RECORDS.map((row, idx) => {
      const employee = dbMap.get(row.uan);
      
      let employeeName = 'Employee Not Found';
      let status = 'INVALID UAN';
      let badgeStyle = styles.badgeWarning;

      if (employee) {
        employeeName = employee.memberName;
        if (employee.ipNumber === row.ipNumber) {
          status = 'CURRENT MATCH';
          badgeStyle = styles.badgeInfo;
        } else {
          status = 'READY TO MAP';
          badgeStyle = styles.badgeSuccess;
        }
      }

      return {
        id: `row_${idx}`,
        uan: row.uan,
        ipNumber: row.ipNumber,
        employeeName,
        status,
        badgeStyle,
        employeeObj: employee
      };
    });
  }, [selectedFile]);

  const handlePreview = () => {
    if (!selectedFile) {
      addToast({
        type: 'error',
        message: 'Please choose an Excel spreadsheet to preview.'
      });
      return;
    }
    setShowPreview(true);
    addToast({
      type: 'success',
      message: 'Excel spreadsheet parsed successfully. Review mappings below.'
    });
  };

  const handleDownloadTemplate = () => {
    try {
      const csvContent = "Universal Account Number (UAN),Insurance Number (IP)\n" + 
        MOCK_TEMPLATE_RECORDS.map(r => `${r.uan},${r.ipNumber}`).join("\n");
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'uan_ip_mapping_template.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast({
        type: 'success',
        message: 'UAN to IP mapping template downloaded successfully.'
      });
    } catch (err) {
      addToast({
        type: 'error',
        message: 'Failed to download template file.'
      });
    }
  };

  const handleImport = () => {
    if (previewData.length === 0) return;

    let successCount = 0;
    previewData.forEach(row => {
      if (row.employeeObj && row.status === 'READY TO MAP') {
        const updated = {
          ...row.employeeObj,
          ipNumber: row.ipNumber
        };
        saveEmployee(updated);
        successCount++;
      }
    });

    addToast({
      type: 'success',
      message: `Successfully mapped and updated ${successCount} employee IP details in database.`
    });

    // Reset controls
    setSelectedFile(null);
    setShowPreview(false);
  };

  return (
    <div className={styles.container}>
      {/* Page header */}
      <div className={styles.headerSection}>
        <div>
          <h2 className={styles.title}>UAN to IP Mapping</h2>
          <p className={styles.subtitle}>
            Bulk map and update employee Insurance Numbers (IP) from universal registers.
          </p>
        </div>
      </div>

      {/* Upload card panel */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          Upload Excel Sheet (UAN and IP columns)
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
                onChange={handleFileChange}
                accept=".xlsx, .xls, .csv"
                className={styles.realInput}
              />
            </div>
          </div>

          <div className={styles.buttonsGroup}>
            <button
              type="button"
              className={styles.previewBtn}
              onClick={handlePreview}
              disabled={!selectedFile}
            >
              <Eye size={16} />
              Preview
            </button>

            <button
              type="button"
              className={styles.templateBtn}
              onClick={handleDownloadTemplate}
            >
              <Download size={16} />
              Download Template
            </button>
            
            {showPreview && previewData.some(r => r.status === 'READY TO MAP') && (
              <button
                type="button"
                className={styles.importBtn}
                onClick={handleImport}
              >
                <Save size={16} />
                Import Mapping
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Preview data table */}
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
                  <th>Insurance Number (IP)</th>
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
                      <td style={{ textAlign: 'center', fontWeight: '500' }}>
                        {index + 1}
                      </td>
                      <td style={{ fontWeight: '600', color: row.employeeObj ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {row.employeeName}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{row.uan}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{row.ipNumber}</td>
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
        </div>
      )}
    </div>
  );
};

export default UanToIpMappingPage;
