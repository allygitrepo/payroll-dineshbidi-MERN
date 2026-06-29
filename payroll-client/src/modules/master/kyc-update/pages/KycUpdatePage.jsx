import React, { useState, useEffect } from 'react';
import { Fingerprint } from 'lucide-react';
import styles from '../components/KycUpdatePage.module.css';
import KycSearch from '../components/KycSearch';
import KycForm from '../components/KycForm';
import { getEmployees, saveEmployee } from '../../employee/services/employeeService';
import { getAddresses } from '../../address/services/addressService';
import { getContractors } from '../../contractor/services/contractorService';
import { useToast } from '../../../../shared/components';

const KycUpdatePage = () => {
  const addToast = useToast();
  const [employees, setEmployees] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [activeEmployee, setActiveEmployee] = useState(null);
  const [localKycDetails, setLocalKycDetails] = useState([]);

  // Load registered employees, addresses and contractors on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      const companyId = localStorage.getItem('selectedCompany');
      if (!companyId) {
        addToast({ type: 'warning', message: 'No company selected! Please select a company on login.' });
        return;
      }
      try {
        const [loadedEmployees, loadedAddresses, loadedContractors] = await Promise.all([
          getEmployees(companyId),
          getAddresses(companyId),
          getContractors(companyId)
        ]);
        setEmployees(loadedEmployees);
        setAddresses(loadedAddresses);
        setContractors(loadedContractors);
      } catch (err) {
        console.error('Error fetching initial KYC data:', err);
        addToast({ type: 'error', message: 'Failed to load employee directory.' });
      }
    };
    fetchInitialData();
  }, [addToast]);

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
    }
  };

  const handleReset = () => {
    setSelectedEmployeeId('');
    setActiveEmployee(null);
    setLocalKycDetails([]);
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
  };

  const handleRemoveKyc = (id) => {
    setLocalKycDetails(prev => prev.filter(item => (item.id || item.documentNumber) !== id));
  };

  const handleSave = async () => {
    if (!activeEmployee) {
      addToast({ type: 'error', message: 'No active employee loaded. Search first!' });
      return;
    }

    const updatedEmployee = {
      ...activeEmployee,
      kycDetails: localKycDetails
    };

    const companyId = localStorage.getItem('selectedCompany');
    try {
      const updatedList = await saveEmployee(updatedEmployee, companyId, addresses, contractors);
      setEmployees(updatedList);
      setActiveEmployee(updatedEmployee);
      addToast({ type: 'success', message: `KYC documents saved successfully for ${activeEmployee.memberName}!` });
    } catch (err) {
      console.error('Error saving KYC details:', err);
      addToast({
        type: 'error',
        message: err.response?.data?.messageToShow || 'Failed to save KYC details.'
      });
    }
  };

  const handleCancel = () => {
    if (activeEmployee) {
      setLocalKycDetails(activeEmployee.kycDetails || []);
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
        activeEmployee={activeEmployee}
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
