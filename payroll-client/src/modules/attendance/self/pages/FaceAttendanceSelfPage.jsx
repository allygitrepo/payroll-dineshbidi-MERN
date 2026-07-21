import React, { useRef, useState, useEffect } from 'react';
import faceService from '../../../master/employee/services/faceService';
import { clockToggleEmployee } from '../../attendanceService';
import { Camera, CheckCircle2, AlertTriangle, RefreshCw, Sparkles, MapPin, Clock, Compass, HelpCircle, X } from 'lucide-react';
import { useToast } from '../../../../shared/components';
import styles from './FaceAttendanceSelfPage.module.css';

const getPhotoUrl = (photoPath) => {
  if (!photoPath) return null;
  if (photoPath.startsWith('data:image')) return photoPath;

  const apiBase = import.meta.env.VITE_API_BASE_URL || '';
  const cleanBase = apiBase ? apiBase.replace(/\/v1\/?$/, '/') : '';
  return `${cleanBase}${photoPath}`;
};

const FaceAttendanceSelfPage = () => {
  const addToast = useToast();
  const videoRef = useRef(null);
  const [loadingModels, setLoadingModels] = useState(true);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [status, setStatus] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [scannedResult, setScannedResult] = useState(null);
  const [gpsCoords, setGpsCoords] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Bulk Scan States
  const [isBulkActive, setIsBulkActive] = useState(false);
  const [bulkLog, setBulkLog] = useState([]);
  const isBulkActiveRef = useRef(false);
  const streamRef = useRef(null);

  // Remount helper for video element when toggled by scannedResult
  useEffect(() => {
    if (videoRef.current && streamRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [scannedResult, isCameraActive]);

  useEffect(() => {
    // Load face-api models on page mount
    const load = async () => {
      try {
        await faceService.loadModels();
        setLoadingModels(false);
      } catch (err) {
        console.error(err);
        setErrorMsg('Failed to load face recognition neural models: ' + err.message);
        setLoadingModels(false);
      }
    };
    load();
    return () => {
      isBulkActiveRef.current = false;
      stopCamera();
    };
  }, []);

  const getGeoLocation = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve('Geolocation not supported by browser');
        return;
      }

      const optionsHigh = { enableHighAccuracy: true, timeout: 4000, maximumAge: 0 };
      const optionsLow = { enableHighAccuracy: false, timeout: 6000, maximumAge: 10000 };

      // Helper to fetch IP-based location as last resort
      const ipFallback = async () => {
        try {
          const res = await fetch('https://ipapi.co/json/');
          if (res.ok) {
            const data = await res.json();
            if (data.latitude && data.longitude) {
              return `${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)} (IP Geolocation)`;
            }
          }
        } catch (e) {
          console.warn('IP fallback failed:', e);
        }
        return null;
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(6);
          const lng = position.coords.longitude.toFixed(6);
          resolve(`${lat}, ${lng}`);
        },
        (err) => {
          console.warn('High accuracy geolocation failed, trying low accuracy...', err.message);
          // Try low accuracy
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const lat = pos.coords.latitude.toFixed(6);
              const lng = pos.coords.longitude.toFixed(6);
              resolve(`${lat}, ${lng}`);
            },
            async (err2) => {
              console.warn('Low accuracy geolocation failed, trying IP fallback...', err2.message);
              const ipLoc = await ipFallback();
              if (ipLoc) {
                resolve(ipLoc);
              } else {
                let errType = 'Error';
                if (err2.code === 1) errType = 'Permission Denied';
                else if (err2.code === 2) errType = 'Position Unavailable';
                else if (err2.code === 3) errType = 'Timeout';
                resolve(`Unknown Location (${errType}: ${err2.message})`);
              }
            },
            optionsLow
          );
        },
        optionsHigh
      );
    });
  };

  const startCamera = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 400, height: 300, facingMode: 'user' },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsCameraActive(true);
        }
      } catch (e) {
        setErrorMsg('Camera access denied: ' + e.message);
        setIsCameraActive(false);
      }
    } else {
      setErrorMsg('Media devices not supported in this browser.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    const s = streamRef.current || videoRef.current?.srcObject;
    if (s && s.getTracks) {
      s.getTracks().forEach((t) => t.stop());
    }
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return null;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 400;
      canvas.height = videoRef.current.videoHeight || 300;
      const ctx = canvas.getContext('2d');
      // Mirror snapshot to match standard camera view
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.85);
    } catch (e) {
      console.warn('Failed to take snapshot:', e);
      return null;
    }
  };

  const handleAction = async () => {
    setScannedResult(null);
    setStatus('Initializing camera...');
    setErrorMsg('');
    setGpsCoords('');
    await startCamera();

    // Auto-trigger scanning loop
    setTimeout(() => {
      triggerScan();
    }, 1500);
  };

  const triggerScan = async () => {
    if (!videoRef.current) return;
    setIsProcessing(true);
    setStatus('Scanning face & acquiring GPS...');

    // Acquire GPS location simultaneously
    const locationPromise = getGeoLocation();

    let faceDescriptor = null;
    let photoData = null;
    let attempts = 0;
    let multipleFacesDetected = false;

    // Try to detect a face in 10 frames
    while (attempts < 10) {
      try {
        const allDescriptors = await faceService.detectAllFaceDescriptors(videoRef.current);
        if (allDescriptors && allDescriptors.length > 1) {
          multipleFacesDetected = true;
          break;
        }
        if (allDescriptors && allDescriptors.length === 1) {
          faceDescriptor = allDescriptors[0];
          photoData = capturePhoto();
          break;
        }
      } catch (err) {
        console.warn('Detection frame failure:', err);
      }
      attempts++;
      await new Promise((r) => setTimeout(r, 600));
    }

    if (multipleFacesDetected) {
      addToast({
        type: 'warning',
        message: 'Multiple faces detected! Only one face should be scanned at a time.'
      });
      setErrorMsg('Multiple faces detected! Scanning aborted.');
      setIsProcessing(false);
      return;
    }

    const locationStr = await locationPromise;
    setGpsCoords(locationStr);

    if (!faceDescriptor) {
      setErrorMsg('No face detected. Align your face, look at the camera, and try again.');
      setIsProcessing(false);
      return;
    }

    try {
      setStatus('Matching face with registered employees...');
      // 1. Send descriptor to backend recognize API
      const recognizeResponse = await faceService.recognize(faceDescriptor);

      if (!recognizeResponse.data?.data?.matched) {
        if (recognizeResponse.data?.data?.ambiguous) {
          setErrorMsg('Face match is ambiguous. Please scan again.');
          addToast({
            type: 'warning',
            message: 'Face match is ambiguous. Please scan again.'
          });
        } else {
          setErrorMsg('Face not recognized! Please ensure you have enrolled your face from Employee Master.');
        }
        setIsProcessing(false);
        return;
      }

      const { employee_id, name } = recognizeResponse.data.data;
      setStatus(`Face Matched: ${name}. Recording attendance...`);

      // 2. Toggle clock-in / clock-out status based on daily record
      const response = await clockToggleEmployee(employee_id, locationStr, photoData);
      const action = response.data?.action || 'in';
      const actionLabel = action === 'in' ? 'Clocked In' : 'Clocked Out';

      setScannedResult({
        name,
        mode: actionLabel,
        time: new Date().toLocaleTimeString(),
        location: locationStr,
        photo: photoData
      });

      addToast({
        type: 'success',
        message: `${name} successfully ${actionLabel}!`
      });

      setStatus(`✓ Attendance updated successfully: ${actionLabel}`);
      stopCamera();

      // Automatically hide match results and show scanner after 8 seconds
      setTimeout(() => {
        setScannedResult(null);
        setStatus('');
        setErrorMsg('');
      }, 8000);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.messageToShow || err.message || 'Failed to submit attendance.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Bulk Attendance Handlers
  const startBulkMode = async () => {
    setScannedResult(null);
    setErrorMsg('');
    setBulkLog([]);
    setStatus('Acquiring GPS coordinates for bulk session...');
    setIsProcessing(true);

    await startCamera();

    // Acquire GPS location once for the entire continuous session
    const loc = await getGeoLocation();
    setGpsCoords(loc);

    isBulkActiveRef.current = true;
    setIsBulkActive(true);
    setIsProcessing(false);

    // Start background scanner loop
    runBulkScanLoop(loc);
  };

  const stopBulkMode = () => {
    isBulkActiveRef.current = false;
    setIsBulkActive(false);
    setStatus('Bulk session stopped.');
    stopCamera();
  };

  const runBulkScanLoop = async (cachedGps) => {
    while (isBulkActiveRef.current) {
      if (!videoRef.current) {
        await new Promise((r) => setTimeout(r, 500));
        continue;
      }

      setStatus('Ready for next face. Scan in progress...');
      setIsProcessing(true);

      let faceDescriptor = null;
      let photoData = null;
      let multipleFacesDetected = false;

      // Single frame scan attempt
      try {
        const allDescriptors = await faceService.detectAllFaceDescriptors(videoRef.current);
        if (allDescriptors && allDescriptors.length > 1) {
          multipleFacesDetected = true;
        } else if (allDescriptors && allDescriptors.length === 1) {
          faceDescriptor = allDescriptors[0];
          photoData = capturePhoto();
        }
      } catch (err) {
        console.warn('Bulk frame detection failure:', err);
      }

      if (multipleFacesDetected) {
        addToast({
          type: 'warning',
          message: 'Multiple faces detected! Only one face should be scanned at a time.'
        });
        setStatus('⚠️ Multiple faces detected! Scanning paused.');
        setIsProcessing(false);
        // Cooldown before retrying so admin can read message
        await new Promise((r) => setTimeout(r, 3000));
        continue;
      }

      if (!faceDescriptor) {
        // Retry scanning in a bit
        setIsProcessing(false);
        await new Promise((r) => setTimeout(r, 800));
        continue;
      }

      // Process match
      try {
        setStatus('Face detected! Matching biometrics...');
        const recognizeResponse = await faceService.recognize(faceDescriptor);

        if (!recognizeResponse.data?.data?.matched) {
          if (recognizeResponse.data?.data?.ambiguous) {
            setStatus('⚠️ Face match is ambiguous. Please scan again.');
            addToast({
              type: 'warning',
              message: 'Face match is ambiguous. Please scan again.'
            });
          } else {
            setStatus('❌ Face not recognized! Please realign.');
            addToast({
              type: 'error',
              message: 'Face not recognized!'
            });
          }
          setIsProcessing(false);
          // 2.5 seconds cooldown
          await new Promise((r) => setTimeout(r, 2500));
          continue;
        }

        const { employee_id, name } = recognizeResponse.data.data;
        setStatus(`Face Matched: ${name}. Recording attendance...`);

        const response = await clockToggleEmployee(employee_id, cachedGps, photoData);
        const action = response.data?.action || 'in';
        const actionLabel = action === 'in' ? 'Clocked In' : 'Clocked Out';

        const scanItem = {
          id: Date.now() + '-' + employee_id,
          name,
          mode: actionLabel,
          time: new Date().toLocaleTimeString(),
          photo: photoData
        };

        setBulkLog((prev) => [scanItem, ...prev]);

        addToast({
          type: 'success',
          message: `${name} successfully ${actionLabel}!`
        });

        // Set scannedResult to display the Clocking Match Result panel (Single Scan view)
        setScannedResult({
          name,
          mode: actionLabel,
          time: new Date().toLocaleTimeString(),
          location: cachedGps,
          photo: photoData
        });

        // Cooldown to prevent double scans and allow subject departure (with visual countdown)
        setIsProcessing(false);
        for (let i = 5; i > 0; i--) {
          if (!isBulkActiveRef.current) break;
          setStatus(`✓ Scanned: ${name} (${actionLabel})! Next scan in ${i}s...`);
          await new Promise((r) => setTimeout(r, 1000));
        }

        // Reset scannedResult to restore camera viewport and resume bulk scanning
        setScannedResult(null);

      } catch (err) {
        console.error('Bulk match error:', err);
        const msg = err.response?.data?.messageToShow || err.message || 'Verification failed.';
        setStatus(`⚠️ Scan error: ${msg}`);
        setIsProcessing(false);
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h2 className={styles.title}>Self-Attendance Terminal</h2>
      </div>

      <p className={styles.subtitle}>
        Identify and log your check-in/out records using real-time face matching and GPS telemetry.
      </p>

      {loadingModels ? (
        <div className={styles.loadingBox}>
          <RefreshCw className={styles.spin} size={28} />
          <span>Loading face recognition modules...</span>
        </div>
      ) : (
        <div className={isBulkActive ? styles.grid : ''} style={{ marginTop: '10px', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {scannedResult ? (
              /* Results Panel shown in place of Scan card */
              <div className={styles.card} style={{ width: '100%', maxWidth: '480px', animation: 'fadeIn 0.3s ease' }}>
                <h4 className={styles.panelTitle} style={{ alignSelf: 'stretch', textAlign: 'center', fontSize: '1.25rem', marginBottom: '20px', color: 'var(--primary)', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
                  Clocking Match Result
                </h4>

                <div className={styles.resultDetails} style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                    <div className={styles.resultPhotoFrame}>
                      {scannedResult.photo ? (
                        <img src={getPhotoUrl(scannedResult.photo)} alt="Scanned Subject" className={styles.resultPhoto} />
                      ) : (
                        <div className={styles.photoFallback}><Camera size={32} /></div>
                      )}
                      <div className={styles.passBadge}>MATCH PASSED</div>
                    </div>
                  </div>

                  <div className={styles.resultInfoList}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoKey}>Employee</span>
                      <span className={styles.infoValue}>{scannedResult.name}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoKey}>Action</span>
                      <span className={`${styles.infoValue} ${scannedResult.mode.includes('In') ? styles.textGreen : styles.textOrange}`}>
                        {scannedResult.mode}
                      </span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoKey}>Time</span>
                      <span className={styles.infoValue}>{scannedResult.time}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoKey}>GPS Telemetry</span>
                      <span className={styles.infoValue} style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} style={{ color: 'var(--primary)' }} />
                        {scannedResult.location}
                      </span>
                    </div>
                  </div>

                  {isBulkActive && (
                    <div className={styles.actionsGrid} style={{ marginTop: '20px', width: '100%' }}>
                      <button
                        type="button"
                        className={styles.btn}
                        onClick={stopBulkMode}
                        style={{ backgroundColor: '#EF4444', width: '100%', maxWidth: 'none' }}
                      >
                        <X size={18} /> Stop Bulk Attendance
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Viewport Card */
              <div className={styles.card} style={{ width: '100%', maxWidth: '520px' }}>
                <div className={styles.viewportWrapper}>
                  <div className={styles.cameraBox} style={{ display: isCameraActive ? 'block' : 'none' }}>
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      width={400}
                      height={300}
                      style={{ transform: 'scaleX(-1)' }}
                    />
                    {isProcessing && <div className={styles.scanningLine} />}
                    <div className={styles.hudOverlay}>
                      <div className={styles.hudCornerTL} />
                      <div className={styles.hudCornerTR} />
                      <div className={styles.hudCornerBL} />
                      <div className={styles.hudCornerBR} />
                    </div>
                  </div>
                  {!isCameraActive && (
                    <div className={styles.cameraPlaceholder}>
                      <Camera size={48} className={styles.placeholderIcon} />
                      <span>Camera Standby</span>
                    </div>
                  )}
                </div>

                {/* Status messages */}
                {status && (
                  <div className={styles.statusBox}>
                    {isProcessing && <RefreshCw className={styles.spin} size={14} style={{ marginRight: 8 }} />}
                    {status}
                  </div>
                )}

                {errorMsg && (
                  <div className={styles.errorBox}>
                    <AlertTriangle size={16} style={{ marginRight: 8, flexShrink: 0 }} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className={styles.actionsGrid}>
                  {isBulkActive ? (
                    <button
                      type="button"
                      className={styles.btn}
                      onClick={stopBulkMode}
                      style={{ backgroundColor: '#EF4444', width: '100%', maxWidth: 'none' }}
                    >
                      <X size={18} /> Stop Bulk Attendance
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnIn}`}
                        onClick={handleAction}
                        disabled={isProcessing || isCameraActive}
                        style={{ flex: 1 }}
                      >
                        <Clock size={18} /> Single Scan
                      </button>
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnOut}`}
                        onClick={startBulkMode}
                        disabled={isProcessing || isCameraActive}
                        style={{ flex: 1 }}
                      >
                        <Sparkles size={18} /> Bulk Scan
                      </button>
                    </>
                  )}
                </div>

                {isCameraActive && !isBulkActive && (
                  <button
                    type="button"
                    className={styles.btnCancel}
                    onClick={stopCamera}
                    disabled={isProcessing}
                  >
                    Close Camera
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Bulk Logs Panel */}
          {isBulkActive && (
            <div className={styles.sideCard} style={{ width: '100%', maxWidth: '400px', animation: 'fadeIn 0.3s ease' }}>
              <h3 className={styles.panelTitle} style={{ color: 'var(--primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Scanned Session Log</span>
                <span style={{ fontSize: '0.8rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary-hover)', padding: '2px 8px', borderRadius: '4px' }}>
                  {bulkLog.length} Scans
                </span>
              </h3>

              <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {bulkLog.length === 0 ? (
                  <div className={styles.emptyPanel}>
                    <Clock size={32} style={{ opacity: 0.3 }} />
                    <p>No scans recorded yet in this session.</p>
                  </div>
                ) : (
                  bulkLog.map((log) => (
                    <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', animation: 'fadeIn 0.25s ease' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0 }}>
                        {log.photo ? (
                          <img src={getPhotoUrl(log.photo)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }}><Camera size={16} /></div>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {log.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          <span>{log.time}</span>
                          <span style={{ height: '4px', width: '4px', borderRadius: '50%', backgroundColor: 'var(--border)' }} />
                          <span style={{ fontWeight: '700', color: log.mode.includes('In') ? 'var(--primary)' : '#f59e0b' }}>
                            {log.mode}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FaceAttendanceSelfPage;
