import React, { useRef, useState, useEffect } from 'react';
import faceService from '../services/faceService';

/**
 * FaceEnroll component
 * Captures 12 facial snapshots to establish a stable mean face descriptor in the database.
 * 
 * @param {Object} props
 * @param {string|number} props.employeeId - Target employee identifier
 * @param {string} props.name - Name of target employee (used for storage cataloging)
 * @param {Function} props.onComplete - Callback when enrollment successfully completes
 */
const FaceEnroll = ({ employeeId, name, onComplete }) => {
  const videoRef = useRef(null);
  const [loadingModels, setLoadingModels] = useState(true);
  const [capturing, setCapturing] = useState(false);
  const [count, setCount] = useState(0);
  const descriptorsRef = useRef([]);
  const [enrollmentStatus, setEnrollmentStatus] = useState('');
  const [enrollmentError, setEnrollmentError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        await faceService.loadModels();
        setLoadingModels(false);
        startCamera();
      } catch (e) {
        setEnrollmentError('Failed to load face models: ' + e.message);
        setLoadingModels(false);
      }
    };
    load();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240 },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (e) {
        setEnrollmentError('Camera access denied: ' + e.message);
      }
    } else {
      setEnrollmentError('Media capture devices not supported in this browser.');
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
    if (!videoRef.current) return false;
    try {
      const result = await faceService.detectFaceDescriptor(videoRef.current);
      if (result) {
        descriptorsRef.current.push(result);
        setCount(descriptorsRef.current.length);
        return true;
      }
    } catch (e) {
      console.error('Individual capture trial error:', e);
    }
    return false;
  };

  const captureMany = async (target = 12) => {
    setCapturing(true);
    setEnrollmentStatus(`Starting capture sequence...`);
    setEnrollmentError('');
    descriptorsRef.current = [];
    setCount(0);

    let attempts = 0;
    // Capture up to target number of descriptors, giving up after a reasonable number of frames
    while (descriptorsRef.current.length < target && attempts < target * 8) {
      await new Promise((r) => setTimeout(r, 600)); // Delay to allow user to vary face angles/expressions
      try {
        await captureOnce();
      } catch (e) {
        console.error('Capture frame exception:', e);
      }
      attempts++;
    }

    setCapturing(false);
    stopCamera();

    if (descriptorsRef.current.length >= 1) {
      setEnrollmentStatus(`Captured ${descriptorsRef.current.length}/${target} descriptors. Saving profile...`);
      try {
        await faceService.enroll(employeeId, name, descriptorsRef.current);
        setEnrollmentStatus('✓ Face enrollment completed successfully!');
        if (onComplete) {
          setTimeout(() => onComplete(), 1000);
        }
      } catch (e) {
        setEnrollmentError('Enrollment request failed: ' + (e?.response?.data?.message || e.message));
        startCamera(); // Restart camera in case they want to retry
      }
    } else {
      setEnrollmentError('Unable to detect faces. Reposition, check lighting, and try again.');
      startCamera();
    }
  };

  return (
    <div className="face-enroll" style={{ maxWidth: '360px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h3 style={{ margin: '10px 0 5px 0' }}>Face Enrollment</h3>
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
        Capture multiple camera snapshots to save your facial bio-descriptor.
      </p>
      
      {loadingModels ? (
        <div style={{ padding: '20px 0', textAlign: 'center', color: '#667eea' }}>
          Loading neural models (tinyFaceDetector, landmarks)...
        </div>
      ) : (
        <>
          <div style={{ position: 'relative', width: '320px', height: '240px', margin: '0 auto', backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden' }}>
            <video
              ref={videoRef}
              autoPlay
              muted
              width={320}
              height={240}
              style={{ objectFit: 'cover' }}
            />
          </div>
          
          {/* Progress Bar & Counter */}
          <div style={{ margin: '15px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
              <span>Capture Progress:</span>
              <strong>{count} / 12 Samples</strong>
            </div>
            <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', 
                  backgroundColor: '#4299e1', 
                  width: `${(count / 12) * 100}%`,
                  transition: 'width 0.3s ease' 
                }} 
              />
            </div>
          </div>

          <div>
            <button
              onClick={() => captureMany(12)}
              disabled={capturing}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: capturing ? '#a0aec0' : '#3182ce',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: capturing ? 'not-allowed' : 'pointer',
                fontWeight: '600'
              }}
            >
              {capturing ? `Capturing... (${count}/12)` : 'Start Scanning Face (12 Images)'}
            </button>
          </div>
          
          {enrollmentStatus && (
            <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#c6f6d5', color: '#22543d', borderRadius: '6px', border: '1px solid #c6f6d5', fontSize: '13px' }}>
              {enrollmentStatus}
            </div>
          )}
          
          {enrollmentError && (
            <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#fed7d7', color: '#742a2a', borderRadius: '6px', border: '1px solid #fed7d7', fontSize: '13px' }}>
              {enrollmentError}
            </div>
          )}
          
          <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#f7fafc', borderRadius: '6px', fontSize: '12px', color: '#4a5568', borderLeft: '3px solid #3182ce' }}>
            <strong>💡 Best Capture Rules:</strong>
            <ul style={{ margin: '5px 0 0 0', paddingLeft: '15px' }}>
              <li>Position face directly in front of the lens.</li>
              <li>Ensure good, even lighting (avoid dark backgrounds).</li>
              <li>Slowly tilt and turn your head slightly to capture different angles.</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default FaceEnroll;
