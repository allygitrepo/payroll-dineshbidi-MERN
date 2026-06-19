import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Image,
  Clock,
  Calendar
} from 'lucide-react';
import styles from './AttendanceListPage.module.css';

// Futuristic biometric avatar component for face visualization
const BiometricAvatar = ({ seed, className }) => {
  const colors = [
    { bg: '#3B82F6', outline: '#60A5FA', face: '#E0F2FE' }, // Blue
    { bg: '#10B981', outline: '#34D399', face: '#ECFDF5' }, // Green
    { bg: '#8B5CF6', outline: '#A78BFA', face: '#F5F3FF' }, // Purple
    { bg: '#F59E0B', outline: '#FBBF24', face: '#FEF3C7' }, // Amber
    { bg: '#EC4899', outline: '#F472B6', face: '#FDF2F8' }, // Pink
    { bg: '#06B6D4', outline: '#22D3EE', face: '#ECFEFF' }, // Cyan
    { bg: '#EF4444', outline: '#F87171', face: '#FEF2F2' }, // Red
    { bg: '#6366F1', outline: '#818CF8', face: '#EEF2FF' }, // Indigo
    { bg: '#14B8A6', outline: '#2DD4BF', face: '#F0FDFA' } // Teal
  ];
  
  const design = colors[(seed - 1) % colors.length];
  
  return (
    <svg viewBox="0 0 100 100" className={className} style={{ width: '100%', height: '100%', display: 'block' }}>
      {/* Background circle */}
      <circle cx="50" cy="50" r="46" fill={design.bg} opacity="0.1" />
      <circle cx="50" cy="50" r="46" stroke={design.outline} strokeWidth="0.75" fill="none" strokeDasharray="2,2" />
      
      {/* Neck */}
      <path d="M42,75 L42,85 C42,88 45,90 50,90 C55,90 58,88 58,85 L58,75 Z" fill="#E2E8F0" />
      <path d="M42,75 L42,85" stroke={design.outline} strokeWidth="0.5" />
      <path d="M58,75 L58,85" stroke={design.outline} strokeWidth="0.5" />
      
      {/* Shoulders */}
      <path d="M25,95 C25,85 35,78 50,78 C65,78 75,85 75,95 Z" fill="#CBD5E1" />
      <path d="M25,95 C25,85 35,78 50,78 C65,78 75,85 75,95" stroke={design.outline} strokeWidth="1" fill="none" />
      
      {/* Face shape */}
      <ellipse cx="50" cy="48" rx="22" ry="26" fill={design.face} stroke={design.outline} strokeWidth="1.5" />
      
      {/* Hair outline (varies by seed) */}
      {seed % 3 === 0 ? (
        // Style A
        <path d="M28,45 C28,25 35,20 50,20 C65,20 72,25 72,45 C72,55 70,55 70,50 C70,40 68,26 50,26 C32,26 30,40 30,50 C30,55 28,55 28,45 Z" fill="#1E293B" />
      ) : seed % 3 === 1 ? (
        // Style B
        <path d="M26,40 C26,22 35,18 50,18 C65,18 74,22 74,40 C74,42 72,40 71,37 C68,28 65,22 50,22 C35,22 32,28 29,37 C28,40 26,42 26,40 Z" fill="#0F172A" />
      ) : (
        // Style C
        <path d="M27,38 Q32,28 40,24 Q50,16 60,24 Q68,28 73,38 Q74,36 71,34 Q66,28 50,25 Q34,28 29,34 Q26,36 27,38 Z" fill="#334155" />
      )}
      
      {/* Eyes */}
      <circle cx="42" cy="45" r="2.5" fill="#1E293B" />
      <circle cx="58" cy="45" r="2.5" fill="#1E293B" />
      <path d="M38,41 Q42,39 46,41" stroke="#1E293B" strokeWidth="1.25" fill="none" />
      <path d="M54,41 Q58,39 62,41" stroke="#1E293B" strokeWidth="1.25" fill="none" />
      
      {/* Nose */}
      <path d="M50,45 L50,56 L47,56" stroke="#475569" strokeWidth="1.25" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Mouth */}
      {seed % 4 === 0 ? (
        <path d="M44,63 Q50,68 56,63" stroke="#E11D48" strokeWidth="1.25" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M45,63 Q50,66 55,63" stroke="#475569" strokeWidth="1.25" fill="none" strokeLinecap="round" />
      )}
      
      {/* Scanning landmarks overlay */}
      <circle cx="42" cy="45" r="5" stroke="#27D68A" strokeWidth="0.5" fill="none" strokeDasharray="1,1" />
      <circle cx="58" cy="45" r="5" stroke="#27D68A" strokeWidth="0.5" fill="none" strokeDasharray="1,1" />
      <path d="M42,45 L50,56 L58,45 L42,45" stroke="#27D68A" strokeWidth="0.5" strokeDasharray="2,2" fill="none" />
      
      {/* Face boundary overlay */}
      <rect x="24" y="18" width="52" height="60" rx="6" stroke="#27D68A" strokeWidth="0.75" fill="none" opacity="0.6" strokeDasharray="3,3" />
      
      {/* Face keypoints */}
      <circle cx="42" cy="45" r="1" fill="#27D68A" />
      <circle cx="58" cy="45" r="1" fill="#27D68A" />
      <circle cx="50" cy="56" r="0.75" fill="#27D68A" />
      <circle cx="50" cy="64" r="0.75" fill="#27D68A" />
      <circle cx="28" cy="48" r="0.75" fill="#27D68A" />
      <circle cx="72" cy="48" r="0.75" fill="#27D68A" />
    </svg>
  );
};

// Premium GPS location radar map component
const BiometricMap = ({ lat, lng, address }) => {
  return (
    <div className={styles.mapContainer}>
      {/* Background grid */}
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
          </pattern>
          <radialGradient id="radar" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#27D68A" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#27D68A" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#27D68A" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Mock Map Streets */}
        <path d="M-50,80 L450,150 M120,-50 L220,300 M-20,180 C100,190 200,120 400,100 M280,-50 L100,300" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="4" fill="none" />
        <path d="M-50,80 L450,150 M120,-50 L220,300 M-20,180 C100,190 200,120 400,100 M280,-50 L100,300" stroke="rgba(39, 214, 138, 0.12)" strokeWidth="1.5" fill="none" />
        
        {/* Radar Area */}
        <circle cx="200" cy="115" r="70" fill="url(#radar)" />
        
        {/* Pulsing circles */}
        <circle cx="200" cy="115" r="40" stroke="#27D68A" strokeWidth="1" fill="none" opacity="0.3">
          <animate attributeName="r" values="10;60" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0" dur="2s" repeatCount="indefinite" />
        </circle>
        
        <circle cx="200" cy="115" r="20" stroke="#27D68A" strokeWidth="1" fill="none" opacity="0.5">
          <animate attributeName="r" values="5;30" dur="2s" repeatCount="indefinite" begin="0.5s" />
          <animate attributeName="opacity" values="0.8;0" dur="2s" repeatCount="indefinite" begin="0.5s" />
        </circle>
        
        {/* Pulse center pin */}
        <circle cx="200" cy="115" r="6" fill="#27D68A" />
        <circle cx="200" cy="115" r="10" stroke="#27D68A" strokeWidth="1.5" fill="none" />
      </svg>
      
      {/* Map Labels/Details HUD */}
      <div className={styles.mapHud}>
        <div className={styles.mapHudHeader}>
          <span className={styles.mapHudTag}>GPS VERIFIED</span>
          <span className={styles.mapHudCoords}>{lat}, {lng}</span>
        </div>
        <div className={styles.mapHudAddress}>
          {address}
        </div>
      </div>
    </div>
  );
};

// Payroll Master Database - Unique Employees
const masterEmployees = [
  { empCode: 'EMP001', name: 'Dinesh Bidi', category: 'Bidi Roller', contact: '9876543210', address: 'Bidi Colony, Sagar, MP', avatarSeed: 1 },
  { empCode: 'EMP002', name: 'Ramesh Patel', category: 'Office Staff', contact: '8765432109', address: 'Civil Lines, Jabalpur, MP', avatarSeed: 2 },
  { empCode: 'EMP003', name: 'Sunita Sharma', category: 'Packing Staff', contact: '7654321098', address: 'Industrial Area, Indore, MP', avatarSeed: 3 },
  { empCode: 'EMP004', name: 'Amit Kumar', category: 'Bidi Roller', contact: '6543210987', address: 'Bidi Colony, Damoh, MP', avatarSeed: 4 },
  { empCode: 'EMP005', name: 'Priya Gupta', category: 'Office Staff', contact: '9123456789', address: 'Vijay Nagar, Indore, MP', avatarSeed: 5 },
  { empCode: 'EMP006', name: 'Rajesh Sen', category: 'Packing Staff', contact: '9234567890', address: 'Kotwali, Sagar, MP', avatarSeed: 6 },
  { empCode: 'EMP007', name: 'Karan Mehra', category: 'Bidi Roller', contact: '9345678901', address: 'Bidi Colony, Damoh, MP', avatarSeed: 7 },
  { empCode: 'EMP008', name: 'Neha Verma', category: 'Office Staff', contact: '9456789012', address: 'Arera Colony, Bhopal, MP', avatarSeed: 8 },
  { empCode: 'EMP009', name: 'Vikram Singh', category: 'Packing Staff', contact: '9567890123', address: 'Malanpur, Gwalior, MP', avatarSeed: 9 },
  { empCode: 'EMP010', name: 'Anjali Das', category: 'Bidi Roller', contact: '9678901234', address: 'Bidi Colony, Sagar, MP', avatarSeed: 10 },
  { empCode: 'EMP011', name: 'Sanjay Prasad', category: 'Bidi Roller', contact: '9789012345', address: 'Cantt Road, Jabalpur, MP', avatarSeed: 11 },
  { empCode: 'EMP012', name: 'Gopal Sharma', category: 'Packing Staff', contact: '9890123456', address: 'New Colony, Guna, MP', avatarSeed: 12 }
];

// Mock Check-in Logs Database
const initialAttendanceRecords = [
  // Today: 2026-06-19 (More check-ins to balance present/absent counts)
  {
    id: 1,
    empCode: 'EMP001',
    date: '2026-06-19',
    time: '09:15 AM',
    status: 'Present',
    location: { lat: '23.8388° N', lng: '78.7378° E', address: 'Bidi Colony Workshop, Sagar, MP', accuracy: '3.2m' }
  },
  {
    id: 2,
    empCode: 'EMP002',
    date: '2026-06-19',
    time: '09:30 AM',
    status: 'Present',
    location: { lat: '23.1686° N', lng: '79.9339° E', address: 'Main Office - Civil Lines, Jabalpur, MP', accuracy: '4.5m' }
  },
  {
    id: 3,
    empCode: 'EMP003',
    date: '2026-06-19',
    time: '09:05 AM',
    status: 'Present',
    location: { lat: '22.7196° N', lng: '75.8577° E', address: 'Packing Unit A - Industrial Area, Indore, MP', accuracy: '2.8m' }
  },
  {
    id: 4,
    empCode: 'EMP004',
    date: '2026-06-19',
    time: '09:55 AM',
    status: 'Late',
    location: { lat: '23.8324° N', lng: '79.4423° E', address: 'Rolling Station 2, Damoh, MP', accuracy: '5.1m' }
  },
  {
    id: 5,
    empCode: 'EMP005',
    date: '2026-06-19',
    time: '09:10 AM',
    status: 'Present',
    location: { lat: '22.7533° N', lng: '75.8937° E', address: 'Corporate HQ - Vijay Nagar, Indore, MP', accuracy: '1.9m' }
  },
  {
    id: 6,
    empCode: 'EMP006',
    date: '2026-06-19',
    time: '10:15 AM',
    status: 'Late',
    location: { lat: '23.8388° N', lng: '78.7378° E', address: 'Packing Depot - Sagar, MP', accuracy: '3.9m' }
  },
  {
    id: 8,
    empCode: 'EMP008',
    date: '2026-06-19',
    time: '09:02 AM',
    status: 'Present',
    location: { lat: '23.2324° N', lng: '77.4323° E', address: 'Bhopal Branch Office, Arera Colony, MP', accuracy: '2.5m' }
  },
  {
    id: 9,
    empCode: 'EMP009',
    date: '2026-06-19',
    time: '09:40 AM',
    status: 'Present',
    location: { lat: '26.2124° N', lng: '78.1778° E', address: 'Gwalior Hub, Malanpur Industrial Area, MP', accuracy: '4.0m' }
  },
  {
    id: 10,
    empCode: 'EMP010',
    date: '2026-06-19',
    time: '09:18 AM',
    status: 'Present',
    location: { lat: '23.8388° N', lng: '78.7378° E', address: 'Bidi Colony Workshop, Sagar, MP', accuracy: '3.0m' }
  },
  // Yesterday: 2026-06-18
  {
    id: 11,
    empCode: 'EMP003',
    date: '2026-06-18',
    time: '09:05 AM',
    status: 'Present',
    location: { lat: '22.7196° N', lng: '75.8577° E', address: 'Packing Unit A - Industrial Area, Indore, MP', accuracy: '2.8m' }
  },
  {
    id: 12,
    empCode: 'EMP004',
    date: '2026-06-18',
    time: '09:55 AM',
    status: 'Present',
    location: { lat: '23.8324° N', lng: '79.4423° E', address: 'Rolling Station 2, Damoh, MP', accuracy: '5.1m' }
  },
  // Previous Days check-in entries
  {
    id: 15,
    empCode: 'EMP005',
    date: '2026-06-17',
    time: '09:10 AM',
    status: 'Present',
    location: { lat: '22.7533° N', lng: '75.8937° E', address: 'Corporate HQ - Vijay Nagar, Indore, MP', accuracy: '1.9m' }
  },
  {
    id: 16,
    empCode: 'EMP006',
    date: '2026-06-17',
    time: '10:15 AM',
    status: 'Late',
    location: { lat: '23.8388° N', lng: '78.7378° E', address: 'Packing Depot - Sagar, MP', accuracy: '3.9m' }
  },
  {
    id: 17,
    empCode: 'EMP007',
    date: '2026-06-16',
    time: '09:25 AM',
    status: 'Present',
    location: { lat: '23.8324° N', lng: '79.4423° E', address: 'Rolling Station 1, Damoh, MP', accuracy: '4.2m' }
  },
  {
    id: 18,
    empCode: 'EMP008',
    date: '2026-06-16',
    time: '09:02 AM',
    status: 'Present',
    location: { lat: '23.2324° N', lng: '77.4323° E', address: 'Bhopal Branch Office, Arera Colony, MP', accuracy: '2.5m' }
  },
  {
    id: 19,
    empCode: 'EMP009',
    date: '2026-06-15',
    time: '09:40 AM',
    status: 'Present',
    location: { lat: '26.2124° N', lng: '78.1778° E', address: 'Gwalior Hub, Malanpur Industrial Area, MP', accuracy: '4.0m' }
  },
  {
    id: 20,
    empCode: 'EMP010',
    date: '2026-06-15',
    time: '09:18 AM',
    status: 'Present',
    location: { lat: '23.8388° N', lng: '78.7378° E', address: 'Bidi Colony Workshop, Sagar, MP', accuracy: '3.0m' }
  },
  {
    id: 21,
    empCode: 'EMP011',
    date: '2026-06-14',
    time: '09:12 AM',
    status: 'Present',
    location: { lat: '23.1686° N', lng: '79.9339° E', address: 'Rolling Yard - Cantt Area, Jabalpur, MP', accuracy: '4.8m' }
  },
  {
    id: 22,
    empCode: 'EMP012',
    date: '2026-06-14',
    time: '10:05 AM',
    status: 'Late',
    location: { lat: '24.6424° N', lng: '77.3224° E', address: 'Guna Sorting Center, MP', accuracy: '3.7m' }
  },
  // May 2026 check-ins
  {
    id: 23,
    empCode: 'EMP001',
    date: '2026-05-28',
    time: '09:20 AM',
    status: 'Present',
    location: { lat: '23.8388° N', lng: '78.7378° E', address: 'Bidi Colony Workshop, Sagar, MP', accuracy: '3.1m' }
  },
  {
    id: 24,
    empCode: 'EMP002',
    date: '2026-05-28',
    time: '09:15 AM',
    status: 'Present',
    location: { lat: '23.1686° N', lng: '79.9339° E', address: 'Main Office - Civil Lines, Jabalpur, MP', accuracy: '2.4m' }
  },
  {
    id: 25,
    empCode: 'EMP003',
    date: '2026-05-27',
    time: '09:10 AM',
    status: 'Present',
    location: { lat: '22.7196° N', lng: '75.8577° E', address: 'Packing Unit A - Industrial Area, Indore, MP', accuracy: '3.0m' }
  }
];

const AttendanceListPage = () => {
  const [logs, setLogs] = useState(initialAttendanceRecords);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  // Single Calendar Date Filter State - Defaults to Today (2026-06-19)
  const [selectedDate, setSelectedDate] = useState('2026-06-19');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modals state
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Generate Daily Attendance Sheet (combining check-ins with generated Absent logs)
  const generateDailySheet = () => {
    // If no date is selected (Show All), we just return all check-in logs
    if (!selectedDate) {
      return logs.map(log => {
        const emp = masterEmployees.find(e => e.empCode === log.empCode) || {};
        return {
          ...log,
          name: emp.name || 'Unknown Employee',
          category: emp.category || 'N/A',
          contact: emp.contact || '',
          address: emp.address || '',
          avatarSeed: emp.avatarSeed || 1
        };
      });
    }

    // For a specific selected date, generate status for all 12 master employees
    return masterEmployees.map(emp => {
      // Find check-in entry for this employee on the selected date
      const checkIn = logs.find(log => log.empCode === emp.empCode && log.date === selectedDate);
      
      if (checkIn) {
        return {
          ...emp,
          ...checkIn
        };
      } else {
        // Construct mock Absent record
        return {
          id: `absent-${emp.empCode}-${selectedDate}`,
          empCode: emp.empCode,
          name: emp.name,
          category: emp.category,
          contact: emp.contact,
          address: emp.address,
          avatarSeed: emp.avatarSeed,
          date: selectedDate,
          time: '—',
          status: 'Absent',
          location: null
        };
      }
    });
  };

  const dailySheet = generateDailySheet();

  // Status priority for sorting (Absent first, then Late, then Present)
  const statusPriority = {
    'Absent': 1,
    'Late': 2,
    'Present': 3
  };

  // Sort daily sheet records
  const sortedRecords = [...dailySheet].sort((a, b) => {
    // 1. Sort by Status Priority (Absent at the absolute top)
    const priorityDiff = statusPriority[a.status] - statusPriority[b.status];
    if (priorityDiff !== 0) return priorityDiff;
    
    // 2. Sort by Date descending (relevant if Show All is clicked)
    const dateDiff = new Date(b.date) - new Date(a.date);
    if (dateDiff !== 0) return dateDiff;
    
    // 3. Sort by Time descending
    const parseTime = (timeStr) => {
      if (timeStr === '—') return 0;
      const [time, modifier] = timeStr.split(' ');
      let [hours, minutes] = time.split(':');
      hours = parseInt(hours, 10);
      minutes = parseInt(minutes, 10);
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };
    
    return parseTime(b.time) - parseTime(a.time);
  });

  // Filtering logic
  const filteredRecords = sortedRecords.filter(rec => {
    // 1. Search filter
    const matchesSearch =
      rec.name.toLowerCase().includes(search.toLowerCase()) ||
      rec.empCode.toLowerCase().includes(search.toLowerCase()) ||
      rec.category.toLowerCase().includes(search.toLowerCase()) ||
      rec.address.toLowerCase().includes(search.toLowerCase());
      
    // 2. Category filter
    const matchesCategory = categoryFilter === 'All' || rec.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredRecords.length / rowsPerPage);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Reset pagination on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, selectedDate, rowsPerPage]);

  const openLocationModal = (rec) => {
    if (rec.status === 'Absent') return;
    setSelectedRecord(rec);
    setIsLocationModalOpen(true);
  };

  const openImageModal = (rec) => {
    if (rec.status === 'Absent') return;
    setSelectedRecord(rec);
    setIsImageModalOpen(true);
  };

  // Helper to format date string to user-friendly format (e.g. 19 Jun 2026)
  const formatDateFriendly = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className={styles.container}>
      {/* Main Page Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <ClipboardList size={24} />
          </div>
          <div>
            <h2 className={styles.headerTitle}>Attendence List</h2>
          </div>
        </div>
      </div>

      {/* Toolbar (Search, Filter, Calendar picker, and Entries count) */}
      <div className={styles.toolbar}>
        <div className={styles.rowsSelect}>
          <span className={styles.controlLabel}>Show</span>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
          <span className={styles.controlLabel}>entries</span>
        </div>
        
        <div className={styles.rightControls}>
          {/* Calendar Date Picker Filter */}
          <div className={styles.dateFilter}>
            <span className={styles.controlLabel}>
              <Calendar size={14} style={{ marginRight: '4px', verticalAlign: 'middle', color: 'var(--primary)' }} />
              Date Filter
            </span>
            <div className={styles.dateInputWrapper}>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className={styles.datePickerInput}
              />
              <button
                type="button"
                className={`${styles.quickBtn} ${selectedDate === '2026-06-19' ? styles.activeQuickBtn : ''}`}
                onClick={() => setSelectedDate('2026-06-19')}
                title="Go to Today"
              >
                Today
              </button>
              <button
                type="button"
                className={`${styles.quickBtn} ${!selectedDate ? styles.activeQuickBtn : ''}`}
                onClick={() => setSelectedDate('')}
                title="Show All Dates"
              >
                All
              </button>
            </div>
          </div>

          {/* Category Selector */}
          <div className={styles.categorySelect}>
            <span className={styles.controlLabel}>Category</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="Office Staff">Office Staff</option>
              <option value="Packing Staff">Packing Staff</option>
              <option value="Bidi Roller">Bidi Roller</option>
            </select>
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
      </div>

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
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRecords.length > 0 ? (
              paginatedRecords.map((rec, index) => {
                const srNo = (currentPage - 1) * rowsPerPage + index + 1;
                const isToday = rec.date === '2026-06-19';
                const isAbsent = rec.status === 'Absent';
                
                // Determine premium row highlighting class
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
                        <span className={styles.timeLabel}>
                          <Clock size={11} style={{ marginRight: '3px' }} />
                          {rec.time}
                        </span>
                      </div>
                    </td>
                    <td>
                      {isAbsent ? (
                        <span className={styles.badgeAbsent}>
                          <AlertCircle size={12} /> Absent
                        </span>
                      ) : rec.status === 'Present' ? (
                        <span className={styles.badgePresent}>
                          <CheckCircle2 size={12} /> Present
                        </span>
                      ) : (
                        <span className={styles.badgeLate}>
                          <AlertCircle size={12} /> Late
                        </span>
                      )}
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={`${styles.actionBtn} ${styles.locationBtn}`}
                          onClick={() => openLocationModal(rec)}
                          disabled={isAbsent}
                          title={isAbsent ? 'No location scan for Absent employee' : 'View Check-In Location'}
                        >
                          <MapPin size={14} />
                          <span>Location</span>
                        </button>
                        <button
                          className={`${styles.actionBtn} ${styles.imageBtn}`}
                          onClick={() => openImageModal(rec)}
                          disabled={isAbsent}
                          title={isAbsent ? 'No photo capture for Absent employee' : 'View Face Capture'}
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
                <td colSpan="7" className={styles.emptyTable}>
                  No attendance records found for {selectedDate ? formatDateFriendly(selectedDate) : 'selected query'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className={styles.tableFooter}>
        <div className={styles.infoText}>
          Showing {filteredRecords.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} to{' '}
          {Math.min(currentPage * rowsPerPage, filteredRecords.length)} of {filteredRecords.length} entries
        </div>
        <div className={styles.pagination}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              className={currentPage === p ? styles.activePage : ''}
              onClick={() => setCurrentPage(p)}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Modal - Clock-In Location Detail */}
      {isLocationModalOpen && selectedRecord && (
        <div className={styles.overlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Clock-In Location Pin</h3>
              <button className={styles.closeBtn} onClick={() => setIsLocationModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <BiometricMap
                lat={selectedRecord.location?.lat}
                lng={selectedRecord.location?.lng}
                address={selectedRecord.location?.address}
              />
              
              <div className={styles.telemetrySection}>
                <div className={styles.telemetryGrid}>
                  <div className={styles.telemetryItem}>
                    <span className={styles.telemetryLabel}>Employee</span>
                    <span className={styles.telemetryVal}>{selectedRecord.name} ({selectedRecord.empCode})</span>
                  </div>
                  <div className={styles.telemetryItem}>
                    <span className={styles.telemetryLabel}>Timestamp</span>
                    <span className={styles.telemetryVal}>{formatDateFriendly(selectedRecord.date)} - {selectedRecord.time}</span>
                  </div>
                  <div className={styles.telemetryItem}>
                    <span className={styles.telemetryLabel}>GPS Accuracy</span>
                    <span className={styles.telemetryVal} style={{ color: 'var(--primary-hover)', fontWeight: 600 }}>
                      {selectedRecord.location?.accuracy || '± 3.0 meters'}
                    </span>
                  </div>
                  <div className={styles.telemetryItem}>
                    <span className={styles.telemetryLabel}>Device Status</span>
                    <span className={styles.telemetryVal} style={{ color: 'var(--primary-hover)' }}>ONLINE / SECURED</span>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnSecondary} onClick={() => setIsLocationModalOpen(false)}>
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
              <div className={styles.avatarVerificationWrapper}>
                <div className={styles.avatarScanFrame}>
                  <BiometricAvatar seed={selectedRecord.avatarSeed} className={styles.avatarScanSvg} />
                  
                  {/* Digital overlay elements */}
                  <div className={styles.cornerBracketTopLeft} />
                  <div className={styles.cornerBracketTopRight} />
                  <div className={styles.cornerBracketBottomLeft} />
                  <div className={styles.cornerBracketBottomRight} />
                  
                  <div className={styles.scanLaser} />
                  
                  <div className={styles.scanTimestamp}>
                    REC // {selectedRecord.date.replace(/-/g, '/')} {selectedRecord.time}
                  </div>
                  
                  <div className={styles.matchConfidenceBadge}>
                    MATCH CONFIDENCE: {98.0 + (selectedRecord.id % 20) / 10}%
                  </div>
                </div>
                
                <div className={styles.telemetrySection} style={{ marginTop: '0' }}>
                  <div className={styles.telemetryGrid}>
                    <div className={styles.telemetryItem}>
                      <span className={styles.telemetryLabel}>Subject Name</span>
                      <span className={styles.telemetryVal}>{selectedRecord.name}</span>
                    </div>
                    <div className={styles.telemetryItem}>
                      <span className={styles.telemetryLabel}>Category Group</span>
                      <span className={styles.telemetryVal}>{selectedRecord.category}</span>
                    </div>
                    <div className={styles.telemetryItem}>
                      <span className={styles.telemetryLabel}>Biometric Status</span>
                      <span className={styles.telemetryVal} style={{ color: 'var(--primary-hover)', fontWeight: 700 }}>
                        PASSED / MATCHED
                      </span>
                    </div>
                    <div className={styles.telemetryItem}>
                      <span className={styles.telemetryLabel}>Device Source</span>
                      <span className={styles.telemetryVal}>FRONT_CAM_01</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnSecondary} onClick={() => setIsImageModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceListPage;
