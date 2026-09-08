import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Download, FileSpreadsheet, Copy, FileText, File, Printer, Upload, CheckCircle2, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import styles from '../components/OfficeStaffSalaryPage.module.css';
import OfficeStaffSalaryForm from '../components/OfficeStaffSalaryForm';
import OfficeStaffSalaryTable from '../components/OfficeStaffSalaryTable';
import { getOfficeStaffSalaries, saveOfficeStaffSalary, deleteOfficeStaffSalary } from '../services/officeStaffSalaryService';
import { getEmployees } from '../../../master/employee/services/employeeService';
import { useToast, ConfirmModal, Modal } from '../../../../shared/components';
import { exportModuleData } from '../../../../shared/services/exportService';
import { parseExcelDate } from '../../../../shared/utils/dateUtils';
import { usePermissions } from '../../../../shared/hooks/usePermissions';

const formatDateForExport = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

const OfficeStaffSalaryPage = () => {
  const addToast = useToast();

  const { canCreate, canEdit, canDelete } = usePermissions('office-staff-salary');

  const [wagesList, setWagesList] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWages, setEditingWages] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Confirmation Modal state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // Excel Import Analysis Modal state
  const [importAnalysis, setImportAnalysis] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  const fetchSalaries = async () => {
    const companyId = localStorage.getItem('selectedCompany');
    if (!companyId) {
      addToast({ type: 'warning', message: 'No company selected! Please select a company on login.' });
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getOfficeStaffSalaries(companyId);
      setWagesList(data);
    } catch (err) {
      console.error('Error fetching office staff salaries:', err);
      addToast({ type: 'error', message: 'Failed to load office staff salaries.' });
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchSalaries();
  }, [addToast]);

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
    setEditingWages(null);
    setIsFormOpen(true);
  };

  const handleEdit = (wages) => {
    setEditingWages(wages);
    setIsFormOpen(true);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleDeleteClick = (id) => {
    setDeleteTargetId(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteTargetId) {
      const companyId = localStorage.getItem('selectedCompany');
      try {
        setIsSaving(true);
        const updated = await deleteOfficeStaffSalary(deleteTargetId, companyId);
        setWagesList(updated);
        addToast({ type: 'success', message: 'Office Staff Salary record deleted successfully!' });
      } catch (err) {
        console.error('Error deleting office staff salary:', err);
        addToast({ type: 'error', message: 'Failed to delete office staff salary.' });
      } finally {
        setIsSaving(false);
      }
    }
    setIsConfirmOpen(false);
    setDeleteTargetId(null);
  };

  const handleCancelDelete = () => {
    setIsConfirmOpen(false);
    setDeleteTargetId(null);
  };

  const handleSave = async (wagesData) => {
    const companyId = localStorage.getItem('selectedCompany');
    try {
      setIsSaving(true);
      const updated = await saveOfficeStaffSalary(wagesData, companyId);
      setWagesList(updated);
      setIsFormOpen(false);
      setEditingWages(null);
      addToast({
        type: 'success',
        message: wagesData.id ? 'Office Staff Salary record updated successfully!' : 'Office Staff Salary record created successfully!'
      });
    } catch (err) {
      console.error('Error saving office staff salary:', err);
      addToast({
        type: 'error',
        message: err.response?.data?.messageToShow || 'Failed to save office staff salary.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingWages(null);
  };

  // Filter list by search term
  const filteredWages = useMemo(() => {
    return wagesList.filter(item => {
      const search = searchTerm.toLowerCase();

      const formattedStart = formatDateForExport(item.startDate).toLowerCase();
      const formattedEnd = formatDateForExport(item.endDate).toLowerCase();

      return (
        formattedStart.includes(search) ||
        formattedEnd.includes(search) ||
        (item.employeeName && item.employeeName.toLowerCase().includes(search)) ||
        (item.salary && item.salary.toLowerCase().includes(search)) ||
        (item.standardBonus && item.standardBonus.toLowerCase().includes(search)) ||
        (item.additionalBonus && item.additionalBonus.toLowerCase().includes(search))
      );
    });
  }, [wagesList, searchTerm]);

  // Export handlers
  const handleExport = async (type) => {
    setIsDropdownOpen(false);

    if (type === 'Excel' || type === 'Excel Template') {
      const isTemplate = type === 'Excel Template';
      const aoa = [
        ['ID (Do Not Modify)', 'Employee ID (Do Not Modify)', 'Employee Name', 'Start Date (YYYY-MM-DD)', 'End Date (YYYY-MM-DD)', 'Salary', 'Standard Bonus', 'Additional Bonus']
      ];

      if (!isTemplate) {
        filteredWages.forEach(w => {
          aoa.push([
            w.id, w.employeeId, w.employeeName, w.startDate, w.endDate, w.salary, w.standardBonus, w.additionalBonus
          ]);
        });
      }

      const worksheet = XLSX.utils.aoa_to_sheet(aoa);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'OfficeStaff_Salary');
      XLSX.writeFile(workbook, `OfficeStaff_Salary_${isTemplate ? 'Template' : 'Export'}.xlsx`);
      addToast({ type: 'success', message: `${type} downloaded!` });
      return;
    }

    if (type === 'Copy') {
      const text = filteredWages.map((w, index) =>
        `${index + 1}\t${formatDateForExport(w.startDate)}\t${formatDateForExport(w.endDate)}\t${w.employeeName}\t${w.salary}\t${w.standardBonus}\t${w.additionalBonus}`
      ).join('\n');
      navigator.clipboard.writeText(text);
      addToast({ type: 'success', message: 'Copied filtered records to clipboard!' });
      return;
    }

    try {
      addToast({ type: 'info', message: `${type} export started...` });
      await exportModuleData('office-staff-salaries', type.toLowerCase());
      addToast({ type: 'success', message: `${type} export completed successfully!` });
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', message: `Failed to export ${type} file.` });
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const companyId = localStorage.getItem('selectedCompany');
    if (!companyId) {
      addToast({ type: 'error', message: 'No company selected.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const workbook = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const importedData = XLSX.utils.sheet_to_json(worksheet);

        if (!importedData || importedData.length === 0) {
          addToast({ type: 'warning', message: 'The uploaded Excel file contains no data rows.' });
          return;
        }

        const employeesRaw = await getEmployees(companyId);
        const employeesList = Array.isArray(employeesRaw) ? employeesRaw : (employeesRaw?.data || []);
        const normalize = (value) =>
          String(value ?? "")
            .trim()
            .replace(/\s+/g, " ")
            .toLowerCase();

        const added = [];
        const updated = [];
        const failed = [];

        for (let i = 0; i < importedData.length; i++) {
          const row = importedData[i];
          const wId = row['ID (Do Not Modify)'] || row['ID'] || row['id'];
          const rawEid = row['Employee ID (Do Not Modify)'] || row['Employee ID'] || row['employee_id'];
          const empName = String(row['Employee Name'] || row['Member Name'] || row['Employee'] || row['Name'] || '').trim();
          const uan = String(row['UAN'] || row['Universal Account Number'] || '').replace(/\D/g, '');

          let resolvedEmployeeId = rawEid;
          let matchedEmpName = empName;

          if (!resolvedEmployeeId && empName) {
            const matchedEmp = employeesList.find(emp => normalize(emp.memberName || emp.name) === normalize(empName));
            if (matchedEmp) {
              resolvedEmployeeId = matchedEmp.id;
              matchedEmpName = matchedEmp.memberName || matchedEmp.name;
            }
          }
          if (!resolvedEmployeeId && uan) {
            const matchedEmp = employeesList.find(emp => emp.uan === uan);
            if (matchedEmp) {
              resolvedEmployeeId = matchedEmp.id;
              matchedEmpName = matchedEmp.memberName || matchedEmp.name;
            }
          }

          const startDate = parseExcelDate(row['Start Date (YYYY-MM-DD)'] || row['Start Date'] || row['StartDate']);
          const endDate = parseExcelDate(row['End Date (YYYY-MM-DD)'] || row['End Date'] || row['EndDate']);

          if (!resolvedEmployeeId) {
            failed.push({
              rowNumber: i + 2,
              name: empName || uan || 'Unknown',
              reason: `Employee "${empName || uan || 'Unknown'}" not found in company records.`
            });
            continue;
          }

          if (!startDate) {
            failed.push({
              rowNumber: i + 2,
              name: matchedEmpName || 'Unknown',
              reason: 'Start Date (YYYY-MM-DD) is missing or invalid.'
            });
            continue;
          }

          const wagesData = {
            id: wId || undefined,
            employeeId: resolvedEmployeeId,
            employeeName: matchedEmpName,
            startDate,
            endDate: endDate || startDate,
            salary: row['Salary'] || 0,
            standardBonus: row['Standard Bonus'] || row['StandardBonus'] || 0,
            additionalBonus: row['Additional Bonus'] || row['AdditionalBonus'] || 0,
            rowNumber: i + 2
          };

          const existingRecord = wagesList.find(w =>
            (wId && String(w.id) === String(wId)) ||
            (String(w.employeeId) === String(resolvedEmployeeId) && w.startDate === startDate)
          );

          if (existingRecord) {
            wagesData.id = existingRecord.id;
            updated.push({
              ...wagesData,
              existingRecord
            });
          } else {
            added.push(wagesData);
          }
        }

        setImportAnalysis({
          added,
          updated,
          failed,
          totalRows: importedData.length
        });
      } catch (error) {
        console.error('Error analyzing Excel:', error);
        addToast({ type: 'error', message: 'Failed to analyze Excel file: ' + error.message });
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = null;
  };

  const handleConfirmImport = async () => {
    if (!importAnalysis) return;
    const companyId = localStorage.getItem('selectedCompany');
    if (!companyId) return;

    setIsImporting(true);
    let successCount = 0;
    let failCount = 0;
    const recordsToProcess = [...importAnalysis.added, ...importAnalysis.updated];

    for (const record of recordsToProcess) {
      try {
        await saveOfficeStaffSalary(record, companyId);
        successCount++;
      } catch (err) {
        console.error(`Row ${record.rowNumber} failed to save:`, err);
        failCount++;
      }
    }

    setIsImporting(false);
    setImportAnalysis(null);

    if (failCount > 0) {
      addToast({
        type: successCount > 0 ? 'info' : 'error',
        message: `Import finished: ${successCount} saved, ${failCount} failed.`
      });
    } else {
      addToast({
        type: 'success',
        message: `Successfully imported ${successCount} record(s)!`
      });
    }
    fetchSalaries();
  };

  return (
    <div className={styles.container}>

      {/* Header section with page heading and action buttons */}
      <div className={styles.headerSection}>
        <h1 className={styles.title}>Office Staff Salary</h1>
        <div className={styles.headerActions}>
          {!isFormOpen && canCreate && (
            <button onClick={handleAddNew} className={styles.addBtn}>
              <Plus size={18} /> Office Staff Salary
            </button>
          )}
          <input
            type="file"
            accept=".xlsx, .xls"
            ref={fileInputRef}
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          {canCreate && (
            <button
              className={styles.downloadBtn}
              style={{ backgroundColor: 'var(--success-color, #10b981)' }}
              onClick={() => fileInputRef.current?.click()}
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
                <button onClick={() => handleExport('Excel')}>
                  <FileSpreadsheet size={16} /> Excel
                </button>
                <button onClick={() => handleExport('Excel Template')}>
                  <FileSpreadsheet size={16} /> Excel Template
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
        <OfficeStaffSalaryForm
          wages={editingWages}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {/* Render table showing office staff salary list */}
      <OfficeStaffSalaryTable
        data={filteredWages}
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
        title="Delete Office Staff Salary Setup"
        message="Are you sure you want to delete this office staff salary entry? This action cannot be undone."
      />

      {/* Excel Import Analysis Modal */}
      {importAnalysis && (
        <Modal
          isOpen={true}
          onClose={() => !isImporting && setImportAnalysis(null)}
          title="Excel Import Preview & Analysis"
          size="lg"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', width: '100%' }}>
              <button
                type="button"
                onClick={() => setImportAnalysis(null)}
                disabled={isImporting}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={isImporting || (importAnalysis.added.length === 0 && importAnalysis.updated.length === 0)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  cursor: isImporting ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  opacity: (importAnalysis.added.length === 0 && importAnalysis.updated.length === 0) ? 0.6 : 1
                }}
              >
                {isImporting ? (
                  <>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Confirm & Save ({importAnalysis.added.length + importAnalysis.updated.length} Records)
                  </>
                )}
              </button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Summary Badges */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '120px', padding: '12px', borderRadius: '8px', backgroundColor: '#dcfce7', color: '#166534', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} />
                <span>{importAnalysis.added.length} New Entries</span>
              </div>
              <div style={{ flex: 1, minWidth: '120px', padding: '12px', borderRadius: '8px', backgroundColor: '#fef08a', color: '#854d0e', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RefreshCw size={18} />
                <span>{importAnalysis.updated.length} To Update</span>
              </div>
              <div style={{ flex: 1, minWidth: '120px', padding: '12px', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#991b1b', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={18} />
                <span>{importAnalysis.failed.length} Errors / Invalid</span>
              </div>
            </div>

            {/* Error details */}
            {importAnalysis.failed.length > 0 && (
              <div style={{ border: '1px solid #fca5a5', borderRadius: '8px', padding: '12px', backgroundColor: '#fef2f2' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#991b1b', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={16} /> Invalid / Skipped Rows ({importAnalysis.failed.length})
                </h4>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#7f1d1d', fontSize: '13px', maxHeight: '120px', overflowY: 'auto' }}>
                  {importAnalysis.failed.map((f, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>
                      <strong>Row {f.rowNumber}</strong> ({f.name}): {f.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Updates details */}
            {importAnalysis.updated.length > 0 && (
              <div style={{ border: '1px solid #fde047', borderRadius: '8px', padding: '12px', backgroundColor: '#fefce8' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#854d0e', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <RefreshCw size={16} /> Entries To Be Updated ({importAnalysis.updated.length})
                </h4>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#713f12', fontSize: '13px', maxHeight: '120px', overflowY: 'auto' }}>
                  {importAnalysis.updated.map((u, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>
                      <strong>Row {u.rowNumber}</strong>: {u.employeeName || 'Employee'} (Start: {u.startDate}, Salary: {u.salary})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* New entries details */}
            {importAnalysis.added.length > 0 && (
              <div style={{ border: '1px solid #86efac', borderRadius: '8px', padding: '12px', backgroundColor: '#f0fdf4' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#166534', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={16} /> New Entries To Be Added ({importAnalysis.added.length})
                </h4>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#14532d', fontSize: '13px', maxHeight: '120px', overflowY: 'auto' }}>
                  {importAnalysis.added.map((a, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>
                      <strong>Row {a.rowNumber}</strong>: {a.employeeName || 'Employee'} (Start: {a.startDate}, Salary: {a.salary})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Modal>
      )}

    </div>
  );
};

export default OfficeStaffSalaryPage;
