import Lenis from 'lenis';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';
import logoImage from '../../../assets/Images/Logo.png';
import dashboardScreenshot from '../../../assets/Images/dashboard_screenshot_1.png';

const faqs = [
  {
    "question": "Is payroll automated for piece-rate workers like bidi rollers and packers?",
    "answer": "Yes. Packing Wages and Bidi Roller Wages are configured once, and daily entries automatically flow into accurate salary sheets — no manual multiplication required."
  },
  {
    "question": "Can multiple companies be managed from one account?",
    "answer": "Yes. Payroll OS supports multi-company operation from a single login, with each company's data kept isolated and a dedicated SaaS administration layer."
  },
  {
    "question": "Does it support contractor-based workforces?",
    "answer": "Yes. Contractors have a dedicated master record, and contractor-wise salary sheets are generated alongside office and packing salary reports."
  },
  {
    "question": "Can attendance be marked with face recognition?",
    "answer": "Yes. Employees can self-check-in using face recognition, in addition to a standard attendance list for manual marking."
  },
  {
    "question": "What statutory compliance reports does the platform generate?",
    "answer": "ECR, ESIC, PF Challans (monthly & yearly), PMRPY, PF Summary, Professional Tax, Statutory Forms 2 / 3A / 5 / 10 / 11, PF Claim Form, Bonus Sheet, Gratuity Calculation and Payment Advice."
  },
  {
    "question": "Can employee data be imported or exported in bulk?",
    "answer": "Yes. Excel import/export tools cover employee data and KYC records, plus a dedicated Excel-to-text conversion utility."
  },
  {
    "question": "How secure is employee data on the platform?",
    "answer": "Access is protected with JWT access and refresh tokens, and every module sits behind a role-based permission system so users only reach what their role allows."
  },
  {
    "question": "Can payslips be delivered over WhatsApp?",
    "answer": "Yes, through the built-in WhatsApp Gateway, which can send payslips and other notifications directly to employees."
  },
  {
    "question": "Is there a backup option in case something goes wrong?",
    "answer": "Yes. A one-click backup and restore utility lets you snapshot and recover the entire database whenever needed."
  },
  {
    "question": "Can I install Payroll OS as an app?",
    "answer": "Yes. Payroll OS is an installable Progressive Web App and can be added to your desktop or mobile home screen like a native app."
  }
];

const LandingPage = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeShot, setActiveShot] = useState('dashboard');
  const [activeFaq, setActiveFaq] = useState(null);
  const [trialModalOpen, setTrialModalOpen] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleTrialSubmit = (e) => {
    e.preventDefault();
    setTrialModalOpen(false);
    showToast('Trial request captured. Our team will reach out shortly.');
  };

  const handleDemoSubmit = (e) => {
    e.preventDefault();
    setDemoModalOpen(false);
    showToast("Demo request captured. We'll confirm a time by email.");
  };

  useEffect(() => {
    // Initialize Lenis smooth scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // 1. Scroll effect for navbar
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);

    // 2. IntersectionObserver for scroll reveals
    const reveals = document.querySelectorAll('.reveal, .reveal-scale');
    const observerOptions = {
      root: null,
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          obs.unobserve(entry.target);
        }
      });
    }, observerOptions);

    reveals.forEach(reveal => {
      observer.observe(reveal);
    });

    // 3. Stats counter animations
    const statsGrid = document.querySelector('.stats-grid');
    const stats = document.querySelectorAll('.stat-num');
    let animated = false;

    const animateStats = () => {
      stats.forEach(stat => {
        const target = parseInt(stat.getAttribute('data-count'), 10) || 0;
        const suffix = stat.getAttribute('data-suffix') || '';
        let current = 0;
        const increment = Math.ceil(target / 40);
        const timer = setInterval(() => {
          current += increment;
          if (current >= target) {
            stat.textContent = target + suffix;
            clearInterval(timer);
          } else {
            stat.textContent = current + suffix;
          }
        }, 30);
      });
    };

    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !animated) {
          animateStats();
          animated = true;
          statsObserver.unobserve(statsGrid);
        }
      });
    }, { threshold: 0.2 });

    if (statsGrid) {
      statsObserver.observe(statsGrid);
    }

    return () => {
      lenis.destroy();
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
      if (statsGrid) {
        statsObserver.disconnect();
      }
    };
  }, []);

  return (
    <>
      {/* SkipLink */}
      <a href="#main" className="skip-link">Skip to content</a>

      {/* ============ NAVBAR ============ */}
  <header id="navbar" className={scrolled ? "scrolled" : ""}>
    <div className="container nav-inner">
      <a href="#home" className="brand" style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
        <img
          src={logoImage}
          alt="" style={{height: '54px', width: 'auto', objectFit: 'contain'}} />
      </a>

      <nav className="nav-links" aria-label="Primary">
        <a href="#home" onClick={() => setMobileMenuOpen(false)}>Home</a>
        <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
        {/* <a href="#modules">Modules</a> */}
        {/* <a href="#pricing">Pricing</a> */}
        <a href="#about" onClick={() => setMobileMenuOpen(false)}>About</a>
        <a href="#contact" onClick={() => setMobileMenuOpen(false)}>Contact</a>
      </nav>

      <div className="nav-actions">
        <button className="btn btn-outline btn-sm" onClick={() => navigate("/login")}>Login</button>
        <button className="btn btn-primary" onClick={() => setTrialModalOpen(true)}>
          Get Started
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
        <button className={`hamburger ${mobileMenuOpen ? "active" : ""}`} id="hamburgerBtn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu" aria-expanded={mobileMenuOpen}>
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  </header>

  {/* ============ MOBILE MENU ============ */}
  <div className={`mobile-menu ${mobileMenuOpen ? "open" : ""}`} id="mobileMenu" style={{ display: mobileMenuOpen ? "block" : "none" }}>
    <a href="#home" onClick={() => setMobileMenuOpen(false)}>Home</a>
    <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
    {/* <a href="#modules">Modules</a> */}
    {/* <a href="#pricing">Pricing</a> */}
    <a href="#about" onClick={() => setMobileMenuOpen(false)}>About</a>
    <a href="#contact" onClick={() => setMobileMenuOpen(false)}>Contact</a>
    <div className="mobile-actions">
      <button className="btn btn-outline btn-block" onClick={() => navigate("/login")}>Login</button>
      <button className="btn btn-primary btn-block" onClick={() => setTrialModalOpen(true)}>Start Free Trial</button>
    </div>
  </div>

  <main id="main">
    {/* ============ HERO ============ */}
    <section id="home">
      <section id="hero">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="container hero-grid">
          <div className="hero-copy reveal in">
            <span className="eyebrow">Built for piece-rate manufacturing</span>
            <h1>Payroll &amp; compliance, <span className="text-grad">built for real factory floors.</span></h1>
            <p className="lead">Payroll OS runs wage calculation, attendance, statutory compliance and multi-company
              operations for manufacturing workforces paid by the piece — bidi rollers, packers, office staff and
              contractors — from one secure cloud platform.</p>
            <div className="hero-ctas">
              <button className="btn btn-primary" onClick={() => setTrialModalOpen(true)}>
                Start Free Trial
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
              <button className="btn btn-outline" onClick={() => setDemoModalOpen(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
                  strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M10 8.5v7l6-3.5-6-3.5Z" fill="currentColor" stroke="none" />
                </svg>
                Book a Demo
              </button>
            </div>
            <ul className="hero-microlist">
              <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
                  strokeLinejoin="round">
                  <path d="M4 12l5 5L20 6" />
                </svg> Piece-rate wage engine</li>
              <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
                  strokeLinejoin="round">
                  <path d="M4 12l5 5L20 6" />
                </svg> Face-recognition attendance</li>
              <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
                  strokeLinejoin="round">
                  <path d="M4 12l5 5L20 6" />
                </svg> PF · ESIC · PT built in</li>
            </ul>
          </div>

          <div className="hero-visual reveal-scale in">
            <div className="float-chip chip-1">
              <span className="fc-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12l2 2 4-4" />
                  <circle cx="12" cy="12" r="9" />
                </svg></span>
              <span>Loan management<small>Deductions updated automatically</small></span>
            </div>
            <div className="float-chip chip-2">
              <span className="fc-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 5h18M3 12h18M3 19h18" />
                </svg></span>
              <span>Payslip sent<small>via WhatsApp Gateway</small></span>
            </div>
            <div className="float-chip chip-3">
              <span className="fc-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg></span>
              <span>Salary management<small>Piece-rate wages calculated</small></span>
            </div>

            <div className="mock-frame">
              <div className="mock-bar"><span></span><span></span><span></span></div>
              <div className="mock-screen" style={{padding: '0', overflow: 'hidden', background: '#fff', height: 'clamp(280px, 32vw, 420px)'}}>
                <img src={dashboardScreenshot} alt="Payroll OS Dashboard" style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'left top', display: 'block'}} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </section>

    {/* ============ TRUSTED STRIP ============ */}
    <section id="trusted">
      <div className="container">
        <p className="trusted-label reveal">One platform replacing registers, spreadsheets &amp; manual filing</p>
        <div className="logo-row reveal stagger" id="logoRow">
          <span className="lw" style={{'--i': 0}}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="7" width="18" height="13" rx="2" />
              <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg> Manufacturing Group</span>
          <span className="lw" style={{'--i': 1}}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 21V9l9-6 9 6v12H3Z" />
              <path d="M9 21v-6h6v6" />
            </svg> Works &amp; Co.</span>
          <span className="lw" style={{'--i': 2}}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21a8 8 0 0 1 16 0" />
            </svg> Contract Labour Ltd.</span>
          <span className="lw" style={{'--i': 3}}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16v16H4z" />
              <path d="M4 10h16M10 4v16" />
            </svg> Packing Industries</span>
          <span className="lw" style={{'--i': 4}}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M2 12h20" />
              <circle cx="12" cy="12" r="9" />
            </svg> Roller Federation</span>
          <span className="lw" style={{'--i': 5}}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="3" width="16" height="18" rx="2" />
              <path d="M9 8h6M9 12h6M9 16h3" />
            </svg> Enterprises Pvt.</span>
        </div>
      </div>
    </section>

    {/* ============ FEATURES ============ */}
    <section id="features" className="section">
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">Core Capabilities</span>
          <h2>Everything payroll needs, nothing it doesn't</h2>
          <p>Every feature below runs inside Payroll OS today — no roadmap items, no vaporware.</p>
        </div>

        <div className="feature-grid stagger" id="featureGrid">
          <div className="feature-card reveal" style={{'--i': 0}}>
            <div className="f-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="7" r="4" />
                <path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75M22 21v-2a4 4 0 0 0-3-3.87" />
              </svg></div>
            <h3>Workforce &amp; Contractor Master</h3>
            <p>One master database for office staff, packers, bidi rollers and contractors — with KYC, nominee and
              family details.</p>
          </div>
          <div className="feature-card reveal" style={{'--i': 1}}>
            <div className="f-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a5 5 0 0 1 5 5v3a5 5 0 0 1-10 0V7a5 5 0 0 1 5-5Z" />
                <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4M9 22h6" />
              </svg></div>
            <h3>Face-Recognition Attendance</h3>
            <p>Employees self-check-in with face verification, alongside a manual attendance list and leave management
              workflow.</p>
          </div>
          <div className="feature-card reveal" style={{'--i': 2}}>
            <div className="f-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg></div>
            <h3>Piece-Rate Wage Engine</h3>
            <p>Configure Packing Wages and Bidi Roller Wages per unit; the engine turns daily entries into accurate
              salary sheets automatically.</p>
          </div>
          <div className="feature-card reveal" style={{'--i': 3}}>
            <div className="f-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                <path d="M14 2v6h6M9 13h6M9 17h4" />
              </svg></div>
            <h3>Statutory Compliance Reports</h3>
            <p>ECR, ESIC, PF Challans, PMRPY, Professional Tax and Forms 2 / 3A / 5 / 10 / 11 generated straight from
              payroll data.</p>
          </div>
          <div className="feature-card reveal" style={{'--i': 4}}>
            <div className="f-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <path
                  d="M21 11.5a8.4 8.4 0 0 1-8.4 8.4A8.3 8.3 0 0 1 8 18.6L3 20l1.4-5a8.3 8.3 0 0 1-1.3-4.5A8.4 8.4 0 0 1 11.5 2 8.4 8.4 0 0 1 21 11.5Z" />
              </svg></div>
            <h3>WhatsApp Payslip Gateway</h3>
            <p>Send payslips and notifications directly to employees on WhatsApp through the built-in messaging gateway.
            </p>
          </div>
          <div className="feature-card reveal" style={{'--i': 5}}>
            <div className="f-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg></div>
            <h3>Multi-Company Operations</h3>
            <p>Run several companies from a single login, with company-level data isolation and dedicated SaaS
              administration.</p>
          </div>
          <div className="feature-card reveal" style={{'--i': 6}}>
            <div className="f-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="10" rx="2" />
                <path d="M7 11V8a5 5 0 0 1 10 0v3" />
              </svg></div>
            <h3>Role-Based Access Control</h3>
            <p>Every module and API route sits behind a roles &amp; permissions system, so people only see what their
              role allows.</p>
          </div>
          <div className="feature-card reveal" style={{'--i': 7}}>
            <div className="f-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg></div>
            <h3>Employee Leave Feature</h3>
            <p>Configure custom leave types, set monthly/annual policies, and track balances tied to each employee
              category automatically.</p>
          </div>
        </div>
      </div>
    </section>

    {/* ============ MODULES ============ */}
    {/*
<section id="modules" className="section section-alt">
  <div className="container">
    <div className="section-head reveal">
      <span className="eyebrow">Full Module Catalogue</span>
      <h2>Every module, organized the way your team works</h2>
      <p>Payroll OS mirrors the real operational flow of a manufacturing payroll office — from masters and setup through to entries, reports and utilities.</p>
    </div>

    <div className="module-tabs" id="moduleTabs">
      <button className="module-tab active" data-panel="masters">Masters</button>
      <button className="module-tab" data-panel="setup">Setup</button>
      <button className="module-tab" data-panel="entry">Attendance &amp; Entry</button>
      <button className="module-tab" data-panel="reports">Reports</button>
      <button className="module-tab" data-panel="utility">Utility</button>
    </div>

    <div className="module-panels">
      <div className="module-panel active" id="panel-masters">
        <div className="module-list">
          <div className="module-item"><span className="mi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></span><div><h4>Company</h4><p>Master profile, addresses and company-level settings.</p></div></div>
          <div className="module-item"><span className="mi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg></span><div><h4>Employee</h4><p>Office staff, packers &amp; bidi roller records in one place.</p></div></div>
          <div className="module-item"><span className="mi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg></span><div><h4>KYC Update</h4><p>Aadhaar, PAN, UAN and ESIC identity capture &amp; verification.</p></div></div>
          <div className="module-item"><span className="mi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span><div><h4>Contractor</h4><p>Contractor master with contractor-wise salary reporting.</p></div></div>
          <div className="module-item"><span className="mi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 6-9 12-9 12S3 16 3 10a9 9 0 0 1 18 0Z"/><circle cx="12" cy="10" r="3"/></svg></span><div><h4>Address</h4><p>Structured address records linked across masters.</p></div></div>
          <div className="module-item"><span className="mi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4"/><rect x="3" y="4" width="18" height="16" rx="2"/></svg></span><div><h4>Leave</h4><p>Leave types, policies and balances tied to each employee.</p></div></div>
        </div>
      </div>

      <div className="module-panel" id="panel-setup">
        <div className="module-list">
          <div className="module-item"><span className="mi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 12V8H6a2 2 0 0 1 0-4h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><circle cx="17" cy="14" r="1"/></svg></span><div><h4>Packing Wages</h4><p>Per-unit wage rates for packing operations.</p></div></div>
          <div className="module-item"><span className="mi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg></span><div><h4>Bidi Roller Wages</h4><p>Piece-rate configuration for bidi rolling work.</p></div></div>
          <div className="module-item"><span className="mi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12h16M4 6h16M4 18h10"/></svg></span><div><h4>Professional Tax</h4><p>Slab-based professional tax configuration.</p></div></div>
          <div className="module-item"><span className="mi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h.01M18 12h4"/></svg></span><div><h4>Office Staff Salary</h4><p>Fixed salary structure setup for office employees.</p></div></div>
          <div className="module-item"><span className="mi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 21V9l8-6 8 6v12"/><path d="M9 21v-6h6v6"/></svg></span><div><h4>Challan Setup</h4><p>Configure challan parameters for material &amp; wage tracking.</p></div></div>
        </div>
      </div>

      <div className="module-panel" id="panel-entry">
        <div className="module-list">
          <div className="module-item"><span className="mi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/></svg></span><div><h4>Attendance List</h4><p>Daily attendance across every employee category.</p></div></div>
          <div className="module-item"><span className="mi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a5 5 0 0 1 5 5v3a5 5 0 0 1-10 0V7a5 5 0 0 1 5-5Z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4"/></svg></span><div><h4>Face Attendance (Self)</h4><p>Self-service check-in using face recognition.</p></div></div>
          <div className="module-item"><span className="mi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/></svg></span><div><h4>Office Staff Entry</h4><p>Daily/monthly entries feeding office payroll.</p></div></div>
          <div className="module-item"><span className="mi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 12V8H6a2 2 0 0 1 0-4h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/></svg></span><div><h4>Packers Entry</h4><p>Daily packing quantities per employee.</p></div></div>
          <div className="module-item"><span className="mi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg></span><div><h4>Bidi Roller Entry</h4><p>Daily rolling output logged per worker.</p></div></div>
          <div className="module-item"><span className="mi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/></svg></span><div><h4>EPF Challan Date Entry</h4><p>Track statutory challan submission dates.</p></div></div>
          <div className="module-item"><span className="mi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="7" r="4"/><path d="M2 21v-2a4 4 0 0 1 4-4h3M17 8l4 4m0 0-4 4m4-4h-8"/></svg></span><div><h4>Resignation</h4><p>Exit workflow &amp; full-and-final record keeping.</p></div></div>
        </div>
      </div>

      <div className="module-panel" id="panel-reports">
        <div className="module-list">
          <div className="module-item"><span className="mi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/></svg></span><div><h4>Salary Sheets</h4><p>Office, Packing and Contractor salary sheets.</p></div></div>
          <div className="module-item"><span className="mi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 17V9M13 17V5M17 17v-4"/><rect x="3" y="3" width="18" height="18" rx="2"/></svg></span><div><h4>ECR &amp; ESIC Reports</h4><p>Electronic Challan-cum-Return and ESIC filings.</p></div></div>
          <div className="module-item"><span className="mi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v16H4z"/><path d="M4 9h16M9 4v16"/></svg></span><div><h4>Statutory Forms</h4><p>Form 2, 3A, 5, 10, 11 and PF Claim Form.</p></div></div>
          <div className="module-item"><span className="mi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18M8 17V9M13 17V5M18 17v-7"/></svg></span><div><h4>PF Challan &amp; Summary</h4><p>Yearly PF challans, PMRPY and PF summary reports.</p></div></div>
          <div className="module-item"><span className="mi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></span><div><h4>Bonus &amp; Gratuity</h4><p>Automated bonus sheets and gratuity calculation.</p></div></div>
          <div className="module-item"><span className="mi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20"/></svg></span><div><h4>Payment Advice</h4><p>Bank-ready payment advice for salary disbursal.</p></div></div>
        </div>
      </div>

      <div className="module-panel" id="panel-utility">
        <div className="module-list">
          <div className="module-item"><span className="mi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/></svg></span><div><h4>Calendar</h4><p>Working-day &amp; holiday calendar per company.</p></div></div>
          <div className="module-item"><span className="mi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg></span><div><h4>User Management</h4><p>Users, roles and permission assignment.</p></div></div>
          <div className="module-item"><span className="mi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.4 8.4 0 0 1-8.4 8.4A8.3 8.3 0 0 1 8 18.6L3 20l1.4-5a8.3 8.3 0 0 1-1.3-4.5A8.4 8.4 0 0 1 11.5 2 8.4 8.4 0 0 1 21 11.5Z"/></svg></span><div><h4>WhatsApp Gateway</h4><p>Automated messaging &amp; payslip delivery.</p></div></div>
          <div className="module-item"><span className="mi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg></span><div><h4>Import / Export</h4><p>Bulk employee data &amp; KYC Excel import-export.</p></div></div>
          <div className="module-item"><span className="mi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-3.5-7.1M21 3v6h-6"/></svg></span><div><h4>Backup &amp; Restore</h4><p>One-click database backup &amp; restore utility.</p></div></div>
          <div className="module-item"><span className="mi-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z"/></svg></span><div><h4>UAN to IP Mapping</h4><p>Link EPF UAN with ESIC IP numbers.</p></div></div>
        </div>
      </div>
    </div>
  </div>
</section>
*/}

    {/* ============ COMPARISON ============ */}
    <section className="section">
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">Why Switch</span>
          <h2>From registers &amp; spreadsheets to one compliant system</h2>
          <p>Manufacturing payroll teams typically stitch together paper registers, Excel and separate compliance
            filing. Payroll OS replaces all of it.</p>
        </div>

        <div className="compare-wrap reveal">
          <div className="compare-col bad">
            <div className="compare-head">
              <span className="ch-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
                  strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg></span>
              <h3>The old way</h3>
            </div>
            <ul className="compare-list">
              <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg> Manual piece-rate wage calculation</li>
              <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg> Paper attendance registers</li>
              <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg> Compliance forms filled by hand</li>
              <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg> Separate spreadsheets per company</li>
              <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg> Physical backups on USB drives</li>
              <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg> Payslips printed &amp; handed out</li>
            </ul>
          </div>
          <div className="compare-col good">
            <div className="compare-head">
              <span className="ch-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12l5 5L20 6" />
                </svg></span>
              <h3>With Payroll OS</h3>
            </div>
            <ul className="compare-list">
              <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"
                  strokeLinejoin="round">
                  <path d="M4 12l5 5L20 6" />
                </svg> Automated piece-rate wage engine</li>
              <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"
                  strokeLinejoin="round">
                  <path d="M4 12l5 5L20 6" />
                </svg> Digital &amp; face-recognition attendance</li>
              <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"
                  strokeLinejoin="round">
                  <path d="M4 12l5 5L20 6" />
                </svg> Auto-generated PF / ESIC / PT reports</li>
              <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"
                  strokeLinejoin="round">
                  <path d="M4 12l5 5L20 6" />
                </svg> Multi-company platform, one login</li>
              <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"
                  strokeLinejoin="round">
                  <path d="M4 12l5 5L20 6" />
                </svg> One-click cloud backup &amp; restore</li>
              <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"
                  strokeLinejoin="round">
                  <path d="M4 12l5 5L20 6" />
                </svg> Payslips delivered via WhatsApp</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    {/* ============ WORKFLOW ============ */}
    <section className="section section-alt">
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">Product Workflow</span>
          <h2>From company setup to statutory filing</h2>
          <p>The same operational sequence real payroll teams follow — now running through one connected system.</p>
        </div>

        <div className="timeline">
          <div className="tl-item done reveal">
            <div className="tl-num">1</div>
            <div className="tl-body">
              <h4>Company Setup</h4>
              <p>Create the company profile, addresses and calendar of working days.</p>
            </div>
          </div>
          <div className="tl-item done reveal">
            <div className="tl-num">2</div>
            <div className="tl-body">
              <h4>Employee &amp; Contractor Onboarding</h4>
              <p>Register office staff, packers, bidi rollers and contractors with KYC.</p>
            </div>
          </div>
          <div className="tl-item done reveal">
            <div className="tl-num">3</div>
            <div className="tl-body">
              <h4>Wage &amp; Challan Setup</h4>
              <p>Configure piece-rate wages, professional tax slabs and challan parameters.</p>
            </div>
          </div>
          <div className="tl-item done reveal">
            <div className="tl-num">4</div>
            <div className="tl-body">
              <h4>Daily Attendance &amp; Entry</h4>
              <p>Log attendance and daily output through Office, Packers and Bidi Roller entry.</p>
            </div>
          </div>
          <div className="tl-item done reveal">
            <div className="tl-num">5</div>
            <div className="tl-body">
              <h4>Leave &amp; Loan Management</h4>
              <p>Approve leave requests and track employee loan repayments.</p>
            </div>
          </div>
          <div className="tl-item done reveal">
            <div className="tl-num">6</div>
            <div className="tl-body">
              <h4>Payroll Processing &amp; Salary Sheets</h4>
              <p>The wage engine generates office, packing and contractor salary sheets.</p>
            </div>
          </div>
          <div className="tl-item done reveal">
            <div className="tl-num">7</div>
            <div className="tl-body">
              <h4>Statutory Compliance Reports</h4>
              <p>ECR, ESIC, PF challans, bonus and gratuity reports are produced automatically.</p>
            </div>
          </div>
          <div className="tl-item reveal">
            <div className="tl-num">8</div>
            <div className="tl-body">
              <h4>WhatsApp Payslip Delivery</h4>
              <p>Payslips and notifications reach every employee directly on WhatsApp.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* ============ SCREENSHOTS ============ */}
    <section className="section">
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">Inside the Product</span>
          <h2>A closer look at the platform</h2>
          <p>Interface previews modeled on the real application screens.</p>
        </div>

        <div className="shot-tabs" id="shotTabs">
          <button className="shot-tab active" data-shot="dashboard">Dashboard</button>
          <button className="shot-tab" data-shot="attendance">Attendance</button>
          <button className="shot-tab" data-shot="payroll">Payroll</button>
          <button className="shot-tab" data-shot="reports">Reports</button>
        </div>

        <div className="shot-stage reveal-scale">
          <div className="shot-browser-bar"><span></span><span></span><span></span><span
              className="url">app.payrollos.in/dashboard</span></div>

          <div className="shot-panel active" id="shot-dashboard" style={{padding: '0', overflow: 'hidden', background: '#fff'}}>
            <img src={dashboardScreenshot} alt="Payroll OS Dashboard" style={{width: '100%', height: 'auto', display: 'block'}} />
          </div>

          
        </div>
      </div>
    </section>

    {/* ============ BENEFITS ============ */}
    <section className="section section-alt">
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">Business Value</span>
          <h2>What teams gain by switching</h2>
          <p>Fewer errors, faster closes, and compliance that no longer depends on one person's memory.</p>
        </div>
        <div className="benefits-grid stagger">
          <div className="benefit-card reveal" style={{'--i': 0}}><span className="b-ic"><svg viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg></span>
            <h4>Fewer payroll errors</h4>
            <p>Piece-rate math runs through one formula engine instead of manual spreadsheet formulas.</p>
          </div>
          <div className="benefit-card reveal" style={{'--i': 1}}><span className="b-ic"><svg viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" />
              </svg></span>
            <h4>Hours saved every month</h4>
            <p>Bulk Excel import/export and auto-generated reports remove repetitive data entry.</p>
          </div>
          <div className="benefit-card reveal" style={{'--i': 2}}><span className="b-ic"><svg viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="10" rx="2" />
                <path d="M7 11V8a5 5 0 0 1 10 0v3" />
              </svg></span>
            <h4>Access controlled by role</h4>
            <p>Every user only sees the modules and data their permission set allows.</p>
          </div>
          <div className="benefit-card reveal" style={{'--i': 3}}><span className="b-ic"><svg viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                <path d="M14 2v6h6" />
              </svg></span>
            <h4>Compliance, ready to file</h4>
            <p>PF, ESIC and Professional Tax reports are generated in the exact formats authorities expect.</p>
          </div>
          <div className="benefit-card reveal" style={{'--i': 4}}><span className="b-ic"><svg viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2">
                <rect x="5" y="2" width="14" height="20" rx="2" />
                <path d="M12 18h.01" />
              </svg></span>
            <h4>Cloud &amp; installable</h4>
            <p>Works from any browser and installs as a lightweight app on desktop or mobile.</p>
          </div>
          <div className="benefit-card reveal" style={{'--i': 5}}><span className="b-ic"><svg viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="10" rx="2" />
                <circle cx="12" cy="16" r="1.5" />
                <path d="M7 11V8a5 5 0 0 1 10 0v3" />
              </svg></span>
            <h4>JWT-secured access</h4>
            <p>Access and refresh tokens keep sessions short-lived and protected.</p>
          </div>
          <div className="benefit-card reveal" style={{'--i': 6}}><span className="b-ic"><svg viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2">
                <path
                  d="M21 11.5a8.4 8.4 0 0 1-8.4 8.4A8.3 8.3 0 0 1 8 18.6L3 20l1.4-5a8.3 8.3 0 0 1-1.3-4.5A8.4 8.4 0 0 1 11.5 2 8.4 8.4 0 0 1 21 11.5Z" />
              </svg></span>
            <h4>Employee-first communication</h4>
            <p>Payslips and alerts reach workers where they already are — on WhatsApp.</p>
          </div>
          <div className="benefit-card reveal" style={{'--i': 7}}><span className="b-ic"><svg viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-3.5-7.1M21 3v6h-6" />
              </svg></span>
            <h4>Peace of mind</h4>
            <p>One-click backup and restore means data loss is never a single point of failure.</p>
          </div>
        </div>
      </div>
    </section>

    {/* ============ STATS ============ */}
    <section id="stats" className="section">
      <div className="container">
        <div className="section-head reveal" style={{maxWidth: '600px'}}>
          <span className="eyebrow" style={{background: 'rgba(255,255,255,.1)', color: '#93C5FD'}}>By The Platform</span>
          <h2 style={{color: '#fff'}}>Built with real payroll depth</h2>
          <p style={{color: '#94A3B8'}}>The kind of coverage a manufacturing payroll office actually needs, not a generic HR
            checklist.</p>
        </div>
        <div className="stats-grid stagger">
          <div className="stat-box reveal" style={{'--i': 0}}>
            <div className="stat-num" data-count="12">0</div>
            <div className="stat-label">Statutory reports &amp; forms automated</div>
          </div>
          <div className="stat-box reveal" style={{'--i': 1}}>
            <div className="stat-num" data-count="4">0</div>
            <div className="stat-label">Workforce categories in one system</div>
          </div>
          <div className="stat-box reveal" style={{'--i': 2}}>
            <div className="stat-num" data-count="30" data-suffix="+">0</div>
            <div className="stat-label">Connected modules across the platform</div>
          </div>
          <div className="stat-box reveal" style={{'--i': 3}}>
            <div className="stat-num" data-count="100" data-suffix="%">0</div>
            <div className="stat-label">Cloud-based &amp; installable as a PWA</div>
          </div>
        </div>
      </div>
    </section>

    {/* ============ TESTIMONIALS ============ */}
    <section className="section">
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">What Teams Say</span>
          <h2>Illustrative feedback from payroll teams</h2>
          <p>Representative feedback based on the workflows Payroll OS is designed to support.</p>
        </div>
        <div className="test-grid stagger">
          <div className="test-card reveal" style={{'--i': 0}}>
            <div className="test-stars">★★★★★</div>
            <p className="quote">"Calculating bidi roller wages by hand used to take our team days. Now the wage engine does
              it the moment entries are logged."</p>
            <div className="test-person"><span className="test-avatar">HR</span>
              <div>
                <div className="tp-name">HR Manager</div>
                <div className="tp-role">Manufacturing Enterprise</div>
              </div>
            </div>
          </div>
          <div className="test-card reveal" style={{'--i': 1}}>
            <div className="test-stars">★★★★★</div>
            <p className="quote">"Filing ECR and ESIC used to mean chasing spreadsheets from three departments. It's now one
              export, ready to submit."</p>
            <div className="test-person"><span className="test-avatar">CA</span>
              <div>
                <div className="tp-name">Compliance Officer</div>
                <div className="tp-role">Contract Labour Firm</div>
              </div>
            </div>
          </div>
          <div className="test-card reveal" style={{'--i': 2}}>
            <div className="test-stars">★★★★★</div>
            <p className="quote">"Face attendance cut down disputes on the shop floor immediately, and payslips over
              WhatsApp mean nobody loses a paper slip again."</p>
            <div className="test-person"><span className="test-avatar">OP</span>
              <div>
                <div className="tp-name">Operations Head</div>
                <div className="tp-role">Packing Industries</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* ============ PRICING (placeholder) ============ */}
    {/*
<section id="pricing" className="section section-alt">
  <div className="container">
    <div className="section-head reveal">
      <span className="eyebrow">Pricing</span>
      <h2>Priced around your workforce</h2>
      <p>Payroll OS is offered on a company-and-workforce-size basis. Talk to us for a quote tailored to your number of employees, contractors and companies.</p>
    </div>
    <div className="reveal" style={{maxWidth: '520px', marginInline: 'auto', background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 'clamp(28px,4vw,40px)', textAlign: 'center', boxShadow: 'var(--shadow)'}}>
      <span className="eyebrow">Enterprise</span>
      <h3 style={{fontSize: '26px', margin: '14px 0 10px'}}>Custom Quote</h3>
      <p style={{color: 'var(--muted)', fontSize: '14.5px', marginBottom: '24px'}}>Every module included — Masters, Setup, Attendance, Entry, Reports and Utilities — with multi-company support and role-based access.</p>
      <ul style={{textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px'}}>
        <li style={{display: 'flex', gap: '10px', alignItems: 'center', fontSize: '14px'}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 6"/></svg> Full module catalogue included</li>
        <li style={{display: 'flex', gap: '10px', alignItems: 'center', fontSize: '14px'}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 6"/></svg> Unlimited companies, one login</li>
        <li style={{display: 'flex', gap: '10px', alignItems: 'center', fontSize: '14px'}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 6"/></svg> Face-recognition attendance included</li>
        <li style={{display: 'flex', gap: '10px', alignItems: 'center', fontSize: '14px'}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 6"/></svg> WhatsApp gateway &amp; backup/restore</li>
      </ul>
      <button className="btn btn-primary btn-block" onClick={() => setDemoModalOpen(true)}>Book a Demo</button>
    </div>
  </div>
</section>
*/}

    {/* ============ ABOUT ============ */}
    <section id="about" className="section">
      <div className="container" style={{maxWidth: '760px', textAlign: 'center'}}>
        <div className="reveal">
          <span className="eyebrow">About Payroll OS</span>
          <h2 style={{fontSize: 'clamp(26px,3.6vw,36px)', marginBottom: '16px'}}>Built for the workforce that manufacturing
            runs on</h2>
          <p style={{color: 'var(--muted)', fontSize: '16px', lineHeight: '1.75'}}>Most payroll software is built for salaried
            desk staff. Payroll OS was built the other way around — starting from piece-rate wage calculation,
            contractor management, daily production entries and the statutory paperwork that manufacturing employers
            actually file every month. The result is a single, secure, cloud platform that fits the way a real payroll
            office works, from company setup through to PF and ESIC compliance.</p>
        </div>
      </div>
    </section>

    {/* ============ FAQ ============ */}
    <section className="section section-alt">
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">FAQ</span>
          <h2>Questions, answered</h2>
          <p>Everything you need to know before getting started.</p>
        </div>
        <div className="faq-list" id="faqList">
          {faqs.map((faq, index) => (
            <div className={`faq-item ${activeFaq === index ? 'open' : ''}`} key={index}>
              <button className="faq-q" onClick={() => setActiveFaq(activeFaq === index ? null : index)}>
                {faq.question}
                <span className="faq-plus">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </button>
              <div className="faq-a" style={{ maxHeight: activeFaq === index ? '300px' : '0' }}>
                <div className="faq-a-inner">{faq.answer}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ============ FINAL CTA ============ */}
    <section id="final-cta">
      <div className="container cta-inner reveal-scale">
        <h2>Ready to modernize your payroll operations?</h2>
        <p>Start a free trial or book a walkthrough with your actual payroll data — no generic demo, just your
          workforce.</p>
        <div className="cta-btns">
          <button className="btn btn-white" onClick={() => setTrialModalOpen(true)}>Start Free Trial</button>
          <button className="btn btn-dark-outline" onClick={() => setDemoModalOpen(true)}>Book a Demo</button>
        </div>
      </div>
    </section>
  </main>

  {/* ============ FOOTER ============ */}
  <footer id="contact">
    <div className="container">
      <div className="footer-grid">
        <div className="footer-brand">
          <a href="#home" className="brand" style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <img
              src={logoImage}
              alt="" style={{height: '54px', width: 'auto', objectFit: 'contain'}} />
          </a>
          <p>A cloud payroll, attendance and compliance platform purpose-built for piece-rate manufacturing workforces.
          </p>
          <div className="footer-social">
            <a href="#" aria-label="LinkedIn"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <rect x="2" y="9" width="4" height="12" />
                <circle cx="4" cy="4" r="2" />
                <path d="M10 9v12M10 13a4 4 0 0 1 8 0v8" />
              </svg></a>
            <a href="#" aria-label="Twitter / X"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <path d="M4 4l16 16M20 4 4 20" />
              </svg></a>
            <a href="#" aria-label="Email"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m2 7 10 6 10-6" />
              </svg></a>
          </div>
        </div>

        <div className="footer-col">
          <h5>Product</h5>
          <ul>
            <li><a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a></li>
            {/* <li><a href="#modules">Modules</a></li> */}
            {/* <li><a href="#pricing">Pricing</a></li> */}
            <li><a href="#" onClick={(e) => { e.preventDefault(); setDemoModalOpen(true); }}>Book a Demo</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h5>Company</h5>
          <ul>
            <li><a href="#about" onClick={() => setMobileMenuOpen(false)}>About</a></li>
            <li><a href="#trusted">Who it's for</a></li>
            <li><a href="#faq">FAQ</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h5>Resources</h5>
          <ul>
            <li><a href="#faq">FAQ</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); setDemoModalOpen(true); }}>Documentation</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); setDemoModalOpen(true); }}>Release Notes</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h5>Support</h5>
          <ul>
            <li><a href="mailto:support@payrollos.in">support@payrollos.in</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); setDemoModalOpen(true); }}>Help Center</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); navigate("/login"); }}>Login</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© <span id="year"></span> Payroll OS. All rights reserved.</span>
        <span>Developed by <a href="https://allysoftsolutions.com/" target="_blank"
            style={{color: '#ffd700', fontWeight: '600', textDecoration: 'none', transition: 'color 0.2s'}}>Allysoft
            Solutions</a></span>
        <div className="legal-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms &amp; Conditions</a>
        </div>
      </div>
    </div>
  </footer>

  {/* ============ MODALS ============ */}
  

  {trialModalOpen && (
    <div className="modal-overlay open" id="modal-trial" onClick={(e) => { if (e.target.id === "modal-trial") setTrialModalOpen(false); }}>
    <div className="modal-box">
      <div className="modal-head">
        <h3>Start your free trial</h3><button className="modal-close" data-close><svg viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg></button>
      </div>
      <p className="modal-sub">Tell us about your workforce and we'll set up a trial workspace.</p>
      <form onSubmit={handleTrialSubmit}>
        <div className="field"><label htmlFor="tr-name">Full name</label><input id="tr-name" type="text" placeholder="Your name"
            required /></div>
        <div className="field"><label htmlFor="tr-company">Company name</label><input id="tr-company" type="text"
            placeholder="e.g. Dinesh Bidi Works" required /></div>
        <div className="field"><label htmlFor="tr-email">Work email</label><input id="tr-email" type="email"
            placeholder="you@company.com" required /></div>
        <div className="field"><label htmlFor="tr-size">Workforce size</label>
          <select id="tr-size">
            <option>Under 100 employees</option>
            <option>100–500 employees</option>
            <option>500–2,000 employees</option>
            <option>2,000+ employees</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary btn-block">Create Trial Workspace</button>
      </form>
    </div>
  </div>
  )}

  {demoModalOpen && (
    <div className="modal-overlay open" id="modal-demo" onClick={(e) => { if (e.target.id === "modal-demo") setDemoModalOpen(false); }}>
    <div className="modal-box">
      <div className="modal-head">
        <h3>Book a demo</h3><button className="modal-close" data-close><svg viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg></button>
      </div>
      <p className="modal-sub">We'll walk through your actual wage structure and compliance needs.</p>
      <form onSubmit={handleDemoSubmit}>
        <div className="field"><label htmlFor="dm-name">Full name</label><input id="dm-name" type="text" placeholder="Your name"
            required /></div>
        <div className="field"><label htmlFor="dm-phone">Phone number</label><input id="dm-phone" type="tel" placeholder="+91"
            required /></div>
        <div className="field"><label htmlFor="dm-email">Work email</label><input id="dm-email" type="email"
            placeholder="you@company.com" required /></div>
        <div className="field"><label htmlFor="dm-notes">What would you like covered?</label><textarea id="dm-notes"
            placeholder="e.g. piece-rate payroll, PF/ESIC filing, contractor management"></textarea></div>
        <button type="submit" className="btn btn-primary btn-block">Request Demo</button>
      </form>
    </div>
  </div>
  )}

  <div className="toast-wrap" id="toastWrap"></div>

      {/* Toast Wrapper */}
      {toastMessage && (
        <div id="toastWrap">
          <div className="toast">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12l5 5L20 6" />
            </svg>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </>
  );
};

export default LandingPage;
