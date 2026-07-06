import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import styles from '../../../modules/dashboard/pages/DashboardPage.module.css'; // Reuse DashboardPage styles
import { Header, Footer } from '../../../shared/components';
import SaasSidebar from '../components/SaasSidebar';

const SaasDashboardPage = () => {
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
        <SaasSidebar 
          sidebarCollapsed={sidebarCollapsed} 
          setSidebarCollapsed={setSidebarCollapsed}
        />

        {/* Backdrop for mobile view */}
        {!sidebarCollapsed && (
          <div 
            className={styles.mobileBackdrop} 
            onClick={() => setSidebarCollapsed(true)} 
          />
        )}

        <main className={styles.contentPane}>
          <Outlet />
          {/* <Footer /> */}
        </main>
      </div>
    </div>
  );
};

export default SaasDashboardPage;
