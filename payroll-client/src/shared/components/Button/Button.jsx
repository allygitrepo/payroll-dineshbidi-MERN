import React from 'react';
import styles from './Button.module.css';

const Button = ({
  children,
  onClick,
  type = 'button',
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <button
      type={type}
      className={`${styles.btn} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
