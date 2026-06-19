import React from 'react';
import { Search } from 'lucide-react';
import styles from './SearchInput.module.css';

const SearchInput = ({ value, onChange, placeholder = 'Search...' }) => {
  return (
    <div className={styles.wrapper}>
      <Search size={14} className={styles.icon} />
      <input
        type="text"
        className={styles.input}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default SearchInput;
