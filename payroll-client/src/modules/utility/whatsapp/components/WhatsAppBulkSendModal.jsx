import React, { useState, useEffect } from 'react';
import { useToast } from '../../../../shared/components';
import { getTemplates, sendBulkMessage, createTemplate } from '../services/whatsappService';
import styles from './WhatsAppComponents.module.css';
import { Send, Search, X } from 'lucide-react';

const WhatsAppBulkSendModal = ({ employees = [], recipientType = 'employee', onClose }) => {
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [customMessage, setCustomMessage] = useState('');
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [showSavePrompt, setShowSavePrompt] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');

    // Filters
    const [statusFilter, setStatusFilter] = useState('ACTIVE');
    const [typeFilter, setTypeFilter] = useState('ALL');

    const addToast = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch templates
            const tplRes = await getTemplates();
            if (tplRes.status === true) {
                setTemplates(tplRes.data || []);
            }
        } catch (error) {
            addToast({ type: 'error', message: "Failed to load templates." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = filteredEmployees.map(emp => emp.id);
            setSelectedEmployees(allIds);
        } else {
            setSelectedEmployees([]);
        }
    };

    const handleSelectEmployee = (id) => {
        setSelectedEmployees(prev => {
            if (prev.includes(id)) {
                return prev.filter(empId => empId !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    const executeSend = async (skipSave = false) => {
        if (selectedEmployees.length === 0) {
            addToast({ type: 'error', message: "Please select at least one employee." });
            return;
        }

        setIsSending(true);
        try {
            if (!skipSave && newTemplateName.trim()) {
                await createTemplate({ name: newTemplateName.trim(), content: customMessage.trim() });
                addToast({ type: 'success', message: "Template saved successfully." });
            }
        } catch (error) {
            addToast({ type: 'error', message: error.messageToShow || "Failed to save template. Proceeding to send messages." });
        }

        try {
            const payload = {
                templateId: selectedTemplate,
                customMessage: customMessage.trim(),
                employeeIds: selectedEmployees,
                recipientType: recipientType
            };
            await sendBulkMessage(payload);
            addToast({ type: 'success', message: `WhatsApp messages successfully initiated for ${selectedEmployees.length} employees.` });
            onClose(); // Close the modal upon success
        } catch (error) {
            addToast({ type: 'error', message: error.messageToShow || "Failed to send bulk messages." });
        } finally {
            setIsSending(false);
            setShowSavePrompt(false);
        }
    };

    const handleSendClick = () => {
        if (!customMessage.trim()) {
            addToast({ type: 'error', message: "Please enter a message or select a template." });
            return;
        }

        // Determine if message is manual or edited
        let isEdited = false;
        if (!selectedTemplate) {
            isEdited = true;
        } else {
            const activeTpl = templates.find(t => t.id === selectedTemplate);
            if (activeTpl && activeTpl.content.trim() !== customMessage.trim()) {
                isEdited = true;
            }
        }

        if (isEdited) {
            setNewTemplateName('');
            setShowSavePrompt(true);
        } else {
            executeSend(true);
        }
    };

    // Derived states
    const baseFilteredEmployees = React.useMemo(() => {
        return employees.filter(emp => {
            // Must have a mobile number
            if (!emp.mobile || String(emp.mobile).trim() === '') {
                return false;
            }

            // Status filter
            if (statusFilter !== 'ALL') {
                const isActive = emp.status === true || String(emp.status).toLowerCase() === 'active' || String(emp.status) === '1';
                if (statusFilter === 'ACTIVE' && !isActive) return false;
                if (statusFilter === 'INACTIVE' && isActive) return false;
            }

            // Employee Type Filter
            if (typeFilter !== 'ALL') {
                if (emp.employeeType && String(emp.employeeType).toUpperCase() !== typeFilter) {
                    return false;
                } else if (!emp.employeeType) {
                    return false; // hide if they don't have a type but we filter by type
                }
            }

            return true;
        });
    }, [employees, statusFilter, typeFilter]);

    useEffect(() => {
        setSelectedEmployees(baseFilteredEmployees.map(emp => emp.id));
    }, [baseFilteredEmployees]);

    const filteredEmployees = baseFilteredEmployees.filter(emp => {
        const fullName = (emp.memberName || emp.name || '').toLowerCase();
        return fullName.includes(searchTerm.toLowerCase()) ||
            (emp.mobile && String(emp.mobile).includes(searchTerm));
    });

    useEffect(() => {
        const activeTemplate = templates.find(t => t.id === selectedTemplate);
        if (activeTemplate) {
            setCustomMessage(activeTemplate.content);
        } else if (selectedTemplate === '') {
            // Keep customMessage as is or clear it? Better to just let them type if it's empty, 
            // but if they explicitly select "-- Select Template --" we might want to keep what they typed or clear it.
            // Let's not clear it so they don't lose work if they misclick.
        }
    }, [selectedTemplate, templates]);

    // Mock preview for the first selected employee or a dummy one
    const previewEmployee = selectedEmployees.length > 0
        ? employees.find(e => e.id === selectedEmployees[0])
        : { memberName: "John Doe" };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent} style={{ maxWidth: '800px', width: '95%' }}>
                <div className={styles.modalHeader}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img src="/wa-whatsapp-icon.png" width={20} height={20} alt="WhatsApp" /> Send WhatsApp Message
                    </h3>
                    <button onClick={onClose} className={styles.iconBtn}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    {isLoading ? (
                        <div className={styles.loadingSpinner}></div>
                    ) : (
                        <div className={styles.twoColumn}>
                            {/* Left side: Selections */}
                            <div>
                                <div className={styles.formGroup}>
                                    <label>1. Select Template</label>
                                    <select
                                        className={styles.select}
                                        value={selectedTemplate}
                                        onChange={(e) => setSelectedTemplate(e.target.value)}
                                    >
                                        <option value="">-- Select Template --</option>
                                        {templates.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className={styles.formGroup} style={{ marginTop: '20px' }}>
                                    <label>2. Select Employees ({selectedEmployees.length} selected)</label>
                                    <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '-5px', marginBottom: '10px' }}>
                                        * This Feature only supports with phone numbers
                                    </p>

                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', outline: 'none' }}
                                        >
                                            <option value="ALL">All Status</option>
                                            <option value="ACTIVE">Active</option>
                                            <option value="INACTIVE">Inactive</option>
                                        </select>
                                        {employees.some(e => e.employeeType) && (
                                            <select
                                                value={typeFilter}
                                                onChange={(e) => setTypeFilter(e.target.value)}
                                                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', outline: 'none' }}
                                            >
                                                <option value="ALL">All Types</option>
                                                <option value="BIDI MAKER">Bidi Maker</option>
                                                <option value="BIDI PACKER">Bidi Packer</option>
                                                <option value="OFFICE STAFF">Office Staff</option>
                                            </select>
                                        )}
                                    </div>

                                    <div className={styles.toolbar}>
                                        <Search size={16} color="#666" />
                                        <input
                                            type="text"
                                            placeholder="Search by name or number..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none' }}
                                        />
                                    </div>

                                    <div className={styles.tableContainer} style={{ maxHeight: '250px' }}>
                                        <table className={styles.table}>
                                            <thead>
                                                <tr>
                                                    <th>
                                                        <input
                                                            type="checkbox"
                                                            className={styles.checkbox}
                                                            onChange={handleSelectAll}
                                                            checked={filteredEmployees.length > 0 && selectedEmployees.length === filteredEmployees.length}
                                                        />
                                                    </th>
                                                    <th>Name</th>
                                                    <th>Phone</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredEmployees.length > 0 ? (
                                                    filteredEmployees.map(emp => (
                                                        <tr key={emp.id} className={selectedEmployees.includes(emp.id) ? styles.selected : ''}>
                                                            <td>
                                                                <input
                                                                    type="checkbox"
                                                                    className={styles.checkbox}
                                                                    checked={selectedEmployees.includes(emp.id)}
                                                                    onChange={() => handleSelectEmployee(emp.id)}
                                                                />
                                                            </td>
                                                            <td>{emp.memberName || emp.name || ''}</td>
                                                            <td>{emp.mobile || 'N/A'}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="3" style={{ textAlign: 'center' }}>No employees found</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Right side: Message Editor / Preview */}
                            <div>
                                <div className={styles.formGroup}>
                                    <label>Message Content</label>
                                    <div className={styles.previewBox} style={{ padding: '15px' }}>
                                        <textarea
                                            value={customMessage}
                                            onChange={(e) => setCustomMessage(e.target.value)}
                                            placeholder="Type your message here or select a template..."
                                            rows={6}
                                            style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px', resize: 'vertical', fontFamily: 'inherit' }}
                                        />
                                        {customMessage && (
                                            <div style={{ marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                                                <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '8px' }}>
                                                    Preview for: <strong>{previewEmployee?.memberName}</strong>
                                                </p>
                                                <div className={styles.previewBubble} style={{ opacity: 0.9 }}>
                                                    {customMessage.replace(/{{name}}/gi, (previewEmployee?.memberName || '').trim())}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className={styles.modalFooter}>
                    <button onClick={onClose} className={styles.btnSecondary} disabled={isSending}>Cancel</button>
                    <button
                        onClick={handleSendClick}
                        className={styles.btnPrimary}
                        disabled={isSending || !customMessage.trim() || selectedEmployees.length === 0}
                    >
                        {isSending ? 'Sending...' : `Send to ${selectedEmployees.length}`}
                    </button>
                </div>
            </div>

            {showSavePrompt && (
                <div className={styles.modalOverlay} style={{ zIndex: 1000, background: 'rgba(0,0,0,0.6)' }}>
                    <div className={styles.modalContent} style={{ maxWidth: '500px', width: '90%' }}>
                        <div className={styles.modalHeader}>
                            <h3>Save as Template</h3>
                            <button onClick={() => setShowSavePrompt(false)} className={styles.iconBtn} disabled={isSending}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <p style={{ marginBottom: '15px', color: 'var(--text-color)', lineHeight: '1.5' }}>
                                You have entered a custom message. Do you want to save it as a new template for future use?
                            </p>
                            <div className={styles.formGroup}>
                                <label>Template Name</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={newTemplateName}
                                    onChange={(e) => setNewTemplateName(e.target.value)}
                                    placeholder="Enter template name..."
                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' }}
                                    autoFocus
                                    disabled={isSending}
                                />
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button onClick={() => executeSend(true)} className={styles.btnSecondary} disabled={isSending}>
                                Skip & Send
                            </button>
                            <button
                                onClick={() => executeSend(false)}
                                className={styles.btnPrimary}
                                disabled={isSending || !newTemplateName.trim()}
                            >
                                {isSending ? 'Saving...' : 'Save & Send'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WhatsAppBulkSendModal;
