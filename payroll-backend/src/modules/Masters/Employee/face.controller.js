const fs = require("fs");
const path = require("path");
const Employee = require("./employee.model");
const { successResponse, errorResponse } = require("../../../utils/response");

const FACE_DATA_DIR = path.join(__dirname, "..", "..", "..", "..", "face_data");

function ensureDataDir() {
    if (!fs.existsSync(FACE_DATA_DIR)) {
        fs.mkdirSync(FACE_DATA_DIR, { recursive: true });
    }
}

function euclideanDistance(a, b) {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        const d = a[i] - b[i];
        sum += d * d;
    }
    return Math.sqrt(sum);
}

class FaceController {
    /**
     * Enrolls the face descriptors for an employee and writes them to a JSON file.
     * Also updates the employee's face_descriptor_path in the database.
     */
    static async enroll(req, res) {
        try {
            const { employee_id, name, descriptors } = req.body;
            if (!employee_id || !Array.isArray(descriptors) || !descriptors.length) {
                return res.status(400).json(
                    errorResponse(
                        "VALIDATION_ERROR",
                        "employee_id and descriptors array are required.",
                        "Employee ID and face descriptors are required."
                    )
                );
            }

            // Verify employee exists in DB
            const employee = await Employee.findOne({ where: { id: employee_id, status: true } });
            if (!employee) {
                return res.status(404).json(
                    errorResponse(
                        "EMPLOYEE_NOT_FOUND",
                        `Employee with ID ${employee_id} not found or inactive.`,
                        "Employee not found."
                    )
                );
            }

            ensureDataDir();
            const fileName = `${employee_id}.json`;
            const filePath = path.join(FACE_DATA_DIR, fileName);
            const payload = { employee_id, name: name || employee.name, descriptors };

            // Compute mathematical mean (average) descriptor profile from samples
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

            // Write face profile to file system
            fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));

            // Store relative path in database
            const relativePath = path.join("face_data", fileName).replace(/\\/g, "/");
            await employee.update({ face_descriptor_path: relativePath });

            return res.status(201).json(
                successResponse(
                    "FACE_ENROLLED",
                    "Face descriptors saved and database updated successfully.",
                    "Face biometrics registered successfully.",
                    { employee_id, face_descriptor_path: relativePath }
                )
            );
        } catch (err) {
            console.error("Face enroll error:", err);
            return res.status(500).json(
                errorResponse(
                    "INTERNAL_SERVER_ERROR",
                    err.message,
                    "Failed to register face biometrics."
                )
            );
        }
    }

    /**
     * Matches a query face descriptor against all registered face JSON files.
     */
    static async recognize(req, res) {
        try {
            const { descriptor } = req.body;
            if (!Array.isArray(descriptor) || !descriptor.length) {
                return res.status(400).json(
                    errorResponse(
                        "VALIDATION_ERROR",
                        "descriptor array is required.",
                        "Face scan data is missing."
                    )
                );
            }

            ensureDataDir();
            const files = fs.readdirSync(FACE_DATA_DIR).filter((f) => f.endsWith(".json"));
            if (!files.length) {
                return res.status(200).json(
                    successResponse(
                        "NO_ENROLLED_FACES",
                        "No face profiles found in storage.",
                        "No registered face profiles found.",
                        { matched: false }
                    )
                );
            }

            let best = { employee_id: null, name: null, distance: Infinity };

            for (const f of files) {
                try {
                    const fileData = JSON.parse(fs.readFileSync(path.join(FACE_DATA_DIR, f), "utf8"));
                    
                    // 1. Match using average/mean descriptor if present
                    if (Array.isArray(fileData.mean_descriptor) && fileData.mean_descriptor.length) {
                        const dist = euclideanDistance(fileData.mean_descriptor, descriptor);
                        if (dist < best.distance) {
                            best = { employee_id: fileData.employee_id, name: fileData.name, distance: dist };
                        }
                    } 
                    // 2. Fallback to individual captured samples
                    else if (Array.isArray(fileData.descriptors) && fileData.descriptors.length) {
                        for (const d of fileData.descriptors) {
                            const dist = euclideanDistance(d, descriptor);
                            if (dist < best.distance) {
                                best = { employee_id: fileData.employee_id, name: fileData.name, distance: dist };
                            }
                        }
                    }
                } catch (e) {
                    console.warn("Skipping malformed profile data file:", f, e.message);
                }
            }

            // Standard Euclidean distance matching threshold for face-api.js model is <= 0.6
            const MATCH_THRESHOLD = 0.6;
            if (best.distance <= MATCH_THRESHOLD) {
                return res.status(200).json(
                    successResponse(
                        "FACE_MATCHED",
                        "Biometric matching completed successfully.",
                        "Face recognized successfully.",
                        { matched: true, employee_id: best.employee_id, name: best.name, distance: best.distance }
                    )
                );
            }

            return res.status(200).json(
                successResponse(
                    "FACE_NOT_MATCHED",
                    "No matching biometric profile found.",
                    "Face not recognized.",
                    { matched: false, distance: best.distance }
                )
            );
        } catch (err) {
            console.error("Face recognize error:", err);
            return res.status(500).json(
                errorResponse(
                    "INTERNAL_SERVER_ERROR",
                    err.message,
                    "Failed to process face recognition."
                )
            );
        }
    }

    /**
     * Lists all employees who have enrolled face descriptors.
     */
    static async list(req, res) {
        try {
            ensureDataDir();
            const files = fs.readdirSync(FACE_DATA_DIR).filter((f) => f.endsWith(".json"));
            const data = [];
            for (const f of files) {
                try {
                    const fileData = JSON.parse(fs.readFileSync(path.join(FACE_DATA_DIR, f), "utf8"));
                    data.push({ employee_id: fileData.employee_id, name: fileData.name });
                } catch (e) {
                    // Skip malformed files
                }
            }

            return res.status(200).json(
                successResponse(
                    "FACE_PROFILES_LISTED",
                    "Face profiles fetched from file system successfully.",
                    "Fetched registered face profiles successfully.",
                    data
                )
            );
        } catch (err) {
            console.error("Face list error:", err);
            return res.status(500).json(
                errorResponse(
                    "INTERNAL_SERVER_ERROR",
                    err.message,
                    "Failed to list face profiles."
                )
            );
        }
    }
}

module.exports = FaceController;
