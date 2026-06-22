import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import styles from './DashboardPage.module.css';
import { Header, Footer, Sidebar } from '../../../shared/components';

const DashboardPage = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className={styles.appContainer}>
      {/* Top Navbar */}
      <Header
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
      />

      {/* Main Body */}
      <div className={styles.mainBody}>
        {/* Sidebar */}
        <Sidebar sidebarCollapsed={sidebarCollapsed} />

        {/* Content Pane */}
        <main className={styles.contentPane}>
          <Outlet />
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
