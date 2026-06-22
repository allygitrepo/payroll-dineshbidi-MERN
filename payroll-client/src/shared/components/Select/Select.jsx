import React from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './Select.module.css';

const Select = ({
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Select option',
  disabled = false,
  icon: Icon,
  className = '',
  ...props
}) => {
  return (
    <div className={`${styles.wrapper} ${className}`}>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={styles.select}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className={styles.iconWrapper}>
        {Icon && <Icon size={16} className={styles.mainIcon} />}
        <ChevronDown size={14} className={styles.chevronIcon} />
      </div>
    </div>
  );
};

export default Select;
