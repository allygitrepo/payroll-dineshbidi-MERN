import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Mail, LogOut, Building2 } from 'lucide-react';
import logoImage from '../../../assets/Images/Logo.png';
import faviconImage from '../../../assets/Images/Favicon.png';
import styles from './Header.module.css';
import authService from '../../../modules/auth/services/authService';
import { getCompanies } from '../../../modules/master/company/services/companyService';

const Header = ({ sidebarCollapsed, setSidebarCollapsed }) => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(localStorage.getItem('selectedCompany') || '');

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const data = await getCompanies();
        setCompanies(data || []);
      } catch (err) {
        console.error("Error fetching companies in header", err);
      }
    };
    fetchCompanies();
  }, []);

  const handleCompanyChange = async (e) => {
    const newCompanyId = e.target.value;
    if (newCompanyId === selectedCompany) return;
    
    try {
      const response = await authService.selectCompany(newCompanyId);
      if (response && response.data && response.data.accessToken) {
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('selectedCompany', newCompanyId);
        setSelectedCompany(newCompanyId);
        window.location.reload(); // Reload to refresh all data globally
      }
    } catch (err) {
      console.error("Failed to switch company", err);
      alert("Failed to switch company.");
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error("Backend logout failed", err);
    }
    localStorage.clear();
    navigate('/');
  };

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
        {companies.length > 0 && (
          <div className={styles.companyDropdownWrapper}>
            <Building2 size={16} className={styles.companyIcon} />
            <select 
              className={styles.companySelect}
              value={selectedCompany} 
              onChange={handleCompanyChange}
            >
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.estbName}</option>
              ))}
            </select>
          </div>
        )}
        <button className={styles.emailBtn}>
          <Mail size={16} />
          <span>Email</span>
        </button>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
