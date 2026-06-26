import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
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
  error,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const togglePassword = () => setShowPassword(prev => !prev);

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.wrapper}>
        <input
          id={name}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          required={required}
          className={`${styles.input} ${Icon || isPassword ? styles.hasIcon : ''} ${error ? styles.inputError : ''}`}
          {...props}
        />
        {isPassword ? (
          <button
            type="button"
            className={styles.toggleBtn}
            onClick={togglePassword}
            tabIndex="-1"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        ) : Icon ? (
          <span className={styles.iconWrapper}>
            <Icon size={16} />
          </span>
        ) : null}
      </div>
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
};

export default Input;
