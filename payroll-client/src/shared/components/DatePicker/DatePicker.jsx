import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, CalendarDays, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './DatePicker.module.css';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// Timezone-safe local today date string (YYYY-MM-DD)
const getTodayLocalString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateForDisplay = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`; // dd-mm-yyyy
  }
  return dateStr;
};

/**
 * Centralized Custom DatePicker Component
 *
 * @prop {string} name - input field name for standard form integration
 * @prop {string} value - YYYY-MM-DD string value
 * @prop {function} onChange - event handler called with mock event { target: { name, value } }
 * @prop {string} placeholder - default placeholder
 * @prop {boolean} disabled - disabled state
 * @prop {boolean} required - required state
 * @prop {string} className - optional wrapper override class name
 */
const DatePicker = ({
  name,
  value = '',
  onChange,
  placeholder = 'dd - mm - yyyy',
  disabled = false,
  required = false,
  min = '',
  max = '',
  className = ''
}) => {
  const containerRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  // View state: controls what the user currently sees in the dropdown calendar
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());

  // Picker mode: 'calendar', 'monthYear', or 'years'
  const [pickerMode, setPickerMode] = useState('calendar');
  const [overlayYear, setOverlayYear] = useState(new Date().getFullYear());
  const [yearRangeStart, setYearRangeStart] = useState(() => Math.floor(new Date().getFullYear() / 12) * 12);

  // Generate wide list of years (1930 to 2060) for direct dropdown jumping
  const ALL_YEARS = useMemo(() => {
    const list = [];
    for (let y = 1930; y <= 2060; y++) {
      list.push(y);
    }
    return list;
  }, []);

  // Initialize view state based on value when calendar opens or value changes
  useEffect(() => {
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        setViewYear(y);
        setViewMonth(parseInt(parts[1], 10) - 1);
        setOverlayYear(y);
        setYearRangeStart(Math.floor(y / 12) * 12);
      }
    }
  }, [value, isOpen]);

  // Click outside to close calendar
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setPickerMode('calendar');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Generate the 42 cells representing the calendar grid
  const daysGrid = useMemo(() => {
    const days = [];
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    // Previous month's trailing days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
      const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
      days.push({
        day,
        month: prevMonth,
        year: prevYear,
        isCurrentMonth: false,
        dateString: `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      });
    }

    // Current month's days
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      days.push({
        day: i,
        month: viewMonth,
        year: viewYear,
        isCurrentMonth: true,
        dateString: `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      });
    }

    // Next month's leading days to complete 42 cells (6 rows of 7 columns)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
      const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
      days.push({
        day: i,
        month: nextMonth,
        year: nextYear,
        isCurrentMonth: false,
        dateString: `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      });
    }

    return days;
  }, [viewYear, viewMonth]);

  const handleSelectDate = (dateString) => {
    if (disabled) return;
    // Check min/max constraint
    if (min && dateString < min) return;
    if (max && dateString > max) return;
    triggerChange(dateString);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (disabled) return;
    triggerChange('');
    setIsOpen(false);
  };

  const handleToday = (e) => {
    e.stopPropagation();
    if (disabled) return;
    const today = getTodayLocalString();
    triggerChange(today);
    setIsOpen(false);
  };

  const triggerChange = (newValue) => {
    if (onChange) {
      onChange({
        target: {
          id: name,
          name,
          value: newValue
        }
      });
    }
  };

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const togglePickerMode = (e) => {
    e.stopPropagation();
    setOverlayYear(viewYear);
    setYearRangeStart(Math.floor(viewYear / 12) * 12);
    setPickerMode(prev => prev === 'calendar' ? 'monthYear' : 'calendar');
  };

  const handleSelectMonthYear = (monthIdx, year) => {
    setViewMonth(monthIdx);
    setViewYear(year);
    setPickerMode('calendar');
  };

  const displayText = formatDateForDisplay(value);
  const todayStr = getTodayLocalString();

  return (
    <div className={`${styles.pickerWrapper} ${className}`} ref={containerRef}>
      {/* Input box trigger */}
      <div
        className={`${styles.inputBox} ${isOpen ? styles.inputBoxOpen : ''} ${disabled ? styles.inputBoxDisabled : ''}`}
        onClick={() => !disabled && setIsOpen(prev => !prev)}
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className={displayText ? styles.inputValue : styles.inputPlaceholder}>
          {displayText || placeholder}
        </span>
        <CalendarDays size={16} className={styles.calIcon} />
      </div>

      {/* Calendar Popup Panel */}
      {isOpen && !disabled && (
        <div className={styles.popup}>
          {pickerMode === 'calendar' ? (
            <>
              {/* Calendar View Header */}
              <div className={styles.headerRow}>
                <div className={styles.monthYearSelector} onClick={togglePickerMode}>
                  <span>{MONTH_NAMES[viewMonth]}, {viewYear}</span>
                  <ChevronDown size={14} className={styles.labelArrow} />
                </div>
                <div className={styles.navButtons}>
                  <button
                    type="button"
                    className={styles.navBtn}
                    onClick={handlePrevMonth}
                    title="Previous Month"
                  >
                    <ArrowUp size={15} />
                  </button>
                  <button
                    type="button"
                    className={styles.navBtn}
                    onClick={handleNextMonth}
                    title="Next Month"
                  >
                    <ArrowDown size={15} />
                  </button>
                </div>
              </div>

              {/* Weekday Names Header */}
              <div className={styles.weekdayRow}>
                {WEEKDAYS.map(day => (
                  <div key={day} className={styles.weekday}>
                    {day}
                  </div>
                ))}
              </div>

              {/* Days Calendar Grid */}
              <div className={styles.daysGrid}>
                {daysGrid.map(cell => {
                  const isSelected = value === cell.dateString;
                  const isToday = todayStr === cell.dateString;
                  const isBeforeMin = min && cell.dateString < min;
                  const isAfterMax = max && cell.dateString > max;
                  const isDayDisabled = isBeforeMin || isAfterMax;
                  return (
                    <button
                      key={cell.dateString}
                      type="button"
                      disabled={isDayDisabled}
                      onClick={() => handleSelectDate(cell.dateString)}
                      className={`${styles.dayCell} ${isSelected ? styles.daySelected : ''} ${isToday ? styles.dayToday : ''} ${!cell.isCurrentMonth ? styles.dayOutside : ''} ${isDayDisabled ? styles.dayDisabled : ''}`}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>

              {/* Dropdown Footer Actions */}
              <div className={styles.footerRow}>
                <button type="button" className={styles.footerBtn} onClick={handleClear}>
                  Clear
                </button>
                <button type="button" className={styles.footerBtn} onClick={handleToday}>
                  Today
                </button>
              </div>
            </>
          ) : pickerMode === 'monthYear' ? (
          /* Month & Year Selection Grid Sheet */
          <div className={styles.monthYearOverlay}>
            <div className={styles.overlayHeader}>
              <button
                type="button"
                className={styles.navBtn}
                onClick={() => {
                  const ny = overlayYear - 1;
                  setOverlayYear(ny);
                  setYearRangeStart(Math.floor(ny / 12) * 12);
                }}
                title="Previous Year"
              >
                <ChevronLeft size={16} />
              </button>

              {/* Year display is interactive - clicking it opens the full Year Grid */}
              <button
                type="button"
                className={styles.yearDisplayBtn}
                onClick={() => {
                  setYearRangeStart(Math.floor(overlayYear / 12) * 12);
                  setPickerMode('years');
                }}
                title="Click to view all years"
              >
                <span>{overlayYear}</span>
                <ChevronDown size={14} />
              </button>

              <button
                type="button"
                className={styles.navBtn}
                onClick={() => {
                  const ny = overlayYear + 1;
                  setOverlayYear(ny);
                  setYearRangeStart(Math.floor(ny / 12) * 12);
                }}
                title="Next Year"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className={styles.monthsGrid}>
              {MONTH_NAMES.map((mName, mIdx) => {
                const isSelected = viewMonth === mIdx && viewYear === overlayYear;
                return (
                  <button
                    key={mName}
                    type="button"
                    onClick={() => handleSelectMonthYear(mIdx, overlayYear)}
                    className={`${styles.monthSelectBtn} ${isSelected ? styles.monthSelectSelected : ''}`}
                  >
                    {mName.substring(0, 3)}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              className={styles.backToCalBtn}
              onClick={() => setPickerMode('calendar')}
            >
              Back to Calendar
            </button>
          </div>
          ) : pickerMode === 'yearList' ? (
            /* Custom Scrollable Years Grid Sheet */
            <div className={styles.monthYearOverlay}>
              <div className={styles.overlayHeader}>
                <span className={styles.yearDisplayTitle}>Select Year</span>
              </div>
              <div className={styles.yearsScrollContainer}>
                {Array.from({ length: 110 }, (_, i) => new Date().getFullYear() - 90 + i).map(yr => {
                  const isSelected = yr === overlayYear;
                  return (
                    <button
                      key={yr}
                      type="button"
                      className={`${styles.yearListItem} ${isSelected ? styles.yearListItemActive : ''}`}
                      onClick={() => {
                        setOverlayYear(yr);
                        setViewYear(yr);
                        setPickerMode('monthYear');
                      }}
                      ref={isSelected ? (el) => el?.scrollIntoView({ block: 'center' }) : null}
                    >
                      {yr}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                className={styles.backToCalBtn}
                onClick={() => setPickerMode('calendar')}
              >
                Back to Calendar
              </button>
            </div>
          ) : (
            /* All Years Selection Grid & Fast Dropdown Sheet */
            <div className={styles.monthYearOverlay}>
              <div className={styles.overlayHeader}>
                <button
                  type="button"
                  className={styles.navBtn}
                  onClick={() => setYearRangeStart(r => r - 12)}
                  title="Previous 12 Years"
                >
                  <ChevronLeft size={16} />
                </button>

                <span className={styles.yearDisplay}>
                  {yearRangeStart} - {yearRangeStart + 11}
                </span>

                <button
                  type="button"
                  className={styles.navBtn}
                  onClick={() => setYearRangeStart(r => r + 12)}
                  title="Next 12 Years"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Direct Jump Dropdown */}
              <div className={styles.quickYearRow}>
                <span className={styles.quickYearLabel}>Jump to Year:</span>
                <select
                  className={styles.quickYearSelect}
                  value={overlayYear}
                  onChange={(e) => {
                    const selectedYear = Number(e.target.value);
                    setOverlayYear(selectedYear);
                    setViewYear(selectedYear);
                    setYearRangeStart(Math.floor(selectedYear / 12) * 12);
                    setPickerMode('monthYear');
                  }}
                >
                  {ALL_YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              {/* 12-Year Grid */}
              <div className={styles.yearsGrid}>
                {Array.from({ length: 12 }, (_, i) => yearRangeStart + i).map((y) => {
                  const isSelected = overlayYear === y;
                  return (
                    <button
                      key={y}
                      type="button"
                      onClick={() => {
                        setOverlayYear(y);
                        setViewYear(y);
                        setPickerMode('monthYear');
                      }}
                      className={`${styles.yearSelectBtn} ${isSelected ? styles.yearSelectSelected : ''}`}
                    >
                      {y}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                <button
                  type="button"
                  className={styles.backToCalBtn}
                  style={{ flex: 1 }}
                  onClick={() => setPickerMode('monthYear')}
                >
                  Back to Months
                </button>
                <button
                  type="button"
                  className={styles.backToCalBtn}
                  style={{ flex: 1 }}
                  onClick={() => setPickerMode('calendar')}
                >
                  Back to Calendar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DatePicker;
