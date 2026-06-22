import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Building2 } from 'lucide-react';
import { Input, Button, Select } from '../../../shared/components';
import mobileImage from '../../../assets/Images/mobile.png';
import logoImage from '../../../assets/Images/Logo.png';
import styles from './LoginPage.module.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');

  const companyOptions = [
    { value: 'ally_solutions', label: 'Ally Soft Solutions' },
    { value: 'dinesh_bidi', label: 'Dinesh Bidi Works' },
    { value: 'demo_company', label: 'Demo Corporation' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/dashboard');
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
              />
            </div>

            <div className={styles.fieldGroup}>
              <Select
                name="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                options={companyOptions}
                placeholder="Select Company"
                icon={Building2}
                required
              />
            </div>

            <Button type="submit" className={styles.loginBtn}>
              Login
            </Button>
          </form>

          {/* Form Footer Links
          <div className={styles.formFooter}>
            <a href="#forgot" className={styles.link}>Forgot</a>
            <a href="#help" className={styles.link}>Help</a>
          </div>
          */}
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
