import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  X,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Image,
  Clock,
  Calendar
} from 'lucide-react';
import styles from './AttendanceListPage.module.css';
import { getEmployees } from '../../../master/employee/services/employeeService';
import { getCompanyAttendance } from '../../attendanceService';

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
  
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/payroll/v1/';
  const cleanBase = apiBase.replace(/\/v1\/?$/, '/');
  return `${cleanBase}${photoPath}`;
};

const AttendanceListPage = () => {
  const [employees, setEmployees] = useState([]);
  const [logs, setLogs] = useState([]);
  
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  // Defaults to today's date
  const getTodayDateStr = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayStr = getTodayDateStr();
  const [selectedDate, setSelectedDate] = useState(todayStr);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modals state
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [activeLocationTab, setActiveLocationTab] = useState('in');

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

    fetchData();
    const interval = setInterval(fetchData, 4000); // Polling every 4 seconds for real-time updates
    return () => clearInterval(interval);
  }, []);

  // Generate Daily Attendance Sheet (combining check-ins with generated Absent logs)
  const generateDailySheet = () => {
    if (!selectedDate) {
      // Show All: Map every check-in log from DB to its employee details
      return logs.map((log) => {
        const emp = employees.find((e) => e.id === log.employee_id) || {};
        return {
          id: log.id,
          empCode: emp.uan || 'N/A',
          name: emp.memberName || 'Unknown Employee',
          category: emp.employeeType || 'N/A',
          contact: emp.mobile || '',
          address: emp.address || '',
          avatarSeed: 1,
          date: log.date,
          status: log.sign_in_time ? 'Present' : 'Absent',
          record: log
        };
      });
    }

    // For a specific selected date, generate status for all active employees
    return employees.map((emp) => {
      const log = logs.find((l) => l.employee_id === emp.id && l.date === selectedDate);
      
      if (log) {
        return {
          id: log.id,
          empCode: emp.uan || 'N/A',
          name: emp.memberName,
          category: emp.employeeType || 'N/A',
          contact: emp.mobile || '',
          address: emp.address || '',
          avatarSeed: 1,
          date: log.date,
          status: log.sign_in_time ? 'Present' : 'Absent',
          record: log
        };
      } else {
        // Construct mock Absent record
        return {
          id: `absent-${emp.id}-${selectedDate}`,
          empCode: emp.uan || 'N/A',
          name: emp.memberName,
          category: emp.employeeType || 'N/A',
          contact: emp.mobile || '',
          address: emp.address || '',
          avatarSeed: 1,
          date: selectedDate,
          status: 'Absent',
          record: null
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
        
      const matchesCategory = categoryFilter === 'All' || rec.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [sortedRecords, search, categoryFilter]);

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
  }, [search, categoryFilter, selectedDate, rowsPerPage]);

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

  const formatDateFriendly = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const d = new Date(timeStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={styles.pageContainer}>
      {/* Main Page Header */}
      <div className={styles.headerSection}>
        <h1 className={styles.pageTitle}>Attendance List</h1>
      </div>

      {/* Table Card wrapper */}
      <div className={styles.tableCard}>
        {/* Toolbar */}
        <div className={styles.toolbar} style={{ justifyContent: 'flex-end' }}>
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
                className={`${styles.quickBtn} ${selectedDate === todayStr ? styles.activeQuickBtn : ''}`}
                onClick={() => setSelectedDate(todayStr)}
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
              <option value="OFFICE STAFF">Office Staff</option>
              <option value="PACKING STAFF">Packing Staff</option>
              <option value="BIDI ROLLER">Bidi Roller</option>
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
                      {isAbsent ? (
                        <span className={styles.badgeAbsent}>
                          <AlertCircle size={12} /> Absent
                        </span>
                      ) : (
                        <span className={styles.badgePresent}>
                          <CheckCircle2 size={12} /> Present
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
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={`${styles.pageBtn} ${currentPage === p ? styles.activePageBtn : ''}`}
              onClick={() => setCurrentPage(p)}
            >
              {p}
            </button>
          ))}
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
                        <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>—</div>
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
                        <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>—</div>
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
      </div>
    </div>
  );
};

export default AttendanceListPage;
