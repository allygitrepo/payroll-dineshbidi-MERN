const fs = require('fs');
const path = require('path');

// Local storage directory to dump user face vector profiles
const FACE_DATA_DIR = path.join(__dirname, '..', '..', 'face_data');

function ensureDataDir() {
  if (!fs.existsSync(FACE_DATA_DIR)) {
    fs.mkdirSync(FACE_DATA_DIR, { recursive: true });
  }
}

/**
 * Calculate Euclidean Distance between two N-dimensional numerical arrays
 */
function euclideanDistance(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

const faceController = {
  /**
   * Register face descriptors for a user
   * Receives an array of vectors (12 items) and calculates an average vector (mean descriptor)
   * which reduces variations in lighting/expression for recognition checks.
   */
  enroll: async (req, res) => {
    try {
      const { employee_id, name, descriptors } = req.body;
      if (!employee_id || !Array.isArray(descriptors) || !descriptors.length) {
        return res.status(400).json({ status: false, message: 'employee_id and descriptors are required' });
      }
      
      ensureDataDir();
      const filePath = path.join(FACE_DATA_DIR, `${employee_id}.json`);
      const payload = { employee_id, name: name || null, descriptors };

      // Compute mathematical mean (average) descriptor profile from samples
      if (Array.isArray(descriptors) && descriptors.length) {
        const len = descriptors[0].length;
        const mean = new Array(len).fill(0);
        for (const d of descriptors) {
          for (let i = 0; i < len; i++) {
            mean[i] += Number(d[i] || 0);
          }
        }
        for (let i = 0; i < len; i++) {
          mean[i] = mean[i] / descriptors.length;
        }
        payload.mean_descriptor = mean;
      }
      
      fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
      return res.status(201).json({ status: true, message: 'Enrolled face data saved', data: payload });
    } catch (err) {
      console.error('Face enroll server exception:', err);
      return res.status(500).json({ status: false, message: err.message });
    }
  },

  /**
   * Match a query descriptor against enrolled database profiles
   * Compares the query to stored descriptors using Euclidean distance metric.
   * Standard threshold for face-api.js model is <= 0.6.
   */
  recognize: async (req, res) => {
    try {
      const { descriptor } = req.body;
      if (!Array.isArray(descriptor) || !descriptor.length) {
        return res.status(400).json({ status: false, message: 'descriptor array is required' });
      }
      
      ensureDataDir();
      const files = fs.readdirSync(FACE_DATA_DIR).filter((f) => f.endsWith('.json'));
      if (!files.length) {
        return res.status(200).json({ status: true, matched: false, message: 'No profiles enrolled in database' });
      }

      let best = { employee_id: null, name: null, distance: Infinity };
      
      // Perform lookup match across stored descriptor profiles
      for (const f of files) {
        try {
          const fileData = JSON.parse(fs.readFileSync(path.join(FACE_DATA_DIR, f), 'utf8'));
          
          // 1. Prefer mean_descriptor match if present
          if (Array.isArray(fileData.mean_descriptor) && fileData.mean_descriptor.length) {
            const dist = euclideanDistance(fileData.mean_descriptor, descriptor);
            if (dist < best.distance) {
              best = { employee_id: fileData.employee_id, name: fileData.name, distance: dist };
            }
          } 
          // 2. Fallback: compute minimum distance across all individual enrolled captures
          else if (Array.isArray(fileData.descriptors) && fileData.descriptors.length) {
            for (const d of fileData.descriptors) {
              const dist = euclideanDistance(d, descriptor);
              if (dist < best.distance) {
                best = { employee_id: fileData.employee_id, name: fileData.name, distance: dist };
              }
            }
          }
        } catch (e) {
          console.warn('Skipping malformed profile data file:', f, e.message);
        }
      }

      // Threshold <= 0.6 represents a positive biometric match
      const MATCH_THRESHOLD = 0.6;
      if (best.distance <= MATCH_THRESHOLD) {
        return res.status(200).json({
          status: true,
          matched: true,
          employee_id: best.employee_id,
          name: best.name,
          distance: best.distance
        });
      }
      
      return res.status(200).json({ status: true, matched: false, distance: best.distance });
    } catch (err) {
      console.error('Face match server exception:', err);
      return res.status(500).json({ status: false, message: err.message });
    }
  },

  /**
   * Return a list of all enrolled profiles
   */
  list: async (req, res) => {
    try {
      ensureDataDir();
      const files = fs.readdirSync(FACE_DATA_DIR).filter((f) => f.endsWith('.json'));
      const output = [];
      for (const f of files) {
        try {
          const fileData = JSON.parse(fs.readFileSync(path.join(FACE_DATA_DIR, f), 'utf8'));
          output.push({ employee_id: fileData.employee_id, name: fileData.name });
        } catch (e) {
          // ignore malformed
        }
      }
      return res.status(200).json({ status: true, data: output });
    } catch (err) {
      return res.status(500).json({ status: false, message: err.message });
    }
  },
};

module.exports = faceController;
