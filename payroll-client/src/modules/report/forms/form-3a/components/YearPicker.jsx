import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import styles from './YearPicker.module.css';

// Align ranges of 12 years with the screenshot's base start of 2017
const getStartYear = (y) => {
  const baseYear = 2017;
  return baseYear + Math.floor((y - baseYear) / 12) * 12;
};

const YearPicker = ({ value, onChange, placeholder = 'Select Year' }) => {
  const containerRef = useRef(null);
  const selectedYear = parseInt(value) || new Date().getFullYear();

  const [isOpen, setIsOpen] = useState(false);
  const [rangeStart, setRangeStart] = useState(getStartYear(selectedYear));

  // Sync display range when value changes externally
  useEffect(() => {
    if (value) {
      setRangeStart(getStartYear(parseInt(value)));
    }
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutside);
    };
  }, [isOpen]);

  const handleYearClick = (year) => {
    onChange(year.toString());
    setIsOpen(false);
  };

  const handlePrevRange = (e) => {
    e.stopPropagation();
    setRangeStart((prev) => prev - 12);
  };

  const handleNextRange = (e) => {
    e.stopPropagation();
    setRangeStart((prev) => prev + 12);
  };

  // Generate 12 years for the grid
  const years = Array.from({ length: 12 }, (_, i) => rangeStart + i);
  const rangeEnd = rangeStart + 11;

  return (
    <div className={styles.pickerWrapper} ref={containerRef}>
      {/* Input Trigger Box */}
      <div
        className={`${styles.inputBox} ${isOpen ? styles.inputBoxOpen : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        tabIndex={0}
        role="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setIsOpen((prev) => !prev);
          }
        }}
      >
        <CalendarDays size={16} className={styles.calIcon} />
        <span className={value ? styles.inputValue : styles.inputPlaceholder}>
          {value || placeholder}
        </span>
        <ChevronRight
          size={14}
          className={`${styles.chevronDown} ${isOpen ? styles.chevronUp : ''}`}
        />
      </div>

      {/* Dropdown Popup */}
      {isOpen && (
        <div className={styles.popup}>
          {/* Range Navigation Header */}
          <div className={styles.rangeHeader}>
            <button
              type="button"
              className={styles.rangeNavBtn}
              onClick={handlePrevRange}
              aria-label="Previous years"
            >
              <ChevronLeft size={16} />
            </button>
            <span className={styles.rangeLabel}>
              {rangeStart}-{rangeEnd}
            </span>
            <button
              type="button"
              className={styles.rangeNavBtn}
              onClick={handleNextRange}
              aria-label="Next years"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Years Grid */}
          <div className={styles.yearGrid}>
            {years.map((yr) => {
              const isSelected = selectedYear === yr;
              return (
                <button
                  type="button"
                  key={yr}
                  className={`${styles.yearBtn} ${isSelected ? styles.yearSelected : ''}`}
                  onClick={() => handleYearClick(yr)}
                >
                  {yr}
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
