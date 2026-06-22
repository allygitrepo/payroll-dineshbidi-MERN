import React from 'react';
import OfficeAttendancePage from '../office/pages/OfficeAttendancePage';
import PackingAttendancePage from '../packing/pages/PackingAttendancePage';
import BidiRollerAttendancePage from '../bidi-roller/pages/BidiRollerAttendancePage';
import AttendanceListPage from '../list/pages/AttendanceListPage';
import FaceAttendanceSelfPage from '../self/pages/FaceAttendanceSelfPage';

const AttendancePage = ({ activeSubMenu }) => {
  switch (activeSubMenu) {
    case 'Attendence List':
      return <AttendanceListPage />;
    case 'Face Attendance (Self)':
      return <FaceAttendanceSelfPage />;
    case 'Office Attendance':
      return <OfficeAttendancePage />;
    case 'Packing Attendance':
      return <PackingAttendancePage />;
    case 'Bidi Roller Attendance':
      return <BidiRollerAttendancePage />;
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
