import React from 'react';
import AttendanceListPage from '../list/pages/AttendanceListPage';
import FaceAttendanceSelfPage from '../self/pages/FaceAttendanceSelfPage';
import LeavePage from '../leave/pages/LeavePage';

const AttendancePage = ({ activeSubMenu }) => {
  switch (activeSubMenu) {
    case 'Attendence List':
      return <AttendanceListPage />;
    case 'Leave Management':
      return <LeavePage />;
    case 'Face Attendance (Self)':
      return <FaceAttendanceSelfPage />;
    default:
      return (
        <div style={{ padding: '30px', backgroundColor: 'var(--card-bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>Attendance Management</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Please select an attendance sub-menu option from the sidebar.
          </p>
        </div>
      );
  }
};

export default AttendancePage;
