import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Settings, List, ShieldAlert, CheckSquare, Play } from 'lucide-react';
import styles from './LeaveMasterPage.module.css';
import { useToast, ConfirmModal } from '../../../../shared/components';
import { getEmployees } from '../../../master/employee/services/employeeService';
import {
  getLeaveTypes,
  saveLeaveType,
  deleteLeaveType,
  getLeavePolicies,
  saveLeavePolicy,
  getGlobalSettings,
  saveGlobalSettings,
  runAccrual,
  getEmployeeBalances,
  adjustBalance
} from '../services/leaveMasterService';

const LeaveMasterPage = () => {
  const addToast = useToast();
  const companyId = localStorage.getItem('selectedCompany');

  // Tab State
  const [activeTab, setActiveTab] = useState('types'); // 'types', 'policies', 'settings'

  // Loading States
  const [loading, setLoading] = useState(true);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [runningAccruals, setRunningAccruals] = useState(false);

  // Tab 1: Leave Types States
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [editingType, setEditingType] = useState(null);
  const [typeForm, setTypeForm] = useState({
    name: '',
    code: '',
    is_paid: true,
    half_day_allowed: true,
    requires_supporting_document: false,
    requires_approval: true,
    is_active: true
  });

  // Tab 2: Leave Policies States
  const [policyMatrix, setPolicyMatrix] = useState([]);
  const [selectedEmpTypeId, setSelectedEmpTypeId] = useState('');

  // Tab 3: Global Leave Settings States
  const [globalSettings, setGlobalSettings] = useState({
    leave_year_type: 'Calendar Year',
    sandwich_policy_enabled: false,
    comp_off_expiry_days: 90
  });

  // Tab 4: Balance Adjustment States
  const [employees, setEmployees] = useState([]);
  const [selectedAdjustEmployeeId, setSelectedAdjustEmployeeId] = useState('');
  const [selectedAdjustLeaveTypeId, setSelectedAdjustLeaveTypeId] = useState('');
  const [adjustYear, setAdjustYear] = useState(new Date().getFullYear().toString());
  const [currentAdjustBalance, setCurrentAdjustBalance] = useState(null);
  const [adjustForm, setAdjustForm] = useState({
    allocated: '',
    carryForward: '',
    reason: ''
  });
  const [savingAdjustment, setSavingAdjustment] = useState(false);

  // Delete Confirmation State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // Load active configurations based on company select
  const loadData = async () => {
    if (!companyId) {
      addToast({ type: 'warning', message: 'Please select a company to configure leave master.' });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      if (activeTab === 'types') {
        const types = await getLeaveTypes(companyId);
        setLeaveTypes(types);
      } else if (activeTab === 'policies') {
        const matrix = await getLeavePolicies(companyId);
        setPolicyMatrix(matrix);
        if (matrix.length > 0 && !selectedEmpTypeId) {
          setSelectedEmpTypeId(matrix[0].employee_type_id);
        }
      } else if (activeTab === 'settings') {
        const settings = await getGlobalSettings(companyId);
        setGlobalSettings(settings);
      }
    } catch (err) {
      console.error('Error loading leave configurations:', err);
      addToast({ type: 'error', message: 'Failed to load leave configuration.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [companyId, activeTab]);

  // Load employees list when tab changes to 'adjustments'
  useEffect(() => {
    const fetchEmployees = async () => {
      if (activeTab === 'adjustments' && companyId && employees.length === 0) {
        try {
          const data = await getEmployees(companyId);
          setEmployees(data || []);
        } catch (err) {
          console.error('Failed to fetch employees list:', err);
        }
      }
    };
    fetchEmployees();
  }, [activeTab, companyId]);

  // Fetch current balance details to prefill
  useEffect(() => {
    const fetchCurrentBalance = async () => {
      if (selectedAdjustEmployeeId && selectedAdjustLeaveTypeId && adjustYear && companyId) {
        try {
          const balances = await getEmployeeBalances(selectedAdjustEmployeeId, companyId, adjustYear);
          const current = balances.find(b => b.leave_type_id === selectedAdjustLeaveTypeId);
          if (current) {
            setCurrentAdjustBalance(current);
            setAdjustForm({
              allocated: current.allocated.toString(),
              carryForward: current.carry_forward.toString(),
              reason: ''
            });
          } else {
            setCurrentAdjustBalance(null);
            setAdjustForm({ allocated: '0', carryForward: '0', reason: '' });
          }
        } catch (err) {
          console.error('Failed to load current balance for adjustment:', err);
        }
      } else {
        setCurrentAdjustBalance(null);
      }
    };
    fetchCurrentBalance();
  }, [selectedAdjustEmployeeId, selectedAdjustLeaveTypeId, adjustYear, companyId]);

  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    if (!companyId || !selectedAdjustEmployeeId || !selectedAdjustLeaveTypeId) {
      addToast({ type: 'warning', message: 'Please select an employee and leave type.' });
      return;
    }
    if (!adjustForm.reason.trim()) {
      addToast({ type: 'warning', message: 'Reason for adjustment is required.' });
      return;
    }

    try {
      setSavingAdjustment(true);
      await adjustBalance(companyId, {
        employeeId: selectedAdjustEmployeeId,
        leaveTypeId: selectedAdjustLeaveTypeId,
        leaveYear: adjustYear,
        allocated: parseFloat(adjustForm.allocated) || 0.0,
        carryForward: parseFloat(adjustForm.carryForward) || 0.0,
        reason: adjustForm.reason.trim()
      });

      addToast({ type: 'success', message: 'Leave balance adjusted successfully!' });
      
      // Refresh current balance numbers
      const balances = await getEmployeeBalances(selectedAdjustEmployeeId, companyId, adjustYear);
      const current = balances.find(b => b.leave_type_id === selectedAdjustLeaveTypeId);
      if (current) {
        setCurrentAdjustBalance(current);
        setAdjustForm(prev => ({ ...prev, reason: '' }));
      }
    } catch (err) {
      console.error('Failed to save manual adjustment:', err);
      addToast({ type: 'error', message: err.message || 'Failed to adjust balance.' });
    } finally {
      setSavingAdjustment(false);
    }
  };

  // Tab 1: Handle Save Type
  const handleSaveType = async (e) => {
    e.preventDefault();
    if (!companyId) return;

    if (!typeForm.name.trim() || !typeForm.code.trim()) {
      addToast({ type: 'warning', message: 'Name and Code are required.' });
      return;
    }

    // Check duplicate code
    const isDuplicate = leaveTypes.some(
      (t) =>
        t.code.toUpperCase().trim() === typeForm.code.toUpperCase().trim() &&
        t.id !== editingType
    );
    if (isDuplicate) {
      addToast({ type: 'warning', message: `Leave Code "${typeForm.code}" already exists.` });
      return;
    }

    try {
      const payload = {
        id: editingType || undefined,
        name: typeForm.name.trim(),
        code: typeForm.code.toUpperCase().trim(),
        is_paid: typeForm.is_paid,
        half_day_allowed: typeForm.half_day_allowed,
        requires_supporting_document: typeForm.requires_supporting_document,
        requires_approval: typeForm.requires_approval,
        is_active: typeForm.is_active
      };

      await saveType(payload);
      addToast({ type: 'success', message: editingType ? 'Leave Type updated successfully!' : 'Leave Type created successfully!' });
      
      // Reset form
      setEditingType(null);
      setTypeForm({
        name: '',
        code: '',
        is_paid: true,
        half_day_allowed: true,
        requires_supporting_document: false,
        requires_approval: true,
        is_active: true
      });
      
      // Reload types
      const types = await getLeaveTypes(companyId);
      setLeaveTypes(types);
    } catch (err) {
      console.error('Failed to save leave type:', err);
      addToast({ type: 'error', message: 'Failed to save leave type config.' });
    }
  };

  const saveType = async (payload) => {
    await saveLeaveType(companyId, payload);
  };

  // Edit Click helper
  const handleEditClick = (type) => {
    setEditingType(type.id);
    setTypeForm({
      name: type.name,
      code: type.code,
      is_paid: type.is_paid,
      half_day_allowed: type.half_day_allowed,
      requires_supporting_document: type.requires_supporting_document,
      requires_approval: type.requires_approval,
      is_active: type.is_active
    });
  };

  const handleCancelEdit = () => {
    setEditingType(null);
    setTypeForm({
      name: '',
      code: '',
      is_paid: true,
      half_day_allowed: true,
      requires_supporting_document: false,
      requires_approval: true,
      is_active: true
    });
  };

  // Delete Click Helper
  const handleDeleteClick = (id) => {
    setDeleteTargetId(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteTargetId && companyId) {
      try {
        await deleteLeaveType(companyId, deleteTargetId);
        addToast({ type: 'success', message: 'Leave Type deleted successfully.' });
        // Reload types
        const types = await getLeaveTypes(companyId);
        setLeaveTypes(types);
      } catch (err) {
        console.error('Error deleting type:', err);
        addToast({ type: 'error', message: 'Failed to delete leave type.' });
      }
    }
    setIsConfirmOpen(false);
    setDeleteTargetId(null);
  };

  // Tab 2: Handle policy input modifications
  const handlePolicyChange = (empTypeId, leaveTypeId, field, value) => {
    setPolicyMatrix((prev) =>
      prev.map((row) => {
        if (row.employee_type_id === empTypeId) {
          return {
            ...row,
            policies: row.policies.map((p) => {
              if (p.leave_type_id === leaveTypeId) {
                return {
                  ...p,
                  policy: {
                    ...p.policy,
                    [field]: value
                  }
                };
              }
              return p;
            })
          };
        }
        return row;
      })
    );
  };

  // Tab 2: Save policy rules for selected Employee Type
  const handleSavePolicies = async (empTypeId) => {
    if (!companyId) return;
    setSavingPolicy(true);
    try {
      const empRow = policyMatrix.find((r) => r.employee_type_id === empTypeId);
      if (!empRow) return;

      for (const p of empRow.policies) {
        const policyPayload = {
          employee_type_id: empTypeId,
          leave_type_id: p.leave_type_id,
          yearly_allocation: parseFloat(p.policy.yearly_allocation) || 0.00,
          monthly_accrual_enabled: p.policy.monthly_accrual_enabled,
          monthly_accrual_amount: parseFloat(p.policy.monthly_accrual_amount) || 0.00,
          carry_forward_allowed: p.policy.carry_forward_allowed,
          max_carry_forward: parseFloat(p.policy.max_carry_forward) || 0.00
        };
        await saveLeavePolicy(companyId, policyPayload);
      }
      addToast({ type: 'success', message: 'Policies updated successfully!' });
    } catch (err) {
      console.error('Error saving policies:', err);
      addToast({ type: 'error', message: 'Failed to save policies.' });
    } finally {
      setSavingPolicy(false);
    }
  };

  // Tab 3: Save global configurations
  const handleSaveGlobalSettings = async (e) => {
    e.preventDefault();
    if (!companyId) return;

    try {
      await saveGlobalSettings(companyId, globalSettings);
      addToast({ type: 'success', message: 'Global leave configurations updated!' });
    } catch (err) {
      console.error('Error saving settings:', err);
      addToast({ type: 'error', message: 'Failed to update global configurations.' });
    }
  };

  // Tab 3: Trigger monthly accrual manually
  const handleRunAccrual = async () => {
    if (!companyId) return;
    setRunningAccruals(true);
    try {
      const res = await runAccrual(companyId);
      addToast({
        type: 'success',
        message: res.data?.message || 'Monthly accrual processed successfully!'
      });
    } catch (err) {
      console.error('Error triggering accruals:', err);
      addToast({ type: 'error', message: 'Failed to process monthly accruals.' });
    } finally {
      setRunningAccruals(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Title */}
      <div className={styles.headerSection}>
        <div>
          <h1 className={styles.title}>Leave Setup & Configuration</h1>
          <span className={styles.subTitle}>Configure custom leave types, employee policies, and sandwich validation settings</span>
        </div>
      </div>

      {/* Tab bar header */}
      <div className={styles.tabsHeader}>
        <button
          className={`${styles.tabLink} ${activeTab === 'types' ? styles.tabLinkActive : ''}`}
          onClick={() => setActiveTab('types')}
        >
          <List size={16} /> Leave Types
        </button>
        <button
          className={`${styles.tabLink} ${activeTab === 'policies' ? styles.tabLinkActive : ''}`}
          onClick={() => setActiveTab('policies')}
        >
          <ShieldAlert size={16} /> Leave Policies
        </button>
        <button
          className={`${styles.tabLink} ${activeTab === 'settings' ? styles.tabLinkActive : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={16} /> Global Settings
        </button>
        <button
          className={`${styles.tabLink} ${activeTab === 'adjustments' ? styles.tabLinkActive : ''}`}
          onClick={() => setActiveTab('adjustments')}
        >
          <CheckSquare size={16} /> Balance Adjustments
        </button>
      </div>

      {loading ? (
        <div className={styles.loadingContainer}>
          Loading configuration details...
        </div>
      ) : (
        <div className={styles.tabContent}>
          {/* TAB 1: Leave Types CRUD */}
          {activeTab === 'types' && (
            <div className={styles.tabPane}>
              <div className={styles.twoColumnGrid}>
                {/* Form to Create/Edit */}
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>
                    {editingType ? 'Edit Leave Type' : 'Add Leave Type'}
                  </h3>
                  <form onSubmit={handleSaveType} className={styles.formContainer}>
                    <div className={styles.field}>
                      <label className={styles.label}>Leave Name *</label>
                      <input
                        type="text"
                        value={typeForm.name}
                        onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                        placeholder="e.g. Casual Leave"
                        className={styles.input}
                        required
                      />
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Leave Code *</label>
                      <input
                        type="text"
                        value={typeForm.code}
                        onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value })}
                        placeholder="e.g. CL"
                        className={styles.input}
                        disabled={!!editingType} // Do not edit code after creation for reference integrity
                        required
                      />
                    </div>

                    <div className={styles.checkboxGroup}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={typeForm.is_paid}
                          onChange={(e) => setTypeForm({ ...typeForm, is_paid: e.target.checked })}
                        />
                        <span>Is Paid Leave (Deducted from balance quota)</span>
                      </label>
                    </div>

                    <div className={styles.checkboxGroup}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={typeForm.half_day_allowed}
                          onChange={(e) => setTypeForm({ ...typeForm, half_day_allowed: e.target.checked })}
                        />
                        <span>Half Day Allowed</span>
                      </label>
                    </div>

                    <div className={styles.checkboxGroup}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={typeForm.requires_supporting_document}
                          onChange={(e) => setTypeForm({ ...typeForm, requires_supporting_document: e.target.checked })}
                        />
                        <span>Requires Supporting Documents (Mandatory Attachment)</span>
                      </label>
                    </div>

                    <div className={styles.checkboxGroup}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={typeForm.requires_approval}
                          onChange={(e) => setTypeForm({ ...typeForm, requires_approval: e.target.checked })}
                        />
                        <span>Requires Approval (Requires Admin action)</span>
                      </label>
                    </div>

                    <div className={styles.checkboxGroup}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={typeForm.is_active}
                          onChange={(e) => setTypeForm({ ...typeForm, is_active: e.target.checked })}
                        />
                        <span>Active status</span>
                      </label>
                    </div>

                    <div className={styles.buttonGroup}>
                      <button type="submit" className={`${styles.btn} ${styles.primaryBtn}`}>
                        <Save size={16} /> {editingType ? 'Update Type' : 'Create Type'}
                      </button>
                      {editingType && (
                        <button type="button" onClick={handleCancelEdit} className={`${styles.btn} ${styles.secondaryBtn}`}>
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* List Table */}
                <div className={styles.tableCard}>
                  <h3 className={styles.cardTitle}>Configured Leave Types</h3>
                  <div className={styles.tableContainer}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Code</th>
                          <th>Name</th>
                          <th>Type</th>
                          <th>Requirements</th>
                          <th>Status</th>
                          <th style={{ width: '80px', textAlign: 'center' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaveTypes.length > 0 ? (
                          leaveTypes.map((row) => (
                            <tr key={row.id}>
                              <td><span className={styles.codeBadge}>{row.code}</span></td>
                              <td><strong>{row.name}</strong></td>
                              <td>
                                <span className={`${styles.typeBadge} ${row.is_paid ? styles.paidBadge : styles.unpaidBadge}`}>
                                  {row.is_paid ? 'Paid' : 'Unpaid'}
                                </span>
                              </td>
                              <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                {row.half_day_allowed && 'Half-Day '}
                                {row.requires_supporting_document && '• Attachments Required '}
                                {row.requires_approval && '• Approval Required '}
                              </td>
                              <td>
                                <span className={`${styles.statusDot} ${row.is_active ? styles.dotActive : styles.dotInactive}`} />
                                {row.is_active ? 'Active' : 'Inactive'}
                              </td>
                              <td>
                                <div className={styles.actionCell}>
                                  <button onClick={() => handleEditClick(row)} className={styles.editBtn} title="Edit Leave Type">
                                    <Edit2 size={13} />
                                  </button>
                                  <button onClick={() => handleDeleteClick(row.id)} className={styles.deleteBtn} title="Delete Leave Type">
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className={styles.emptyState}>No leave types configured.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Leave Policies Matrix */}
          {activeTab === 'policies' && (
            <div className={styles.tabPane}>
              <div className={styles.policiesWrapper}>
                {/* Policies Configuration Matrix Card */}
                <div className={styles.matrixFormCard}>
                  {(() => {
                    const activeRow = policyMatrix.find((r) => r.employee_type_id === selectedEmpTypeId);
                    if (!activeRow) {
                      return <div className={styles.emptyState}>Select an Employee Type to configure policies.</div>;
                    }

                    return (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '16px', flexWrap: 'wrap' }}>
                          <h3 className={styles.matrixTitle}>
                            Leave limits for <u>{activeRow.employee_type_name}</u>
                          </h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Employee Type:</span>
                              <select
                                value={selectedEmpTypeId}
                                onChange={(e) => setSelectedEmpTypeId(e.target.value)}
                                className={styles.matrixSelectFilter}
                              >
                                {policyMatrix.map((row) => (
                                  <option key={row.employee_type_id} value={row.employee_type_id}>
                                    {row.employee_type_name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <button
                              onClick={() => handleSavePolicies(activeRow.employee_type_id)}
                              className={`${styles.btn} ${styles.primaryBtn}`}
                              disabled={savingPolicy}
                            >
                              <Save size={16} /> {savingPolicy ? 'Saving Matrix...' : 'Save Policy Matrix'}
                            </button>
                          </div>
                        </div>

                        <div className={styles.tableContainer}>
                          <table className={styles.table}>
                            <thead>
                              <tr>
                                <th>Leave Type</th>
                                <th style={{ width: '130px' }}>Yearly Allocation</th>
                                <th style={{ width: '130px' }}>Accrual Enabled</th>
                                <th style={{ width: '130px' }}>Accrual / Month</th>
                                <th style={{ width: '130px' }}>Carry Forward</th>
                                <th style={{ width: '130px' }}>Max CF limit</th>
                              </tr>
                            </thead>
                            <tbody>
                              {activeRow.policies.map((p) => (
                                <tr key={p.leave_type_id}>
                                  <td>
                                    <strong>{p.leave_name}</strong>
                                    <br />
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Code: {p.leave_code}</span>
                                  </td>
                                  <td>
                                    <input
                                      type="number"
                                      step="0.5"
                                      min="0"
                                      value={p.policy.yearly_allocation}
                                      onChange={(e) => handlePolicyChange(activeRow.employee_type_id, p.leave_type_id, 'yearly_allocation', e.target.value)}
                                      className={styles.matrixInput}
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="checkbox"
                                      checked={p.policy.monthly_accrual_enabled}
                                      onChange={(e) => handlePolicyChange(activeRow.employee_type_id, p.leave_type_id, 'monthly_accrual_enabled', e.target.checked)}
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      disabled={!p.policy.monthly_accrual_enabled}
                                      value={p.policy.monthly_accrual_amount}
                                      onChange={(e) => handlePolicyChange(activeRow.employee_type_id, p.leave_type_id, 'monthly_accrual_amount', e.target.value)}
                                      className={styles.matrixInput}
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="checkbox"
                                      checked={p.policy.carry_forward_allowed}
                                      onChange={(e) => handlePolicyChange(activeRow.employee_type_id, p.leave_type_id, 'carry_forward_allowed', e.target.checked)}
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="number"
                                      step="0.5"
                                      min="0"
                                      disabled={!p.policy.carry_forward_allowed}
                                      value={p.policy.max_carry_forward}
                                      onChange={(e) => handlePolicyChange(activeRow.employee_type_id, p.leave_type_id, 'max_carry_forward', e.target.value)}
                                      className={styles.matrixInput}
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Global Leave Settings */}
          {activeTab === 'settings' && (
            <div className={styles.tabPane}>
              <div className={styles.twoColumnGrid}>
                {/* Global parameters form */}
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Global Leave Configurations</h3>
                  <form onSubmit={handleSaveGlobalSettings} className={styles.formContainer}>
                    <div className={styles.field}>
                      <label className={styles.label}>Leave Year Type *</label>
                      <select
                        value={globalSettings.leave_year_type}
                        onChange={(e) => setGlobalSettings({ ...globalSettings, leave_year_type: e.target.value })}
                        className={styles.input}
                        required
                      >
                        <option value="Calendar Year">Calendar Year (Jan - Dec)</option>
                        <option value="Financial Year">Financial Year (Apr - Mar)</option>
                        <option value="Joining Anniversary">Joining Anniversary (Per Employee joining date)</option>
                      </select>
                    </div>

                    <div className={styles.checkboxGroup} style={{ marginTop: '10px' }}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={globalSettings.sandwich_policy_enabled}
                          onChange={(e) => setGlobalSettings({ ...globalSettings, sandwich_policy_enabled: e.target.checked })}
                        />
                        <span>Enable Sandwich Leave Policy (Count weekends/holidays sandwiched between leaves)</span>
                      </label>
                    </div>

                    <div className={styles.field} style={{ marginTop: '10px' }}>
                      <label className={styles.label}>Default Comp Off Expiry (Days) *</label>
                      <input
                        type="number"
                        min="1"
                        value={globalSettings.comp_off_expiry_days}
                        onChange={(e) => setGlobalSettings({ ...globalSettings, comp_off_expiry_days: parseInt(e.target.value, 10) || 90 })}
                        className={styles.input}
                        required
                      />
                      <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>
                        Comp-Off grants will expire automatically after this duration from the grant date.
                      </small>
                    </div>

                    <div className={styles.buttonGroup}>
                      <button type="submit" className={`${styles.btn} ${styles.primaryBtn}`}>
                        <Save size={16} /> Save Settings
                      </button>
                    </div>
                  </form>
                </div>

                {/* Monthly Accruals Force trigger Card */}
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Accrual Actions</h3>
                  <div className={styles.actionCardBody}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '16px' }}>
                      Trigger monthly leave accrual calculations for all active employees immediately. This processes policies marked with <em>Monthly Accrual Enabled</em>, credits their balances, and logs transaction audits.
                    </p>
                    <button
                      onClick={handleRunAccrual}
                      className={`${styles.btn} ${styles.primaryBtn}`}
                      disabled={runningAccruals}
                      style={{ background: 'var(--warning, #f59e0b)', boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.2)' }}
                    >
                      <Play size={16} /> {runningAccruals ? 'Processing Accruals...' : 'Process Monthly Accruals Now'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Balance Adjustments */}
          {activeTab === 'adjustments' && (
            <div className={styles.tabPane}>
              <div className={styles.twoColumnGrid}>
                {/* Form Card */}
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Manual Balance Adjustment</h3>
                  <form onSubmit={handleSaveAdjustment} className={styles.formContainer}>
                    <div className={styles.field}>
                      <label className={styles.label}>Select Employee *</label>
                      <select
                        value={selectedAdjustEmployeeId}
                        onChange={(e) => setSelectedAdjustEmployeeId(e.target.value)}
                        className={styles.input}
                        required
                      >
                        <option value="">-- Choose Employee --</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.memberName} ({emp.employeeType || 'N/A'})</option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Select Leave Type *</label>
                      <select
                        value={selectedAdjustLeaveTypeId}
                        onChange={(e) => setSelectedAdjustLeaveTypeId(e.target.value)}
                        className={styles.input}
                        required
                      >
                        <option value="">-- Choose Leave Type --</option>
                        {leaveTypes.map(type => (
                          <option key={type.id} value={type.id}>{type.name} ({type.code})</option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Leave Year *</label>
                      <input
                        type="text"
                        value={adjustYear}
                        onChange={(e) => setAdjustYear(e.target.value)}
                        className={styles.input}
                        required
                      />
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>New Allocated Balance (Days) *</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={adjustForm.allocated}
                        onChange={(e) => setAdjustForm({ ...adjustForm, allocated: e.target.value })}
                        className={styles.input}
                        required
                      />
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>New Carry Forward Balance (Days) *</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={adjustForm.carryForward}
                        onChange={(e) => setAdjustForm({ ...adjustForm, carryForward: e.target.value })}
                        className={styles.input}
                        required
                      />
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Reason for Adjustment *</label>
                      <textarea
                        value={adjustForm.reason}
                        onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                        placeholder="Provide details about why you are manually overriding this employee's balance..."
                        className={styles.input}
                        rows="3"
                        required
                      />
                    </div>

                    <div className={styles.buttonGroup}>
                      <button type="submit" className={`${styles.btn} ${styles.primaryBtn}`} disabled={savingAdjustment}>
                        <Save size={16} /> {savingAdjustment ? 'Saving adjustment...' : 'Save Balance Quota'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Display Current Balance Preview */}
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Current Quotas & Balances</h3>
                  {currentAdjustBalance ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '6px' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Allocated Quota</span>
                          <h4 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '4px' }}>{currentAdjustBalance.allocated} Days</h4>
                        </div>
                        <div style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '6px' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Carry Forward</span>
                          <h4 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '4px' }}>{currentAdjustBalance.carry_forward} Days</h4>
                        </div>
                        <div style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '6px' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Used Balance</span>
                          <h4 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '4px', color: '#ef4444' }}>{currentAdjustBalance.used} Days</h4>
                        </div>
                        <div style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '6px' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pending Count</span>
                          <h4 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '4px', color: '#f59e0b' }}>{currentAdjustBalance.pending} Days</h4>
                        </div>
                      </div>
                      <div style={{ marginTop: '12px', padding: '16px', backgroundColor: 'rgba(39, 214, 138, 0.1)', borderRadius: '8px', border: '1px solid rgba(39, 214, 138, 0.2)' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Net Remaining Available:</span>
                        <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>{currentAdjustBalance.remaining} Days</h3>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      Select an Employee and Leave Type to preview active quotas.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Leave Type"
        message="Are you sure you want to delete this Leave Type? If there are active requests using this type, it will be marked as inactive instead of deleted to protect association history."
      />
    </div>
  );
};

export default LeaveMasterPage;
