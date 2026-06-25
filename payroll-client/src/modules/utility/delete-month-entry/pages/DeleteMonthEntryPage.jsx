import React, { useState, useEffect } from 'react';
import { Trash2, AlertTriangle, ShieldAlert, Download } from 'lucide-react';
import { useToast, MonthYearPicker, ConfirmModal } from '../../../../shared/components';
import apiClient from '../../../../shared/services/apiClient';
import styles from '../components/DeleteMonthEntryPage.module.css';

const EMPLOYEE_TYPES = [
  { value: 'BIDI PACKER', label: 'BIDI PACKER' },
  { value: 'BIDI MAKER', label: 'BIDI MAKER' },
  { value: 'OFFICE STAFF', label: 'OFFICE STAFF' }
];

const getEndpointForType = (type) => {
  if (type === 'BIDI PACKER') return 'packers-entries/company';
  if (type === 'BIDI MAKER') return 'bidi-roller-entries/company';
  if (type === 'OFFICE STAFF') return 'office-staff-entries';
  return '';
};

const formatMonthLabel = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 2) {
    const year = parts[0];
    const month = parts[1];
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthIndex = parseInt(month, 10) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${months[monthIndex]} ${year}`;
    }
  }
  return dateStr;
};

const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) return;
  const headers = ['Employee Name', 'UAN', 'Basic/Piece Wages', 'Gross Wages', 'Net Wages'];
  const rows = data.map(item => [
    `"${item.name || item.employeeName || '-'}"`,
    `"${item.uan || '-'}"`,
    item.wages || item.basicSalary || item.basic || 0,
    item.gross || item.grossWages || item.gross_wages || 0,
    item.netWages || item.net_wages || 0
  ]);
  
  const csvContent = "data:text/csv;charset=utf-8," 
    + [headers.join(','), ...rows.map(e => e.join(','))].join("\n");
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const DeleteMonthEntryPage = () => {
  const addToast = useToast();

  const [selectedMonth, setSelectedMonth] = useState('2026-06');
  const [employeeType, setEmployeeType] = useState('');
  const [previewData, setPreviewData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    const fetchPreview = async () => {
      if (!selectedMonth || !employeeType) {
        setPreviewData([]);
        return;
      }
      
      const companyId = localStorage.getItem('selectedCompany');
      if (!companyId) return;

      const endpoint = getEndpointForType(employeeType);
      if (!endpoint) return;

      setIsLoading(true);
      try {
        const response = await apiClient.get(`${endpoint}?company_id=${companyId}&month_year=${selectedMonth}`);
        if (response.data && response.data.data) {
          // Bidi roller / Packers returns data differently or inside `data`
          // Let's filter out entries that have gross wages > 0 or are actual entries
          const entries = response.data.data.filter(e => 
            (e.id || e.entryId) && (e.gross || e.gross_wages || e.grossWages > 0)
          );
          setPreviewData(entries);
        } else {
          setPreviewData([]);
        }
      } catch (err) {
        console.error("Failed to fetch preview", err);
        setPreviewData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreview();
  }, [selectedMonth, employeeType]);

  const handleDeleteClick = () => {
    if (!selectedMonth || !employeeType) {
      addToast({ type: 'error', message: 'Please select a Month and Type of Employee.' });
      return;
    }
    if (previewData.length === 0) {
      addToast({ type: 'warning', message: 'No entries available to delete for this selection.' });
      return;
    }
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsConfirmOpen(false);
    
    const companyId = localStorage.getItem('selectedCompany');
    const endpoint = getEndpointForType(employeeType);
    
    if (!companyId || !endpoint) {
      addToast({ type: 'error', message: 'Invalid parameters for deletion.' });
      return;
    }

    try {
      const res = await apiClient.delete(`${endpoint}?company_id=${companyId}&month_year=${selectedMonth}`);
      if (res.data && res.data.status) {
        addToast({
          type: 'success',
          message: `Successfully deleted ${res.data.deletedCount || previewData.length} entries for ${formatMonthLabel(selectedMonth)}.`
        });
        setPreviewData([]);
      } else {
        throw new Error(res.data?.message || 'Deletion failed');
      }
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || err.message || 'Failed to delete entries' });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerSection}>
        <div>
          <h2 className={styles.title}>Delete Month Entry</h2>
          <p className={styles.subtitle}>
            Admin utility to purge monthly attendance sheets, wages, and transaction logs.
          </p>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.rowLayout}>
          <div className={styles.formGroup}>
            <span className={styles.label}>Select Month and Year</span>
            <MonthYearPicker
              value={selectedMonth}
              onChange={setSelectedMonth}
            />
          </div>

          <div className={styles.formGroup}>
            <span className={styles.label}>Type of Employee</span>
            <select
              value={employeeType}
              onChange={(e) => setEmployeeType(e.target.value)}
              className={styles.selectInput}
            >
              <option value="">SELECT EMPLOYEE TYPE</option>
              {EMPLOYEE_TYPES.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading && <p style={{ padding: '20px', color: '#666' }}>Loading preview data...</p>}

      {!isLoading && selectedMonth && employeeType && previewData.length === 0 && (
        <div className={styles.infoBox} style={{ backgroundColor: '#f8f9fa', borderColor: '#e9ecef' }}>
          <div className={styles.infoContent}>
            <h4>No Entries Found</h4>
            <p>There are no finalized wage entries for {formatMonthLabel(selectedMonth)} in this category.</p>
          </div>
        </div>
      )}

      {!isLoading && previewData.length > 0 && (
        <>
          <div className={styles.infoBox}>
            <ShieldAlert size={28} style={{ color: 'var(--danger)', flexShrink: 0 }} />
            <div className={styles.infoContent}>
              <h4>Destructive Administrative Action</h4>
              <p>
                Deleting this month will permanently clear the wages for <strong>{previewData.length} employees</strong>. 
                Please download the preview below as a backup before performing this operation.
              </p>
            </div>
          </div>

          <div style={{ marginTop: '20px', marginBottom: '20px', display: 'flex', gap: '15px' }}>
            <button 
              type="button" 
              onClick={() => exportToCSV(previewData, `backup_${employeeType}_${selectedMonth}.csv`)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
                backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'
              }}
            >
              <Download size={16} /> Download Backup
            </button>
            <button
              type="button"
              className={styles.deleteBtn}
              onClick={handleDeleteClick}
            >
              <Trash2 size={16} /> Delete Entries
            </button>
          </div>

          <div style={{ overflowX: 'auto', backgroundColor: 'white', border: '1px solid var(--border-light)', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid var(--border-light)' }}>
                <tr>
                  <th style={{ padding: '12px 16px', fontSize: '13px', color: '#666' }}>Employee Name</th>
                  <th style={{ padding: '12px 16px', fontSize: '13px', color: '#666' }}>UAN</th>
                  <th style={{ padding: '12px 16px', fontSize: '13px', color: '#666' }}>Gross Wages</th>
                  <th style={{ padding: '12px 16px', fontSize: '13px', color: '#666' }}>Net Wages</th>
                </tr>
              </thead>
              <tbody>
                {previewData.slice(0, 50).map((emp, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '500' }}>{emp.name || emp.employeeName || '-'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#666' }}>{emp.uan || '-'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>₹{emp.gross || emp.grossWages || emp.gross_wages || 0}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>₹{emp.netWages || emp.net_wages || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {previewData.length > 50 && (
              <div style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: '#666' }}>
                Showing 50 of {previewData.length} records. Download CSV to view all.
              </div>
            )}
          </div>
        </>
      )}

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Month Deletion"
        message={`Are you sure you want to delete ${previewData.length} records for ${formatMonthLabel(selectedMonth)}? This action cannot be undone.`}
      />
    </div>
  );
};

export default DeleteMonthEntryPage;
