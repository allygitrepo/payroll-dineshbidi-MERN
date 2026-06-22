import faceapiImport from 'face-api.js'; // Ensure to install face-api.js
// Custom Axios API instance - replace or implement to point to your backend API base URL
import api from './api'; 

let faceapiModule = null;

const faceService = {
  /**
   * Load face-api.js models from a local directory or fallback to a CDN.
   * Required models: tinyFaceDetector, faceLandmark68Net, faceRecognitionNet
   */
  loadModels: async () => {
    const bases = [
      (import.meta.env.BASE_URL || '/') + 'models',
      'https://justadudewhohacks.github.io/face-api.js/models' // Fallback public CDN hosting the pre-trained weights
    ];
    
    const faceapiImported = await import('face-api.js');
    faceapiModule = faceapiImported.default || faceapiImported;
    
    const checkAndLoad = async (base) => {
      // Validate manifest endpoint response before attempting load
      const manifestUrl = base.replace(/\/$/, '') + '/tiny_face_detector_model-weights_manifest.json';
      const resp = await fetch(manifestUrl, { method: 'GET' });
      if (!resp.ok) throw new Error('Manifest not found');
      
      const ct = (resp.headers.get('content-type') || '').toLowerCase();
      if (!ct.includes('application/json') && !ct.includes('application/octet-stream')) {
        throw new Error('Manifest not valid JSON');
      }
      
      await faceapiModule.nets.tinyFaceDetector.loadFromUri(base);
      await faceapiModule.nets.faceLandmark68Net.loadFromUri(base);
      await faceapiModule.nets.faceRecognitionNet.loadFromUri(base);
    };

    let ok = false;
    for (const base of bases) {
      try {
        await checkAndLoad(base);
        ok = true;
        console.log('Loaded face-api models from:', base);
        break;
      } catch (err) {
        console.warn('Failed to load models from:', base, err?.message || err);
      }
    }
    if (!ok) throw new Error('Failed to load face-api models from any source.');
  },

  /**
   * Detect single face and retrieve facial descriptor vector (128-dimensional Float32Array) from HTML5 Video
   */
  detectFaceDescriptor: async (videoElement) => {
    if (!faceapiModule) {
      throw new Error('Face models not loaded. Call loadModels() first.');
    }
    
    try {
      const options = new faceapiModule.TinyFaceDetectorOptions({ inputSize: 224 });
      const result = await faceapiModule
        .detectSingleFace(videoElement, options)
        .withFaceLandmarks()
        .withFaceDescriptor();
      
      if (result && result.descriptor) {
        return result.descriptor;
      }
      return null;
    } catch (err) {
      console.error('detectFaceDescriptor error:', err);
      throw err;
    }
  },

  /**
   * Enroll user face descriptors to the backend
   * @param {string|number} employeeId - ID of the employee
   * @param {string} name - Name of the employee
   * @param {Array<Float32Array>} descriptors - Set of face descriptors captured (ideally 12 samples)
   */
  enroll: async (employeeId, name, descriptors) => {
    const payload = { 
      employee_id: employeeId, 
      name, 
      descriptors: descriptors.map(d => Array.from(d)) 
    };
    const res = await api.post('/face/enroll', payload);
    return res.data;
  },

  /**
   * Send single descriptor to backend for identification match
   * @param {Float32Array} descriptor - Facial descriptor captured from camera
   */
  recognize: async (descriptor) => {
    const payload = { descriptor: Array.from(descriptor) };
    const res = await api.post('/face/recognize', payload);
    return res.data;
  },

  /**
   * Retrieve list of enrolled profiles from server
   */
  list: async () => {
    const res = await api.get('/face/list');
    return res.data?.data || [];
  },

  /**
   * Helper workflow that triggers model loading, mounts a fullscreen/centered camera modal,
   * captures a face descriptor, runs recognition, takes a photo preview, and teardown.
   * 
   * @param {Object} opts - configurations
   * @param {number} opts.attempts - Maximum face detection attempts before closing camera
   * @param {number} opts.delayMs - Delay in milliseconds between detection frames
   */
  recognizeUsingCamera: async (opts = {}) => {
    // 1. Ensure models loaded
    const bases = [
      (import.meta.env.BASE_URL || '/') + 'models',
      'https://justadudewhohacks.github.io/face-api.js/models'
    ];
    const faceapiImported = await import('face-api.js');
    const faceapi = faceapiImported.default || faceapiImported;
    
    const checkAndLoad = async (base) => {
      const manifestUrl = base.replace(/\/$/, '') + '/tiny_face_detector_model-weights_manifest.json';
      const resp = await fetch(manifestUrl, { method: 'GET' });
      if (!resp.ok) throw new Error('Manifest not found');
      await faceapi.nets.tinyFaceDetector.loadFromUri(base);
      await faceapi.nets.faceLandmark68Net.loadFromUri(base);
      await faceapi.nets.faceRecognitionNet.loadFromUri(base);
    };

    let ok = false;
    for (const base of bases) {
      try {
        await checkAndLoad(base);
        ok = true;
        break;
      } catch (err) {
        console.warn('Failed model base url:', base, err?.message);
      }
    }
    if (!ok) throw new Error('Failed to load face-api models');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return { status: false, matched: false, message: 'Web camera interface is not available' };
    }

    // 2. Create Modal/Overlay Elements
    const overlay = document.createElement('div');
    overlay.id = 'face-recognition-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '9999';
    overlay.style.fontFamily = 'Inter, system-ui, sans-serif';
    
    const container = document.createElement('div');
    container.style.position = 'relative';
    container.style.textAlign = 'center';
    container.style.backgroundColor = '#1e293b';
    container.style.padding = '30px';
    container.style.borderRadius = '16px';
    container.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
    
    const message = document.createElement('div');
    message.style.color = '#f8fafc';
    message.style.marginBottom = '20px';
    message.style.fontSize = '18px';
    message.style.fontWeight = '600';
    message.textContent = 'Position your face in the center of the camera frame...';
    
    const video = document.createElement('video');
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.style.width = '400px';
    video.style.height = '300px';
    video.style.borderRadius = '12px';
    video.style.border = '3px solid #6366f1';
    video.style.boxShadow = '0 0 20px rgba(99, 102, 241, 0.3)';
    video.style.objectFit = 'cover';
    
    const statusText = document.createElement('div');
    statusText.style.color = '#34d399';
    statusText.style.marginTop = '20px';
    statusText.style.fontSize = '14px';
    statusText.style.fontWeight = '500';
    statusText.style.minHeight = '20px';
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Cancel';
    closeBtn.style.marginTop = '15px';
    closeBtn.style.padding = '8px 16px';
    closeBtn.style.backgroundColor = '#ef4444';
    closeBtn.style.color = 'white';
    closeBtn.style.border = 'none';
    closeBtn.style.borderRadius = '6px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.fontWeight = '500';
    
    container.appendChild(message);
    container.appendChild(video);
    container.appendChild(statusText);
    container.appendChild(document.createElement('br'));
    container.appendChild(closeBtn);
    overlay.appendChild(container);
    document.body.appendChild(overlay);

    let stream;
    let isCancelled = false;

    closeBtn.onclick = () => {
      isCancelled = true;
    };

    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true });
    } catch (err) {
      document.body.removeChild(overlay);
      console.error('Camera capture error:', err);
      return { status: false, matched: false, message: 'Webcam permission denied or unavailable' };
    }
    video.srcObject = stream;

    try {
      await video.play();
    } catch (e) {
      console.warn('Playback fail:', e);
    }

    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224 });
    let result = null;
    const maxAttempts = opts.attempts || 10;
    const delayMs = opts.delayMs || 800;
    
    for (let i = 0; i < maxAttempts; i++) {
      if (isCancelled) break;
      try {
        statusText.textContent = `Scanning face... Attempt ${i + 1}/${maxAttempts}`;
        result = await faceapi
          .detectSingleFace(video, options)
          .withFaceLandmarks()
          .withFaceDescriptor();
        
        if (result && result.descriptor) {
          statusText.textContent = `Face detected! Matching...`;
          break;
        }
      } catch (e) {
        console.warn('Detection trial failed:', e?.message || e);
      }
      await new Promise((r) => setTimeout(r, delayMs));
    }

    // Capture base64 snapshot frame for logs verification
    let photoDataUrl = null;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      photoDataUrl = canvas.toDataURL('image/jpeg', 0.85);
    } catch (e) {
      console.warn('Failed to draw snapshot:', e);
    }

    // Cleanup camera streams and unmount UI elements
    try {
      if (stream && stream.getTracks) stream.getTracks().forEach((t) => t.stop());
    } catch (e) {
      console.warn('Clean track fail:', e);
    }
    try { document.body.removeChild(overlay); } catch (e) { /* already removed */ }

    if (isCancelled) {
      return { status: false, matched: false, message: 'User cancelled verification workflow' };
    }

    if (!result || !result.descriptor) {
      return { status: true, matched: false, message: 'No face detected in frames', photo: photoDataUrl };
    }

    // Match with database via backend API
    const matchResponse = await faceService.recognize(result.descriptor);
    return { ...matchResponse, photo: photoDataUrl };
  }
};

export default faceService;
