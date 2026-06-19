import React from 'react';
import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <span>© {new Date().getFullYear()} - Payroll Services</span>
    </footer>
  );
};

export default Footer;
