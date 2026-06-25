import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Check, X, FileCheck, Calendar, Users, AlertCircle, FileClock, Download, FileSpreadsheet, Copy, FileText, File, Printer } from 'lucide-react';
import styles from './LeavePage.module.css';
import { getEmployees } from '../../../master/employee/services/employeeService';
import { useToast, ConfirmModal, DatePicker } from '../../../../shared/components';
import {
  getLeaveRequests,
  createLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest
} from '../services/leaveService';

const getDurationInDays = (fromDate, toDate, leaveType) => {
  if (leaveType === 'Half Day Leave') return 0.5;
  if (!fromDate || !toDate) return 0;
  const start = new Date(fromDate);
  const end = new Date(toDate);
  const diffTime = end - start;
  if (diffTime < 0) return 0;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

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
  const todayStr = useMemo(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const [employees, setEmployees] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Confirmation Modal States
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'approve' | 'reject'
  const [confirmTargetId, setConfirmTargetId] = useState(null);
  const [confirmTargetName, setConfirmTargetName] = useState(null);
  
  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newLeave, setNewLeave] = useState({
    employeeId: '',
    leaveType: '',
    fromDate: '',
    toDate: '',
    description: '',
    singleDay: false
  });



  // Helper to construct employee photo URL
  const getPhotoUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('data:')) return path;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/payroll/v1/';
    const host = baseUrl.replace('/payroll/v1/', '');
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${host}/payroll/${cleanPath}`;
  };

  // Fetch real database employees and merge/map them to leave requests
  useEffect(() => {
    const companyId = localStorage.getItem('selectedCompany');
    if (!companyId) {
      setLeaveRequests([]);
      return;
    }

    const loadData = async () => {
      try {
        const empData = await getEmployees(companyId);
        setEmployees(empData);

        const requestsData = await getLeaveRequests(companyId);
        setLeaveRequests(requestsData || []);
      } catch (err) {
        console.error('Failed to load employees or leave requests for dashboard:', err);
        addToast({ type: 'error', message: 'Failed to load leave requests.' });
        setLeaveRequests([]);
      }
    };

    loadData();
  }, []);

  // Close download dropdown if clicked outside
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

  const exportToCSV = (data, filename) => {
    const headers = ['Employee Name', 'UAN', 'Mobile', 'Leave Category', 'Leave Details (Duration)', 'Request Date', 'Remaining Leaves', 'Description', 'Status'];
    const rows = data.map(r => {
      const duration = r.fromDate === r.toDate 
        ? `${formatDateToDMY(r.fromDate)} (${r.leaveType === 'Half Day Leave' ? '0.5 Day' : '1 Day'})` 
        : `${formatDateToDMY(r.fromDate)} to ${formatDateToDMY(r.toDate)} (${getDurationInDays(r.fromDate, r.toDate, r.leaveType)} Days)`;
      return [
        r.employeeName,
        r.uan,
        r.mobile,
        r.leaveType,
        duration,
        formatDateToDMY(r.requestDate),
        r.remainingLeaves,
        r.description ? r.description.replace(/"/g, '""') : '',
        r.status
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printTable = (data) => {
    const formatPrintDateTime = (date) => {
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const yyyy = date.getFullYear();
      const hrs = String(date.getHours()).padStart(2, '0');
      const mins = String(date.getMinutes()).padStart(2, '0');
      const secs = String(date.getSeconds()).padStart(2, '0');
      return `${dd}-${mm}-${yyyy} ${hrs}:${mins}:${secs}`;
    };

    const htmlContent = `
      <html>
        <head>
          <title>&nbsp;</title>
          <style>
            @media print {
              @page { margin: 0; }
              body { 
                margin: 0; 
                padding: 1.6cm; 
              }
            }
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            h1 { text-align: center; color: #27d68a; margin-bottom: 5px; }
            p.info { text-align: center; color: #666; font-size: 0.9rem; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 0.9rem; }
            th { background-color: #f8f9fa; font-weight: bold; }
            .status-Approved { color: #27d68a; font-weight: bold; }
            .status-Rejected { color: #ef4444; font-weight: bold; }
            .status-Pending { color: #f59e0b; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Leave Requests Report</h1>
          <p class="info">Generated on: ${formatPrintDateTime(new Date())}</p>
          <table>
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>UAN</th>
                <th>Mobile</th>
                <th>Leave Category</th>
                <th>Leave Details</th>
                <th>Remaining Leaves</th>
                <th>Description</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(r => `
                <tr>
                  <td><strong>${r.employeeName || ''}</strong></td>
                  <td>${r.uan || ''}</td>
                  <td>${r.mobile || ''}</td>
                  <td>${r.leaveType || ''}</td>
                  <td>${r.fromDate === r.toDate 
                    ? `${formatDateToDMY(r.fromDate)} (${r.leaveType === 'Half Day Leave' ? '0.5 Day' : '1 Day'})` 
                    : `${formatDateToDMY(r.fromDate)} to ${formatDateToDMY(r.toDate)} (${getDurationInDays(r.fromDate, r.toDate, r.leaveType)} Days)`}</td>
                  <td>${r.remainingLeaves ?? ''}</td>
                  <td>${r.description || '-'}</td>
                  <td><span class="status-${r.status || ''}">${r.status || ''}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    printFrame.style.visibility = 'hidden';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow.document;
    frameDoc.write(htmlContent);
    frameDoc.close();

    printFrame.contentWindow.focus();
    printFrame.contentWindow.print();

    setTimeout(() => {
      document.body.removeChild(printFrame);
    }, 1000);
  };

  // Export handlers
  const handleExportClick = (type) => {
    setIsDropdownOpen(false);
    if (filteredRequests.length === 0) {
      addToast({ type: 'warning', message: 'No records to export.' });
      return;
    }

    try {
      if (type === 'CSV') {
        exportToCSV(filteredRequests, 'leave_requests.csv');
        addToast({ type: 'success', message: 'CSV file exported successfully!' });
      } else if (type === 'Excel') {
        exportToCSV(filteredRequests, 'leave_requests.csv');
        addToast({ type: 'success', message: 'Excel file exported successfully!' });
      } else if (type === 'PDF' || type === 'Print') {
        printTable(filteredRequests);
      }
    } catch (err) {
      console.error('Export failed:', err);
      addToast({ type: 'error', message: `Failed to export ${type} file.` });
    }
  };

  const handleCopyClick = () => {
    const text = filteredRequests
      .map((r) => {
        const duration = r.fromDate === r.toDate 
          ? `${formatDateToDMY(r.fromDate)} (${r.leaveType === 'Half Day Leave' ? '0.5 Day' : '1 Day'})` 
          : `${formatDateToDMY(r.fromDate)} to ${formatDateToDMY(r.toDate)} (${getDurationInDays(r.fromDate, r.toDate, r.leaveType)} Days)`;
        return `${r.employeeName}\t${r.uan}\t${r.mobile}\t${r.leaveType}\t${duration}\tReq: ${formatDateToDMY(r.requestDate)}\t${r.remainingLeaves}\t${r.description}\t${r.status}`;
      })
      .join('\n');
    navigator.clipboard.writeText(text);
    addToast({ type: 'success', message: 'Copied filtered leave requests list to clipboard!' });
    setIsDropdownOpen(false);
  };

  // Employee Dropdown Options (merges DB data with fallbacks)
  const employeeOptions = useMemo(() => {
    if (employees && employees.length > 0) {
      return employees.map(e => ({
        id: e.id,
        name: e.memberName || e.name,
        uan: e.uan || 'N/A',
        mobile: e.mobile || 'N/A',
        category: e.employeeType || 'Office Staff',
        imagePath: e.employeeImage || null
      }));
    }
    // Fallback options
    return [
      { id: 'mock-1', name: 'Karan Mehra', uan: '100090965378', mobile: '9345678901', category: 'Bidi Roller', imagePath: null },
      { id: 'mock-2', name: 'Gopal Sharma', uan: '100110358674', mobile: '9890123456', category: 'Packing Staff', imagePath: null },
      { id: 'mock-3', name: 'Vatsal', uan: '111222333444', mobile: '9876543210', category: 'Office Staff', imagePath: null },
      { id: 'mock-4', name: 'Sanjay Prasad', uan: '100093736407', mobile: '9789012345', category: 'Bidi Roller', imagePath: null }
    ];
  }, [employees]);

  // Form Input Change Handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewLeave((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Form Submit Handler
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const toDateVal = newLeave.singleDay ? newLeave.fromDate : newLeave.toDate;
    
    if (!newLeave.employeeId || !newLeave.leaveType || !newLeave.fromDate || !toDateVal || !newLeave.description) {
      addToast({ type: 'warning', message: 'Please fill out all required fields.' });
      return;
    }

    if (!newLeave.singleDay && new Date(toDateVal) < new Date(newLeave.fromDate)) {
      addToast({ type: 'warning', message: 'To Date cannot be earlier than From Date.' });
      return;
    }

    const companyId = localStorage.getItem('selectedCompany');
    if (!companyId) {
      addToast({ type: 'error', message: 'No company selected.' });
      return;
    }

    try {
      const createdRequest = await createLeaveRequest({
        employeeId: newLeave.employeeId,
        companyId,
        leaveType: newLeave.leaveType,
        fromDate: newLeave.fromDate,
        toDate: toDateVal,
        description: newLeave.description
      });

      setLeaveRequests((prev) => [createdRequest, ...prev]);
      setIsFormOpen(false);
      setNewLeave({
        employeeId: '',
        leaveType: '',
        fromDate: '',
        toDate: '',
        description: '',
        singleDay: false
      });
      addToast({
        type: 'success',
        message: `Leave request for ${createdRequest.employeeName} submitted successfully!`
      });
    } catch (err) {
      console.error('Error submitting leave request:', err);
      addToast({ type: 'error', message: err.message || 'Failed to submit leave request.' });
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
        message: `Leave request for ${updated.employeeName} approved successfully!`
      });
    } catch (err) {
      console.error('Error approving leave request:', err);
      addToast({ type: 'error', message: err.message || 'Failed to approve leave request.' });
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
        message: `Leave request for ${updated.employeeName} has been rejected.`
      });
    } catch (err) {
      console.error('Error rejecting leave request:', err);
      addToast({ type: 'error', message: err.message || 'Failed to reject leave request.' });
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

  const handleConfirmAction = async () => {
    const action = confirmAction;
    const id = confirmTargetId;
    
    // Clear states immediately to avoid overlay flickering
    setIsConfirmOpen(false);
    setConfirmTargetId(null);
    setConfirmTargetName(null);
    setConfirmAction(null);

    if (id && action) {
      if (action === 'approve') {
        await approveRequest(id);
      } else if (action === 'reject') {
        await rejectRequest(id);
      }
    }
  };

  const handleCancelAction = () => {
    setIsConfirmOpen(false);
    setConfirmTargetId(null);
    setConfirmTargetName(null);
    setConfirmAction(null);
  };

  // Calculate statistics for the summary cards
  const stats = useMemo(() => {
    const total = leaveRequests.length;
    const pending = leaveRequests.filter((r) => r.status === 'Pending').length;
    const approved = leaveRequests.filter((r) => r.status === 'Approved').length;
    const rejected = leaveRequests.filter((r) => r.status === 'Rejected').length;

    return { total, pending, approved, rejected };
  }, [leaveRequests]);

  // Filter requests based on search query and status tab
  const filteredRequests = useMemo(() => {
    return leaveRequests.filter((req) => {
      const matchesSearch =
        req.employeeName.toLowerCase().includes(search.toLowerCase()) ||
        req.description.toLowerCase().includes(search.toLowerCase()) ||
        req.category.toLowerCase().includes(search.toLowerCase()) ||
        req.leaveType.toLowerCase().includes(search.toLowerCase()) ||
        req.uan.includes(search) ||
        req.mobile.includes(search);

      const matchesStatus = statusFilter === 'All' || req.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [leaveRequests, search, statusFilter]);

  // Pagination calculations
  const totalPages = useMemo(() => {
    const calculated = Math.ceil(filteredRequests.length / rowsPerPage);
    return Math.max(1, calculated);
  }, [filteredRequests, rowsPerPage]);

  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredRequests.slice(start, start + rowsPerPage);
  }, [filteredRequests, currentPage, rowsPerPage]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, rowsPerPage]);

  return (
    <div className={styles.pageContainer}>
      {/* Title Header */}
      <div className={styles.headerSection}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className={styles.pageTitle}>Leave Management</h1>
            <span className={styles.subTitle}>Manage and audit employee leave allowance requests</span>
          </div>
          {!isFormOpen && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button onClick={() => setIsFormOpen(true)} className={styles.addBtn}>
                + Add Leave
              </button>
              <div className={styles.dropdownContainer} ref={dropdownRef}>
                <button
                  className={styles.downloadBtn}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <Download size={18} /> Download
                </button>
                {isDropdownOpen && (
                  <div className={styles.dropdownMenu}>
                    <button onClick={() => handleExportClick('Excel')}>
                      <FileSpreadsheet size={16} /> Excel
                    </button>
                    <button onClick={handleCopyClick}>
                      <Copy size={16} /> Copy
                    </button>
                    <button onClick={() => handleExportClick('CSV')}>
                      <FileText size={16} /> CSV
                    </button>
                    <button onClick={() => handleExportClick('PDF')}>
                      <File size={16} /> PDF
                    </button>
                    <button onClick={() => handleExportClick('Print')}>
                      <Printer size={16} /> Print
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Render form card if open */}
      {isFormOpen && (
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h3 className={styles.formTitle}>New Leave Request</h3>
          </div>
          <form onSubmit={handleFormSubmit}>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label className={styles.label}>Select Employee *</label>
                <select
                  name="employeeId"
                  value={newLeave.employeeId}
                  onChange={handleInputChange}
                  className={styles.select}
                  required
                >
                  <option value="" disabled>Select Employee</option>
                  {employeeOptions.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Leave Type *</label>
                <select
                  name="leaveType"
                  value={newLeave.leaveType}
                  onChange={handleInputChange}
                  className={styles.select}
                  required
                >
                  <option value="" disabled>Select Leave Type</option>
                  <option value="Casual Leave (CL)">Casual Leave (CL)</option>
                  <option value="Sick Leave (SL)">Sick Leave (SL)</option>
                  <option value="Marriage Leave">Marriage Leave</option>
                  <option value="Engagement Leave">Engagement Leave</option>
                  <option value="Half Day Leave">Half Day Leave</option>
                  <option value="Emergency Leave">Emergency Leave</option>
                </select>
              </div>

              {/* Single Day Checkbox */}
              <div
                className={styles.checkboxField}
                onClick={(e) => {
                  if (e.target.id === 'singleDay' || e.target.tagName === 'LABEL') return;
                  setNewLeave(prev => {
                    const nextVal = !prev.singleDay;
                    return {
                      ...prev,
                      singleDay: nextVal,
                      toDate: nextVal ? prev.fromDate : ''
                    };
                  });
                }}
              >
                <input
                  type="checkbox"
                  id="singleDay"
                  name="singleDay"
                  checked={newLeave.singleDay}
                  onChange={(e) => {
                    setNewLeave(prev => ({
                      ...prev,
                      singleDay: e.target.checked,
                      toDate: e.target.checked ? prev.fromDate : ''
                    }));
                  }}
                  className={styles.checkbox}
                />
                <label htmlFor="singleDay" className={styles.checkboxLabel}>Single Day Leave</label>
              </div>

              {newLeave.singleDay ? (
                <div className={styles.field}>
                  <label className={styles.label}>Select Date *</label>
                  <DatePicker
                    name="fromDate"
                    value={newLeave.fromDate}
                    min={todayStr}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewLeave(prev => ({
                        ...prev,
                        fromDate: val,
                        toDate: val
                      }));
                    }}
                  />
                </div>
              ) : (
                <>
                  <div className={styles.field}>
                    <label className={styles.label}>From Date *</label>
                    <DatePicker
                      name="fromDate"
                      value={newLeave.fromDate}
                      min={todayStr}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewLeave(prev => ({
                          ...prev,
                          fromDate: val,
                          toDate: prev.toDate && prev.toDate >= val ? prev.toDate : val
                        }));
                      }}
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>To Date *</label>
                    <DatePicker
                      name="toDate"
                      value={newLeave.toDate}
                      min={newLeave.fromDate || todayStr}
                      onChange={handleInputChange}
                    />
                  </div>
                </>
              )}

              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label}>Reason / Description *</label>
                <textarea
                  name="description"
                  value={newLeave.description}
                  onChange={handleInputChange}
                  placeholder="Explain reason for leave request..."
                  className={styles.textarea}
                  rows={4}
                  required
                />
              </div>
            </div>

            <div className={styles.buttonGroup}>
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  setNewLeave({
                    employeeId: '',
                    leaveType: '',
                    fromDate: '',
                    toDate: '',
                    description: '',
                    singleDay: false
                  });
                }}
                className={styles.cancelBtn}
              >
                Cancel
              </button>
              <button type="submit" className={styles.saveBtn}>
                Submit Request
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Leave Requests Dashboard & Table View */}
      <>
          {/* Summary Cards Grid */}
          {!isFormOpen && (
            <div className={styles.statsGrid}>
              <div className={`${styles.statsCard} ${styles.blueCard}`}>
                <div className={styles.statsIconWrapper}>
                  <FileClock size={24} />
                </div>
                <div className={styles.statsContent}>
                  <span className={styles.statsLabel}>Total Requests</span>
                  <span className={styles.statsValue}>{stats.total}</span>
                </div>
              </div>

              <div className={`${styles.statsCard} ${styles.orangeCard}`}>
                <div className={styles.statsIconWrapper}>
                  <Calendar size={24} />
                </div>
                <div className={styles.statsContent}>
                  <span className={styles.statsLabel}>Pending Approval</span>
                  <span className={styles.statsValue}>{stats.pending}</span>
                </div>
              </div>

              <div className={`${styles.statsCard} ${styles.greenCard}`}>
                <div className={styles.statsIconWrapper}>
                  <FileCheck size={24} />
                </div>
                <div className={styles.statsContent}>
                  <span className={styles.statsLabel}>Approved Leaves</span>
                  <span className={styles.statsValue}>{stats.approved}</span>
                </div>
              </div>

              <div className={`${styles.statsCard} ${styles.redCard}`}>
                <div className={styles.statsIconWrapper}>
                  <AlertCircle size={24} />
                </div>
                <div className={styles.statsContent}>
                  <span className={styles.statsLabel}>Rejected Requests</span>
                  <span className={styles.statsValue}>{stats.rejected}</span>
                </div>
              </div>
            </div>
          )}

          <div className={styles.tableCard}>
            {/* Filter Controls Row */}
            <div className={styles.tableControls}>
              <div className={styles.leftControlsPlaceholder}></div>
              <div className={styles.rightControls}>
                {/* Status Dropdown Filter */}
                <div className={styles.selectWrapper}>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className={styles.statusSelect}
                  >
                    <option value="All">All Statuses ({leaveRequests.length})</option>
                    <option value="Pending">Pending ({leaveRequests.filter((r) => r.status === 'Pending').length})</option>
                    <option value="Approved">Approved ({leaveRequests.filter((r) => r.status === 'Approved').length})</option>
                    <option value="Rejected">Rejected ({leaveRequests.filter((r) => r.status === 'Rejected').length})</option>
                  </select>
                </div>

                {/* Search Input */}
                <div className={styles.searchWrapper}>
                  <Search size={16} className={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Search employee, leave type..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>
              </div>
            </div>

            {/* Leaves Table Wrapper */}
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Employee Name</th>
                    <th>Contact</th>
                    <th>Leave Category</th>
                    <th>Leave Details</th>
                    <th style={{ textAlign: 'center' }}>Remaining (Yearly CAP 12)</th>
                    <th>Leave Description</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th style={{ textAlign: 'center', width: '120px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRequests.length > 0 ? (
                    paginatedRequests.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <div className={styles.empNameCell}>
                            <div className={styles.avatar}>
                              {row.imagePath ? (
                                <img
                                  src={getPhotoUrl(row.imagePath)}
                                  alt={row.employeeName}
                                  className={styles.avatarImg}
                                />
                              ) : (
                                row.employeeName.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className={styles.nameDetails}>
                              <span className={styles.boldCell}>{row.employeeName}</span>
                              <span className={styles.subTextUan}>UAN: {row.uan}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={styles.boldCell}>{row.mobile}</span>
                        </td>
                        <td>
                          <span className={styles.leaveType}>{row.leaveType}</span>
                        </td>
                        <td>
                          <div className={styles.leaveTypeCell}>
                            {row.fromDate && (
                              <span className={styles.leaveDuration}>
                                {row.fromDate === row.toDate 
                                  ? `${formatDateToDMY(row.fromDate)} (${row.leaveType === 'Half Day Leave' ? '0.5 Day' : '1 Day'})` 
                                  : `${formatDateToDMY(row.fromDate)} to ${formatDateToDMY(row.toDate)} (${getDurationInDays(row.fromDate, row.toDate, row.leaveType)} Days)`}
                              </span>
                            )}
                            <span className={styles.requestDate}>Req Date: {formatDateToDMY(row.requestDate)}</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            className={`${styles.remainingCount} ${
                              row.remainingLeaves <= 3 ? styles.criticalLeaves : ''
                            }`}
                          >
                            {row.remainingLeaves}
                          </span>
                        </td>
                        <td>
                          <p className={styles.descriptionText} title={row.description}>
                            {row.description}
                          </p>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            className={`${styles.statusBadge} ${
                              row.status === 'Approved'
                                ? styles.badgeApproved
                                : row.status === 'Rejected'
                                ? styles.badgeRejected
                                : styles.badgePending
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {row.status === 'Pending' ? (
                            <div className={styles.actionButtonGroup}>
                              <button
                                onClick={() => handleApprove(row.id, row.employeeName)}
                                className={styles.approveIconBtn}
                                title="Approve Leave Request"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() => handleReject(row.id, row.employeeName)}
                                className={styles.rejectIconBtn}
                                title="Reject Leave Request"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <span className={styles.actionCompletedText}>
                              Processed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className={styles.emptyTable}>
                        No leave requests found matching the selection criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer with Pagination Controls */}
            <div className={styles.tableFooter}>
              <div className={styles.footerLeft}>
                <div className={styles.limitControl}>
                  <span>Show</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => setRowsPerPage(Number(e.target.value))}
                    className={styles.limitSelect}
                  >
                    <option value={5}>5 records</option>
                    <option value={10}>10 records</option>
                    <option value={20}>20 records</option>
                  </select>
                  <span>per page</span>
                </div>
                <div className={styles.infoText}>
                  Showing {filteredRequests.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} to{' '}
                  {Math.min(currentPage * rowsPerPage, filteredRequests.length)} of {filteredRequests.length} entries
                </div>
              </div>

              <div className={styles.pagination}>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={styles.pageBtn}
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => {
                      setCurrentPage(page);
                    }}
                    className={`${styles.pageBtn} ${currentPage === page ? styles.activePageBtn : ''}`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={styles.pageBtn}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </>

      {/* Reusable Confirm Action Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={handleCancelAction}
        onConfirm={handleConfirmAction}
        title={confirmAction === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}
        message={
          confirmAction === 'approve'
            ? `Are you sure you want to approve the leave request for ${confirmTargetName}?`
            : `Are you sure you want to reject the leave request for ${confirmTargetName}? This action cannot be undone.`
        }
        confirmText={confirmAction === 'approve' ? 'Approve' : 'Reject'}
        theme={confirmAction === 'approve' ? 'success' : 'danger'}
      />
    </div>
  );
};

export default LeavePage;
