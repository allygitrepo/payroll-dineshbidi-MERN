import React from 'react';
import AbsentListPage from '../absent-list/pages/AbsentListPage';
import RetirementListPage from '../retirement-list/pages/RetirementListPage';
import NotesPage from '../notes/pages/NotesPage';

const TodoListPage = ({ activeSubMenu }) => {
  switch (activeSubMenu) {
    case '3 Month Absent List':
      return <AbsentListPage />;
    case '58 Years of age':
      return <RetirementListPage />;
    case 'Notes':
      return <NotesPage />;
    default:
      return (
        <div style={{ padding: '30px', backgroundColor: 'var(--card-bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>Todo List</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Please select a todo sub-menu option from the sidebar.
          </p>
        </div>
      );
  }
};

export default TodoListPage;
