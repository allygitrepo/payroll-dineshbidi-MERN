import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import styles from '../../../modules/dashboard/pages/DashboardPage.module.css'; // Reuse DashboardPage styles
import { Header, Footer } from '../../../shared/components';
import SaasSidebar from '../components/SaasSidebar';

const SaasDashboardPage = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className={styles.appContainer}>
      <Header
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
      />

      <div className={styles.mainBody}>
        <SaasSidebar sidebarCollapsed={sidebarCollapsed} />

        <main className={styles.contentPane}>
          <Outlet />
          {/* <Footer /> */}
        </main>
      </div>
    </div>
  );
};

export default SaasDashboardPage;
