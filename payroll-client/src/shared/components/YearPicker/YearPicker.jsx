import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './YearPicker.module.css';

/**
 * Shared Custom Year Picker matching the 12-year grid screenshot
 *
 * @prop {string}   value       - "YYYY" format (e.g. "2026")
 * @prop {function} onChange    - called with "YYYY" string when selection changes
 * @prop {string}   placeholder - placeholder text shown when no value selected
 */
const YearPicker = ({ value, onChange, placeholder = 'Select Year' }) => {
  const containerRef = useRef(null);
  
  const [isOpen, setIsOpen] = useState(false);
  
  // The year currently selected
  const selectedYear = value ? parseInt(value) : null;
  
  // The start year of the current 12-year view
  // By default, if a year is selected, we center the view around it.
  // The screenshot shows 2021-2032 which is 12 years.
  const [startYear, setStartYear] = useState(() => {
    if (selectedYear) {
      // Find the nearest multiple of 12 for pagination, e.g. 2021
      // For 2026, 2026 - (2026 % 12) + some offset. Actually let's just make it selectedYear - 5
      return selectedYear - 5;
    }
    return new Date().getFullYear() - 5;
  });

  // Sync startYear if value changes externally
  useEffect(() => {
    if (value) {
      const y = parseInt(value);
      if (y < startYear || y > startYear + 11) {
        setStartYear(y - 5);
      }
    }
  }, [value, startYear]);

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

  const handleYearClick = (year) => {
    onChange(String(year));
    setIsOpen(false);
  };

  const endYear = startYear + 11;

  // Generate array of 12 years
  const yearsGrid = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 12; i++) {
      arr.push(startYear + i);
    }
    return arr;
  }, [startYear]);

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
        <span className={value ? styles.inputValue : styles.inputPlaceholder}>
          {value || placeholder}
        </span>
      </div>

      {/* Dropdown Popup */}
      {isOpen && (
        <div className={styles.popup}>
          {/* Year navigation */}
          <div className={styles.yearRow}>
            <button
              className={styles.yearNavBtn}
              onClick={() => setStartYear(y => y - 12)}
              aria-label="Previous years"
            >
              <ChevronLeft size={16} strokeWidth={3} />
            </button>
            <span className={styles.yearLabel}>{startYear}-{endYear}</span>
            <button
              className={styles.yearNavBtn}
              onClick={() => setStartYear(y => y + 12)}
              aria-label="Next years"
            >
              <ChevronRight size={16} strokeWidth={3} />
            </button>
          </div>

          {/* Year grid */}
          <div className={styles.yearGrid}>
            {yearsGrid.map((year) => {
              const isSelected = selectedYear === year;
              return (
                <button
                  key={year}
                  className={`${styles.yearBtn} ${isSelected ? styles.yearSelected : ''}`}
                  onClick={() => handleYearClick(year)}
                >
                  {year}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default YearPicker;
