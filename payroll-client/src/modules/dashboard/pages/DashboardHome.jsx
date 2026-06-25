import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, UserCheck } from 'lucide-react';
import { useToast } from '../../../shared/components';
import dashboardService from '../services/dashboardService';
import styles from './DashboardPage.module.css';

const DashboardHome = () => {
  const addToast = useToast();
  // Search and Pagination states
  const [absentSearch, setAbsentSearch] = useState('');
  const [absentRowsPerPage, setAbsentRowsPerPage] = useState(5);
  const [absentPage, setAbsentPage] = useState(1);

  const [retireSearch, setRetireSearch] = useState('');
  const [retireRowsPerPage, setRetireRowsPerPage] = useState(5);
  const [retirePage, setRetirePage] = useState(1);

  // Dynamic States
  const [notes, setNotes] = useState("Loading upcoming notes...");
  const [staffData, setStaffData] = useState([]);
  const [challanStatus, setChallanStatus] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [absentList, setAbsentList] = useState([]);
  const [retireList, setRetireList] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const companyId = localStorage.getItem('selectedCompany');
        if (!companyId) return;

        setIsLoading(true);
        const res = await dashboardService.getDashboardSummary(companyId);
        
        if (res?.status) {
          setStaffData(res.data.staffData || []);
          setChallanStatus(res.data.challanStatus || []);
          setNotes(res.data.notesText || "No upcoming notes found.");
          setAbsentList(res.data.absentList || []);
          setRetireList(res.data.retireList || []);
        } else {
          addToast({ type: 'error', message: 'Failed to load dashboard data' });
        }
      } catch (error) {
        console.error("Dashboard fetch error", error);
        addToast({ type: 'error', message: 'An error occurred while loading dashboard' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
    <>
      <div className={styles.contentHeader}>
        <h1 className={styles.pageTitle}>Dashboard</h1>
      </div>

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
    </>
  );
};

export default DashboardHome;
