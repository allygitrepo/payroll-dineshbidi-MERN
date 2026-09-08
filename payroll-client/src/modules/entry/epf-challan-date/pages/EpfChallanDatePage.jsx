import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Download, FileSpreadsheet, Copy, FileText, File, Printer, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import styles from '../components/EpfChallanDatePage.module.css';
import EpfChallanDateForm from '../components/EpfChallanDateForm';
import EpfChallanDateTable from '../components/EpfChallanDateTable';
import BulkUploadPreviewModal from '../components/BulkUploadPreviewModal';
import {
  getEpfChallans,
  saveEpfChallan,
  deleteEpfChallan,
  saveBulkEpfChallans
} from '../services/epfChallanDateService';
import { useToast, ConfirmModal, Loader } from '../../../../shared/components';
import { usePermissions } from '../../../../shared/hooks/usePermissions';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

const EpfChallanDatePage = () => {
  const addToast = useToast();

  const { canCreate, canEdit, canDelete } = usePermissions('epf-challan-date');

  const [challans, setChallans] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingChallan, setEditingChallan] = useState(null);

  // Search and dropdown state
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Delete modal state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // Bulk Upload state
  const [bulkData, setBulkData] = useState([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Load initial data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const data = await getEpfChallans();
      setChallans(data);
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to fetch EPF Challans' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleAddNew = () => {
    setEditingChallan(null);
    setIsFormOpen(true);
  };

  const handleEdit = (challan) => {
    setEditingChallan(challan);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = (id) => {
    setDeleteTargetId(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteTargetId) {
      try {
        await deleteEpfChallan(deleteTargetId);
        addToast({ type: 'success', message: 'EPF Challan record deleted successfully!' });
        fetchData(); // Reload from server
      } catch (error) {
        addToast({ type: 'error', message: 'Failed to delete EPF Challan' });
      }
    }
    setIsConfirmOpen(false);
    setDeleteTargetId(null);
  };

  const handleCancelDelete = () => {
    setIsConfirmOpen(false);
    setDeleteTargetId(null);
  };

  const handleSave = async (challanData) => {
    try {
      await saveEpfChallan(challanData);
      setIsFormOpen(false);
      setEditingChallan(null);
      addToast({
        type: 'success',
        message: challanData.id ? 'EPF Challan record updated successfully!' : 'EPF Challan record created successfully!'
      });
      fetchData(); // Reload from server
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to save EPF Challan' });
    }
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingChallan(null);
  };

  const handleDownloadTemplate = () => {
    const header = [
      'TRRN', 'CRN No', 'Wage Month', 'Due Date', 'Challan Date',
      'A/C 1 (EE)', 'A/C 1 (ER)', 'A/C 2', 'A/C 10', 'A/C 21', 'A/C 22', 'Total Amount', 'Return Date'
    ];
    // Example format rows
    const dummyData = [
      ['4742001002895', '2080120492301', '12/2019', '2020-01-15', '2020-01-08', 74759, 11543, 4859, 45211, 3613, 0, 140000, '2020-01-20']
    ];

    const ws = XLSX.utils.aoa_to_sheet([header, ...dummyData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "EPF_Challan_Template.xlsx");
  };

  const parseExcelDate = (dateVal) => {
    if (!dateVal) return null;
    if (dateVal instanceof Date) {
      return !isNaN(dateVal) ? dateVal.toISOString() : null;
    }
    if (typeof dateVal === 'number') {
      const date = new Date((dateVal - (25567 + 2)) * 86400 * 1000);
      return !isNaN(date) ? date.toISOString() : null;
    }
    if (typeof dateVal === 'string') {
      const str = dateVal.trim();
      if (!str) return null;

      if (/^\d{4}-\d{2}-\d{2}$/.test(str) || str.includes('T')) {
        const date = new Date(str);
        return !isNaN(date) ? date.toISOString() : null;
      }

      const parts = str.split(/[-/]/);
      if (parts.length === 3) {
        let p1 = parseInt(parts[0], 10);
        let p2 = parseInt(parts[1], 10);
        let p3 = parseInt(parts[2], 10);

        if (p1 > 1000) {
          const date = new Date(p1, p2 - 1, p3);
          return !isNaN(date) ? date.toISOString() : null;
        } else {
          if (p3 < 100) p3 += 2000;
          const date = new Date(p3, p2 - 1, p1);
          return !isNaN(date) ? date.toISOString() : null;
        }
      }
      const date = new Date(str);
      return !isNaN(date) ? date.toISOString() : null;
    }
    return null;
  };

  const formatWageMonth = (rawVal) => {
    if (!rawVal) return '';
    const str = String(rawVal).trim();
    if (/^\d{1,2}\/\d{4}$/.test(str)) {
      const [m, y] = str.split('/');
      return `${m.padStart(2, '0')}/${y}`;
    }
    if (/^\d{4}-\d{1,2}$/.test(str)) {
      const [y, m] = str.split('-');
      return `${m.padStart(2, '0')}/${y}`;
    }
    const parsedDate = parseExcelDate(rawVal);
    if (parsedDate) {
      const d = new Date(parsedDate);
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const y = d.getFullYear();
      return `${m}/${y}`;
    }
    return str;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const wb = XLSX.read(data, { type: 'array', cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        const rawSheetRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        if (!rawSheetRows || rawSheetRows.length === 0) {
          addToast({ type: 'error', message: 'The uploaded file is empty or missing data rows.' });
          return;
        }

        // Find header row dynamically (searching for key column titles)
        let headerRowIndex = rawSheetRows.findIndex(row => 
          Array.isArray(row) && row.some(cell => {
            const str = String(cell || '').toLowerCase();
            return str.includes('trrn') || str.includes('crn') || str.includes('wage') || str.includes('challan') || str.includes('a/c');
          })
        );

        if (headerRowIndex === -1) {
          headerRowIndex = 0;
        }

        const headers = rawSheetRows[headerRowIndex].map(h => String(h || '').trim());
        const dataRows = rawSheetRows.slice(headerRowIndex + 1).filter(row => 
          Array.isArray(row) && row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')
        );

        if (dataRows.length === 0) {
          addToast({ type: 'error', message: 'No valid data rows found in the uploaded file.' });
          return;
        }

        const findColIdx = (patterns) => {
          return headers.findIndex(h => {
            const str = h.toLowerCase().replace(/\s+/g, '');
            return patterns.some(p => p(str, h));
          });
        };

        const trrnIdx = findColIdx([s => s.includes('trrn'), s => s.includes('ttrn')]);
        const crnIdx = findColIdx([s => s.includes('crn')]);
        const wageMonthIdx = findColIdx([s => s.includes('wage') || s.includes('wagemonth'), s => s.includes('month') && !s.includes('due') && !s.includes('challan') && !s.includes('return')]);
        const dueDateIdx = findColIdx([s => s.includes('due')]);
        const challanDateIdx = findColIdx([s => s.includes('challan')]);
        const returnDateIdx = findColIdx([s => s.includes('return')]);

        const ac1eeIdx = findColIdx([
          s => (s.includes('1') || s.includes('ac1') || s.includes('a/c1')) && (s.includes('ee') || s.includes('employee')),
          s => s.includes('ac1ee') || s.includes('a/c1ee')
        ]);

        const ac1erIdx = findColIdx([
          s => (s.includes('1') || s.includes('ac1') || s.includes('a/c1')) && (s.includes('er') || s.includes('employer')),
          s => s.includes('ac1er') || s.includes('a/c1er')
        ]);

        const ac2Idx = findColIdx([
          s => (s.includes('2') || s.includes('ac2') || s.includes('a/c2') || s.includes('02')) && !s.includes('21') && !s.includes('22') && !s.includes('ee') && !s.includes('er')
        ]);

        const ac10Idx = findColIdx([
          s => s.includes('10') || s.includes('ac10') || s.includes('a/c10') || s.includes('eps')
        ]);

        const ac21Idx = findColIdx([
          s => s.includes('21') || s.includes('ac21') || s.includes('a/c21') || s.includes('edli')
        ]);

        const ac22Idx = findColIdx([
          s => s.includes('22') || s.includes('ac22') || s.includes('a/c22')
        ]);

        const totalAmountIdx = findColIdx([
          s => s.includes('total') || s.includes('amount') || s.includes('grandtotal')
        ]);

        const mappedData = dataRows.map(row => {
          const rawWageMonth = wageMonthIdx !== -1 ? row[wageMonthIdx] : '';

          const item = {
            trrn: trrnIdx !== -1 ? String(row[trrnIdx] || '').trim() : '',
            crnNo: crnIdx !== -1 ? String(row[crnIdx] || '').trim() : '',
            wageMonth: formatWageMonth(rawWageMonth),
            dueDate: dueDateIdx !== -1 ? parseExcelDate(row[dueDateIdx]) : null,
            challanDate: challanDateIdx !== -1 ? parseExcelDate(row[challanDateIdx]) : null,
            ac1EE: ac1eeIdx !== -1 ? (parseFloat(row[ac1eeIdx]) || 0) : 0,
            ac1ER: ac1erIdx !== -1 ? (parseFloat(row[ac1erIdx]) || 0) : 0,
            ac2: ac2Idx !== -1 ? (parseFloat(row[ac2Idx]) || 0) : 0,
            ac10: ac10Idx !== -1 ? (parseFloat(row[ac10Idx]) || 0) : 0,
            ac21: ac21Idx !== -1 ? (parseFloat(row[ac21Idx]) || 0) : 0,
            ac22: ac22Idx !== -1 ? (parseFloat(row[ac22Idx]) || 0) : 0,
            totalAmount: totalAmountIdx !== -1 ? (parseFloat(row[totalAmountIdx]) || 0) : 0,
            returnDate: returnDateIdx !== -1 ? parseExcelDate(row[returnDateIdx]) : null,
          };

          if (!item.totalAmount) {
            item.totalAmount = item.ac1EE + item.ac1ER + item.ac2 + item.ac10 + item.ac21 + item.ac22;
          }

          return item;
        });

        setBulkData(mappedData);
        setIsPreviewOpen(true);
      } catch (err) {
        console.error('File parsing error:', err);
        addToast({ type: 'error', message: 'Failed to read file. Please ensure it is in the correct format (XLSX, XLS, or CSV).' });
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirmBulkUpload = async () => {
    try {
      setIsLoading(true);
      const response = await saveBulkEpfChallans(bulkData);
      addToast({ type: 'success', message: response?.message || `${bulkData.length} records uploaded successfully!` });
      setIsPreviewOpen(false);
      setBulkData([]);
      fetchData();
    } catch (error) {
      console.error('Bulk upload error:', error);
      const errMsg = error.response?.data?.message || 'Failed to bulk upload records. Check validation errors.';
      addToast({ type: 'error', message: errMsg });
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered and sorted challans data
  const filteredChallans = useMemo(() => {
    const filtered = challans.filter((item) => {
      const search = searchTerm.toLowerCase();
      const formattedDue = formatDate(item.dueDate).toLowerCase();
      const formattedChallan = formatDate(item.challanDate).toLowerCase();
      const formattedReturn = formatDate(item.returnDate).toLowerCase();

      return (
        (item.trrn && String(item.trrn).toLowerCase().includes(search)) ||
        (item.crnNo && String(item.crnNo).toLowerCase().includes(search)) ||
        (item.wageMonth && String(item.wageMonth).toLowerCase().includes(search)) ||
        formattedDue.includes(search) ||
        formattedChallan.includes(search) ||
        formattedReturn.includes(search) ||
        (item.ac1EE && String(item.ac1EE).toLowerCase().includes(search)) ||
        (item.ac1ER && String(item.ac1ER).toLowerCase().includes(search)) ||
        (item.ac2 && String(item.ac2).toLowerCase().includes(search)) ||
        (item.ac10 && String(item.ac10).toLowerCase().includes(search)) ||
        (item.ac21 && String(item.ac21).toLowerCase().includes(search)) ||
        (item.ac22 && String(item.ac22).toLowerCase().includes(search)) ||
        (item.totalAmount && String(item.totalAmount).toLowerCase().includes(search))
      );
    });

    // Sort according to dueDate (ascending order so newest is at last)
    return filtered.sort((a, b) => {
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
      return dateA - dateB;
    });
  }, [challans, searchTerm]);

  const handleExport = (type) => {
    if (type === 'Copy') {
      const header = 'TRRN\tCRN No\tWage Month\tDue Date\tChallan Date\tA/C 1 (EE)\tA/C 1 (ER)\tA/C 2\tA/C 10\tA/C 21\tA/C 22\tTotal Amount\tReturn Date';
      const body = filteredChallans.map(c =>
        `${c.trrn}\t${c.crnNo}\t${c.wageMonth}\t${c.dueDate}\t${c.challanDate}\t${c.ac1EE}\t${c.ac1ER}\t${c.ac2}\t${c.ac10}\t${c.ac21}\t${c.ac22}\t${c.totalAmount}\t${c.returnDate}`
      ).join('\n');
      navigator.clipboard.writeText(`${header}\n${body}`);
      addToast({ type: 'success', message: 'Copied filtered records to clipboard!' });
    } else {
      addToast({ type: 'info', message: `${type} export started for ${filteredChallans.length} records!` });
    }
    setIsDropdownOpen(false);
  };

  return (
    <div className={styles.container}>
      {/* Header section with page heading and action buttons */}
      <div className={styles.headerSection}>
        <h1 className={styles.title}>EPF Challan Date Entry</h1>
        <div className={styles.headerActions}>
          {!isFormOpen && canCreate && (
            <button onClick={handleAddNew} className={styles.addBtn}>
              <Plus size={18} /> EPF Challan Date
            </button>
          )}
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
          {canCreate && (
            <button
              className={styles.uploadBtn}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              title="Upload Excel for Data Entry"
            >
              <Upload size={18} /> Upload Excel
            </button>
          )}
          <div className={styles.dropdownContainer} ref={dropdownRef}>
            <button
              className={styles.downloadBtn}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <Download size={18} /> Download
            </button>
            {isDropdownOpen && (
              <div className={styles.dropdownMenu}>
                <button onClick={handleDownloadTemplate}>
                  <FileSpreadsheet size={16} /> Template
                </button>
                <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '4px 0' }} />
                <button onClick={() => handleExport('Excel')}>
                  <FileSpreadsheet size={16} /> Excel
                </button>
                <button onClick={() => handleExport('Copy')}>
                  <Copy size={16} /> Copy
                </button>
                <button onClick={() => handleExport('CSV')}>
                  <FileText size={16} /> CSV
                </button>
                <button onClick={() => handleExport('PDF')}>
                  <File size={16} /> PDF
                </button>
                <button onClick={() => handleExport('Print')}>
                  <Printer size={16} /> Print
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Render form card if editing or adding */}
      {isFormOpen && (
        <EpfChallanDateForm
          challan={editingChallan}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {/* Render table showing challans list */}
      <EpfChallanDateTable
        data={filteredChallans}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onEdit={canEdit ? handleEdit : undefined}
        onDelete={canDelete ? handleDeleteClick : undefined}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete EPF Challan Record"
        message="Are you sure you want to delete this EPF Challan record? This action cannot be undone."
      />

      {/* Bulk Upload Preview Modal */}
      <BulkUploadPreviewModal
        isOpen={isPreviewOpen}
        data={bulkData}
        onConfirm={handleConfirmBulkUpload}
        onCancel={() => { setIsPreviewOpen(false); setBulkData([]); }}
      />
    </div>
  );
};

export default EpfChallanDatePage;
