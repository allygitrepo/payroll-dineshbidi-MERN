import React, { useState, useEffect } from 'react';
import { Fingerprint } from 'lucide-react';
import styles from '../components/KycUpdatePage.module.css';
import KycSearch from '../components/KycSearch';
import KycForm from '../components/KycForm';
import { getEmployees, saveEmployee } from '../../employee/services/employeeService';
import { useToast } from '../../../../shared/components';

const KycUpdatePage = () => {
  const addToast = useToast();
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [activeEmployee, setActiveEmployee] = useState(null);
  const [localKycDetails, setLocalKycDetails] = useState([]);

  // Load registered employees on mount
  useEffect(() => {
    setEmployees(getEmployees());
  }, []);

  const handleSelectEmployee = (id) => {
    setSelectedEmployeeId(id);
  };

  const handleSearch = () => {
    if (!selectedEmployeeId) {
      addToast({ type: 'warning', message: 'Please select an employee first!' });
      return;
    }
    const emp = employees.find(e => e.id === selectedEmployeeId);
    if (emp) {
      setActiveEmployee(emp);
      setLocalKycDetails(emp.kycDetails || []);
      addToast({ type: 'success', message: `Loaded KYC details for ${emp.memberName}` });
    }
  };

  const handleReset = () => {
    setSelectedEmployeeId('');
    setActiveEmployee(null);
    setLocalKycDetails([]);
    addToast({ type: 'info', message: 'Search reset' });
  };

  const handleAddKyc = (newDoc) => {
    if (!activeEmployee) {
      addToast({ type: 'error', message: 'Load employee using search before adding document!' });
      return;
    }
    const docWithId = {
      ...newDoc,
      id: 'k_local_' + Date.now()
    };
    setLocalKycDetails(prev => [...prev, docWithId]);
    addToast({ type: 'info', message: 'Document added to queue' });
  };

  const handleRemoveKyc = (id) => {
    setLocalKycDetails(prev => prev.filter(item => (item.id || item.documentNumber) !== id));
    addToast({ type: 'info', message: 'Document removed from queue' });
  };

  const handleSave = () => {
    if (!activeEmployee) {
      addToast({ type: 'error', message: 'No active employee loaded. Search first!' });
      return;
    }

    const updatedEmployee = {
      ...activeEmployee,
      kycDetails: localKycDetails
    };

    const updatedList = saveEmployee(updatedEmployee);
    setEmployees(updatedList);
    setActiveEmployee(updatedEmployee);
    addToast({ type: 'success', message: `KYC documents saved successfully for ${activeEmployee.memberName}!` });
  };

  const handleCancel = () => {
    if (activeEmployee) {
      setLocalKycDetails(activeEmployee.kycDetails || []);
      addToast({ type: 'info', message: 'Changes reverted to last saved state' });
    } else {
      handleReset();
    }
  };

  return (
    <div className={styles.container}>
      {/* Title Header */}
      <div className={styles.headerSection}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/*<div style={{ color: 'var(--primary)', backgroundColor: 'var(--primary-light)', padding: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center' }}>
            <Fingerprint size={24} />
          </div>*/}
          <h1 className={styles.title} style={{ fontSize: '1.75rem', fontWeight: 700 }}>KYC Update</h1>
        </div>
      </div>

      {/* Employee Selection card */}
      <KycSearch
        employees={employees}
        selectedEmployeeId={selectedEmployeeId}
        onSelectEmployee={handleSelectEmployee}
        onSearch={handleSearch}
        onReset={handleReset}
      />

      {/* KYC form and sub-grid table card */}
      <KycForm
        kycDetails={localKycDetails}
        onAddKyc={handleAddKyc}
        onRemoveKyc={handleRemoveKyc}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default KycUpdatePage;
