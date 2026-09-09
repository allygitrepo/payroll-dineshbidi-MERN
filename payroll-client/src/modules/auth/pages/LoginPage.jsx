import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Building2 } from 'lucide-react';
import { Input, Button, Select, useToast } from '../../../shared/components';
import authService from '../services/authService';
import { getCompanies } from '../../master/company/services/companyService';
import mobileImage from '../../../assets/Images/mobile.png';
import logoImage from '../../../assets/Images/Logo.png';
import styles from './LoginPage.module.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const addToast = useToast();



  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    // Check if app is already running in PWA standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) {
      addToast({
        type: 'info',
        message: 'The Payroll App is already installed and running in Desktop/Mobile App mode!',
      });
      return;
    }

    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User choice on install prompt: ${outcome}`);
        setDeferredPrompt(null);
      } catch (err) {
        console.error('Install prompt error:', err);
      }
    } else {
      const userAgent = window.navigator.userAgent.toLowerCase();
      if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
        addToast({
          type: 'info',
          message: 'To install on iOS: Tap the Share button in Safari and select "Add to Home Screen".',
        });
      } else {
        addToast({
          type: 'info',
          message: 'To install: Click the Install icon (⊕) in your browser address bar or browser menu.',
        });
      }
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!username.trim()) newErrors.username = 'User ID is required!';
    if (!password) newErrors.password = 'Password is required!';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsSubmitting(true);
    try {
      const response = await authService.login(username, password);
      if ((response.status || response.success) && response.data) {
        const { user, accessToken, refreshToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
        localStorage.setItem('user', JSON.stringify(user));
        
        try {
          const companies = await getCompanies();
          if (companies && companies.length > 0) {
            const firstCompanyId = companies[0].id;
            localStorage.setItem('selectedCompany', firstCompanyId);
            const selectRes = await authService.selectCompany(firstCompanyId);
            if (selectRes && selectRes.data) {
              if (selectRes.data.accessToken) localStorage.setItem('accessToken', selectRes.data.accessToken);
              if (selectRes.data.refreshToken) localStorage.setItem('refreshToken', selectRes.data.refreshToken);
            }
          } else {
            localStorage.removeItem('selectedCompany');
          }
        } catch (compErr) {
          console.error("Error fetching user companies on login:", compErr);
          localStorage.removeItem('selectedCompany');
        }
        
        addToast({
          type: 'success',
          message: 'Welcome back! Login successful.',
        });
        
        if (user && user.role && user.role.name === 'OWNER') {
          navigate('/saas-dashboard');
        } else {
          navigate('/dashboard');
        }
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

          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <div className={styles.fieldGroup}>
              <Input
                name="username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errors.username) setErrors(prev => ({ ...prev, username: '' }));
                }}
                placeholder="Enter User Id"
                icon={User}
                error={errors.username}
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.fieldGroup}>
              <Input
                name="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                }}
                placeholder="Password"
                icon={Lock}
                error={errors.password}
                disabled={isSubmitting}
              />
            </div>

            <Button type="submit" className={styles.loginBtn} disabled={isSubmitting}>
              {isSubmitting ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          {/* <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Or test face recognition: </span>
            <a href="/trial-attendance" style={{ color: 'var(--primary)', fontWeight: '600', fontSize: '0.85rem', textDecoration: 'underline' }}>
              Self-Attendance Kiosk
            </a>
          </div> 
          </div>*/}

          <div className={styles.installBtnContainer}>
            <Button type="button" variant="primary" onClick={handleInstallClick}>
              Install Desktop/Mobile App
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
