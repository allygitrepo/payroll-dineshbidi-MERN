import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Database,
  Settings,
  FileEdit,
  FileText,
  Wrench,
  ListTodo,
  FileCheck,
  Menu,
  Mail,
  LogOut,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  UserCheck,
  User,
  PlusCircle,
  Building2,
  Users,
  Fingerprint,
  Briefcase,
  MapPin,
  Package,
  Coins,
  Percent,
  Wallet,
  Sliders,
  Calendar,
  CalendarCheck,
  UserMinus,
  UserCog,
  FileUp,
  FileDown,
  Printer,
  AlertCircle,
  Trash2,
  Save,
  RefreshCw,
  Link,
  UserX,
  Notebook,
  FileSpreadsheet,
  Folder,
  ClipboardList,
  Calculator
} from 'lucide-react';
import logoImage from '../../../assets/Images/Logo.png';
import faviconImage from '../../../assets/Images/Favicon.png';
import styles from './DashboardPage.module.css';
import MasterPage from '../../master/pages/MasterPage';
import SetupPage from '../../setup/pages/SetupPage';
import AttendancePage from '../../attendance/pages/AttendancePage';
import EntryPage from '../../entry/pages/EntryPage';



const DashboardPage = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [activeSubMenu, setActiveSubMenu] = useState('');
  const [expandedMenus, setExpandedMenus] = useState({ Master: true, Report: true, Attendance: true });
  const [expandedSubMenus, setExpandedSubMenus] = useState({ Forms: true, 'Salary Sheet': true });




  // Search and Pagination states
  const [absentSearch, setAbsentSearch] = useState('');
  const [absentRowsPerPage, setAbsentRowsPerPage] = useState(5);
  const [absentPage, setAbsentPage] = useState(1);

  const [retireSearch, setRetireSearch] = useState('');
  const [retireRowsPerPage, setRetireRowsPerPage] = useState(5);
  const [retirePage, setRetirePage] = useState(1);

  // Notes state
  const [notes, setNotes] = useState(
    "1. PF Return filing due date is 25th.\n2. Review absent list for Maity Contractor.\n3. Complete 58-year-age verifications."
  );

  // Mock Datasets
  const staffData = [
    { type: 'Office Staff', month: 'May-2026', nos: 12, amount: 185000 },
    { type: 'Packing Staff', month: 'May-2026', nos: 45, amount: 420000 },
    { type: 'Bidi Roller', month: 'May-2026', nos: 120, amount: 840000 }
  ];

  const challanStatus = [
    { type: 'PF Challan', month: 'May-2026', status: 'Pending', date: '-' },
    { type: 'PF Return', month: 'May-2026', status: 'Pending', date: '-' },
    { type: 'ESIC Challan', month: 'May-2026', status: 'Completed', date: '15-Jun-2026' }
  ];

  const absentList = [
    { name: 'BIPADTARAN GOSWAMI', acNo: '0015067', uan: '100115419794', contractor: 'MAITY CONTRACTOR' },
    { name: 'KANJAN KUMAR', acNo: '17291', uan: '100188654022', contractor: 'KUMAR ENTERPRISES' },
    { name: 'KIRTAN KUMAR', acNo: '0017225', uan: '100194181241', contractor: 'DAS LOGISTICS' },
    { name: 'NABIN MAHATO', acNo: '0005870', uan: '100247084817', contractor: 'SEN & CO' },
    { name: 'RAJ KHATIK', acNo: '0017450', uan: '101513506630', contractor: 'MAITY CONTRACTOR' },
    { name: 'DINESH PATEL', acNo: '0018020', uan: '101526789123', contractor: 'PATEL INFRA' },
    { name: 'SANJAY PRASAD', acNo: '0019280', uan: '101534567890', contractor: 'KUMAR ENTERPRISES' },
    { name: 'GOPAL SHARMA', acNo: '0020115', uan: '101545678901', contractor: 'DAS LOGISTICS' }
  ];

  const retireList = [
    { name: 'ARUN ROHIDAS', acNo: '0002041', uan: '100090965378', dob: '06/07/1968', contractor: 'LAKHIRAM KUMAR' },
    { name: 'ASHOK KUMAR', acNo: '0001470', uan: '100093736407', dob: '13/05/1969', contractor: 'ASHOK KUMAR' },
    { name: 'BAHARAT CHANDRA DAS', acNo: '0016239', uan: '101238434600', dob: '14/03/1969', contractor: 'SAHUD ANSARI' },
    { name: 'BHAKU MAHATO', acNo: '0004872', uan: '100110358674', dob: '05/08/1968', contractor: 'SHREEPADA MAHATO' },
    { name: 'BIMALA KUMAR', acNo: '0005906', uan: '100114758818', dob: '07/05/1968', contractor: 'PARAN CHANDRA KUMAR' },
    { name: 'HARISH SINGH', acNo: '0006215', uan: '100115678901', dob: '12/10/1968', contractor: 'PATEL INFRA' },
    { name: 'RAMESH PAL', acNo: '0007320', uan: '100116789012', dob: '19/02/1969', contractor: 'DAS LOGISTICS' }
  ];

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    {
      name: 'Master',
      icon: User,
      subItems: [
        { name: 'Comapany', icon: Building2 },
        { name: 'Employee', icon: Users },
        { name: 'KYC Update', icon: Fingerprint },
        { name: 'Contractor', icon: Briefcase },
        { name: 'Address', icon: MapPin }
      ]
    },
    {
      name: 'Setup',
      icon: Settings,
      subItems: [
        { name: 'Packing Wages', icon: Package },
        { name: 'Bidi Roller Wages', icon: Coins },
        { name: 'Professional Tax', icon: Percent },
        { name: 'Office Staff Salary', icon: Wallet },
        { name: 'Challan Setup', icon: Sliders }
      ]
    },
    {
      name: 'Attendance',
      icon: CalendarCheck,
      subItems: [
        { name: 'Office Attendance', icon: Users },
        { name: 'Packing Attendance', icon: Package },
        { name: 'Bidi Roller Attendance', icon: User }
      ]
    },
    {
      name: 'Entry',
      icon: FileEdit,
      subItems: [
        { name: 'Office Staff', icon: Users },
        { name: 'Packers', icon: Package },
        { name: 'Bidi Roller', icon: User },
        { name: 'EPF Challan Date', icon: Calendar },
        { name: 'Resignation', icon: UserMinus }
      ]
    },
    {
      name: 'Report',
      icon: Sliders,
      subItems: [
        {
          name: 'Salary Sheet',
          icon: Folder,
          nestedItems: [
            { name: 'Office Salary', icon: Wallet },
            { name: 'Packing Salary', icon: Package },
            { name: 'Contractor Salary', icon: Briefcase }
          ]
        },
        {
          name: 'Forms',
          icon: Folder,
          nestedItems: [
            { name: 'Form 2', icon: FileText },
            { name: 'Form 3A', icon: FileSpreadsheet },
            { name: 'Form 5', icon: ClipboardList },
            { name: 'Form 10', icon: Notebook },
            { name: 'Form 11', icon: FileCheck },
            { name: 'PF Claim Form', icon: FileEdit }
          ]
        },
        { name: 'ECR Report', icon: PlusCircle },
        { name: 'ESIC Report', icon: PlusCircle },
        { name: 'PMRPY Report', icon: PlusCircle },
        { name: 'PF Challan Yearly', icon: PlusCircle },
        { name: 'ESIC Challan Yearly', icon: PlusCircle },
        { name: 'EPF Challan', icon: PlusCircle },
        { name: 'PF Summary', icon: PlusCircle },
        { name: 'Payment Advice', icon: PlusCircle },
        { name: 'Bonus Sheet', icon: PlusCircle },
        { name: 'Gratuity Calculation', icon: PlusCircle },
        { name: 'Professional Tax', icon: PlusCircle }
      ]
    },
    {
      name: 'Utility',
      icon: Wrench,
      subItems: [
        { name: 'Calender', icon: Calendar },
        { name: 'User Management', icon: UserCog },
        { name: 'Employee Data Import', icon: FileUp },
        { name: 'Employee Data Export', icon: FileDown },
        { name: 'KYC Export', icon: Fingerprint },
        { name: 'Attandance Printing', icon: Printer },
        { name: 'Missing Information', icon: AlertCircle },
        { name: 'Delete Month Entry', icon: Trash2 },
        { name: 'Backup', icon: Save },
        { name: 'Restore', icon: RefreshCw },
        { name: 'UAN to IP Mapping', icon: Link }
      ]
    },
    {
      name: 'Todo List',
      icon: ListTodo,
      subItems: [
        { name: '3 Month Absent List', icon: UserX },
        { name: '58 Years of age', icon: UserCheck },
        { name: 'Notes', icon: Notebook }
      ]
    },
    {
      name: 'Convert Excel To Text',
      icon: FileCheck,
      subItems: [
        { name: 'Excel To Text', icon: FileSpreadsheet }
      ]
    },
  ];

  // Filtering & Pagination Calculations for Absent List
  const filteredAbsent = absentList.filter(emp =>
    emp.name.toLowerCase().includes(absentSearch.toLowerCase()) ||
    emp.acNo.includes(absentSearch) ||
    emp.uan.includes(absentSearch) ||
    emp.contractor.toLowerCase().includes(absentSearch.toLowerCase())
  );

  const totalAbsentPages = Math.ceil(filteredAbsent.length / absentRowsPerPage);
  const paginatedAbsent = filteredAbsent.slice(
    (absentPage - 1) * absentRowsPerPage,
    absentPage * absentRowsPerPage
  );

  // Filtering & Pagination Calculations for Retiring List
  const filteredRetire = retireList.filter(emp =>
    emp.name.toLowerCase().includes(retireSearch.toLowerCase()) ||
    emp.acNo.includes(retireSearch) ||
    emp.uan.includes(retireSearch) ||
    emp.dob.includes(retireSearch) ||
    emp.contractor.toLowerCase().includes(retireSearch.toLowerCase())
  );

  const totalRetirePages = Math.ceil(filteredRetire.length / retireRowsPerPage);
  const paginatedRetire = filteredRetire.slice(
    (retirePage - 1) * retireRowsPerPage,
    retirePage * retireRowsPerPage
  );



  return (
    <div className={styles.appContainer}>

      {/* Top Navbar */}
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

      {/* Main Body */}
      <div className={styles.mainBody}>

        {/* Sidebar */}
        <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ''}`}>
          <div className={styles.sidebarSectionTitle}>Main Navigation</div>
          <nav className={styles.sidebarNav}>
            {menuItems.map(item => {
              const IconComp = item.icon;
              const hasSubItems = !!item.subItems;
              const isExpanded = expandedMenus[item.name];
              const isActive = activeMenu === item.name;

              return (
                <div key={item.name} className={styles.menuItemWrapper}>
                  <button
                    className={`${styles.sidebarItem} ${isActive ? styles.activeItem : ''}`}
                    onClick={() => {
                      if (hasSubItems && !sidebarCollapsed) {
                        setExpandedMenus(prev => ({
                          ...prev,
                          [item.name]: !prev[item.name]
                        }));
                      } else {
                        setActiveMenu(item.name);
                        setActiveSubMenu('');
                      }
                    }}
                  >
                    <IconComp size={18} className={styles.sidebarIcon} />
                    <span className={styles.sidebarText}>{item.name}</span>
                    {hasSubItems && !sidebarCollapsed && (
                      <ChevronRight
                        size={16}
                        className={`${styles.chevron} ${isExpanded ? styles.chevronExpanded : ''}`}
                      />
                    )}
                  </button>

                  {hasSubItems && isExpanded && !sidebarCollapsed && (
                    <div className={styles.subMenuContainer}>
                      {item.subItems.map(sub => {
                        const isSubActive = activeSubMenu === sub.name;
                        const SubIcon = sub.icon;
                        const hasNestedItems = !!sub.nestedItems;
                        const isSubExpanded = expandedSubMenus[sub.name];

                        return (
                          <div key={sub.name} className={styles.subItemWrapper}>
                            <button
                              className={`${styles.subItem} ${isSubActive ? styles.activeSubItem : ''} ${hasNestedItems ? styles.formParentSubItem : ''}`}
                              onClick={() => {
                                if (hasNestedItems) {
                                  setExpandedSubMenus(prev => ({
                                    ...prev,
                                    [sub.name]: !prev[sub.name]
                                  }));
                                } else {
                                  setActiveMenu(item.name);
                                  setActiveSubMenu(sub.name);
                                }
                              }}
                            >
                              {hasNestedItems ? (
                                <>
                                  <ChevronRight
                                    size={14}
                                    className={`${styles.leftChevron} ${isSubExpanded ? styles.leftChevronExpanded : ''}`}
                                  />
                                  <span>{sub.name}</span>
                                </>
                              ) : (
                                <>
                                  <SubIcon size={16} className={styles.subIcon} />
                                  <span>{sub.name}</span>
                                  {hasNestedItems && (
                                    <span className={styles.chevron}>
                                      {isSubExpanded ? '▼' : '▶'}
                                    </span>
                                  )}
                                </>
                              )}
                            </button>

                            {hasNestedItems && isSubExpanded && (
                              <div className={styles.nestedMenuContainer}>
                                {sub.nestedItems.map(nested => {
                                  const isNestedActive = activeSubMenu === nested.name;
                                  const NestedIcon = nested.icon;
                                  return (
                                    <button
                                      key={nested.name}
                                      className={`${styles.nestedItem} ${isNestedActive ? styles.activeNestedItem : ''} ${hasNestedItems ? styles.formNestedItem : ''}`}
                                      onClick={() => {
                                        setActiveMenu(item.name);
                                        setActiveSubMenu(nested.name);
                                      }}
                                    >
                                      <NestedIcon size={14} className={styles.nestedIcon} />
                                      <span>{nested.name}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Content Pane */}
        <main className={styles.contentPane}>
          <div className={styles.contentHeader}>
            <h1 className={styles.pageTitle}>{activeMenu}</h1>
          </div>

          {activeMenu === 'Dashboard' ? (
            <div className={styles.dashboardGrid}>

              {/* Card 1: Last Month Data Entered */}
              <div className={`${styles.card} ${styles.greenCard}`}>
                <div className={styles.cardHeader}>
                  <div className={styles.headerDot}></div>
                  <h3>Last Month Data Entered</h3>
                </div>
                <div className={styles.cardContent}>
                  <table className={styles.simpleTable}>
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Month</th>
                        <th>Nos.</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffData.map((row, idx) => (
                        <tr key={idx}>
                          <td className={styles.boldCell}>{row.type}</td>
                          <td>{row.month}</td>
                          <td><span className={styles.pillGray}>{row.nos}</span></td>
                          <td className={styles.amountText}>₹{row.amount.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Card 2: Challan & Return Status */}
              <div className={`${styles.card} ${styles.orangeCard}`}>
                <div className={styles.cardHeader}>
                  <div className={styles.headerDot}></div>
                  <h3>Challan & Return Status</h3>
                </div>
                <div className={styles.cardContent}>
                  <table className={styles.simpleTable}>
                    <thead>
                      <tr>
                        <th>Transaction</th>
                        <th>Month</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {challanStatus.map((row, idx) => {
                        const isPending = row.status === 'Pending';
                        return (
                          <tr key={idx}>
                            <td className={styles.boldCell}>{row.type}</td>
                            <td>{row.month}</td>
                            <td>
                              <span className={isPending ? styles.badgePending : styles.badgeSuccess}>
                                {row.status}
                              </span>
                            </td>
                            <td>{row.date}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Card 3: 3 Month Absent List */}
              <div className={`${styles.card} ${styles.redCard} ${styles.span2}`}>
                <div className={styles.cardHeader}>
                  <div className={styles.headerDot}></div>
                  <h3>3 Month Absent List</h3>
                </div>
                <div className={styles.cardContent}>

                  {/* Table Controls */}
                  <div className={styles.tableControls}>
                    <div className={styles.rowsSelect}>
                      <span className={styles.controlLabel}>Show</span>
                      <select
                        value={absentRowsPerPage}
                        onChange={(e) => {
                          setAbsentRowsPerPage(Number(e.target.value));
                          setAbsentPage(1);
                        }}
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                      </select>
                      <span className={styles.controlLabel}>entries</span>
                    </div>
                    <div className={styles.searchWrapper}>
                      <Search size={14} className={styles.searchIcon} />
                      <input
                        type="text"
                        placeholder="Search table..."
                        value={absentSearch}
                        onChange={(e) => {
                          setAbsentSearch(e.target.value);
                          setAbsentPage(1);
                        }}
                      />
                    </div>
                  </div>

                  <div className={styles.tableResponsive}>
                    <table className={styles.dataTable}>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>A/C No.</th>
                          <th>UAN</th>
                          <th>Contractor Name</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedAbsent.length > 0 ? (
                          paginatedAbsent.map((row, idx) => (
                            <tr key={idx}>
                              <td className={styles.boldCell}>{row.name}</td>
                              <td>{row.acNo}</td>
                              <td className={styles.monospace}>{row.uan}</td>
                              <td>{row.contractor}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className={styles.emptyTable}>No matching records found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Table Footer / Pagination */}
                  <div className={styles.tableFooter}>
                    <div className={styles.infoText}>
                      Showing {filteredAbsent.length > 0 ? (absentPage - 1) * absentRowsPerPage + 1 : 0} to{' '}
                      {Math.min(absentPage * absentRowsPerPage, filteredAbsent.length)} of {filteredAbsent.length} entries
                    </div>
                    <div className={styles.pagination}>
                      <button
                        onClick={() => setAbsentPage(Math.max(1, absentPage - 1))}
                        disabled={absentPage === 1}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      {Array.from({ length: totalAbsentPages }, (_, i) => i + 1).map(p => (
                        <button
                          key={p}
                          className={absentPage === p ? styles.activePage : ''}
                          onClick={() => setAbsentPage(p)}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        onClick={() => setAbsentPage(Math.min(totalAbsentPages, absentPage + 1))}
                        disabled={absentPage === totalAbsentPages || totalAbsentPages === 0}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* Card 4: Employee Complete 58 Year of Age */}
              <div className={`${styles.card} ${styles.blueCard} ${styles.span2}`}>
                <div className={styles.cardHeader}>
                  <div className={styles.headerDot}></div>
                  <h3>Employee Complete 58 Year of Age</h3>
                </div>
                <div className={styles.cardContent}>

                  {/* Table Controls */}
                  <div className={styles.tableControls}>
                    <div className={styles.rowsSelect}>
                      <span className={styles.controlLabel}>Show</span>
                      <select
                        value={retireRowsPerPage}
                        onChange={(e) => {
                          setRetireRowsPerPage(Number(e.target.value));
                          setRetirePage(1);
                        }}
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                      </select>
                      <span className={styles.controlLabel}>entries</span>
                    </div>
                    <div className={styles.searchWrapper}>
                      <Search size={14} className={styles.searchIcon} />
                      <input
                        type="text"
                        placeholder="Search table..."
                        value={retireSearch}
                        onChange={(e) => {
                          setRetireSearch(e.target.value);
                          setRetirePage(1);
                        }}
                      />
                    </div>
                  </div>

                  <div className={styles.tableResponsive}>
                    <table className={styles.dataTable}>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>A/C No</th>
                          <th>UAN</th>
                          <th>DOB</th>
                          <th>Contractor Name</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedRetire.length > 0 ? (
                          paginatedRetire.map((row, idx) => (
                            <tr key={idx}>
                              <td className={styles.boldCell}>{row.name}</td>
                              <td>{row.acNo}</td>
                              <td className={styles.monospace}>{row.uan}</td>
                              <td>{row.dob}</td>
                              <td>{row.contractor}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className={styles.emptyTable}>No matching records found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Table Footer / Pagination */}
                  <div className={styles.tableFooter}>
                    <div className={styles.infoText}>
                      Showing {filteredRetire.length > 0 ? (retirePage - 1) * retireRowsPerPage + 1 : 0} to{' '}
                      {Math.min(retirePage * retireRowsPerPage, filteredRetire.length)} of {filteredRetire.length} entries
                    </div>
                    <div className={styles.pagination}>
                      <button
                        onClick={() => setRetirePage(Math.max(1, retirePage - 1))}
                        disabled={retirePage === 1}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      {Array.from({ length: totalRetirePages }, (_, i) => i + 1).map(p => (
                        <button
                          key={p}
                          className={retirePage === p ? styles.activePage : ''}
                          onClick={() => setRetirePage(p)}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        onClick={() => setRetirePage(Math.min(totalRetirePages, retirePage + 1))}
                        disabled={retirePage === totalRetirePages || totalRetirePages === 0}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* Card 5: Notes */}
              <div className={`${styles.card} ${styles.notesCard} ${styles.span2}`}>
                <div className={styles.cardHeader}>
                  <div className={styles.headerDot}></div>
                  <h3>Notes & Remarks</h3>
                </div>
                <div className={styles.cardContent}>
                  <textarea
                    className={styles.notesTextarea}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Type payroll remarks, updates or actions here..."
                  />
                </div>
              </div>

            </div>
          ) : activeMenu === 'Master' ? (
            <MasterPage activeSubMenu={activeSubMenu} />
          ) : activeMenu === 'Setup' ? (
            <SetupPage activeSubMenu={activeSubMenu} />
          ) : activeMenu === 'Attendance' ? (
            <AttendancePage activeSubMenu={activeSubMenu} />
          ) : activeMenu === 'Entry' ? (
            <EntryPage activeSubMenu={activeSubMenu} />
          ) : (
            <div className={styles.placeholderPage}>
              <div className={styles.placeholderIcon}>
                <UserCheck size={48} />
              </div>
              <h2>
                {activeMenu}
                {activeSubMenu ? ` - ${activeSubMenu}` : ' Management'}
              </h2>
              <p>
                {activeSubMenu
                  ? `Configure and manage the ${activeSubMenu.toLowerCase()} data tables here. This section is integrated with the payroll master system.`
                  : `This module is currently active. Use the sidebar to navigate back to the Main Dashboard or configure settings.`
                }
              </p>
            </div>
          )}

          {/* Footer */}
          <footer className={styles.footer}>
            <span>© {new Date().getFullYear()} - Payroll Services</span>
          </footer>
        </main>

      </div>
    </div>
  );
};

export default DashboardPage;
