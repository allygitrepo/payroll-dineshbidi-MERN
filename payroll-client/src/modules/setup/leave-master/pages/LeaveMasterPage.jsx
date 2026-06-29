import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, Save, X, CalendarCheck } from 'lucide-react';
import styles from './LeaveMasterPage.module.css';
import { useToast, ConfirmModal } from '../../../../shared/components';
import { getLeaveMaster, saveLeaveMaster, deleteLeaveType } from '../services/leaveMasterService';

const LeaveMasterPage = () => {
  const addToast = useToast();
  const companyId = localStorage.getItem('selectedCompany');

  // Page States
  const [yearlyLeaveCap, setYearlyLeaveCap] = useState('');
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [leaveTypes.length, pageSize]);

  const totalEntries = leaveTypes.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);
  const paginatedLeaveTypes = useMemo(() => {
    return leaveTypes.slice(startIndex, endIndex);
  }, [leaveTypes, startIndex, endIndex]);

  // Error States for Real-time validation
  const [yearlyCapError, setYearlyCapError] = useState('');
  const [leaveDaysError, setLeaveDaysError] = useState('');
  const [editDaysError, setEditDaysError] = useState('');

  // Form States (Add)
  const [leaveTypeInput, setLeaveTypeInput] = useState('');
  const [leaveDaysInput, setLeaveDaysInput] = useState('');

  // Editing States
  const [editingId, setEditingId] = useState(null);
  const [editTypeInput, setEditTypeInput] = useState('');
  const [editDaysInput, setEditDaysInput] = useState('');

  // Delete Confirmation State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // Decimal check helper
  const validateDecimalInput = (val, isRequired = false) => {
    if (val === undefined || val === null || String(val).trim() === '') {
      return isRequired ? 'This field is required.' : '';
    }
    const str = String(val).trim();
    // Only numbers and positive decimal points allowed
    const regex = /^\d+(\.\d+)?$/;
    if (!regex.test(str)) {
      return 'Only positive numbers and decimal values are allowed (e.g. 12 or 1.5).';
    }
    const parsed = parseFloat(str);
    if (isNaN(parsed) || parsed < 0) {
      return 'Please enter a valid positive number.';
    }
    return '';
  };

  const handleYearlyCapChange = (e) => {
    const val = e.target.value;
    setYearlyLeaveCap(val);
    setYearlyCapError(validateDecimalInput(val, true));
  };

  const handleLeaveDaysChange = (e) => {
    const val = e.target.value;
    setLeaveDaysInput(val);
    setLeaveDaysError(validateDecimalInput(val, false));
  };

  const handleEditDaysChange = (e) => {
    const val = e.target.value;
    setEditDaysInput(val);
    setEditDaysError(validateDecimalInput(val, false));
  };

  // Load configuration
  const loadConfig = async () => {
    if (!companyId) {
      addToast({ type: 'warning', message: 'No company selected! Please select a company.' });
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getLeaveMaster(companyId);
      setYearlyLeaveCap(data.yearly_leave_cap !== null && data.yearly_leave_cap !== undefined ? String(data.yearly_leave_cap) : '0');
      setLeaveTypes(data.leave_types || []);
    } catch (err) {
      console.error('Error fetching leave master:', err);
      addToast({ type: 'error', message: 'Failed to load leave master configuration.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, [companyId]);

  // Save Yearly Leave Cap
  const handleSaveCap = async () => {
    if (!companyId) return;
    const err = validateDecimalInput(yearlyLeaveCap, true);
    if (err) {
      setYearlyCapError(err);
      addToast({ type: 'warning', message: err });
      return;
    }

    const capVal = parseFloat(yearlyLeaveCap);
    try {
      const data = {
        yearly_leave_cap: capVal,
        leave_types: leaveTypes.map(t => ({
          id: t.id,
          leave_type: t.leave_type,
          leave_days: t.leave_days
        }))
      };
      const updated = await saveLeaveMaster(companyId, data);
      setYearlyLeaveCap(String(updated.yearly_leave_cap));
      setLeaveTypes(updated.leave_types);
      addToast({ type: 'success', message: 'Yearly Leave Cap saved successfully!' });
    } catch (err) {
      console.error('Error saving yearly leave cap:', err);
      addToast({ type: 'error', message: 'Failed to save Yearly Leave Cap.' });
    }
  };

  // Add new Leave Type
  const handleAddLeaveType = async (e) => {
    e.preventDefault();
    if (!companyId) return;

    const capErr = validateDecimalInput(yearlyLeaveCap, true);
    if (capErr) {
      setYearlyCapError(capErr);
      addToast({ type: 'warning', message: 'Please correct Yearly Leave Cap validation errors.' });
      return;
    }

    if (!leaveTypeInput.trim()) {
      addToast({ type: 'warning', message: 'Leave Type name is required.' });
      return;
    }

    // Check duplicate name
    if (leaveTypes.some(t => t.leave_type.toLowerCase() === leaveTypeInput.trim().toLowerCase())) {
      addToast({ type: 'warning', message: 'This Leave Type already exists.' });
      return;
    }

    const daysErr = validateDecimalInput(leaveDaysInput, false);
    if (daysErr) {
      setLeaveDaysError(daysErr);
      addToast({ type: 'warning', message: daysErr });
      return;
    }

    const daysVal = leaveDaysInput.trim() !== '' ? parseFloat(leaveDaysInput) : null;
    try {
      const newTypeObj = {
        leave_type: leaveTypeInput.trim(),
        leave_days: daysVal !== null ? daysVal : ''
      };
      
      const payload = {
        yearly_leave_cap: parseFloat(yearlyLeaveCap),
        leave_types: [
          ...leaveTypes.map(t => ({
            id: t.id,
            leave_type: t.leave_type,
            leave_days: t.leave_days
          })),
          newTypeObj
        ]
      };

      const updated = await saveLeaveMaster(companyId, payload);
      setYearlyLeaveCap(String(updated.yearly_leave_cap));
      setLeaveTypes(updated.leave_types);
      setLeaveTypeInput('');
      setLeaveDaysInput('');
      setLeaveDaysError('');
      addToast({ type: 'success', message: 'Leave Type added successfully!' });
    } catch (err) {
      console.error('Error adding leave type:', err);
      addToast({ type: 'error', message: 'Failed to add leave type.' });
    }
  };

  // Start editing leave type
  const handleEditClick = (type) => {
    setEditingId(type.id);
    setEditTypeInput(type.leave_type);
    setEditDaysInput(type.leave_days !== null && type.leave_days !== undefined ? String(type.leave_days) : '');
    setEditDaysError('');
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTypeInput('');
    setEditDaysInput('');
    setEditDaysError('');
  };

  // Update Leave Type
  const handleUpdateLeaveType = async (e) => {
    e.preventDefault();
    if (!companyId || !editingId) return;

    const capErr = validateDecimalInput(yearlyLeaveCap, true);
    if (capErr) {
      setYearlyCapError(capErr);
      addToast({ type: 'warning', message: 'Please correct Yearly Leave Cap validation errors.' });
      return;
    }

    if (!editTypeInput.trim()) {
      addToast({ type: 'warning', message: 'Leave Type name is required.' });
      return;
    }

    // Check duplicate name excluding itself
    if (leaveTypes.some(t => t.id !== editingId && t.leave_type.toLowerCase() === editTypeInput.trim().toLowerCase())) {
      addToast({ type: 'warning', message: 'Another Leave Type already has this name.' });
      return;
    }

    const daysErr = validateDecimalInput(editDaysInput, false);
    if (daysErr) {
      setEditDaysError(daysErr);
      addToast({ type: 'warning', message: daysErr });
      return;
    }

    const daysVal = editDaysInput.trim() !== '' && editDaysInput !== null ? parseFloat(editDaysInput) : null;
    try {
      const payload = {
        yearly_leave_cap: parseFloat(yearlyLeaveCap),
        leave_types: leaveTypes.map(t => {
          if (t.id === editingId) {
            return {
              id: t.id,
              leave_type: editTypeInput.trim(),
              leave_days: daysVal !== null ? daysVal : ''
            };
          }
          return {
            id: t.id,
            leave_type: t.leave_type,
            leave_days: t.leave_days
          };
        })
      };

      const updated = await saveLeaveMaster(companyId, payload);
      setYearlyLeaveCap(String(updated.yearly_leave_cap));
      setLeaveTypes(updated.leave_types);
      setEditingId(null);
      setEditDaysError('');
      addToast({ type: 'success', message: 'Leave Type updated successfully!' });
    } catch (err) {
      console.error('Error updating leave type:', err);
      addToast({ type: 'error', message: 'Failed to update leave type.' });
    }
  };

  // Trigger Delete confirmation modal
  const handleDeleteClick = (id) => {
    setDeleteTargetId(id);
    setIsConfirmOpen(true);
  };

  // Execute deletion
  const handleConfirmDelete = async () => {
    if (deleteTargetId && companyId) {
      try {
        const updated = await deleteLeaveType(deleteTargetId, companyId);
        setYearlyLeaveCap(String(updated.yearly_leave_cap));
        setLeaveTypes(updated.leave_types || []);
        addToast({ type: 'success', message: 'Leave Type deleted successfully!' });
      } catch (err) {
        console.error('Error deleting leave type:', err);
        addToast({ type: 'error', message: 'Failed to delete leave type.' });
      }
    }
    setIsConfirmOpen(false);
    setDeleteTargetId(null);
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerSection}>
        <div>
          <h1 className={styles.title}>Leave Setup</h1>
          <span className={styles.subTitle}>Configure dynamic leave types and yearly limits</span>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading leave configuration...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
          {/* Top Section: Yearly Cap & Add Form side-by-side, centered */}
          <div className={styles.topSection}>
            {/* Yearly Cap Card */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Yearly Leave Cap</h3>
              <div className={styles.field}>
                <label className={styles.label}>
                  Allowed Leaves in a Year *
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input
                    type="text"
                    value={yearlyLeaveCap}
                    onChange={handleYearlyCapChange}
                    placeholder="e.g. 12"
                    className={`${styles.input} ${yearlyCapError ? styles.inputError : ''}`}
                    required
                  />
                  <button 
                    onClick={handleSaveCap} 
                    className={`${styles.btn} ${styles.primaryBtn}`}
                    disabled={!!yearlyCapError}
                  >
                    <Save size={16} /> Save Cap
                  </button>
                </div>
                {yearlyCapError && <span className={styles.errorText}>{yearlyCapError}</span>}
              </div>
            </div>

            {/* Add Leave Type Card */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>
                {editingId ? 'Edit Leave Type' : 'Add Leave Type'}
              </h3>
              <form onSubmit={editingId ? handleUpdateLeaveType : handleAddLeaveType} style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                <div className={styles.field}>
                  <label className={styles.label}>Leave Type Name *</label>
                  <input
                    type="text"
                    value={editingId ? editTypeInput : leaveTypeInput}
                    onChange={(e) => editingId ? setEditTypeInput(e.target.value) : setLeaveTypeInput(e.target.value)}
                    placeholder="e.g. Casual Leave (CL)"
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Total Days (Optional)</label>
                  <input
                    type="text"
                    value={editingId ? editDaysInput : leaveDaysInput}
                    onChange={editingId ? handleEditDaysChange : handleLeaveDaysChange}
                    placeholder="e.g. 6.5"
                    className={`${styles.input} ${(editingId ? editDaysError : leaveDaysError) ? styles.inputError : ''}`}
                  />
                  {(editingId ? editDaysError : leaveDaysError) && (
                    <span className={styles.errorText}>
                      {editingId ? editDaysError : leaveDaysError}
                    </span>
                  )}
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    Leave this empty if the days are unrestricted. Supports fractional half-days (e.g. 1.5, 0.5).
                  </small>
                </div>

                <div className={styles.buttonGroup}>
                  {editingId ? (
                    <>
                      <button 
                        type="submit" 
                        className={`${styles.btn} ${styles.primaryBtn}`}
                        disabled={!!editDaysError}
                      >
                        Update
                      </button>
                      <button type="button" onClick={handleCancelEdit} className={`${styles.btn} ${styles.secondaryBtn}`}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button 
                      type="submit" 
                      className={`${styles.btn} ${styles.primaryBtn}`}
                      disabled={!!leaveDaysError}
                    >
                      <Plus size={16} /> Add Leave Type
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Bottom Section: Configured Leave Types List taking full width */}
          <div className={styles.tableCard}>
            <h3 className={styles.cardTitle}>Configured Leave Types</h3>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Leave Type</th>
                    <th>Days Limit</th>
                    <th style={{ width: '100px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLeaveTypes.length > 0 ? (
                    paginatedLeaveTypes.map((row) => (
                      <tr key={row.id}>
                        <td><strong>{row.leave_type}</strong></td>
                        <td>{row.leave_days ? `${row.leave_days} Days` : 'Unrestricted'}</td>
                        <td>
                          <div className={styles.actionCell}>
                            <button
                              onClick={() => handleEditClick(row)}
                              className={styles.editBtn}
                              title="Edit Leave Type"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(row.id)}
                              className={styles.deleteBtn}
                              title="Delete Leave Type"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className={styles.emptyState}>
                        No custom leave types configured yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className={styles.tableFooter}>
                <div className={styles.footerLeft}>
                  <div className={styles.limitControl}>
                    <select 
                      value={pageSize} 
                      onChange={(e) => setPageSize(Number(e.target.value))}
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
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={styles.pageBtn}
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`${styles.pageBtn} ${currentPage === i + 1 ? styles.activePageBtn : ''}`}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={styles.pageBtn}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Leave Type"
        message="Are you sure you want to delete this Leave Type? Existing leave records using this type will not be deleted, but this leave type will no longer be available in the dropdown."
      />
    </div>
  );
};

export default LeaveMasterPage;
