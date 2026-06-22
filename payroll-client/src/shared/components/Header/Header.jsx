import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Mail, LogOut } from 'lucide-react';
import logoImage from '../../../assets/Images/Logo.png';
import faviconImage from '../../../assets/Images/Favicon.png';
import styles from './Header.module.css';

const Header = ({ sidebarCollapsed, setSidebarCollapsed }) => {
  const navigate = useNavigate();

  return (
    <header className={styles.navbar}>
      <div className={styles.navLeft}>
        <div className={`${styles.logoArea} ${sidebarCollapsed ? styles.collapsedLogoArea : ''}`}>
          <img
            src={sidebarCollapsed ? faviconImage : logoImage}
            alt="Logo"
            className={`${styles.logoImg} ${sidebarCollapsed ? styles.collapsedLogoImg : ''}`}
          />
        </div>
        <button
          className={styles.iconBtn}
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title="Toggle Sidebar"
        >
          <Menu size={20} />
        </button>
      </div>
      <div className={styles.navRight}>
        <button className={styles.emailBtn}>
          <Mail size={16} />
          <span>Email</span>
        </button>
        <button className={styles.logoutBtn} onClick={() => navigate('/')}>
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
