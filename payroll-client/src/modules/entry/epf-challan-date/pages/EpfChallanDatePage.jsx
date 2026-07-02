import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Download, FileSpreadsheet, Copy, FileText, File, Printer, UploadCloud } from 'lucide-react';
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
import { useToast, ConfirmModal } from '../../../../shared/components';
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
      const data = await getEpfChallans();
      setChallans(data);
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to fetch EPF Challans' });
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

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const sheetData = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (sheetData.length <= 1) {
          addToast({ type: 'error', message: 'The uploaded file is empty or missing data rows.' });
          return;
        }

        const headers = sheetData[0];
        const rows = sheetData.slice(1).filter(row => row.length > 0);

        const parseExcelDate = (dateVal) => {
          if (!dateVal) return null;
          if (dateVal instanceof Date) {
            if (!isNaN(dateVal)) return dateVal.toISOString();
            return null;
          }
          if (typeof dateVal === 'number') {
            const date = new Date((dateVal - (25567 + 2)) * 86400 * 1000);
            if (!isNaN(date)) return date.toISOString();
            return null;
          }
          if (typeof dateVal === 'string') {
            const parts = dateVal.split(/[-/]/);
            if (parts.length === 3) {
              const p1 = parseInt(parts[0], 10);
              const p2 = parseInt(parts[1], 10) - 1;
              let p3 = parseInt(parts[2], 10);

              if (p1 <= 31) {
                if (p3 < 100) p3 += 2000;
                const date = new Date(p3, p2, p1);
                if (!isNaN(date)) return date.toISOString();
              }
            }
            const date = new Date(dateVal);
            if (!isNaN(date)) return date.toISOString();
          }
          return null;
        };

        const mappedData = rows.map(row => {
          // Map array row to object using header indices
          const trrnIdx = headers.findIndex(h => h && h.toString().includes('TRRN'));
          const crnIdx = headers.findIndex(h => h && h.toString().includes('CRN'));
          const wageMonthIdx = headers.findIndex(h => h && h.toString().includes('Wage Month'));
          const dueDateIdx = headers.findIndex(h => h && h.toString().includes('Due Date'));
          const challanDateIdx = headers.findIndex(h => h && h.toString().includes('Challan Date'));
          const ac1eeIdx = headers.findIndex(h => h && h.toString().includes('A/C 1 (EE)'));
          const ac1erIdx = headers.findIndex(h => h && h.toString().includes('A/C 1 (ER)'));
          const ac2Idx = headers.findIndex(h => h && h.toString().includes('A/C 2') && !h.toString().includes('21') && !h.toString().includes('22'));
          const ac10Idx = headers.findIndex(h => h && h.toString().includes('A/C 10'));
          const ac21Idx = headers.findIndex(h => h && h.toString().includes('A/C 21'));
          const ac22Idx = headers.findIndex(h => h && h.toString().includes('A/C 22'));
          const totalAmountIdx = headers.findIndex(h => h && h.toString().includes('Total Amount'));
          const returnDateIdx = headers.findIndex(h => h && h.toString().includes('Return Date'));

          return {
            trrn: trrnIdx !== -1 ? String(row[trrnIdx] || '') : '',
            crnNo: crnIdx !== -1 ? String(row[crnIdx] || '') : '',
            wageMonth: wageMonthIdx !== -1 ? String(row[wageMonthIdx] || '') : '',
            dueDate: dueDateIdx !== -1 ? parseExcelDate(row[dueDateIdx]) : null,
            challanDate: challanDateIdx !== -1 ? parseExcelDate(row[challanDateIdx]) : null,
            ac1EE: ac1eeIdx !== -1 ? Number(row[ac1eeIdx] || 0) : 0,
            ac1ER: ac1erIdx !== -1 ? Number(row[ac1erIdx] || 0) : 0,
            ac2: ac2Idx !== -1 ? Number(row[ac2Idx] || 0) : 0,
            ac10: ac10Idx !== -1 ? Number(row[ac10Idx] || 0) : 0,
            ac21: ac21Idx !== -1 ? Number(row[ac21Idx] || 0) : 0,
            ac22: ac22Idx !== -1 ? Number(row[ac22Idx] || 0) : 0,
            totalAmount: totalAmountIdx !== -1 ? Number(row[totalAmountIdx] || 0) : 0,
            returnDate: returnDateIdx !== -1 ? parseExcelDate(row[returnDateIdx]) : null,
          };
        });

        setBulkData(mappedData);
        setIsPreviewOpen(true);
      } catch (err) {
        console.error('File parsing error:', err);
        addToast({ type: 'error', message: 'Failed to read file. Please ensure it is in the correct format (XLSX, XLS, or CSV).' });
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset file input
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirmBulkUpload = async () => {
    try {
      await saveBulkEpfChallans(bulkData);
      addToast({ type: 'success', message: `${bulkData.length} records uploaded successfully!` });
      setIsPreviewOpen(false);
      setBulkData([]);
      fetchData(); // Reload from server
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to bulk upload records. Check validation errors.' });
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
          <div className={styles.dropdownContainer} ref={dropdownRef}>
            {/* <button 
              className={styles.uploadBtn}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              title="Upload Excel"
            >
              <UploadCloud size={18} /> Bulk Upload
            </button> */}
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />

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
