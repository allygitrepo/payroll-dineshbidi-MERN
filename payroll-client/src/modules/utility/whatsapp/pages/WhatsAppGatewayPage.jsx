import React, { useState, useEffect, useRef } from 'react';
import { QrCode, LogOut, CheckCircle2, Phone, User, AlertTriangle } from 'lucide-react';
import { useToast } from '../../../../shared/components';
import styles from './WhatsAppGatewayPage.module.css';
import { initiateWhatsApp, getWhatsAppStatus, disconnectWhatsApp } from '../services/whatsappService';
import WhatsAppTemplates from '../components/WhatsAppTemplates';

const WhatsAppIcon = ({ size = 24 }) => (
  <img src="/wa-whatsapp-icon.png" width={size} height={size} alt="WhatsApp" />
);

const WhatsAppGatewayPage = () => {
    const [status, setStatus] = useState('loading'); // loading, unlinked, qr_ready, connected
    const [qrCode, setQrCode] = useState(null);
    const [expiresIn, setExpiresIn] = useState(0);
    const [profile, setProfile] = useState(null);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
    
    const templatesRef = useRef(null);
    
    const addToast = useToast();

    // Refs for timer management
    const timerRef = useRef(null);
    const pollingRef = useRef(null);

    // Fetch initial status
    useEffect(() => {
        checkStatus(true);
        return () => {
            clearTimers();
        };
    }, []);

    const clearTimers = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (pollingRef.current) clearInterval(pollingRef.current);
    };

    const checkStatus = async (isInitial = false) => {
        try {
            const response = await getWhatsAppStatus();
            
            if (response.status === true && response.data?.status === 'connected') {
                setStatus('connected');
                setProfile({
                    name: response.data.name,
                    phone: response.data.phone,
                    profileImage: response.data.profileImage || null
                });
                clearTimers();
            } else if (isInitial) {
                setStatus('unlinked');
            }
        } catch (error) {
            if (isInitial) setStatus('unlinked');
        }
    };

    const handleInitiate = async () => {
        setIsActionLoading(true);
        clearTimers();
        
        try {
            const response = await initiateWhatsApp();
            
            // Handle both response.status and response.success depending on API wrapper
            const isSuccess = response && (response.status === true || response.success === true);
            
            if (isSuccess && response.data) {
                const data = response.data;
                if (data.status === 'connected') {
                    setStatus('connected');
                    setProfile({
                        name: data.name,
                        phone: data.phone,
                        profileImage: data.profileImage || null
                    });
                } else if (data.status === 'qr_ready') {
                    setStatus('qr_ready');
                    setQrCode(data.qr);
                    setExpiresIn(data.validInSeconds || 40);
                    
                    // Start countdown
                    timerRef.current = setInterval(() => {
                        setExpiresIn((prev) => {
                            if (prev <= 1) {
                                clearInterval(timerRef.current);
                                // Refresh QR automatically when it hits 0
                                handleInitiate();
                                return 0;
                            }
                            return prev - 1;
                        });
                    }, 1000);

                    // Start polling for connection success every 5 seconds
                    pollingRef.current = setInterval(() => {
                        checkStatus();
                    }, 5000);
                } else {
                    addToast({ type: 'error', message: `Unexpected status: ${data.status}` });
                    setStatus('unlinked');
                }
            } else {
                addToast({ type: 'error', message: "Failed to load QR Code." });
                setStatus('unlinked');
            }
        } catch (error) {
            console.error("handleInitiate Error:", error);
            addToast({ type: 'error', message: error.messageToShow || "Failed to connect to WhatsApp service." });
            setStatus('unlinked');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleDisconnect = async () => {
        setIsActionLoading(true);
        try {
            await disconnectWhatsApp();
            addToast({ type: 'success', message: "WhatsApp disconnected successfully." });
            setStatus('unlinked');
            setQrCode(null);
            setProfile(null);
            clearTimers();
        } catch (error) {
            addToast({ type: 'error', message: error.messageToShow || "Failed to disconnect." });
        } finally {
            setIsActionLoading(false);
        }
    };

    const renderConnectionContent = () => (
        <div className={styles.card}>
            {status === 'loading' && (
                <div className={styles.loadingSpinner}></div>
            )}

            {status === 'unlinked' && (
                <div className={styles.actionState}>
                    <div className={styles.iconWrapper}>
                        <WhatsAppIcon size={40} />
                    </div>
                    <h3 className={styles.statusTitle}>Not Connected</h3>
                    <p className={styles.statusDesc}>
                        Link your WhatsApp account to enable messaging capabilities.
                    </p>
                    <button 
                        className={styles.btnPrimary} 
                        onClick={handleInitiate}
                        disabled={isActionLoading}
                    >
                        {isActionLoading ? 'Preparing...' : 'Link WhatsApp'}
                        <QrCode size={20} />
                    </button>
                </div>
            )}

            {status === 'qr_ready' && (
                <div className={styles.qrContainer}>
                    <h3 className={styles.statusTitle}>Scan QR Code</h3>
                    <p className={styles.statusDesc}>Open WhatsApp &gt; Linked Devices &gt; Link a Device</p>
                    
                    <div className={styles.qrBox}>
                        {qrCode ? (
                            <img src={qrCode} alt="WhatsApp QR Code" className={styles.qrImage} />
                        ) : (
                            <div className={styles.loadingSpinner}></div>
                        )}
                    </div>

                    <div className={styles.timerContainer}>
                        <span className={styles.timerText}>{expiresIn}s</span>
                        <span className={styles.timerLabel}>Expires in</span>
                    </div>
                </div>
            )}

            {status === 'connected' && profile && (
                <div className={styles.profileContainer}>
                    <div className={styles.profileAvatarWrapper}>
                        {profile.profileImage ? (
                            <img src={profile.profileImage} alt="Profile" className={styles.profileImage} />
                        ) : (
                            <div className={styles.iconWrapper} style={{ width: '90px', height: '90px', margin: 0 }}>
                                <User size={40} />
                            </div>
                        )}
                        <div className={styles.statusIndicator}>
                            <CheckCircle2 size={20} color="#fff" fill="#25D366" />
                        </div>
                    </div>

                    <div className={styles.profileDetails}>
                        <h2 className={styles.profileName}>{profile.name || "WhatsApp User"}</h2>
                        <span className={styles.connectedBadge}>Session Active</span>
                    </div>

                    {profile.phone && (
                        <div className={styles.profilePhone}>
                            <Phone size={16} />
                            {profile.phone}
                        </div>
                    )}

                    <button 
                        className={styles.btnDanger} 
                        onClick={handleDisconnect}
                        disabled={isActionLoading}
                    >
                        {isActionLoading ? 'Disconnecting...' : 'Disconnect WhatsApp'}
                        <LogOut size={18} />
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <div className={styles.container}>
            <div className={styles.pageHeaderSection}>
                <h1 className={styles.pageTitle}>WhatsApp Gateway</h1>
                <div className={styles.headerActionsGroup}>
                    <button 
                        className={styles.statusBadgeBtn} 
                        onClick={() => setIsConnectionModalOpen(true)}
                    >
                        {status === 'connected' ? (
                            <><span className={styles.statusDotActive}></span> Connected</>
                        ) : (
                            <><span className={styles.statusDotInactive}></span> Not Connected</>
                        )}
                    </button>
                    {status === 'connected' && (
                        <button 
                            className={styles.btnPrimaryTop} 
                            onClick={() => templatesRef.current?.handleOpenModal()}
                        >
                            + New Template
                        </button>
                    )}
                </div>
            </div>

            <WhatsAppTemplates ref={templatesRef} />

            {isConnectionModalOpen && (
                <div className={styles.modalOverlay} onClick={() => setIsConnectionModalOpen(false)}>
                    <div className={styles.modalContentWrapper} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>WhatsApp Connection</h3>
                            <button className={styles.closeBtn} onClick={() => setIsConnectionModalOpen(false)}>
                                ×
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            {renderConnectionContent()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WhatsAppGatewayPage;
