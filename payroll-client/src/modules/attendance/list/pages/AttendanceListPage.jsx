import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  X,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Image,
  Clock,
  Calendar,
  Download,
  FileSpreadsheet,
  Copy,
  FileText,
  File,
  Printer,
  Camera,
  Check
} from 'lucide-react';
import { useToast, DatePicker, ConfirmModal, Loader, SearchableSelect } from '../../../../shared/components';
import styles from './AttendanceListPage.module.css';
import { getEmployees } from '../../../master/employee/services/employeeService';
import { getCompanyAttendance, approveAttendance, rejectAttendance } from '../../attendanceService';
import { getEmployeeTypes } from '../../../setup/leave-master/services/leaveMasterService';

// Futuristic biometric avatar component for face visualization fallback
const BiometricAvatar = ({ seed, className }) => {
  const colors = [
    { bg: '#3B82F6', outline: '#60A5FA', face: '#E0F2FE' },
    { bg: '#10B981', outline: '#34D399', face: '#ECFDF5' },
    { bg: '#8B5CF6', outline: '#A78BFA', face: '#F5F3FF' },
    { bg: '#F59E0B', outline: '#FBBF24', face: '#FEF3C7' },
    { bg: '#EC4899', outline: '#F472B6', face: '#FDF2F8' },
    { bg: '#06B6D4', outline: '#22D3EE', face: '#ECFEFF' }
  ];
  
  const design = colors[(seed - 1) % colors.length] || colors[0];
  
  return (
    <svg viewBox="0 0 100 100" className={className} style={{ width: '100%', height: '100%', display: 'block' }}>
      <circle cx="50" cy="50" r="46" fill={design.bg} opacity="0.1" />
      <circle cx="50" cy="50" r="46" stroke={design.outline} strokeWidth="0.75" fill="none" strokeDasharray="2,2" />
      <path d="M42,75 L42,85 C42,88 45,90 50,90 C55,90 58,88 58,85 L58,75 Z" fill="#E2E8F0" />
      <ellipse cx="50" cy="48" rx="22" ry="26" fill={design.face} stroke={design.outline} strokeWidth="1.5" />
      <circle cx="42" cy="45" r="2.5" fill="#1E293B" />
      <circle cx="58" cy="45" r="2.5" fill="#1E293B" />
      <circle cx="42" cy="45" r="5" stroke="#27D68A" strokeWidth="0.5" fill="none" strokeDasharray="1,1" />
      <circle cx="58" cy="45" r="5" stroke="#27D68A" strokeWidth="0.5" fill="none" strokeDasharray="1,1" />
      <rect x="24" y="18" width="52" height="60" rx="6" stroke="#27D68A" strokeWidth="0.75" fill="none" opacity="0.6" strokeDasharray="3,3" />
    </svg>
  );
};

// Futuristic camera placeholder component for missing biometric images
const CameraPlaceholder = ({ label }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      position: 'relative',
      padding: '12px'
    }}>
      {/* Biometric scanning effect corner lines */}
      <div style={{
        position: 'absolute',
        top: '8px',
        left: '8px',
        width: '12px',
        height: '12px',
        borderTop: '2px solid #27d68a',
        borderLeft: '2px solid #27d68a',
        opacity: 0.6
      }} />
      <div style={{
        position: 'absolute',
        top: '8px',
        right: '8px',
        width: '12px',
        height: '12px',
        borderTop: '2px solid #27d68a',
        borderRight: '2px solid #27d68a',
        opacity: 0.6
      }} />
      <div style={{
        position: 'absolute',
        bottom: '8px',
        left: '8px',
        width: '12px',
        height: '12px',
        borderBottom: '2px solid #27d68a',
        borderLeft: '2px solid #27d68a',
        opacity: 0.6
      }} />
      <div style={{
        position: 'absolute',
        bottom: '8px',
        right: '8px',
        width: '12px',
        height: '12px',
        borderBottom: '2px solid #27d68a',
        borderRight: '2px solid #27d68a',
        opacity: 0.6
      }} />
      
      {/* Pulsing/glow wrapper for Camera icon */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '42px',
        height: '42px',
        borderRadius: '50%',
        backgroundColor: 'rgba(39, 214, 138, 0.1)',
        border: '1px dashed rgba(39, 214, 138, 0.4)',
        marginBottom: '6px',
        color: '#27d68a'
      }}>
        <Camera size={20} />
      </div>
      
      {/* Label text */}
      <span style={{ 
        fontSize: '0.7rem', 
        fontWeight: '600', 
        color: '#94a3b8', 
        textTransform: 'uppercase', 
        letterSpacing: '0.05em' 
      }}>
        {label || 'No Image'}
      </span>
    </div>
  );
};

// Premium GPS location radar map component
const BiometricMap = ({ lat, lng, address }) => {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  const isInvalid = isNaN(latitude) || isNaN(longitude);

  const googleMapsUrl = !isInvalid
    ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
    : '#';

  // OpenStreetMap embed URL
  const delta = 0.002; // Bounding box zoom level offset (closer zoom)
  const embedUrl = !isInvalid
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - delta}%2C${latitude - delta}%2C${longitude + delta}%2C${latitude + delta}&layer=mapnik&marker=${latitude}%2C${longitude}`
    : '';

  return (
    <div 
      className={styles.mapContainer}
      style={{ position: 'relative', overflow: 'hidden', height: '240px' }}
    >
      {!isInvalid ? (
        <iframe
          title="GPS Geolocation Map"
          width="100%"
          height="100%"
          style={{ border: 'none', filter: 'brightness(0.9) contrast(1.1)' }}
          src={embedUrl}
        />
      ) : (
        <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          No valid coordinates available
        </div>
      )}
      
      <div className={styles.mapHud} style={{ bottom: '8px', left: '8px', right: '8px', padding: '8px 12px' }}>
        <div className={styles.mapHudHeader} style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>
          <span className={styles.mapHudTag}>GPS VERIFIED</span>
          <span className={styles.mapHudCoords}>{lat}, {lng}</span>
        </div>
        {!isInvalid && (
          <div 
            onClick={() => window.open(googleMapsUrl, '_blank')}
            style={{ 
              marginTop: '6px', 
              fontSize: '0.75rem', 
              color: '#27D68A', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px', 
              fontWeight: '600',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
            title="Click to view exact location in Google Maps"
          >
            <MapPin size={12} />
            <span>Open in Google Maps ↗</span>
          </div>
        )}
      </div>
    </div>
  );
};

const parseCoords = (locationStr) => {
  if (!locationStr) return null;
  const parts = locationStr.split(',');
  if (parts.length < 2) return null;
  const lat = parseFloat(parts[0].trim());
  const lng = parseFloat(parts[1].trim());
  if (isNaN(lat) || isNaN(lng)) return null;
  return { lat, lng };
};

const getPhotoUrl = (photoPath) => {
  if (!photoPath) return null;
  if (photoPath.startsWith('data:image')) return photoPath;
  
  const apiBase = import.meta.env.VITE_API_BASE_URL || '';
  const cleanBase = apiBase ? apiBase.replace(/\/v1\/?$/, '/') : '';
  return `${cleanBase}${photoPath}`;
};

const formatDateFriendly = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const d = new Date(timeStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const AttendanceListPage = () => {
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
  const isAdmin = userRole.toUpperCase().startsWith('ADMIN') || userRole.toUpperCase().startsWith('OWNER');
  const isContractor = userRole === 'Contractor' || userRole === 'CONTRACTOR';
  const canApproveOrReject = isAdmin || isContractor;

  const [employees, setEmployees] = useState([]);
  const [logs, setLogs] = useState([]);
  
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [dbEmployeeTypes, setDbEmployeeTypes] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Defaults to today's date
  const getTodayDateStr = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayStr = getTodayDateStr();
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('All');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const addToast = useToast();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Modals state
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [activeLocationTab, setActiveLocationTab] = useState('in');

  // Confirmation Modal States
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'approve' | 'reject'
  const [confirmTargetId, setConfirmTargetId] = useState(null);
  const [confirmTargetName, setConfirmTargetName] = useState(null);

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const data = await getEmployeeTypes();
        setDbEmployeeTypes(data || []);
      } catch (err) {
        console.error('Error loading employee types for attendance list:', err);
      }
    };
    fetchTypes();
  }, []);

  // Fetch real data from DB
  useEffect(() => {
    const companyId = localStorage.getItem('selectedCompany');
    if (!companyId) return;

    const fetchData = async () => {
      try {
        const empData = await getEmployees(companyId);
        setEmployees(empData);

        const logData = await getCompanyAttendance(companyId);
        setLogs(logData);
      } catch (err) {
        console.error('Error fetching real-time attendance logs:', err);
      }
    };

    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        await fetchData();
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
    const interval = setInterval(fetchData, 4000); // Polling every 4 seconds for real-time updates
    return () => clearInterval(interval);
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
    const headers = ['SR No', 'Emp Code (UAN)', 'Name', 'Category', 'Date', 'Sign-In Time', 'Sign-Out Time', 'Status'];
    const rows = data.map((rec, index) => {
      const srNo = index + 1;
      const signIn = rec.record?.sign_in_time ? formatTime(rec.record.sign_in_time) : '—';
      const signOut = rec.record?.sign_out_time ? formatTime(rec.record.sign_out_time) : '—';
      return [
        srNo,
        rec.empCode || '',
        rec.name || '',
        rec.category || '',
        formatDateFriendly(rec.date),
        signIn,
        signOut,
        rec.status || ''
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => {
        const str = String(val === undefined || val === null ? '' : val);
        return `"${str.replace(/"/g, '""')}"`;
      }).join(','))
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
            .status-Present { color: #27d68a; font-weight: bold; }
            .status-Absent { color: #ef4444; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Attendance Report</h1>
          <p class="info">Generated on: ${formatPrintDateTime(new Date())}</p>
          <table>
            <thead>
              <tr>
                <th>SR No.</th>
                <th>Emp Code</th>
                <th>Name</th>
                <th>Category</th>
                <th>Date</th>
                <th>Sign-In Time</th>
                <th>Sign-Out Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${data.map((rec, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${rec.empCode || ''}</td>
                  <td><strong>${rec.name || ''}</strong></td>
                  <td>${rec.category || ''}</td>
                  <td>${formatDateFriendly(rec.date)}</td>
                  <td>${rec.record?.sign_in_time ? formatTime(rec.record.sign_in_time) : '—'}</td>
                  <td>${rec.record?.sign_out_time ? formatTime(rec.record.sign_out_time) : '—'}</td>
                  <td><span class="status-${rec.status || ''}">${rec.status || ''}</span></td>
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

  const handleExportClick = (type) => {
    setIsDropdownOpen(false);
    if (filteredRecords.length === 0) {
      addToast({ type: 'warning', message: 'No records to export.' });
      return;
    }

    try {
      if (type === 'CSV') {
        exportToCSV(filteredRecords, 'attendance_report.csv');
        addToast({ type: 'success', message: 'CSV file exported successfully!' });
      } else if (type === 'Excel') {
        exportToCSV(filteredRecords, 'attendance_report.csv');
        addToast({ type: 'success', message: 'Excel file exported successfully!' });
      } else if (type === 'PDF' || type === 'Print') {
        printTable(filteredRecords);
      }
    } catch (err) {
      console.error('Export failed:', err);
      addToast({ type: 'error', message: `Failed to export ${type} file.` });
    }
  };

  const handleCopyClick = () => {
    if (filteredRecords.length === 0) {
      addToast({ type: 'warning', message: 'No records to copy.' });
      return;
    }
    const text = filteredRecords
      .map((rec, index) => {
        const srNo = index + 1;
        const signIn = rec.record?.sign_in_time ? formatTime(rec.record.sign_in_time) : '—';
        const signOut = rec.record?.sign_out_time ? formatTime(rec.record.sign_out_time) : '—';
        return `${srNo}\t${rec.empCode}\t${rec.name}\t${rec.category}\t${formatDateFriendly(rec.date)}\tIn: ${signIn}\tOut: ${signOut}\t${rec.status}`;
      })
      .join('\n');
    navigator.clipboard.writeText(text);
    addToast({ type: 'success', message: 'Copied filtered attendance list to clipboard!' });
    setIsDropdownOpen(false);
  };

  // Helper to generate dates between fromDate and toDate
  const getDatesInRange = (startDate, endDate) => {
    const dates = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);
    
    // Safety check to prevent infinite loops or massive arrays
    if (isNaN(currentDate.getTime()) || isNaN(end.getTime())) return dates;
    
    // Max 31 days if we are not filtering by a specific employee, to avoid freezing the browser.
    // If a specific employee is selected, they can go up to 365 days.
    const maxDays = selectedEmployeeId !== 'All' ? 366 : 31;
    let days = 0;
    
    while (currentDate <= end && days < maxDays) {
      const yyyy = currentDate.getFullYear();
      const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
      const dd = String(currentDate.getDate()).padStart(2, '0');
      dates.push(`${yyyy}-${mm}-${dd}`);
      currentDate.setDate(currentDate.getDate() + 1);
      days++;
    }
    return dates;
  };

  // Generate Daily Attendance Sheet (combining check-ins with generated Absent logs)
  const generateDailySheet = () => {
    const resolveStatus = (log) => {
      if (!log) return 'Absent';
      if (log.approval_status === 'Pending') return 'Pending';
      if (log.approval_status === 'Rejected') return 'Absent';
      return log.sign_in_time ? 'Present' : 'Absent';
    };

    if (!fromDate || !toDate) {
      // Just map raw logs if dates are cleared entirely
      return logs.map((log) => {
        const emp = employees.find((e) => e.id === log.employee_id) || {};
        return {
          id: log.id,
          empCode: emp.uan || 'N/A',
          name: emp.memberName || emp.name || log.employee?.name || 'Unknown Employee',
          category: emp.employeeType || log.employee?.employee_type || 'N/A',
          contact: emp.mobile || '',
          address: emp.address || '',
          avatarSeed: 1,
          date: log.date,
          status: resolveStatus(log),
          record: log
        };
      });
    }

    const dates = getDatesInRange(fromDate, toDate);
    const empsToProcess = selectedEmployeeId === 'All' 
        ? employees 
        : employees.filter(e => e.id === selectedEmployeeId);

    const sheet = [];

    empsToProcess.forEach(emp => {
      dates.forEach(date => {
        const log = logs.find((l) => l.employee_id === emp.id && l.date === date);
        if (log) {
          sheet.push({
            id: log.id,
            empCode: emp.uan || 'N/A',
            name: emp.memberName || emp.name || log.employee?.name || 'Unknown Employee',
            category: emp.employeeType || log.employee?.employee_type || 'N/A',
            contact: emp.mobile || '',
            address: emp.address || '',
            avatarSeed: 1,
            date: log.date,
            status: resolveStatus(log),
            record: log
          });
        } else {
          sheet.push({
            id: `absent-${emp.id}-${date}`,
            empCode: emp.uan || 'N/A',
            name: emp.memberName || emp.name || 'Unknown Employee',
            category: emp.employeeType || 'N/A',
            contact: emp.mobile || '',
            address: emp.address || '',
            avatarSeed: 1,
            date: date,
            status: 'Absent',
            record: null
          });
        }
      });
    });

    return sheet;
  };

  const dailySheet = generateDailySheet();

  // Status priority for sorting (Pending first, then Absent, then Late, then Present)
  const statusPriority = {
    'Pending': 1,
    'Absent': 2,
    'Late': 3,
    'Present': 4
  };

  // Sort daily sheet records
  const sortedRecords = useMemo(() => {
    return [...dailySheet].sort((a, b) => {
      const priorityDiff = (statusPriority[a.status] || 3) - (statusPriority[b.status] || 3);
      if (priorityDiff !== 0) return priorityDiff;
      
      return new Date(b.date) - new Date(a.date);
    });
  }, [dailySheet]);

  // Filtering logic
  const filteredRecords = useMemo(() => {
    return sortedRecords.filter((rec) => {
      const matchesSearch =
        rec.name.toLowerCase().includes(search.toLowerCase()) ||
        rec.empCode.toLowerCase().includes(search.toLowerCase()) ||
        rec.category.toLowerCase().includes(search.toLowerCase()) ||
        rec.address.toLowerCase().includes(search.toLowerCase());
        
      const matchesCategory =
        categoryFilter === 'All' ||
        (rec.category && rec.category.toUpperCase().trim() === categoryFilter.toUpperCase().trim());
      const matchesStatus = statusFilter === 'All' || rec.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [sortedRecords, search, categoryFilter, statusFilter]);

  // Calculate summary stats for single employee
  const summaryStats = useMemo(() => {
    if (selectedEmployeeId === 'All' || !fromDate || !toDate) return null;
    
    let presentCount = 0;
    let absentCount = 0;
    let pendingCount = 0;

    filteredRecords.forEach(rec => {
        if (rec.status === 'Present' || rec.status === 'Late') presentCount++;
        else if (rec.status === 'Absent') absentCount++;
        else if (rec.status === 'Pending') pendingCount++;
    });

    return { presentCount, absentCount, pendingCount, total: presentCount + absentCount + pendingCount };
  }, [filteredRecords, selectedEmployeeId, fromDate, toDate]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredRecords.length / rowsPerPage);
  const paginatedRecords = useMemo(() => {
    return filteredRecords.slice(
      (currentPage - 1) * rowsPerPage,
      currentPage * rowsPerPage
    );
  }, [filteredRecords, currentPage, rowsPerPage]);

  // Reset pagination on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, statusFilter, fromDate, toDate, selectedEmployeeId, rowsPerPage]);

  const openLocationModal = (rec) => {
    if (rec.status === 'Absent') return;
    setSelectedRecord(rec);
    setIsLocationModalOpen(true);
    if (!rec.record?.sign_in_location && rec.record?.sign_out_location) {
      setActiveLocationTab('out');
    } else {
      setActiveLocationTab('in');
    }
  };

  const openImageModal = (rec) => {
    if (rec.status === 'Absent') return;
    setSelectedRecord(rec);
    setIsImageModalOpen(true);
  };

  const handleApprove = async (id) => {
    try {
      setIsSaving(true);
      await approveAttendance(id);
      addToast({ type: 'success', message: 'Attendance approved successfully.' });
      const companyId = localStorage.getItem('selectedCompany');
      if (companyId) {
        const logData = await getCompanyAttendance(companyId);
        setLogs(logData);
      }
    } catch (err) {
      console.error('Failed to approve attendance:', err);
      addToast({ type: 'error', message: err.message || 'Failed to approve attendance.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReject = async (id) => {
    try {
      setIsSaving(true);
      await rejectAttendance(id);
      addToast({ type: 'info', message: 'Attendance rejected.' });
      const companyId = localStorage.getItem('selectedCompany');
      if (companyId) {
        const logData = await getCompanyAttendance(companyId);
        setLogs(logData);
      }
    } catch (err) {
      console.error('Failed to reject attendance:', err);
      addToast({ type: 'error', message: err.message || 'Failed to reject attendance.' });
    } finally {
      setIsSaving(false);
    }
  };

  const triggerApproveConfirm = (id, name) => {
    setConfirmTargetId(id);
    setConfirmTargetName(name);
    setConfirmAction('approve');
    setIsConfirmOpen(true);
  };

  const triggerRejectConfirm = (id, name) => {
    setConfirmTargetId(id);
    setConfirmTargetName(name);
    setConfirmAction('reject');
    setIsConfirmOpen(true);
  };

  const handleCancelConfirm = () => {
    setIsConfirmOpen(false);
    setConfirmTargetId(null);
    setConfirmTargetName(null);
    setConfirmAction(null);
  };

  const handleExecuteConfirm = async () => {
    const action = confirmAction;
    const id = confirmTargetId;

    setIsConfirmOpen(false);
    setConfirmTargetId(null);
    setConfirmTargetName(null);
    setConfirmAction(null);

    if (id && action) {
      if (action === 'approve') {
        await handleApprove(id);
      } else if (action === 'reject') {
        await handleReject(id);
      }
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      if (currentPage <= 3) {
        end = 4;
      }
      if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
      }
      
      if (start > 2) {
        pages.push('...');
      }
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (end < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className={styles.pageContainer}>
      {(isLoading || isSaving) && <Loader fullPage={true} />}
      {/* Main Page Header */}
      <div className={styles.headerSection}>
        <h1 className={styles.pageTitle}>Attendance List</h1>
        
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

      {/* Table Card wrapper */}
      <div className={styles.tableCard}>
        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.leftControls}>
            <div style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.95rem', marginRight: '10px' }}>
              Total Records: {filteredRecords.length}
            </div>

            {/* Date Range Picker Filter */}
            <div className={styles.dateFilter}>
              <span className={styles.controlLabel} style={{ marginRight: '5px' }}>From</span>
              <DatePicker
                name="fromDate"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className={styles.datePickerInput}
              />
              <span className={styles.controlLabel} style={{ margin: '0 5px' }}>To</span>
              <DatePicker
                name="toDate"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className={styles.datePickerInput}
              />
              <button
                type="button"
                className={styles.quickBtn}
                onClick={() => {
                  setFromDate(todayStr);
                  setToDate(todayStr);
                }}
                title="Go to Today"
              >
                Today
              </button>
            </div>

            {/* Employee Selector */}
            <div className={styles.categorySelect} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span className={styles.controlLabel}>Employee</span>
              <SearchableSelect
                name="selectedEmployeeId"
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                options={[{ value: 'All', label: 'All Employees' }, ...employees.map(emp => ({ value: emp.id, label: `${emp.memberName || emp.name} (${emp.uan || 'No UAN'})` }))]}
                placeholder="All Employees"
                className={styles.searchableSelectFilter}
              />
            </div>

            {/* Category Selector */}
            <div className={styles.categorySelect}>
              <span className={styles.controlLabel}>Category</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="All">All Categories</option>
                <option value="OFFICE STAFF">Office Staff</option>
                <option value="PACKING STAFF">Packing Staff</option>
                <option value="BIDI ROLLER">Bidi Roller</option>
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
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Search Input */}
          <div className={styles.searchWrapper}>
            <Search size={14} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {summaryStats && (
            <div style={{ padding: '15px 20px', backgroundColor: '#f0fdf4', borderBottom: '1px solid #dcfce7', display: 'flex', gap: '30px', alignItems: 'center' }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#166534' }}>Employee Report Summary</div>
                <div style={{ display: 'flex', gap: '20px', fontSize: '0.95rem', color: '#15803d' }}>
                    <div><strong>Total Days:</strong> {summaryStats.total}</div>
                    <div><strong>Present:</strong> {summaryStats.presentCount}</div>
                    <div><strong>Absent:</strong> {summaryStats.absentCount}</div>
                    {summaryStats.pendingCount > 0 && <div><strong>Pending:</strong> {summaryStats.pendingCount}</div>}
                </div>
            </div>
        )}

      {/* Responsive Table */}
      <div className={styles.tableResponsive}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>SR No.</th>
              <th>Emp Code</th>
              <th>Name</th>
              <th>Category</th>
              <th>Date & Time</th>
              <th>Status</th>
              <th>Action By</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRecords.length > 0 ? (
              paginatedRecords.map((rec, index) => {
                const srNo = (currentPage - 1) * rowsPerPage + index + 1;
                const isToday = rec.date === todayStr;
                const isAbsent = rec.status === 'Absent';
                
                let rowClass = '';
                if (isToday) {
                  rowClass = isAbsent ? styles.highlightAbsentRow : styles.highlightPresentRow;
                }
                
                return (
                  <tr key={rec.id} className={rowClass}>
                    <td className={styles.srCell}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {isToday && isAbsent && <span className={styles.pulsingRedDot} title="Today Absent Alert" />}
                        {isToday && !isAbsent && <span className={styles.pulsingDot} title="Today Present" />}
                        {String(srNo).padStart(2, '0')}
                      </div>
                    </td>
                    <td className={styles.monoCell}>{rec.empCode}</td>
                    <td className={styles.boldCell}>{rec.name}</td>
                    <td>{rec.category}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 500 }}>{formatDateFriendly(rec.date)}</span>
                          {isToday && isAbsent && <span className={styles.todayAbsentTag}>TODAY ABSENT</span>}
                          {isToday && !isAbsent && <span className={styles.todayTag}>TODAY</span>}
                        </div>
                        {rec.record ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', fontSize: '0.75rem', marginTop: '2px', color: 'var(--text-secondary)' }}>
                            {rec.record.sign_in_time && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <Clock size={10} /> In: {formatTime(rec.record.sign_in_time)}
                              </span>
                            )}
                            {rec.record.sign_out_time && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <Clock size={10} /> Out: {formatTime(rec.record.sign_out_time)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className={styles.timeLabel}>
                            <Clock size={11} style={{ marginRight: '3px' }} />
                            —
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      {rec.status === 'Absent' && (
                        <span className={styles.badgeAbsent}>
                          <AlertCircle size={12} /> Absent
                        </span>
                      )}
                      {rec.status === 'Present' && (
                        <span className={styles.badgePresent}>
                          <CheckCircle2 size={12} /> Present
                        </span>
                      )}
                      {rec.status === 'Pending' && (
                        <span className={styles.badgePending} style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> Pending Approval
                        </span>
                      )}
                    </td>
                    <td>
                      {(() => {
                        const role = rec.record?.action_by_role;
                        const name = rec.record?.action_by_name;
                        if (!role) return <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>;
                        const upperRole = role.toUpperCase();
                        let displayName = '';
                        if (upperRole.startsWith('OWNER')) {
                          displayName = 'Owner';
                        } else if (upperRole.startsWith('ADMIN')) {
                          displayName = 'Admin';
                        } else if (upperRole.startsWith('CONTRACTOR')) {
                          displayName = 'Contractor';
                        } else {
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.82rem' }}>
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{name}</span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>({role})</span>
                            </div>
                          );
                        }
                        return (
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                            {displayName}
                          </span>
                        );
                      })()}
                    </td>
                    <td>
                      <div className={styles.actions}>
                        {canApproveOrReject && rec.status === 'Pending' && (
                          <>
                            <button
                              className={styles.actionBtn}
                              style={{
                                backgroundColor: '#10B981',
                                color: 'white',
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '6px 8px',
                                borderRadius: '4px',
                                border: 'none',
                                cursor: 'pointer',
                                marginRight: '6px'
                              }}
                              onClick={() => triggerApproveConfirm(rec.id, rec.name)}
                              title="Approve Attendance"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              className={styles.actionBtn}
                              style={{
                                backgroundColor: '#EF4444',
                                color: 'white',
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '6px 8px',
                                borderRadius: '4px',
                                border: 'none',
                                cursor: 'pointer',
                                marginRight: '6px'
                              }}
                              onClick={() => triggerRejectConfirm(rec.id, rec.name)}
                              title="Reject Attendance"
                            >
                              <X size={14} />
                            </button>
                          </>
                        )}
                        <button
                          className={`${styles.actionBtn} ${styles.locationBtn}`}
                          onClick={() => openLocationModal(rec)}
                          disabled={rec.status === 'Absent'}
                          title={rec.status === 'Absent' ? 'No location scan for Absent employee' : 'View Check-In Location'}
                        >
                          <MapPin size={14} />
                          <span>Location</span>
                        </button>
                        <button
                          className={`${styles.actionBtn} ${styles.imageBtn}`}
                          onClick={() => openImageModal(rec)}
                          disabled={rec.status === 'Absent'}
                          title={rec.status === 'Absent' ? 'No photo capture for Absent employee' : 'View Face Capture'}
                        >
                          <Image size={14} />
                          <span>Image</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" className={styles.emptyTable}>
                  No attendance records found for {fromDate && toDate ? `${formatDateFriendly(fromDate)} to ${formatDateFriendly(toDate)}` : 'selected query'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Mobile Card Layout for smaller viewports */}
      <div className={styles.mobileCardsContainer}>
        {paginatedRecords.length > 0 ? (
          paginatedRecords.map((rec, index) => {
            const srNo = (currentPage - 1) * rowsPerPage + index + 1;
            const isToday = rec.date === todayStr;
            const isAbsent = rec.status === 'Absent';
            
            // Resolve action by details
            const actionRole = rec.record?.action_by_role;
            const actionName = rec.record?.action_by_name;
            let actionDisplay = '—';
            if (actionRole) {
              const upperRole = actionRole.toUpperCase();
              if (upperRole.startsWith('OWNER')) actionDisplay = 'Owner';
              else if (upperRole.startsWith('ADMIN')) actionDisplay = 'Admin';
              else if (upperRole.startsWith('CONTRACTOR')) actionDisplay = 'Contractor';
              else actionDisplay = `${actionName} (${actionRole})`;
            }

            return (
              <div key={rec.id} className={`${styles.mobileCard} ${isToday ? (isAbsent ? styles.highlightAbsentRow : styles.highlightPresentRow) : ''}`}>
                <div className={styles.mobileCardHeader}>
                  <span className={styles.mobileCardIndex}># {String(srNo).padStart(2, '0')}</span>
                  <span>
                    {rec.status === 'Absent' && <span className={styles.badgeAbsent}>Absent</span>}
                    {rec.status === 'Present' && <span className={styles.badgePresent}>Present</span>}
                    {rec.status === 'Pending' && <span className={styles.badgePending}>Pending Approval</span>}
                  </span>
                </div>
                <div className={styles.mobileCardBody}>
                  <div className={styles.mobileCardRow}>
                    <span className={styles.mobileCardLabel}>Emp Code:</span>
                    <span className={`${styles.mobileCardValue} ${styles.monoCell}`}>{rec.empCode}</span>
                  </div>
                  <div className={styles.mobileCardRow}>
                    <span className={styles.mobileCardLabel}>Name:</span>
                    <span className={`${styles.mobileCardValue} ${styles.boldCell}`}>{rec.name}</span>
                  </div>
                  <div className={styles.mobileCardRow}>
                    <span className={styles.mobileCardLabel}>Category:</span>
                    <span className={styles.mobileCardValue}>{rec.category}</span>
                  </div>
                  <div className={styles.mobileCardRow}>
                    <span className={styles.mobileCardLabel}>Date:</span>
                    <span className={styles.mobileCardValue}>{formatDateFriendly(rec.date)}</span>
                  </div>
                  {rec.record?.sign_in_time && (
                    <div className={styles.mobileCardRow}>
                      <span className={styles.mobileCardLabel}>Sign-In:</span>
                      <span className={styles.mobileCardValue}>{formatTime(rec.record.sign_in_time)}</span>
                    </div>
                  )}
                  {rec.record?.sign_out_time && (
                    <div className={styles.mobileCardRow}>
                      <span className={styles.mobileCardLabel}>Sign-Out:</span>
                      <span className={styles.mobileCardValue}>{formatTime(rec.record.sign_out_time)}</span>
                    </div>
                  )}
                  <div className={styles.mobileCardRow}>
                    <span className={styles.mobileCardLabel}>Action By:</span>
                    <span className={styles.mobileCardValue}>{actionDisplay}</span>
                  </div>
                </div>
                <div className={styles.mobileCardActions}>
                  {canApproveOrReject && rec.status === 'Pending' && (
                    <>
                      <button
                        onClick={() => triggerApproveConfirm(rec.id, rec.name)}
                        className={styles.iconBtnRound}
                        style={{ backgroundColor: '#10B981', color: 'white', border: 'none' }}
                        title="Approve"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => triggerRejectConfirm(rec.id, rec.name)}
                        className={styles.iconBtnRound}
                        style={{ backgroundColor: '#EF4444', color: 'white', border: 'none' }}
                        title="Reject"
                      >
                        <X size={16} />
                      </button>
                    </>
                  )}
                  <button
                    className={`${styles.iconBtnRound} ${styles.locationBtnMobile}`}
                    onClick={() => openLocationModal(rec)}
                    disabled={rec.status === 'Absent'}
                    title={rec.status === 'Absent' ? 'No location scan' : 'View Location'}
                  >
                    <MapPin size={16} />
                  </button>
                  <button
                    className={`${styles.iconBtnRound} ${styles.imageBtnMobile}`}
                    onClick={() => openImageModal(rec)}
                    disabled={rec.status === 'Absent'}
                    title={rec.status === 'Absent' ? 'No face capture' : 'View Face Capture'}
                  >
                    <Image size={16} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
            No attendance records found.
          </div>
        )}
      </div>

      {/* Pagination Footer */}
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
            Showing {filteredRecords.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} to{' '}
            {Math.min(currentPage * rowsPerPage, filteredRecords.length)} of {filteredRecords.length} entries
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
          {getPageNumbers().map((p, idx) => {
            if (p === '...') {
              return (
                <span
                  key={`dots-${idx}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    color: 'var(--text-muted)',
                    fontSize: '0.9rem'
                  }}
                >
                  ...
                </span>
              );
            }
            return (
              <button
                key={p}
                className={`${styles.pageBtn} ${currentPage === p ? styles.activePageBtn : ''}`}
                onClick={() => setCurrentPage(p)}
              >
                {p}
              </button>
            );
          })}
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0}
            className={styles.pageBtn}
          >
            Next
          </button>
        </div>
      </div>

      {/* Modal - Location Details */}
      {isLocationModalOpen && selectedRecord && (
        <div className={styles.overlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Employee Geolocation Pin</h3>
              <button className={styles.closeBtn} onClick={() => setIsLocationModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              {/* Tab navigation for Sign-In and Sign-Out locations */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '8px' }}>
                <button
                  type="button"
                  onClick={() => setActiveLocationTab('in')}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeLocationTab === 'in' ? '3px solid var(--primary)' : 'none',
                    color: activeLocationTab === 'in' ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: activeLocationTab === 'in' ? '700' : '500',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                  disabled={!selectedRecord.record?.sign_in_location}
                >
                  Sign-In Location
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLocationTab('out')}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeLocationTab === 'out' ? '3px solid var(--primary)' : 'none',
                    color: activeLocationTab === 'out' ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: activeLocationTab === 'out' ? '700' : '500',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    opacity: selectedRecord.record?.sign_out_location ? 1 : 0.4
                  }}
                  disabled={!selectedRecord.record?.sign_out_location}
                >
                  Sign-Out Location
                </button>
              </div>

              {(() => {
                const targetLoc = activeLocationTab === 'in' 
                  ? selectedRecord.record?.sign_in_location 
                  : selectedRecord.record?.sign_out_location;

                const coords = parseCoords(targetLoc) || { lat: 23.8388, lng: 78.7378 };
                const label = activeLocationTab === 'in' ? 'Sign-In Coordinates' : 'Sign-Out Coordinates';

                return (
                  <BiometricMap
                    lat={coords.lat}
                    lng={coords.lng}
                    address={targetLoc ? `${label}: ${targetLoc}` : 'No coordinates captured'}
                  />
                );
              })()}
              
              <div className={styles.telemetrySection} style={{ marginTop: '4px' }}>
                <div className={styles.telemetryGrid}>
                  <div className={styles.telemetryItem}>
                    <span className={styles.telemetryLabel}>Employee Name</span>
                    <span className={styles.telemetryVal}>{selectedRecord.name} (UAN: {selectedRecord.empCode})</span>
                  </div>
                  <div className={styles.telemetryItem}>
                    <span className={styles.telemetryLabel}>Sign-In GPS</span>
                    <span className={styles.telemetryVal}>{selectedRecord.record?.sign_in_location || '—'}</span>
                  </div>
                  <div className={styles.telemetryItem}>
                    <span className={styles.telemetryLabel}>Sign-Out GPS</span>
                    <span className={styles.telemetryVal}>{selectedRecord.record?.sign_out_location || '—'}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnClose} onClick={() => setIsLocationModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Face Scan Photo Verification */}
      {isImageModalOpen && selectedRecord && (
        <div className={styles.overlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Biometric Face Capture</h3>
              <button className={styles.closeBtn} onClick={() => setIsImageModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {/* Sign-In Photo */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-secondary)' }}>Sign-In Image</div>
                    <div className={styles.avatarScanFrame} style={{ width: '160px', height: '120px', borderRadius: '8px', overflow: 'hidden', position: 'relative', border: '1px solid var(--border)' }}>
                      {selectedRecord.record?.sign_in_photo ? (
                        <img 
                          src={getPhotoUrl(selectedRecord.record.sign_in_photo)} 
                          alt="Sign In Face" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      ) : (
                        <CameraPlaceholder label="No Sign-In" />
                      )}
                    </div>
                  </div>

                  {/* Sign-Out Photo */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-secondary)' }}>Sign-Out Image</div>
                    <div className={styles.avatarScanFrame} style={{ width: '160px', height: '120px', borderRadius: '8px', overflow: 'hidden', position: 'relative', border: '1px solid var(--border)' }}>
                      {selectedRecord.record?.sign_out_photo ? (
                        <img 
                          src={getPhotoUrl(selectedRecord.record.sign_out_photo)} 
                          alt="Sign Out Face" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      ) : (
                        <CameraPlaceholder label="No Sign-Out" />
                      )}
                    </div>
                  </div>
                </div>

                <div className={styles.telemetrySection} style={{ marginTop: '0', width: '100%' }}>
                  <div className={styles.telemetryGrid}>
                    <div className={styles.telemetryItem}>
                      <span className={styles.telemetryLabel}>Employee Name</span>
                      <span className={styles.telemetryVal}>{selectedRecord.name}</span>
                    </div>
                    <div className={styles.telemetryItem}>
                      <span className={styles.telemetryLabel}>Category Group</span>
                      <span className={styles.telemetryVal}>{selectedRecord.category}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnClose} onClick={() => setIsImageModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Confirmation Dialog Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={handleCancelConfirm}
        onConfirm={handleExecuteConfirm}
        title={confirmAction === 'approve' ? 'Approve Attendance' : 'Reject Attendance'}
        message={
          confirmAction === 'approve'
            ? `Are you sure you want to approve the attendance check-in for ${confirmTargetName}? This will mark them as Present.`
            : `Are you sure you want to reject the attendance check-in for ${confirmTargetName}? This will mark them as Absent.`
        }
        confirmText={confirmAction === 'approve' ? 'Approve' : 'Reject'}
        theme={confirmAction === 'approve' ? 'success' : 'danger'}
      />
      </div>
    </div>
  );
};

export default AttendanceListPage;
