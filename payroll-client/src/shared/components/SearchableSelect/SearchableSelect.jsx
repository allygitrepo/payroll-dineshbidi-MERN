import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import styles from './SearchableSelect.module.css';

/**
 * Reusable SearchableSelect Component
 *
 * @prop {string} name - Field name
 * @prop {string|number} value - Selected option value
 * @prop {function} onChange - Triggered with mock event: { target: { name, value } }
 * @prop {Array} options - List of { value, label } options
 * @prop {string} placeholder - Default placeholder
 * @prop {boolean} disabled - Disabled state
 * @prop {string} error - Validation error text
 * @prop {boolean} required - Compulsory indicator
 */
const SearchableSelect = ({
  name,
  value = '',
  onChange,
  options = [],
  placeholder = 'Select option',
  disabled = false,
  error = '',
  required = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  const filteredOptions = options.filter((opt) =>
    String(opt.label).toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (val) => {
    if (disabled) return;
    if (onChange) {
      onChange({
        target: {
          id: name,
          name,
          value: val
        }
      });
    }
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (disabled) return;
    if (onChange) {
      onChange({
        target: {
          id: name,
          name,
          value: ''
        }
      });
    }
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className={`${styles.container} ${className}`} ref={containerRef}>
      <div
        className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ''} ${disabled ? styles.triggerDisabled : ''} ${error ? styles.triggerError : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? styles.triggerValue : styles.triggerPlaceholder}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className={styles.iconContainer}>
          {selectedOption && !required && !disabled && (
            <X size={14} className={styles.clearIcon} onClick={handleClear} />
          )}
          <ChevronDown size={16} className={`${styles.chevronIcon} ${isOpen ? styles.chevronOpen : ''}`} />
        </div>
      </div>

      {isOpen && !disabled && (
        <div className={styles.dropdown}>
          <div className={styles.searchWrapper}>
            <Search size={14} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className={styles.optionsList}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  className={`${styles.option} ${String(opt.value) === String(value) ? styles.optionActive : ''}`}
                  onClick={() => handleSelect(opt.value)}
                >
                  {opt.label}
                </div>
              ))
            ) : (
              <div className={styles.noOptions}>No results found</div>
            )}
          </div>
        </div>
      )}
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
};

export default SearchableSelect;
