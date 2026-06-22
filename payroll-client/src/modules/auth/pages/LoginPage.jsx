import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Building2 } from 'lucide-react';
import { Input, Button, Select, useToast } from '../../../shared/components';
import authService from '../services/authService';
import mobileImage from '../../../assets/Images/mobile.png';
import logoImage from '../../../assets/Images/Logo.png';
import styles from './LoginPage.module.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [companyOptions, setCompanyOptions] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const addToast = useToast();

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await authService.getPublicCompanies();
        if ((response.status || response.success) && response.data) {
          const options = response.data.map((c) => ({
            value: c.id,
            label: c.company_name,
          }));
          setCompanyOptions(options);
        } else {
          addToast({
            type: 'error',
            message: 'Failed to load company options.',
          });
        }
      } catch (err) {
        console.error('Error fetching companies:', err);
        addToast({
          type: 'error',
          message: err.response?.data?.messageToShow || 'Error loading companies from server.',
        });
      } finally {
        setLoadingCompanies(false);
      }
    };
    fetchCompanies();
  }, [addToast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await authService.login(username, password);
      if ((response.status || response.success) && response.data) {
        const { user, accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('selectedCompany', company);
        
        addToast({
          type: 'success',
          message: 'Welcome back! Login successful.',
        });
        
        navigate('/dashboard');
      } else {
        addToast({
          type: 'error',
          message: response.messageToShow || 'Login failed.',
        });
      }
    } catch (err) {
      console.error('Login error:', err);
      addToast({
        type: 'error',
        message: err.response?.data?.messageToShow || 'Invalid user ID or password.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>

        {/* Left Welcome Panel */}
        <div className={styles.welcomePanel}>
          <div className={styles.leftLogoContainer}>
            <img src={logoImage} alt="Payroll System Logo" className={styles.leftLogo} />
          </div>
          <div className={styles.welcomeText}>Welcome</div>
          <div className={styles.tagline}>
            Simplify Payroll. Empower People.
          </div>
        </div>

        {/* 3D Overlapping Mobile Graphic (Bridging both panels) */}
        <div className={styles.graphicContainer}>
          <img src={mobileImage} alt="Payroll Dashboard Mockup" className={styles.mockupImage} />
        </div>

        {/* Right Form Panel */}
        <div className={styles.formPanel}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>LOGIN</h2>
            <p className={styles.formSubTitle}>Secure sign in to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.fieldGroup}>
              <Input
                name="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter User Id"
                icon={Mail}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.fieldGroup}>
              <Input
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                icon={Lock}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.fieldGroup}>
              <Select
                name="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                options={companyOptions}
                placeholder={loadingCompanies ? "Loading companies..." : "Select Company"}
                disabled={loadingCompanies || isSubmitting}
                icon={Building2}
                required
              />
            </div>

            <Button type="submit" className={styles.loginBtn} disabled={isSubmitting}>
              {isSubmitting ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Or test face recognition: </span>
            <a href="/trial-attendance" style={{ color: 'var(--primary)', fontWeight: '600', fontSize: '0.85rem', textDecoration: 'underline' }}>
              Self-Attendance Kiosk
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
