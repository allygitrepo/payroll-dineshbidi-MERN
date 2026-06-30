import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, QrCode, LogOut, CheckCircle2, Phone, User, AlertTriangle } from 'lucide-react';
import { useToast } from '../../../../shared/components';
import styles from './WhatsAppGatewayPage.module.css';
import { initiateWhatsApp, getWhatsAppStatus, disconnectWhatsApp } from '../services/whatsappService';

const WhatsAppGatewayPage = () => {
    const [status, setStatus] = useState('loading'); // loading, unlinked, qr_ready, connected
    const [qrCode, setQrCode] = useState(null);
    const [expiresIn, setExpiresIn] = useState(0);
    const [profile, setProfile] = useState(null);
    const [isActionLoading, setIsActionLoading] = useState(false);
    
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
            console.log("handleInitiate Response:", response);
            
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

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>WhatsApp Gateway</h1>
                <p className={styles.subtitle}>Link your company's WhatsApp to send automated notifications.</p>
            </div>

            <div className={styles.card}>
                {status === 'loading' && (
                    <div className={styles.loadingSpinner}></div>
                )}

                {status === 'unlinked' && (
                    <>
                        <div className={styles.iconWrapper}>
                            <MessageCircle size={40} />
                        </div>
                        <h2 className={styles.statusUnlinked}>Not Connected</h2>
                        <p className={styles.subtitle} style={{ marginBottom: '2rem' }}>
                            Connect your WhatsApp to start sending salary slips, leave updates, and more directly to your employees.
                        </p>
                        <button 
                            className={styles.btnPrimary} 
                            onClick={handleInitiate}
                            disabled={isActionLoading}
                        >
                            {isActionLoading ? 'Loading...' : 'Link WhatsApp'}
                            <QrCode size={20} />
                        </button>
                    </>
                )}

                {status === 'qr_ready' && (
                    <div className={styles.qrContainer}>
                        <h2 className={styles.title} style={{ fontSize: '1.4rem' }}>Scan QR Code</h2>
                        <p className={styles.subtitle}>Open WhatsApp on your phone &gt; Linked Devices &gt; Link a Device</p>
                        
                        <div className={styles.qrBox}>
                            {qrCode ? (
                                <img src={qrCode} alt="WhatsApp QR Code" className={styles.qrImage} />
                            ) : (
                                <div className={styles.loadingSpinner}></div>
                            )}
                        </div>

                        <div className={styles.timerContainer}>
                            <span className={styles.timerText}>{expiresIn}s</span>
                            <span className={styles.timerLabel}>QR Code expires in</span>
                        </div>
                    </div>
                )}

                {status === 'connected' && profile && (
                    <div className={styles.profileContainer}>
                        <div style={{ position: 'relative' }}>
                            {profile.profileImage ? (
                                <img src={profile.profileImage} alt="Profile" className={styles.profileImage} />
                            ) : (
                                <div className={styles.iconWrapper} style={{ width: '120px', height: '120px', margin: 0 }}>
                                    <User size={50} />
                                </div>
                            )}
                            <div style={{
                                position: 'absolute', bottom: '5px', right: '5px',
                                background: '#fff', borderRadius: '50%', padding: '2px'
                            }}>
                                <CheckCircle2 size={24} color="#25D366" />
                            </div>
                        </div>

                        <div>
                            <h2 className={styles.profileName}>{profile.name || "WhatsApp User"}</h2>
                            <span className={styles.connectedBadge}>Active Session</span>
                        </div>

                        {profile.phone && (
                            <div className={styles.profilePhone}>
                                <Phone size={18} />
                                {profile.phone}
                            </div>
                        )}

                        <button 
                            className={styles.btnDanger} 
                            onClick={handleDisconnect}
                            disabled={isActionLoading}
                        >
                            <LogOut size={18} style={{ marginRight: '8px' }}/>
                            {isActionLoading ? 'Disconnecting...' : 'Disconnect WhatsApp'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WhatsAppGatewayPage;
