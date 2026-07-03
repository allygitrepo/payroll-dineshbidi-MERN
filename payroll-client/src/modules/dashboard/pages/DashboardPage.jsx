import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import styles from './DashboardPage.module.css';
import { Header, Footer, Sidebar } from '../../../shared/components';

const DashboardPage = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={styles.appContainer}>
      <Header
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
      />

      <div className={styles.mainBody}>
        {/* Sidebar */}
        <Sidebar sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} />

        {/* Backdrop for mobile view */}
        {!sidebarCollapsed && (
          <div 
            className={styles.mobileBackdrop} 
            onClick={() => setSidebarCollapsed(true)} 
          />
        )}

        {/* Content Pane */}
        <main className={styles.contentPane}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
