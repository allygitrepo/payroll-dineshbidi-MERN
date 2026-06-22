import React, { useEffect, useRef, useState } from 'react';

/**
 * FaceCapture Component
 * Small capture widget that loads models, activates the camera, and triggers onCapture with a single facial descriptor.
 * 
 * @param {Object} props
 * @param {Function} props.onCapture - Callback triggered with the Float32Array face descriptor when captured successfully
 */
const FaceCapture = ({ onCapture }) => {
  const videoRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const load = async () => {
      const bases = [
        (import.meta.env.BASE_URL || '/') + 'models',
        'https://justadudewhohacks.github.io/face-api.js/models'
      ];
      try {
        const faceapiModule = await import('face-api.js');
        const faceapi = faceapiModule.default || faceapiModule;
        let ok = false;
        for (const base of bases) {
          try {
            await faceapi.nets.tinyFaceDetector.loadFromUri(base);
            await faceapi.nets.faceLandmark68Net.loadFromUri(base);
            await faceapi.nets.faceRecognitionNet.loadFromUri(base);
            ok = true;
            break;
          } catch (err) {
            console.warn('Could not load models from uri:', base);
          }
        }
        setModelsLoaded(ok);
        if (!ok) setErrorMsg('Failed to fetch face-api weights.');
      } catch (err) {
        setErrorMsg('Error loading face-api module: ' + err.message);
      }
    };
    load();
  }, []);

  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } else {
        setErrorMsg('Webcam API is not supported in this browser.');
      }
    } catch (e) {
      setErrorMsg('Webcam activation error: ' + e.message);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      const s = videoRef.current?.srcObject;
      if (s && s.getTracks) s.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const captureSingle = async () => {
    if (!videoRef.current || !modelsLoaded) return;
    try {
      const faceapiModule = await import('face-api.js');
      const faceapi = faceapiModule.default || faceapiModule;
      const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224 });
      
      const result = await faceapi
        .detectSingleFace(videoRef.current, options)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (result && result.descriptor) {
        onCapture(result.descriptor);
      } else {
        alert('No face detected. Align your face clearly in the camera frame.');
      }
    } catch (e) {
      alert('Error detecting face: ' + e.message);
    }
  };

  return (
    <div style={{ textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
      {errorMsg && <div style={{ color: 'red', margin: '10px 0' }}>{errorMsg}</div>}
      <div style={{ width: '320px', height: '240px', margin: '0 auto', backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden' }}>
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          width={320} 
          height={240} 
          style={{ objectFit: 'cover' }} 
        />
      </div>
      <div style={{ marginTop: '10px' }}>
        <button 
          onClick={captureSingle} 
          disabled={!modelsLoaded}
          style={{
            padding: '8px 16px',
            backgroundColor: modelsLoaded ? '#48bb78' : '#cbd5e0',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: modelsLoaded ? 'pointer' : 'not-allowed',
            fontWeight: '600'
          }}
        >
          {modelsLoaded ? 'Capture Face Descriptor' : 'Loading models...'}
        </button>
      </div>
    </div>
  );
};

export default FaceCapture;
