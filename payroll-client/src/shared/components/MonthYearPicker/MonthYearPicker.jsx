import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import styles from './MonthYearPicker.module.css';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr',
  'May', 'Jun', 'Jul', 'Aug',
  'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Shared Custom Month-Year Picker
 *
 * @prop {string}   value       - "YYYY-MM" format (e.g. "2026-01")
 * @prop {function} onChange    - called with "YYYY-MM" string when selection changes
 * @prop {string}   placeholder - placeholder text shown when no value selected
 *
 * Usage:
 *   import { MonthYearPicker } from '../../../../shared/components';
 *   <MonthYearPicker value={selectedMonth} onChange={setSelectedMonth} />
 */
const MonthYearPicker = ({ value, onChange, placeholder = 'Select Month & Year' }) => {
  const containerRef = useRef(null);

  const parseValue = (val) => {
    if (!val) return { year: new Date().getFullYear(), month: null };
    const [y, m] = val.split('-');
    return { year: parseInt(y), month: parseInt(m) };
  };

  const parsed = parseValue(value);
  const [isOpen, setIsOpen] = useState(false);
  const [displayYear, setDisplayYear] = useState(parsed.year);

  // Sync displayYear if value changes externally
  useEffect(() => {
    if (value) {
      const [y] = value.split('-');
      setDisplayYear(parseInt(y));
    }
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  const handleMonthClick = (monthIndex) => {
    const m = String(monthIndex + 1).padStart(2, '0');
    onChange(`${displayYear}-${m}`);
    setIsOpen(false);
  };

  // Display: "01/2026"
  const displayText = value
    ? `${String(parsed.month).padStart(2, '0')}/${parsed.year}`
    : '';

  const selectedYear = parsed.year;
  const selectedMonth = parsed.month; // 1-based

  return (
    <div className={styles.pickerWrapper} ref={containerRef}>
      {/* Input trigger */}
      <div
        className={`${styles.inputBox} ${isOpen ? styles.inputBoxOpen : ''}`}
        onClick={() => setIsOpen(prev => !prev)}
        tabIndex={0}
        role="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setIsOpen(prev => !prev)}
      >
        <CalendarDays size={16} className={styles.calIcon} />
        <span className={displayText ? styles.inputValue : styles.inputPlaceholder}>
          {displayText || placeholder}
        </span>
        <ChevronRight
          size={14}
          className={`${styles.chevronDown} ${isOpen ? styles.chevronUp : ''}`}
        />
      </div>

      {/* Dropdown Popup */}
      {isOpen && (
        <div className={styles.popup}>
          {/* Year navigation */}
          <div className={styles.yearRow}>
            <button
              className={styles.yearNavBtn}
              onClick={() => setDisplayYear(y => y - 1)}
              aria-label="Previous year"
            >
              <ChevronLeft size={18} />
            </button>
            <span className={styles.yearLabel}>{displayYear}</span>
            <button
              className={styles.yearNavBtn}
              onClick={() => setDisplayYear(y => y + 1)}
              aria-label="Next year"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Month grid */}
          <div className={styles.monthGrid}>
            {MONTHS.map((name, idx) => {
              const isSelected =
                selectedYear === displayYear && selectedMonth === idx + 1;
              return (
                <button
                  key={name}
                  className={`${styles.monthBtn} ${isSelected ? styles.monthSelected : ''}`}
                  onClick={() => handleMonthClick(idx)}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthYearPicker;
