import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useToast } from '../../../../shared/components';
import { getTemplates, createTemplate, updateTemplate, deleteTemplate } from '../services/whatsappService';
import styles from './WhatsAppComponents.module.css';
import { Edit2, Trash2, Plus, X } from 'lucide-react';

const WhatsAppTemplates = forwardRef((props, ref) => {
    const [templates, setTemplates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    
    // Form state
    const [name, setName] = useState('');
    const [content, setContent] = useState('');
    
    const addToast = useToast();

    useImperativeHandle(ref, () => ({
        handleOpenModal: (template = null) => handleOpenModal(template)
    }));

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        setIsLoading(true);
        try {
            const response = await getTemplates();
            if (response.status === true) {
                setTemplates(response.data || []);
            }
        } catch (error) {
            addToast({ type: 'error', message: error.messageToShow || "Failed to load templates." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (template = null) => {
        if (template) {
            setEditingTemplate(template);
            setName(template.name);
            setContent(template.content);
        } else {
            setEditingTemplate(null);
            setName('');
            setContent('');
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTemplate(null);
    };

    const handleSave = async () => {
        if (!name.trim() || !content.trim()) {
            addToast({ type: 'error', message: "Name and content are required." });
            return;
        }

        try {
            if (editingTemplate) {
                await updateTemplate(editingTemplate.id, { name, content });
                addToast({ type: 'success', message: "Template updated successfully." });
            } else {
                await createTemplate({ name, content });
                addToast({ type: 'success', message: "Template created successfully." });
            }
            handleCloseModal();
            fetchTemplates();
        } catch (error) {
            addToast({ type: 'error', message: error.messageToShow || "Failed to save template." });
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this template?")) {
            try {
                await deleteTemplate(id);
                addToast({ type: 'success', message: "Template deleted successfully." });
                fetchTemplates();
            } catch (error) {
                addToast({ type: 'error', message: error.messageToShow || "Failed to delete template." });
            }
        }
    };

    const insertVariable = (variable) => {
        setContent((prev) => prev + ` {{${variable}}} `);
    };

    return (
        <div className={styles.cardContainer}>
            <div className={styles.cardHeaderArea}>
                <div className={styles.entriesCount}>
                    Total Templates: {templates.length}
                </div>
            </div>

            {isLoading ? (
                <div className={styles.loadingSpinner}></div>
            ) : templates.length === 0 ? (
                <div className={styles.emptyState}>
                    <p>No templates found. Create one to get started!</p>
                </div>
            ) : (
                <div className={styles.templatesList}>
                    {templates.map((tpl) => (
                        <div key={tpl.id} className={styles.templateRow}>
                            <div className={styles.templateInfo}>
                                <h3 className={styles.templateName}>{tpl.name}</h3>
                                <p className={styles.templatePreview}>
                                    {tpl.content.length > 100 ? `${tpl.content.substring(0, 100)}...` : tpl.content}
                                </p>
                            </div>
                            <div className={styles.templateActions}>
                                <button onClick={() => handleOpenModal(tpl)} className={styles.actionBtn} title="Edit Template">
                                    <Edit2 size={16} />
                                    <span>Edit</span>
                                </button>
                                <button onClick={() => handleDelete(tpl.id)} className={`${styles.actionBtn} ${styles.actionBtnDanger}`} title="Delete Template">
                                    <Trash2 size={16} />
                                    <span>Delete</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h3>{editingTemplate ? 'Edit Template' : 'Create Template'}</h3>
                            <button onClick={handleCloseModal} className={styles.iconBtn}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.formGroup}>
                                <label>Template Name</label>
                                <input 
                                    type="text" 
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)} 
                                    placeholder="e.g., Salary Notification"
                                    className={styles.input}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Message Content</label>
                                <div className={styles.toolbar}>
                                    <span style={{ fontSize: '12px', color: '#666', marginRight: '8px' }}>Variables:</span>
                                    <button className={styles.tagBtn} onClick={() => insertVariable('name')}>
                                        + Employee Name
                                    </button>
                                </div>
                                <textarea 
                                    value={content} 
                                    onChange={(e) => setContent(e.target.value)} 
                                    placeholder="Type your message here..."
                                    className={styles.textarea}
                                    rows={6}
                                />
                                <small className={styles.helpText}>
                                    Use {"{{name}}"} to dynamically insert the employee's full name.
                                </small>
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button onClick={handleCloseModal} className={styles.btnSecondary}>Cancel</button>
                            <button onClick={handleSave} className={styles.btnPrimary}>Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

export default WhatsAppTemplates;
