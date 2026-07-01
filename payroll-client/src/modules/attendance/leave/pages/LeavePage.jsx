import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Check, X, FileCheck, Calendar, Users, AlertCircle, FileClock, Download, Copy, File, Printer, ArrowLeft, Ban, Plus, ChevronDown, Upload } from 'lucide-react';
import styles from './LeavePage.module.css';
import { getEmployees } from '../../../master/employee/services/employeeService';
import { useToast, ConfirmModal, DatePicker } from '../../../../shared/components';
import {
  getLeaveRequests,
  createLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
  cancelLeaveRequest,
  calculateLeaveDays
} from '../services/leaveService';
import { getLeaveTypes, getEmployeeBalances, getEmployeeTypes } from '../../../setup/leave-master/services/leaveMasterService';

const formatDateToDMY = (dateStr) => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
};

const LeavePage = () => {
  const addToast = useToast();
  const companyId = localStorage.getItem('selectedCompany');

  const userStr = localStorage.getItem('user');
  const userObj = useMemo(() => {
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  }, [userStr]);

  const userRole = userObj?.role?.name || '';
  const isAdmin = userRole === 'Admin' || userRole === 'ADMIN' || userRole === 'OWNER';
  const isContractor = userRole === 'Contractor';
  const canApproveOrReject = isAdmin || isContractor;

  const [employees, setEmployees] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedDate, setSelectedDate] = useState('');
  const [dbEmployeeTypes, setDbEmployeeTypes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Search Select States & Refs for Employee dropdown
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
  const [isEmployeeSelectOpen, setIsEmployeeSelectOpen] = useState(false);
  const employeeSelectRef = useRef(null);

  // Search Select States & Refs for Leave Type dropdown
  const [leaveTypeSearchQuery, setLeaveTypeSearchQuery] = useState('');
  const [isLeaveTypeSelectOpen, setIsLeaveTypeSelectOpen] = useState(false);
  const leaveTypeSelectRef = useRef(null);

  // File Upload State & Ref
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef(null);

  // Live employee balances preview state
  const [employeeBalances, setEmployeeBalances] = useState([]);
  const [selectedBalance, setSelectedBalance] = useState(null);

  // Confirmation Modal States
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'approve' | 'reject' | 'cancel'
  const [confirmTargetId, setConfirmTargetId] = useState(null);
  const [confirmTargetName, setConfirmTargetName] = useState(null);
  
  const [calculatedDays, setCalculatedDays] = useState(null);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newLeave, setNewLeave] = useState({
    employeeId: '',
    leaveTypeId: '',
    fromDate: '',
    toDate: '',
    dayType: 'Full Day',
    reason: '',
    status: 'Submitted',
    attachmentPath: ''
  });

  // Base64 file upload helper
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewLeave(prev => ({ ...prev, attachmentPath: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const getPhotoUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('data:')) return path;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/payroll/v1/';
    const host = baseUrl.replace('/payroll/v1/', '');
    let cleanPath = path.startsWith('/') ? path.slice(1) : path;
    if (cleanPath.startsWith('payroll/')) {
      cleanPath = cleanPath.slice('payroll/'.length);
    }
    return `${host}/payroll/${cleanPath}`;
  };

  // Fetch initial data
  const loadInitialData = async () => {
    if (!companyId) return;
    try {
      const empData = await getEmployees(companyId);
      setEmployees(empData);

      const requestsData = await getLeaveRequests(companyId);
      setLeaveRequests(requestsData || []);

      const typesData = await getLeaveTypes(companyId);
      setLeaveTypes(typesData.filter(t => t.is_active));

      const empTypesData = await getEmployeeTypes();
      setDbEmployeeTypes(empTypesData || []);
    } catch (err) {
      console.error('Failed to load leave requests info:', err);
      addToast({ type: 'error', message: 'Failed to load leave records.' });
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [companyId]);

  // Handle click outside for searchable dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (employeeSelectRef.current && !employeeSelectRef.current.contains(event.target)) {
        setIsEmployeeSelectOpen(false);
      }
      if (leaveTypeSelectRef.current && !leaveTypeSelectRef.current.contains(event.target)) {
        setIsLeaveTypeSelectOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredEmployeeOptions = useMemo(() => {
    return employees.filter(e => {
      const name = e.memberName || '';
      const type = e.employeeType || '';
      return name.toLowerCase().includes(employeeSearchQuery.toLowerCase()) ||
             type.toLowerCase().includes(employeeSearchQuery.toLowerCase());
    });
  }, [employees, employeeSearchQuery]);

  const filteredLeaveTypeOptions = useMemo(() => {
    return leaveTypes.filter(t => {
      const name = t.name || '';
      const code = t.code || '';
      return name.toLowerCase().includes(leaveTypeSearchQuery.toLowerCase()) ||
             code.toLowerCase().includes(leaveTypeSearchQuery.toLowerCase());
    });
  }, [leaveTypes, leaveTypeSearchQuery]);

  // Fetch balances when employee is selected
  useEffect(() => {
    const fetchBalances = async () => {
      if (!newLeave.employeeId || !companyId) {
        setEmployeeBalances([]);
        setSelectedBalance(null);
        return;
      }
      try {
        const year = newLeave.fromDate ? newLeave.fromDate.split('-')[0] : new Date().getFullYear().toString();
        const balances = await getEmployeeBalances(newLeave.employeeId, companyId, year);
        setEmployeeBalances(balances);

        if (newLeave.leaveTypeId) {
          const bal = balances.find(b => b.leave_type_id === newLeave.leaveTypeId);
          setSelectedBalance(bal || null);
        }
      } catch (err) {
        console.error('Failed to fetch employee balances:', err);
      }
    };
    fetchBalances();
  }, [newLeave.employeeId, newLeave.fromDate]);

  // Update selected balance when type changes
  useEffect(() => {
    if (newLeave.leaveTypeId && employeeBalances.length > 0) {
      const bal = employeeBalances.find(b => b.leave_type_id === newLeave.leaveTypeId);
      setSelectedBalance(bal || null);
    } else {
      setSelectedBalance(null);
    }
  }, [newLeave.leaveTypeId, employeeBalances]);

  // Form Input Change Handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewLeave((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Calculate live leave duration
  useEffect(() => {
    const fetchDuration = async () => {
      if (!newLeave.fromDate || !newLeave.toDate || !companyId) {
        setCalculatedDays(null);
        return;
      }
      try {
        const days = await calculateLeaveDays(
          companyId,
          newLeave.fromDate,
          newLeave.toDate,
          newLeave.dayType
        );
        setCalculatedDays(days);
      } catch (err) {
        console.error('Failed to calculate leave days:', err);
        setCalculatedDays(null);
      }
    };
    fetchDuration();
  }, [newLeave.fromDate, newLeave.toDate, newLeave.dayType, companyId]);

  // Keep toDate in sync with fromDate for half days
  useEffect(() => {
    if (newLeave.dayType !== 'Full Day' && newLeave.fromDate) {
      setNewLeave(prev => ({
        ...prev,
        toDate: prev.fromDate
      }));
    }
  }, [newLeave.dayType, newLeave.fromDate]);

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setCalculatedDays(null);
    setIsEmployeeSelectOpen(false);
    setIsLeaveTypeSelectOpen(false);
    setEmployeeSearchQuery('');
    setLeaveTypeSearchQuery('');
    setFileName('');
    setNewLeave({
      employeeId: '',
      leaveTypeId: '',
      fromDate: '',
      toDate: '',
      dayType: 'Full Day',
      reason: '',
      status: 'Submitted',
      attachmentPath: ''
    });
  };

  // Form Submit Handler
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!companyId) return;

    if (!newLeave.employeeId || !newLeave.leaveTypeId || !newLeave.fromDate || !newLeave.toDate || !newLeave.reason) {
      addToast({ type: 'warning', message: 'Please fill out all required fields.' });
      return;
    }

    try {
      const createdRequest = await createLeaveRequest({
        ...newLeave,
        companyId
      });

      setLeaveRequests((prev) => [createdRequest, ...prev]);
      handleCloseForm();
      addToast({
        type: 'success',
        message: `Leave request for ${createdRequest.employeeName} submitted successfully!`
      });
      loadInitialData(); // Reload for live balance counts
    } catch (err) {
      console.error('Error submitting leave request:', err);
      const errMsg = err.response?.data?.messageToShow || err.message || 'Failed to submit leave request.';
      addToast({ type: 'error', message: errMsg });
    }
  };

  // Approve API Caller
  const approveRequest = async (id) => {
    try {
      const updated = await approveLeaveRequest(id);
      setLeaveRequests((prev) =>
        prev.map((req) => (req.id === id ? updated : req))
      );
      addToast({
        type: 'success',
        message: `Leave request approved successfully!`
      });
      loadInitialData();
    } catch (err) {
      console.error('Error approving request:', err);
      addToast({ type: 'error', message: err.message || 'Failed to approve request.' });
    }
  };

  // Reject API Caller
  const rejectRequest = async (id) => {
    try {
      const updated = await rejectLeaveRequest(id);
      setLeaveRequests((prev) =>
        prev.map((req) => (req.id === id ? updated : req))
      );
      addToast({
        type: 'info',
        message: `Leave request has been rejected.`
      });
      loadInitialData();
    } catch (err) {
      console.error('Error rejecting request:', err);
      addToast({ type: 'error', message: err.message || 'Failed to reject request.' });
    }
  };

  // Cancel API Caller
  const cancelRequest = async (id) => {
    try {
      const updated = await cancelLeaveRequest(id);
      setLeaveRequests((prev) =>
        prev.map((req) => (req.id === id ? updated : req))
      );
      addToast({
        type: 'info',
        message: `Approved leave request has been cancelled and balances restored.`
      });
      loadInitialData();
    } catch (err) {
      console.error('Error cancelling request:', err);
      addToast({ type: 'error', message: err.message || 'Failed to cancel request.' });
    }
  };

  // Confirmation Modal Open Triggers
  const handleApprove = (id, employeeName) => {
    setConfirmTargetId(id);
    setConfirmTargetName(employeeName);
    setConfirmAction('approve');
    setIsConfirmOpen(true);
  };

  const handleReject = (id, employeeName) => {
    setConfirmTargetId(id);
    setConfirmTargetName(employeeName);
    setConfirmAction('reject');
    setIsConfirmOpen(true);
  };

  const handleCancel = (id, employeeName) => {
    setConfirmTargetId(id);
    setConfirmTargetName(employeeName);
    setConfirmAction('cancel');
    setIsConfirmOpen(true);
  };

  const handleCancelAction = () => {
    setIsConfirmOpen(false);
    setConfirmTargetId(null);
    setConfirmTargetName(null);
    setConfirmAction(null);
  };

  const handleConfirmAction = async () => {
    const action = confirmAction;
    const id = confirmTargetId;
    
    setIsConfirmOpen(false);
    setConfirmTargetId(null);
    setConfirmTargetName(null);
    setConfirmAction(null);

    if (id && action) {
      if (action === 'approve') {
        await approveRequest(id);
      } else if (action === 'reject') {
        await rejectRequest(id);
      } else if (action === 'cancel') {
        await cancelRequest(id);
      }
    }
  };

  // Calculate statistics for the summary cards
  const stats = useMemo(() => {
    const total = leaveRequests.length;
    const pending = leaveRequests.filter((r) => r.status === 'Submitted').length;
    const approved = leaveRequests.filter((r) => r.status === 'Approved').length;
    const rejected = leaveRequests.filter((r) => r.status === 'Rejected' || r.status === 'Cancelled').length;

    return { total, pending, approved, rejected };
  }, [leaveRequests]);

  // Filter requests based on search query, category, status, and selected date
  const filteredRequests = useMemo(() => {
    return leaveRequests.filter((req) => {
      const matchesSearch =
        req.employeeName.toLowerCase().includes(search.toLowerCase()) ||
        req.reason.toLowerCase().includes(search.toLowerCase()) ||
        req.category.toLowerCase().includes(search.toLowerCase()) ||
        req.leaveType.toLowerCase().includes(search.toLowerCase()) ||
        req.uan.includes(search) ||
        req.mobile.includes(search);

      const matchesCategory =
        categoryFilter === 'All' ||
        (req.category && req.category.toUpperCase().trim() === categoryFilter.toUpperCase().trim());

      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Pending' && req.status === 'Submitted') ||
        (statusFilter === 'Approved' && req.status === 'Approved') ||
        (statusFilter === 'Rejected' && (req.status === 'Rejected' || req.status === 'Cancelled'));

      const matchesDate = !selectedDate || (
        selectedDate >= req.fromDate && selectedDate <= req.toDate
      );

      return matchesSearch && matchesCategory && matchesStatus && matchesDate;
    });
  }, [leaveRequests, search, statusFilter, categoryFilter, selectedDate]);

  // Reset pagination on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, categoryFilter, selectedDate, rowsPerPage]);

  // Pagination logic
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredRequests.slice(start, start + rowsPerPage);
  }, [filteredRequests, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredRequests.length / rowsPerPage);

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.headerSection}>
        <div>
          <h1 className={styles.pageTitle}>Leave Applications</h1>
          <span className={styles.subTitle}>Manage employee leave applications, approve requests, and review dynamic balances</span>
        </div>
        {!isFormOpen && (
          <button onClick={() => setIsFormOpen(true)} className={styles.addBtn}>
            <Plus size={16} /> Apply for Leave
          </button>
        )}
      </div>

      {/* Render tabbed form card inline if open */}
      {isFormOpen && (
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Apply for Leave</h2>
          </div>
          
          <form onSubmit={handleFormSubmit} className={styles.modalForm} style={{ padding: 0 }}>
            <div className={styles.field} ref={employeeSelectRef} style={{ position: 'relative' }}>
              <label className={styles.label}>Select Employee *</label>
              <div 
                className={styles.searchSelectTrigger}
                onClick={() => setIsEmployeeSelectOpen(!isEmployeeSelectOpen)}
              >
                <span>
                  {newLeave.employeeId 
                    ? employees.find(e => e.id === newLeave.employeeId)?.memberName 
                    : '-- Choose Employee --'}
                </span>
                <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />
              </div>

              {isEmployeeSelectOpen && (
                <div className={styles.searchSelectDropdown}>
                  <div className={styles.searchSelectInputWrapper}>
                    <Search size={14} className={styles.searchSelectIcon} />
                    <input
                      type="text"
                      placeholder="Type to search..."
                      value={employeeSearchQuery}
                      onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                      className={styles.searchSelectInput}
                      autoFocus
                    />
                  </div>
                  <div className={styles.searchSelectList}>
                    {filteredEmployeeOptions.length > 0 ? (
                      filteredEmployeeOptions.map(e => (
                        <div
                          key={e.id}
                          className={`${styles.searchSelectItem} ${newLeave.employeeId === e.id ? styles.searchSelectItemActive : ''}`}
                          onClick={() => {
                            setNewLeave(prev => ({ ...prev, employeeId: e.id }));
                            setIsEmployeeSelectOpen(false);
                            setEmployeeSearchQuery('');
                          }}
                        >
                          {e.memberName} ({e.employeeType || 'N/A'})
                        </div>
                      ))
                    ) : (
                      <div className={styles.searchSelectEmpty}>No employees found</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Dynamic Balance Preview Card */}
            {selectedBalance && (
              <div className={styles.balancePreviewCard}>
                <div className={styles.balanceHeader}>
                  <strong>Balance details: {selectedBalance.leave_name} ({selectedBalance.leave_code})</strong>
                </div>
                <div className={styles.balanceGrid}>
                  <div>Allocated: <strong>{selectedBalance.allocated}</strong></div>
                  <div>Carry Forward: <strong>{selectedBalance.carry_forward}</strong></div>
                  <div>Used: <strong>{selectedBalance.used}</strong></div>
                  <div>Pending: <strong>{selectedBalance.pending}</strong></div>
                  <div style={{ color: 'var(--primary)', fontWeight: 700 }}>
                    Remaining Available: <strong>{selectedBalance.remaining}</strong>
                  </div>
                </div>
              </div>
            )}

            <div className={styles.field} ref={leaveTypeSelectRef} style={{ position: 'relative' }}>
              <label className={styles.label}>Leave Type *</label>
              <div 
                className={styles.searchSelectTrigger}
                onClick={() => setIsLeaveTypeSelectOpen(!isLeaveTypeSelectOpen)}
              >
                <span>
                  {newLeave.leaveTypeId 
                    ? leaveTypes.find(t => t.id === newLeave.leaveTypeId)?.name 
                    : '-- Choose Leave Type --'}
                </span>
                <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />
              </div>

              {isLeaveTypeSelectOpen && (
                <div className={styles.searchSelectDropdown}>
                  <div className={styles.searchSelectInputWrapper}>
                    <Search size={14} className={styles.searchSelectIcon} />
                    <input
                      type="text"
                      placeholder="Type to search..."
                      value={leaveTypeSearchQuery}
                      onChange={(e) => setLeaveTypeSearchQuery(e.target.value)}
                      className={styles.searchSelectInput}
                      autoFocus
                    />
                  </div>
                  <div className={styles.searchSelectList}>
                    {filteredLeaveTypeOptions.length > 0 ? (
                      filteredLeaveTypeOptions.map(t => (
                        <div
                          key={t.id}
                          className={`${styles.searchSelectItem} ${newLeave.leaveTypeId === t.id ? styles.searchSelectItemActive : ''}`}
                          onClick={() => {
                            setNewLeave(prev => ({ ...prev, leaveTypeId: t.id }));
                            setIsLeaveTypeSelectOpen(false);
                            setLeaveTypeSearchQuery('');
                          }}
                        >
                          {t.name} ({t.code})
                        </div>
                      ))
                    ) : (
                      <div className={styles.searchSelectEmpty}>No leave types found</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Day Type *</label>
              <select
                name="dayType"
                value={newLeave.dayType}
                onChange={handleInputChange}
                className={styles.input}
                required
              >
                <option value="Full Day">Full Day</option>
                <option value="First Half">First Half Day (0.5)</option>
                <option value="Second Half">Second Half Day (0.5)</option>
              </select>
            </div>

            {newLeave.dayType === 'Full Day' ? (
              <div className={styles.twoColumnInputs}>
                <div className={styles.field}>
                  <label className={styles.label}>From Date *</label>
                  <input
                    type="date"
                    name="fromDate"
                    value={newLeave.fromDate}
                    onChange={handleInputChange}
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>To Date *</label>
                  <input
                    type="date"
                    name="toDate"
                    value={newLeave.toDate}
                    onChange={handleInputChange}
                    className={styles.input}
                    required
                  />
                </div>
              </div>
            ) : (
              <div className={styles.field}>
                <label className={styles.label}>Leave Date *</label>
                <input
                  type="date"
                  name="fromDate"
                  value={newLeave.fromDate}
                  onChange={handleInputChange}
                  className={styles.input}
                  required
                />
              </div>
            )}

            {calculatedDays !== null && (
              <div className={styles.durationBanner}>
                <span>Leave Duration:</span>
                <strong>{calculatedDays} {calculatedDays === 1 ? 'Day' : 'Days'}</strong>
              </div>
            )}

            <div className={styles.field}>
              <label className={styles.label}>Supporting Document (Optional)</label>
              <div className={styles.fileUploadWrapper}>
                <button
                  type="button"
                  className={styles.fileUploadBtn}
                  onClick={() => fileInputRef.current.click()}
                >
                  <Upload size={16} /> Choose File
                </button>
                <span className={styles.fileUploadName}>
                  {fileName || 'No file chosen'}
                </span>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    handleFileChange(e);
                    if (e.target.files[0]) {
                      setFileName(e.target.files[0].name);
                    } else {
                      setFileName('');
                    }
                  }}
                  accept="image/*,application/pdf"
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Reason for Leave *</label>
              <textarea
                name="reason"
                rows="3"
                value={newLeave.reason}
                onChange={handleInputChange}
                placeholder="Provide details about the leave..."
                className={styles.input}
                required
              />
            </div>

            <div className={styles.buttonGroup}>
              <button type="submit" className={styles.saveBtn}>Submit Request</button>
              <button type="button" onClick={handleCloseForm} className={styles.cancelBtn}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Render Summary Cards & Requests Table if form is closed */}
      {!isFormOpen && (
        <>
          {/* Summary Cards */}
          <div className={styles.statsGrid}>
            <div className={`${styles.statsCard} ${styles.blueCard}`}>
              <div className={styles.statsIconWrapper}><Users size={20} /></div>
              <div className={styles.statsContent}>
                <span className={styles.statsLabel}>Total Applications</span>
                <span className={styles.statsValue}>{stats.total}</span>
              </div>
            </div>

            <div className={`${styles.statsCard} ${styles.orangeCard}`}>
              <div className={styles.statsIconWrapper}><FileClock size={20} /></div>
              <div className={styles.statsContent}>
                <span className={styles.statsLabel}>Pending Approvals</span>
                <span className={styles.statsValue}>{stats.pending}</span>
              </div>
            </div>

            <div className={`${styles.statsCard} ${styles.greenCard}`}>
              <div className={styles.statsIconWrapper}><FileCheck size={20} /></div>
              <div className={styles.statsContent}>
                <span className={styles.statsLabel}>Approved Leaves</span>
                <span className={styles.statsValue}>{stats.approved}</span>
              </div>
            </div>

            <div className={`${styles.statsCard} ${styles.redCard}`}>
              <div className={styles.statsIconWrapper}><AlertCircle size={20} /></div>
              <div className={styles.statsContent}>
                <span className={styles.statsLabel}>Rejected & Cancelled</span>
                <span className={styles.statsValue}>{stats.rejected}</span>
              </div>
            </div>
          </div>

          {/* Table Card Container */}
          <div className={styles.tableCard}>
            {/* Table Controls (Search and Filters inside the Card matching Attendance list) */}
            <div className={styles.toolbar}>
              <div className={styles.leftControls}>
                <div style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.95rem', marginRight: '10px' }}>
                  Total Records: {filteredRequests.length}
                </div>

                {/* Calendar Date Picker Filter */}
                <div className={styles.dateFilter}>
                  <DatePicker
                    name="selectedDate"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className={styles.datePickerInput}
                  />
                  <button
                    type="button"
                    className={`${styles.quickBtn} ${!selectedDate ? styles.activeQuickBtn : ''}`}
                    onClick={() => setSelectedDate('')}
                    title="Show All Dates"
                  >
                    All
                  </button>
                </div>

                {/* Category Selector */}
                <div className={styles.categorySelect}>
                  <span className={styles.controlLabel}>Category</span>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="All">All Categories</option>
                    {dbEmployeeTypes.map((type) => (
                      <option key={type.id} value={type.name.toUpperCase().trim()}>
                        {type.name.toUpperCase().trim()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Selector */}
                <div className={styles.categorySelect}>
                  <span className={styles.controlLabel}>Status</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Search Input */}
              <div className={styles.searchWrapper}>
                <Search size={14} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search applications..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Table Container */}
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Employee Details</th>
                    <th>Leave Type</th>
                    <th>Duration (Dates)</th>
                    <th>Days Count</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Action By</th>
                    <th style={{ width: '130px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRequests.length > 0 ? (
                    paginatedRequests.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <div className={styles.empNameCell}>
                            {row.imagePath ? (
                              <img src={getPhotoUrl(row.imagePath)} alt="Profile" className={styles.avatar} />
                            ) : (
                              <div className={styles.avatar}>{row.employeeName.charAt(0)}</div>
                            )}
                            <div className={styles.identityCell}>
                              <strong className={styles.boldCell}>{row.employeeName}</strong>
                              <div className={styles.identityUan}>UAN: {row.uan} • <span className={styles.categoryBadge}>{row.category}</span></div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className={styles.leaveTypeCell}>
                            <span className={styles.leaveType}>{row.leaveType}</span>
                            <span className={styles.requestDate}>Code: {row.leaveCode}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                            <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                            <span>
                              {formatDateToDMY(row.fromDate)} to {formatDateToDMY(row.toDate)}
                            </span>
                          </div>
                          {row.dayType !== 'Full Day' && (
                            <small className={styles.halfDayTag}>{row.dayType}</small>
                          )}
                        </td>
                        <td>
                          <span className={styles.remainingCount}>{row.numberOfDays} Days</span>
                        </td>
                        <td className={styles.descriptionText} title={row.reason}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span>{row.reason}</span>
                            {row.attachmentPath && (
                              <a
                                href={getPhotoUrl(row.attachmentPath)}
                                download={`attachment_${row.id}`}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'underline', width: 'fit-content' }}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <File size={12} /> View Document
                              </a>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`${styles.statusBadge} ${
                            row.status === 'Approved' ? styles.statusApproved :
                            row.status === 'Submitted' ? styles.statusPending :
                            row.status === 'Cancelled' ? styles.statusCancelled : styles.statusRejected
                          }`}>
                            {row.status === 'Submitted' ? 'Pending' : row.status}
                          </span>
                        </td>
                        <td>
                          {row.actionByName ? (
                            <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.82rem' }}>
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.actionByName}</span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>({row.actionByRole})</span>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>
                          )}
                        </td>
                        <td>
                          <div className={styles.actionButtons}>
                            {canApproveOrReject ? (
                              <>
                                {row.status === 'Submitted' && (
                                  <>
                                    <button onClick={() => handleApprove(row.id, row.employeeName)} className={styles.actionApprove} title="Approve Request">
                                      <Check size={14} />
                                    </button>
                                    <button onClick={() => handleReject(row.id, row.employeeName)} className={styles.actionReject} title="Reject Request">
                                      <X size={14} />
                                    </button>
                                  </>
                                )}
                                {row.status !== 'Submitted' && (
                                  <span className={styles.actionCompletedText}>No actions</span>
                                )}
                              </>
                            ) : (
                              <span className={styles.actionCompletedText}>No permission</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className={styles.emptyTable}>No leave applications found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer / Pagination */}
            <div className={styles.tableFooter}>
              <div className={styles.footerLeft}>
                <div className={styles.limitControl}>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
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
                  Showing {filteredRequests.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} to {Math.min(currentPage * rowsPerPage, filteredRequests.length)} of {filteredRequests.length} entries
                </div>
              </div>
              <div className={styles.pagination}>
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={styles.pageBtn}
                >
                  Previous
                </button>

                {(() => {
                  const pages = [];
                  if (totalPages <= 7) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                  } else {
                    if (currentPage <= 4) {
                      for (let i = 1; i <= 5; i++) pages.push(i);
                      pages.push('...');
                      pages.push(totalPages);
                    } else if (currentPage >= totalPages - 3) {
                      pages.push(1);
                      pages.push('...');
                      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
                    } else {
                      pages.push(1);
                      pages.push('...');
                      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                      pages.push('...');
                      pages.push(totalPages);
                    }
                  }
                  return pages.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => p !== '...' && setCurrentPage(p)}
                      disabled={p === '...'}
                      className={`${styles.pageBtn} ${currentPage === p ? styles.activePageBtn : ''}`}
                      style={p === '...' ? { border: 'none', background: 'transparent', cursor: 'default' } : {}}
                    >
                      {p}
                    </button>
                  ));
                })()}

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={styles.pageBtn}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Confirmation Dialog Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={handleCancelAction}
        onConfirm={handleConfirmAction}
        title={
          confirmAction === 'approve' ? 'Approve Leave Request' : 
          confirmAction === 'reject' ? 'Reject Leave Request' : 'Cancel Leave Approval'
        }
        message={
          confirmAction === 'approve' ? `Are you sure you want to approve the leave request for ${confirmTargetName}? This will deduct leaves and record attendance status.` : 
          confirmAction === 'reject' ? `Are you sure you want to reject the leave request for ${confirmTargetName}?` : 
          `Are you sure you want to cancel the approved leave for ${confirmTargetName}? This will restore the leave balance and revert attendance changes.`
        }
        confirmText={
          confirmAction === 'approve' ? 'Approve' :
          confirmAction === 'reject' ? 'Reject' : 'Cancel Leave'
        }
        theme={
          confirmAction === 'approve' ? 'success' :
          confirmAction === 'reject' ? 'danger' : 'warning'
        }
      />
    </div>
  );
};

export default LeavePage;
