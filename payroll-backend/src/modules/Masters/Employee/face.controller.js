const fs = require("fs");
const path = require("path");
const Employee = require("./employee.model");
const { successResponse, errorResponse } = require("../../../utils/response");

const FACE_DATA_DIR = path.join(__dirname, "..", "..", "..", "..", "face_data");
const MATCH_THRESHOLD = 0.50;
const MATCH_GAP_THRESHOLD = 0.05;
const DUPLICATE_THRESHOLD = 0.50;
const SAMPLE_VARIATION_THRESHOLD = 0.45;

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

            // Compute mathematical mean (average) descriptor profile from initial samples
            const len = descriptors[0].length;
            let mean = new Array(len).fill(0);
            for (const d of descriptors) {
                for (let i = 0; i < len; i++) {
                    mean[i] += Number(d[i] || 0);
                }
            }
            for (let i = 0; i < len; i++) {
                mean[i] = mean[i] / descriptors.length;
            }

            // Consistency check: filter out outliers
            const validDescriptors = [];
            for (const d of descriptors) {
                const dist = euclideanDistance(d, mean);
                if (dist <= SAMPLE_VARIATION_THRESHOLD) {
                    validDescriptors.push(d);
                }
            }

            if (validDescriptors.length < 8) {
                return res.status(400).json(
                    errorResponse(
                        "INCONSISTENT_SAMPLES",
                        `Only ${validDescriptors.length} of ${descriptors.length} samples were consistent.`,
                        "Enrollment failed. Please recapture the face."
                    )
                );
            }

            // Recompute mean from only valid descriptors
            mean = new Array(len).fill(0);
            for (const d of validDescriptors) {
                for (let i = 0; i < len; i++) {
                    mean[i] += Number(d[i] || 0);
                }
            }
            for (let i = 0; i < len; i++) {
                mean[i] = mean[i] / validDescriptors.length;
            }

            // Check for duplicate face across other employees
            ensureDataDir();
            const files = fs.readdirSync(FACE_DATA_DIR).filter((f) => f.endsWith(".json"));
            for (const f of files) {
                try {
                    const fileData = JSON.parse(fs.readFileSync(path.join(FACE_DATA_DIR, f), "utf8"));
                    // Skip checking against the same employee (allows updating biometrics)
                    if (fileData.employee_id === employee_id) {
                        continue;
                    }

                    let minDistance = Infinity;
                    const existingDescriptors = Array.isArray(fileData.descriptors) && fileData.descriptors.length
                        ? fileData.descriptors
                        : (Array.isArray(fileData.mean_descriptor) ? [fileData.mean_descriptor] : []);

                    for (const newD of validDescriptors) {
                        for (const existingD of existingDescriptors) {
                            const dist = euclideanDistance(newD, existingD);
                            if (dist < minDistance) {
                                minDistance = dist;
                            }
                        }
                    }

                    if (minDistance < DUPLICATE_THRESHOLD) {
                        const dbEmp = await Employee.findOne({ where: { id: fileData.employee_id } });
                        const matchedName = dbEmp ? dbEmp.name : fileData.name;

                        return res.status(400).json(
                            errorResponse(
                                "DUPLICATE_FACE",
                                `Face matches existing employee: ${matchedName} (id: ${fileData.employee_id}) with distance ${minDistance.toFixed(4)}.`,
                                `This face appears to already be registered under ${matchedName}.`
                            )
                        );
                    }
                } catch (e) {
                    console.warn("Skipping check for malformed profile:", f, e.message);
                }
            }

            const fileName = `${employee_id}.json`;
            const filePath = path.join(FACE_DATA_DIR, fileName);
            const payload = {
                employee_id,
                name: name || employee.name,
                descriptors: validDescriptors,
                mean_descriptor: mean
            };

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
            let secondBest = { employee_id: null, name: null, distance: Infinity };

            for (const f of files) {
                try {
                    const fileData = JSON.parse(fs.readFileSync(path.join(FACE_DATA_DIR, f), "utf8"));
                    let minDistanceForEmp = Infinity;

                    // Prefer all stored descriptors if available
                    if (Array.isArray(fileData.descriptors) && fileData.descriptors.length) {
                        for (const d of fileData.descriptors) {
                            const dist = euclideanDistance(d, descriptor);
                            if (dist < minDistanceForEmp) {
                                minDistanceForEmp = dist;
                            }
                        }
                    }
                    // Fallback to mean_descriptor if descriptors are not present
                    else if (Array.isArray(fileData.mean_descriptor) && fileData.mean_descriptor.length) {
                        const dist = euclideanDistance(fileData.mean_descriptor, descriptor);
                        minDistanceForEmp = dist;
                    }

                    if (minDistanceForEmp < best.distance) {
                        // Shift current best to secondBest
                        secondBest = { ...best };
                        best = { employee_id: fileData.employee_id, name: fileData.name, distance: minDistanceForEmp };
                    } else if (minDistanceForEmp < secondBest.distance) {
                        secondBest = { employee_id: fileData.employee_id, name: fileData.name, distance: minDistanceForEmp };
                    }
                } catch (e) {
                    console.warn("Skipping malformed profile data file:", f, e.message);
                }
            }

            const isMatched = best.distance <= MATCH_THRESHOLD;
            const confidenceVal = best.distance === Infinity ? 0 : parseFloat((100 * (1 - best.distance)).toFixed(2));
            const secondBestDistVal = secondBest.distance === Infinity ? null : secondBest.distance;

            if (isMatched) {
                const gap = secondBest.distance - best.distance;
                if (gap < MATCH_GAP_THRESHOLD) {
                    // Ambiguous match detection

                    return res.status(200).json(
                        successResponse(
                            "FACE_AMBIGUOUS",
                            "Biometric match is ambiguous.",
                            "Face match is ambiguous. Please scan again.",
                            {
                                matched: false,
                                ambiguous: true,
                                employeeId: best.employee_id,
                                employee_id: best.employee_id,
                                employeeName: best.name,
                                name: best.name,
                                bestDistance: best.distance,
                                secondBestDistance: secondBestDistVal,
                                confidence: confidenceVal,
                                result: "AMBIGUOUS"
                            }
                        )
                    );
                }

                // Fetch the latest employee details from DB to get the most updated name
                const dbEmp = await Employee.findOne({ where: { id: best.employee_id } });
                const matchedName = dbEmp ? dbEmp.name : best.name;

                return res.status(200).json(
                    successResponse(
                        "FACE_MATCHED",
                        "Biometric matching completed successfully.",
                        "Face recognized successfully.",
                        {
                            matched: true,
                            employeeId: best.employee_id,
                            employee_id: best.employee_id,
                            employeeName: matchedName,
                            name: matchedName,
                            bestDistance: best.distance,
                            secondBestDistance: secondBestDistVal,
                            confidence: confidenceVal,
                            result: "MATCHED"
                        }
                    )
                );
            }

            return res.status(200).json(
                successResponse(
                    "FACE_NOT_MATCHED",
                    "No matching biometric profile found.",
                    "Face not recognized.",
                    {
                        matched: false,
                        bestDistance: best.distance,
                        secondBestDistance: secondBestDistVal,
                        confidence: confidenceVal,
                        result: "NOT_MATCHED"
                    }
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

            // Get all employees to map their names dynamically from DB
            const employees = await Employee.findAll({ attributes: ["id", "name"] });
            const employeeMap = {};
            for (const emp of employees) {
                employeeMap[emp.id] = emp.name;
            }

            const data = [];
            for (const f of files) {
                try {
                    const fileData = JSON.parse(fs.readFileSync(path.join(FACE_DATA_DIR, f), "utf8"));
                    const currentName = employeeMap[fileData.employee_id] || fileData.name;
                    data.push({ employee_id: fileData.employee_id, name: currentName });
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
