import React, { useRef, useState, useEffect } from 'react';
import faceService from '../services/faceService';
import { Camera, CheckCircle2, AlertTriangle, RefreshCw, Sparkles, Smile } from 'lucide-react';
import styles from './EmployeePage.module.css';

const FaceEnroll = ({ employeeId, name, faceDescriptorPath, onDescriptorsCaptured }) => {
  const videoRef = useRef(null);
  const [loadingModels, setLoadingModels] = useState(true);
  const [capturing, setCapturing] = useState(false);
  const [count, setCount] = useState(0);
  const descriptorsRef = useRef([]);
  const [enrollmentStatus, setEnrollmentStatus] = useState('');
  const [enrollmentError, setEnrollmentError] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isFaceRegistered, setIsFaceRegistered] = useState(!!faceDescriptorPath);

  useEffect(() => {
    // Only load models if camera is activated or face needs registration
    if (isCameraActive) {
      const load = async () => {
        setLoadingModels(true);
        setEnrollmentError('');
        try {
          await faceService.loadModels();
          setLoadingModels(false);
          await startCamera();
        } catch (e) {
          setEnrollmentError('Failed to load face-api models: ' + e.message);
          setLoadingModels(false);
          setIsCameraActive(false);
        }
      };
      load();
    }
    return () => stopCamera();
  }, [isCameraActive]);

  const startCamera = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsCameraActive(true);
        }
      } catch (e) {
        setEnrollmentError('Camera access denied: ' + e.message);
        setIsCameraActive(false);
      }
    } else {
      setEnrollmentError('Web camera media devices are not supported in this browser.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    const s = videoRef.current?.srcObject;
    if (s && s.getTracks) {
      s.getTracks().forEach((t) => t.stop());
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const captureOnce = async () => {
    if (!videoRef.current) return { success: false, error: 'Camera is not ready.' };
    try {
      const result = await faceService.detectFaceDescriptor(videoRef.current);
      if (result) {
        descriptorsRef.current.push(result);
        setCount(descriptorsRef.current.length);
        return { success: true };
      }
    } catch (e) {
      console.error('Individual capture trial error:', e);
      return { success: false, error: e.message || 'Face detection failed.' };
    }
    return { success: false, error: 'No face detected.' };
  };

  const captureMany = async (target = 12) => {
    setCapturing(true);
    setEnrollmentStatus(`Positioning face...`);
    setEnrollmentError('');
    descriptorsRef.current = [];
    setCount(0);

    let attempts = 0;
    // Capture up to 12 descriptors
    while (descriptorsRef.current.length < target && attempts < target * 8) {
      setEnrollmentStatus(`Scanning face... Capture ${descriptorsRef.current.length + 1}/${target}`);
      await new Promise((r) => setTimeout(r, 600)); // Delay for different angles
      try {
        const res = await captureOnce();
        if (!res.success) {
          setEnrollmentStatus(`Scanning face... Capture ${descriptorsRef.current.length + 1}/${target} (${res.error})`);
        }
      } catch (e) {
        console.error('Capture frame exception:', e);
      }
      attempts++;
    }

    setCapturing(false);
    stopCamera();

    if (descriptorsRef.current.length >= target) {
      setEnrollmentStatus('✓ 12 Face snapshots captured successfully!');
      // Pass the descriptors to parent form state
      onDescriptorsCaptured(descriptorsRef.current);
      setIsCameraActive(false);
    } else {
      setEnrollmentError('Unable to scan 12 clear face samples. Please ensure good lighting and try again.');
      // Restart camera for retry
      startCamera();
    }
  };

  const handleStartScanning = () => {
    setIsCameraActive(true);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <Smile size={24} style={{ color: 'var(--primary)' }} />
        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>Face Biometric Registration</h3>
      </div>

      {!isCameraActive ? (
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '24px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          {isFaceRegistered ? (
            <>
              <CheckCircle2 size={48} style={{ color: 'var(--primary)' }} />
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontWeight: '600', color: 'var(--text-primary)' }}>Face Enrolled</h4>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  This employee has active face biometrics registered in the database.
                </p>
              </div>
              <button
                type="button"
                className={styles.addBtn}
                onClick={handleStartScanning}
                style={{ marginTop: '8px' }}
              >
                <RefreshCw size={16} /> Re-Register Face
              </button>
            </>
          ) : (
            <>
              <Camera size={48} style={{ color: 'var(--text-muted)' }} />
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontWeight: '600', color: 'var(--text-primary)' }}>Face Not Enrolled</h4>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Register employee's face for face-recognition attendance clocking.
                </p>
              </div>
              <button
                type="button"
                className={styles.addBtn}
                onClick={handleStartScanning}
                style={{ marginTop: '8px' }}
              >
                <Sparkles size={16} /> Start Scanning Face
              </button>
            </>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {loadingModels ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px',
              gap: '12px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              color: 'var(--primary)'
            }}>
              <RefreshCw className={styles.spin} size={24} style={{ animation: 'spin 1.5s linear infinite' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                Loading facial detection & landmarks neural models...
              </span>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              padding: '20px'
            }}>
              {/* Webcam viewport wrapper */}
              <div style={{
                position: 'relative',
                width: '320px',
                height: '240px',
                borderRadius: '12px',
                overflow: 'hidden',
                backgroundColor: '#000',
                border: '3px solid var(--primary)',
                boxShadow: '0 8px 24px rgba(39, 214, 138, 0.15)'
              }}>
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  width={320}
                  height={240}
                  style={{ objectFit: 'cover', transform: 'scaleX(-1)' }}
                />
                {capturing && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '2px',
                    backgroundColor: 'var(--primary)',
                    boxShadow: '0 0 8px var(--primary)',
                    animation: 'scanLine 1.5s ease-in-out infinite'
                  }} />
                )}
              </div>

              {/* Progress and scanning actions */}
              <div style={{ width: '100%', maxWidth: '320px', margin: '20px 0 10px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>
                  <span>Scanning Progress:</span>
                  <span>{count} / 12 Samples</span>
                </div>
                <div style={{ height: '8px', backgroundColor: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      height: '100%', 
                      backgroundColor: 'var(--primary)', 
                      width: `${(count / 12) * 100}%`,
                      transition: 'width 0.3s ease' 
                    }} 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '320px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => captureMany(12)}
                  disabled={capturing}
                  className={styles.saveBtn}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  {capturing ? `Scanning (${count}/12)...` : 'Start Scanning'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setIsCameraActive(false);
                  }}
                  disabled={capturing}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {enrollmentStatus && (
        <div style={{
          marginTop: '16px',
          padding: '12px 16px',
          backgroundColor: 'rgba(39, 214, 138, 0.1)',
          color: 'var(--primary)',
          borderRadius: '8px',
          border: '1px solid rgba(39, 214, 138, 0.2)',
          fontSize: '0.875rem',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={16} />
          {enrollmentStatus}
        </div>
      )}

      {enrollmentError && (
        <div style={{
          marginTop: '16px',
          padding: '12px 16px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          color: 'var(--danger)',
          borderRadius: '8px',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          fontSize: '0.875rem',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertTriangle size={16} />
          {enrollmentError}
        </div>
      )}

      {/* Guidelines Card */}
      <div style={{
        marginTop: '20px',
        padding: '16px',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '10px',
        border: '1px solid var(--border)',
        fontSize: '0.8rem',
        color: 'var(--text-secondary)'
      }}>
        <strong style={{ display: 'block', marginBottom: '6px', color: 'var(--text-primary)' }}>
          💡 Instructions for optimal face scanning:
        </strong>
        <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <li>Position the face directly in front of the web camera lens.</li>
          <li>Avoid dark rooms or bright backlight (ensure clear front-facing light).</li>
          <li>Slowly tilt your chin slightly up, down, and sideways during scanning to capture different angles.</li>
        </ul>
      </div>

      {/* Embedded Scan Line Keyframe Keyframes */}
      <style>{`
        @keyframes scanLine {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
      `}</style>
    </div>
  );
};

export default FaceEnroll;
