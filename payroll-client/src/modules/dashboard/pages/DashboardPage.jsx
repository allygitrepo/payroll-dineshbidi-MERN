import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import styles from './DashboardPage.module.css';
import { Header, Footer, Sidebar } from '../../../shared/components';

const DashboardPage = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [activeSubMenu, setActiveSubMenu] = useState('');




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
    { empCode: 'EMP007', name: 'Karan Mehra', category: 'Bidi Roller', contact: '9345678901', status: 'Absent' },
    { empCode: 'EMP011', name: 'Sanjay Prasad', category: 'Bidi Roller', contact: '9789012345', status: 'Absent' },
    { empCode: 'EMP012', name: 'Gopal Sharma', category: 'Packing Staff', contact: '9890123456', status: 'Absent' }
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



  // Filtering & Pagination Calculations for Absent List
  const filteredAbsent = absentList.filter(emp =>
    emp.name.toLowerCase().includes(absentSearch.toLowerCase()) ||
    emp.empCode.toLowerCase().includes(absentSearch.toLowerCase()) ||
    emp.category.toLowerCase().includes(absentSearch.toLowerCase()) ||
    emp.contact.includes(absentSearch)
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
      <Header
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
      />

      {/* Main Body */}
      <div className={styles.mainBody}>
        {/* Sidebar */}
        <Sidebar sidebarCollapsed={sidebarCollapsed} />

        {/* Content Pane */}
        <main className={styles.contentPane}>
          {activeMenu === 'Dashboard' && (
            <div className={styles.contentHeader}>
              <h1 className={styles.pageTitle}>{activeMenu}</h1>
            </div>
          )}

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
                  <h3>Today's Absent Employees</h3>
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
                          <th>Emp Code</th>
                          <th>Name</th>
                          <th>Category</th>
                          <th>Contact No.</th>
                          <th style={{ textAlign: 'center' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedAbsent.length > 0 ? (
                          paginatedAbsent.map((row, idx) => (
                            <tr key={idx}>
                              <td className={styles.monospace}>{row.empCode}</td>
                              <td className={styles.boldCell}>{row.name}</td>
                              <td>{row.category}</td>
                              <td>{row.contact}</td>
                              <td style={{ textAlign: 'center' }}>
                                <span style={{
                                  backgroundColor: '#FEE2E2',
                                  color: '#EF4444',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  display: 'inline-flex',
                                  alignItems: 'center'
                                }}>
                                  Absent
                                </span>
                              </td>
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
          ) : activeMenu === 'Report' ? (
            <ReportPage activeSubMenu={activeSubMenu} />
          ) : activeMenu === 'Utility' ? (
            <UtilityPage activeSubMenu={activeSubMenu} />
          ) : activeMenu === 'Todo List' ? (
            <TodoListPage activeSubMenu={activeSubMenu} />
          ) : activeMenu === 'Convert Excel To Text' ? (
            <ConvertExcelToTextPage activeSubMenu={activeSubMenu} />
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
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
