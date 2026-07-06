import React, { useState } from 'react';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import { LayoutDashboard, Users, ShieldCheck, BarChart } from 'lucide-react';
import styles from '../../../shared/components/Sidebar/Sidebar.module.css'; // Reuse existing styles

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/saas-dashboard' },
  { name: 'Client Management', icon: Users, path: '/saas-dashboard/clients' },
  { name: 'Co-Admins', icon: ShieldCheck, path: '/saas-dashboard/co-admins' },
  { name: 'Employee Stats', icon: BarChart, path: '/saas-dashboard/employee-stats' }
];

const SaasSidebar = ({ sidebarCollapsed, setSidebarCollapsed }) => {
  const location = useLocation();

  const handleLinkClick = () => {
    if (setSidebarCollapsed && window.innerWidth < 768) {
      setSidebarCollapsed(true);
    }
  };

  return (
    <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ''}`}>
      <div className={styles.sidebarSectionTitle}>SaaS Administration</div>
      <nav className={styles.sidebarNav}>
        {menuItems.map(item => {
          const IconComp = item.icon;
          const isActive = location.pathname === item.path || (item.path !== '/saas-dashboard' && location.pathname.startsWith(`${item.path}`));

          return (
            <div key={item.name} className={styles.menuItemWrapper}>
              <RouterLink
                to={item.path}
                className={`${styles.sidebarItem} ${isActive ? styles.activeItem : ''}`}
                onClick={handleLinkClick}
              >
                <IconComp size={18} className={styles.sidebarIcon} />
                <span className={styles.sidebarText}>{item.name}</span>
              </RouterLink>
            </div>
          );
        })}
      </nav>
    </aside>
  );
};

export default SaasSidebar;
