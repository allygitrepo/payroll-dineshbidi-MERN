import React from 'react';
import styles from './Button.module.css';

const Button = ({
  children,
  onClick,
  type = 'button',
  disabled = false,
  className = '',
  variant = 'primary',
  style,
  ...props
}) => {
  const variantClass = variant === 'outline' ? styles.btnOutline : styles.btnPrimary;

  return (
    <button
      type={type}
      className={`${styles.btn} ${variantClass} ${className}`}
      disabled={disabled}
      onClick={onClick}
      style={style}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
