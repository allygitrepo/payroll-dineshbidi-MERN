import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Building2 } from 'lucide-react';
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
  const [errors, setErrors] = useState({});
  const [deferredPrompt, setDeferredPrompt] = useState(null);
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
          if (options.length === 1) {
            setCompany(options[0].value);
          }
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
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
  };

  const validate = () => {
    const newErrors = {};
    if (!username.trim()) newErrors.username = 'User ID is required!';
    if (!password) newErrors.password = 'Password is required!';
    if (companyOptions.length > 0 && !company) newErrors.company = 'Company is required!';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsSubmitting(true);
    try {
      const response = await authService.login(username, password, company || undefined);
      if ((response.status || response.success) && response.data) {
        const { user, accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('user', JSON.stringify(user));
        if (company) {
          localStorage.setItem('selectedCompany', company);
        } else {
          localStorage.removeItem('selectedCompany');
        }
        
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

            <div className={styles.fieldGroup}>
              <Select
                name="company"
                value={company}
                onChange={(e) => {
                  setCompany(e.target.value);
                  if (errors.company) setErrors(prev => ({ ...prev, company: '' }));
                }}
                options={companyOptions}
                placeholder={loadingCompanies ? "Loading companies..." : "Select Company"}
                disabled={loadingCompanies || isSubmitting}
                icon={Building2}
                error={errors.company}
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

          {deferredPrompt && (
            <div className={styles.installBtnContainer}>
              <Button type="button" variant="outline" onClick={handleInstallClick} style={{ width: '100%', borderColor: 'var(--primary)', color: 'var(--primary)' }}>
                Install Desktop/Mobile App
              </Button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
