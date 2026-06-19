import React from 'react';
import styles from './Loader.module.css';

const Loader = ({ fullPage = false }) => {
  if (fullPage) {
    return (
      <div className={styles.fullPage}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <div className={styles.loaderOverlay}>
      <div className={styles.spinner} />
    </div>
  );
};

export default Loader;
