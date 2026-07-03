import { Pagination } from '../../../../shared/components';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Download, FileSpreadsheet, Copy, FileText, File, Printer, Edit2, Trash2, Save, X, Notebook } from 'lucide-react';
import { useToast, DatePicker } from '../../../../shared/components';
import { getNotes, saveNote, deleteNote } from '../services/notesService';
import styles from '../components/NotesPage.module.css';

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const NotesPage = () => {
  const [notesList, setNotesList] = useState([]);
  const [noteDate, setNoteDate] = useState(getTodayDateString());
  const [noteContent, setNoteContent] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Validation state
  const [formError, setFormError] = useState('');
  
  // Filtering & Pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Header dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const addToast = useToast();

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      const companyId = localStorage.getItem('selectedCompany');
      if (companyId) {
        const data = await getNotes(companyId);
        setNotesList(data);
      } else {
        setNotesList([]);
      }
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to fetch notes.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Load notes on mount
  useEffect(() => {
    fetchNotes();
  }, []);

  // Handle Edit Action Click
  const handleEditClick = (note) => {
    setEditingId(note.id);
    setNoteDate(note.date);
    setNoteContent(note.content);
    setFormError('');
    // Scroll to form smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
    addToast({
      type: 'info',
      message: 'Note loaded into editor fields.'
    });
  };

  // Handle Delete Action Click
  const handleDeleteClick = async (id) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await deleteNote(id);
        addToast({
          type: 'success',
          message: 'Note deleted successfully!'
        });
        await fetchNotes(); // Refresh list after delete
        // If we are currently editing the deleted note, clear the form
        if (editingId === id) {
          handleCancelEdit();
        }
      } catch (err) {
        addToast({
          type: 'error',
          message: 'Failed to delete note.'
        });
      }
    }
  };

  // Save/Update Note Submit
  const handleSaveNote = async (e) => {
    e.preventDefault();
    
    if (!noteDate) {
      setFormError('Please select a valid date.');
      return;
    }
    if (!noteContent.trim()) {
      setFormError('Note content cannot be empty.');
      return;
    }

    const companyId = localStorage.getItem('selectedCompany');
    if (!companyId) {
      addToast({ type: 'warning', message: 'Please select a company first.' });
      return;
    }

    setFormError('');
    const newNote = {
      id: editingId,
      company_id: companyId,
      date: noteDate,
      content: noteContent.trim()
    };

    try {
      await saveNote(newNote);
      addToast({
        type: 'success',
        message: editingId ? 'Note updated successfully!' : 'New note saved successfully!'
      });

      // Reset Form fields
      setNoteDate(getTodayDateString());
      setNoteContent('');
      setEditingId(null);
      await fetchNotes(); // Refresh list
    } catch (err) {
      addToast({
        type: 'error',
        message: 'Failed to save note.'
      });
    }
  };

  const handleCancelEdit = () => {
    setNoteDate(getTodayDateString());
    setNoteContent('');
    setEditingId(null);
    setFormError('');
  };

  // Filter notes locally
  const filteredNotes = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return notesList;

    return notesList.filter(note => {
      const formattedDateStr = formatDate(note.date);
      return (
        formattedDateStr.includes(query) ||
        note.date.includes(query) ||
        note.content.toLowerCase().includes(query)
      );
    });
  }, [notesList, searchTerm]);

  // Pagination logic
  const totalEntries = filteredNotes.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);

  const paginatedData = useMemo(() => {
    return filteredNotes.slice(startIndex, endIndex);
  }, [filteredNotes, startIndex, endIndex]);

  // Reset pagination on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  // Dropdown click outside hook
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

  const handleExport = (type) => {
    if (totalEntries === 0) {
      addToast({
        type: 'error',
        message: 'No records available to export!'
      });
      setIsDropdownOpen(false);
      return;
    }

    if (type === 'Copy') {
      addToast({
        type: 'success',
        message: 'Copied notes list registry to clipboard!'
      });
    } else {
      addToast({
        type: 'info',
        message: `${type} export process triggered for ${totalEntries} logs!`
      });
    }
    setIsDropdownOpen(false);
  };

  return (
    <div className={styles.container}>
      {/* Header section with download dropdown */}
      <div className={styles.headerSection}>
        <div>
          <h2 className={styles.title}>Notes & Remarks</h2>
          <p className={styles.subtitle}>
            Create, view, and maintain custom payroll remarks, warning sheets, and audit system reminders.
          </p>
        </div>
        <div className={styles.headerActions}>
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

      {/* Note Creation Form Card */}
      <div className={styles.formCard}>
        <form onSubmit={handleSaveNote} className={styles.formRow}>
          <div className={`${styles.field} ${styles.fieldDate}`}>
            <label className={styles.label}>
              Select Date <span className={styles.required}>*</span>
            </label>
            <DatePicker
              name="noteDate"
              value={noteDate}
              onChange={(e) => setNoteDate(e.target.value)}
              className={formError && !noteDate ? styles.inputError : ''}
            />
          </div>

          <div className={`${styles.field} ${styles.fieldNote}`}>
            <label className={styles.label}>
              Note / Remarks <span className={styles.required}>*</span>
            </label>
            <textarea
              placeholder="WRITE NOTE"
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className={`${styles.textarea} ${formError && !noteContent.trim() ? styles.inputError : ''}`}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className={styles.saveBtn}>
              <Save size={16} />
              {editingId ? 'Update Note' : 'Save Note'}
            </button>
            {editingId && (
              <button type="button" className={styles.cancelBtn} onClick={handleCancelEdit}>
                <X size={16} />
                Cancel
              </button>
            )}
          </div>
        </form>
        {formError && <div className={styles.errorText}>{formError}</div>}
      </div>

      {/* Notes Registry Card */}
      <div className={styles.tableCard}>
        {/* Controls Row */}
        <div className={styles.tableControls}>
          <div className={styles.totalRecords}>
            Total Notes: {totalEntries}
          </div>
          
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* Data Table */}
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '100px', textAlign: 'center', paddingLeft: '8px', paddingRight: '8px' }}>Sr. No.</th>
                <th style={{ width: '150px' }}>Date</th>
                <th>Notes</th>
                <th style={{ width: '120px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    Loading notes...
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No matching records found.
                  </td>
                </tr>
              ) : (
                paginatedData.map((note, index) => (
                  <tr key={note.id}>
                    <td style={{ textAlign: 'center', fontWeight: '500', paddingLeft: '8px', paddingRight: '8px' }}>
                      {startIndex + index + 1}
                    </td>
                    <td style={{ fontWeight: '500', color: 'var(--text-secondary)' }}>
                      {formatDate(note.date)}
                    </td>
                    <td style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                      {note.content}
                    </td>
                    <td>
                      <div className={styles.actionCell}>
                        <button
                          type="button"
                          onClick={() => handleEditClick(note)}
                          className={styles.editBtn}
                          title="Edit Note"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(note.id)}
                          className={styles.deleteBtn}
                          title="Delete Note"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile view cards layout */}
        <div className={styles.mobileCardsContainer}>
          {paginatedData.length > 0 ? (
            paginatedData.map((note, index) => (
              <div key={note.id} className={styles.mobileCard}>
                <div className={styles.mobileCardHeader}>
                  <span className={styles.mobileCardIndex}># {String(startIndex + index + 1).padStart(2, '0')}</span>
                  <span style={{ fontWeight: '700', color: 'var(--text-secondary)' }}>{formatDate(note.date)}</span>
                </div>
                <div className={styles.mobileCardBody}>
                  <div className={styles.mobileCardRow} style={{ flexDirection: 'column', alignItems: 'stretch', gap: '4px' }}>
                    <span className={styles.mobileCardLabel}>Note Content:</span>
                    <span className={styles.mobileCardValue} style={{ textAlign: 'left', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                      {note.content}
                    </span>
                  </div>
                </div>
                <div className={styles.mobileCardActions}>
                  <button
                    onClick={() => handleEditClick(note)}
                    className={styles.iconBtnRound}
                    title="Edit Note"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(note.id)}
                    className={styles.iconBtnRound}
                    style={{ color: '#EF4444' }}
                    title="Delete Note"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
              No matching records found.
            </div>
          )}
        </div>

        {/* Table Footer Controls */}
        <div className={styles.tableFooter}>
          <div className={styles.footerLeft}>
            <div className={styles.limitControl}>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className={styles.limitSelect}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>records per page</span>
            </div>
            <div className={styles.infoText}>
              Showing {totalEntries > 0 ? startIndex + 1 : 0} to {endIndex} of {totalEntries} entries
            </div>
          </div>

          <div className={styles.pagination}>
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotesPage;
