import React, { useState, useEffect, useMemo } from 'react';
import styles from '../components/CalenderPage.module.css';
import CalenderForm from '../components/CalenderForm';
import CalenderTable from '../components/CalenderTable';
import { getCalender, saveCalender, deleteCalender } from '../services/calenderService';
import { useToast, ConfirmModal } from '../../../../shared/components';
import { exportModuleData } from '../../../../shared/services/exportService';

const formatDateForExport = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
};

const CalenderPage = () => {
  const addToast = useToast();

  const [calenderList, setCalenderList] = useState([]);
  const [editingEntry, setEditingEntry] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Confirmation Modal state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const fetchCalenders = async () => {
    const companyId = localStorage.getItem('selectedCompany');
    if (!companyId) {
      addToast({ type: 'warning', message: 'No company selected! Please select a company.' });
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getCalender(companyId);
      setCalenderList(data);
    } catch (err) {
      console.error('Error fetching calendar entries:', err);
      addToast({ type: 'error', message: 'Failed to load calendar entries.' });
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchCalenders();
  }, [addToast]);

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = (id) => {
    setDeleteTargetId(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteTargetId) {
      const companyId = localStorage.getItem('selectedCompany');
      try {
        const updated = await deleteCalender(deleteTargetId, companyId);
        setCalenderList(updated);
        addToast({ type: 'success', message: 'Calendar entry deleted successfully!' });
      } catch (err) {
        console.error('Error deleting calendar entry:', err);
        addToast({ type: 'error', message: 'Failed to delete calendar entry.' });
      }
    }
    setIsConfirmOpen(false);
    setDeleteTargetId(null);
  };

  const handleCancelDelete = () => {
    setIsConfirmOpen(false);
    setDeleteTargetId(null);
  };

  const handleSave = async (entryData) => {
    const companyId = localStorage.getItem('selectedCompany');
    if (!companyId) {
      addToast({ type: 'warning', message: 'No company selected!' });
      return;
    }
    try {
      const updated = await saveCalender(entryData, companyId);
      setCalenderList(updated);
      setEditingEntry(null);
      addToast({
        type: 'success',
        message: entryData.id
          ? 'Calendar entry updated successfully!'
          : 'Calendar entry created successfully!'
      });
    } catch (err) {
      console.error('Error saving calendar entry:', err);
      addToast({
        type: 'error',
        message: err.response?.data?.messageToShow || 'Failed to save calendar entry.'
      });
    }
  };

  const handleCancel = () => {
    setEditingEntry(null);
  };

  // Filter list by search term
  const filteredCalenders = useMemo(() => {
    return calenderList.filter(item => {
      const search = searchTerm.toLowerCase();
      const formattedDate = item.holidayDate ? formatDateForExport(item.holidayDate).toLowerCase() : '';
      const year = String(item.year || '').toLowerCase();
      const type = (item.holidayType || '').toLowerCase();
      const weekDay = (item.weekDay || '').toLowerCase();
      const remark = (item.remark || '').toLowerCase();

      return (
        formattedDate.includes(search) ||
        year.includes(search) ||
        type.includes(search) ||
        weekDay.includes(search) ||
        remark.includes(search)
      );
    });
  }, [calenderList, searchTerm]);

  // Export handlers
  const handleExport = async (type) => {
    if (type === 'Copy') {
      const text = filteredCalenders.map((c, index) =>
        `${index + 1}\t${c.holidayType === 'COMPANY' ? formatDateForExport(c.holidayDate) : '-'}\t${c.year || '-'}\t${c.holidayType}\t${c.holidayType === 'WEEKLY' ? c.weekDay : '-'}\t${c.remark || ''}`
      ).join('\n');
      navigator.clipboard.writeText(text);
      addToast({ type: 'success', message: 'Copied filtered records to clipboard!' });
      return;
    }

    try {
      addToast({ type: 'info', message: `${type} export started...` });
      await exportModuleData('calenders', type.toLowerCase());
      addToast({ type: 'success', message: `${type} export completed successfully!` });
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', message: `Failed to export ${type} file.` });
    }
  };

  return (
    <div className={styles.container}>
      {/* Header section with page heading */}
      <div className={styles.headerSection}>
        <h1 className={styles.title}>Calender</h1>
      </div>

      {/* Render form card */}
      <CalenderForm
        entry={editingEntry}
        onSave={handleSave}
        onCancel={handleCancel}
      />

      {/* Render table showing calendar list */}
      <CalenderTable
        data={filteredCalenders}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onExport={handleExport}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Calendar Entry"
        message="Are you sure you want to delete this calendar holiday entry? This action cannot be undone."
      />
    </div>
  );
};

export default CalenderPage;
