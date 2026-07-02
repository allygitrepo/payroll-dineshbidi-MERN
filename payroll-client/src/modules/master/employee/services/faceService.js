import apiClient from '../../../../shared/services/apiClient';

let faceapiModule = null;

const faceService = {
  /**
   * Load face-api.js models from a local directory or fallback to a CDN.
   */
  loadModels: async () => {
    if (faceapiModule) return;

    const bases = [
      (import.meta.env.BASE_URL || '/') + 'models',
      'https://justadudewhohacks.github.io/face-api.js/models' // Fallback public CDN
    ];
    
    const faceapiImported = await import('face-api.js');
    faceapiModule = faceapiImported.default || faceapiImported;
    
    const checkAndLoad = async (base) => {
      // Validate manifest endpoint response before attempting load
      const manifestUrl = base.replace(/\/$/, '') + '/tiny_face_detector_model-weights_manifest.json';
      const resp = await fetch(manifestUrl, { method: 'GET' });
      if (!resp.ok) throw new Error('Manifest not found');
      
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
      const results = await faceapiModule
        .detectAllFaces(videoElement, options)
        .withFaceLandmarks()
        .withFaceDescriptors();
      
      if (!results || results.length === 0) {
        throw new Error('No face detected.');
      }
      if (results.length > 1) {
        throw new Error('Multiple faces detected. Exactly one face must be visible.');
      }
      
      const result = results[0];
      if (!result.detection || result.detection.score < 0.90) {
        const scorePct = result.detection ? (result.detection.score * 100).toFixed(0) : '0';
        throw new Error(`Face confidence too low (${scorePct}%). Need >= 90%.`);
      }
      
      return result.descriptor;
    } catch (err) {
      console.error('detectFaceDescriptor error:', err);
      throw err;
    }
  },

  /**
   * Detect all faces in the frame and retrieve their descriptors.
   */
  detectAllFaceDescriptors: async (videoElement) => {
    if (!faceapiModule) {
      throw new Error('Face models not loaded. Call loadModels() first.');
    }
    try {
      const options = new faceapiModule.TinyFaceDetectorOptions({ inputSize: 224 });
      const results = await faceapiModule
        .detectAllFaces(videoElement, options)
        .withFaceLandmarks()
        .withFaceDescriptors();
      
      if (results && results.length > 0) {
        return results.map(r => r.descriptor);
      }
      return [];
    } catch (err) {
      console.error('detectAllFaceDescriptors error:', err);
      throw err;
    }
  },

  /**
   * Enroll user face descriptors to the backend
   */
  enroll: async (employeeId, name, descriptors) => {
    const payload = { 
      employee_id: employeeId, 
      name, 
      descriptors: descriptors.map(d => Array.from(d)) 
    };
    const res = await apiClient.post('employees/face/enroll', payload);
    return res.data;
  },

  /**
   * Match user face descriptor against registered biometrics
   */
  recognize: async (descriptor) => {
    const companyId = localStorage.getItem('selectedCompany');
    const payload = {
      descriptor: Array.from(descriptor),
      company_id: companyId
    };
    const res = await apiClient.post('employees/face/recognize', payload);
    return res;
  }
};

export default faceService;
