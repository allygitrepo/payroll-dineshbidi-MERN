import React from 'react';
import styles from './Input.module.css';

const Input = ({
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  icon: Icon,
  className = '',
  ...props
}) => {
  return (
    <div className={`${styles.wrapper} ${className}`}>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        required={required}
        className={`${styles.input} ${Icon ? styles.hasIcon : ''}`}
        {...props}
      />
      {Icon && (
        <span className={styles.iconWrapper}>
          <Icon size={16} />
        </span>
      )}
    </div>
  );
};

export default Input;
