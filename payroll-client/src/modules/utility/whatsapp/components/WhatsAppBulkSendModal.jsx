import React, { useState, useEffect } from 'react';
import { useToast } from '../../../../shared/components';
import { getTemplates, sendBulkMessage } from '../services/whatsappService';
import styles from './WhatsAppComponents.module.css';
import { Send, Search, X } from 'lucide-react';

const WhatsAppBulkSendModal = ({ employees = [], onClose }) => {
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    
    const addToast = useToast();

    useEffect(() => {
        fetchData();
        // Select all missing employees by default
        setSelectedEmployees(employees.map(emp => emp.id));
    }, [employees]);

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

    const handleSend = async () => {
        if (!selectedTemplate) {
            addToast({ type: 'error', message: "Please select a template." });
            return;
        }

        if (selectedEmployees.length === 0) {
            addToast({ type: 'error', message: "Please select at least one employee." });
            return;
        }

        setIsSending(true);
        try {
            const payload = {
                templateId: selectedTemplate,
                employeeIds: selectedEmployees
            };
            await sendBulkMessage(payload);
            addToast({ type: 'success', message: `WhatsApp messages successfully initiated for ${selectedEmployees.length} employees.` });
            onClose(); // Close the modal upon success
        } catch (error) {
            addToast({ type: 'error', message: error.messageToShow || "Failed to send bulk messages." });
        } finally {
            setIsSending(false);
        }
    };

    // Derived states
    const filteredEmployees = employees.filter(emp => {
        const fullName = (emp.memberName || '').toLowerCase();
        return fullName.includes(searchTerm.toLowerCase()) || 
               (emp.mobile && emp.mobile.includes(searchTerm));
    });

    const activeTemplate = templates.find(t => t.id === selectedTemplate);

    // Mock preview for the first selected employee or a dummy one
    const previewEmployee = selectedEmployees.length > 0 
        ? employees.find(e => e.id === selectedEmployees[0]) 
        : { memberName: "John Doe" };
    
    let previewText = "Select a template to see preview.";
    if (activeTemplate) {
        const fullName = (previewEmployee?.memberName || '').trim();
        previewText = activeTemplate.content.replace(/{{name}}/gi, fullName);
    }

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent} style={{ maxWidth: '800px', width: '95%' }}>
                <div className={styles.modalHeader}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Send size={20} color="#25D366" /> Send WhatsApp Message
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
                                                            <td>{emp.memberName || ''}</td>
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

                            {/* Right side: Preview */}
                            <div>
                                <div className={styles.formGroup}>
                                    <label>Message Preview</label>
                                    <div className={styles.previewBox}>
                                        {activeTemplate ? (
                                            <>
                                                <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '8px' }}>
                                                    Showing preview for: <strong>{previewEmployee?.memberName}</strong>
                                                </p>
                                                <div className={styles.previewBubble}>
                                                    {previewText}
                                                </div>
                                            </>
                                        ) : (
                                            <p style={{ color: '#666', textAlign: 'center', marginTop: '40px' }}>
                                                {previewText}
                                            </p>
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
                        onClick={handleSend} 
                        className={styles.btnPrimary}
                        disabled={isSending || !selectedTemplate || selectedEmployees.length === 0}
                    >
                        {isSending ? 'Sending...' : `Send to ${selectedEmployees.length}`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WhatsAppBulkSendModal;
