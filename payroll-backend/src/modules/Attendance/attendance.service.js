const { Op } = require("sequelize");
const sequelize = require("../../config/database");
const Attendance = require("./attendance.model");
const Employee = require("../Masters/Employee/employee.model");
const Company = require("../Masters/Company/company.model");
const Contractor = require("../Masters/Contractor/contractor.model");
const fs = require("fs");
const path = require("path");

/**
 * Saves a base64 image string to a specified server subfolder.
 * Returns the relative database storage path, or null if invalid.
 */
function saveBase64Image(base64Str, subfolder, filename) {
    if (!base64Str || typeof base64Str !== "string" || !base64Str.startsWith("data:image")) {
        return null;
    }
    try {
        const uploadsDir = path.join(__dirname, "..", "..", "..", "uploads");
        const destDir = path.join(uploadsDir, "attendance", subfolder);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }

        // Strip data URI prefix
        const base64Data = base64Str.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");

        const filePath = path.join(destDir, filename);
        fs.writeFileSync(filePath, buffer);

        return `uploads/attendance/${subfolder}/${filename}`;
    } catch (e) {
        console.error(`Failed to save base64 image to ${subfolder}:`, e.message);
        return null;
    }
}

/**
 * Helper to verify company exists and belongs to the user.
 */
const verifyCompanyAccess = async (companyId, user) => {
    const company = await Company.findOne({ where: { id: companyId, cstatus: true } });
    if (!company) {
        const error = new Error("Company not found.");
        error.statusCode = 404;
        error.errorCode = "COMPANY_NOT_FOUND";
        error.messageToShow = "Company not found.";
        throw error;
    }

    if (user.role_name === 'Contractor') {
        if (!user.contractor_id) {
            const error = new Error("Contractor profile not found.");
            error.statusCode = 403;
            error.errorCode = "CONTRACTOR_PROFILE_NOT_FOUND";
            error.messageToShow = "Contractor profile not found.";
            throw error;
        }
        const contractor = await Contractor.findOne({ where: { id: user.contractor_id, company_id: companyId, status: true } });
        if (!contractor) {
            const error = new Error("Access denied. Contractor does not belong to this company.");
            error.statusCode = 403;
            error.errorCode = "ACCESS_DENIED";
            error.messageToShow = "Access denied.";
            throw error;
        }
    } else {
        if (company.user_id !== user.id) {
            const error = new Error("Access denied.");
            error.statusCode = 403;
            error.errorCode = "ACCESS_DENIED";
            error.messageToShow = "Access denied.";
            throw error;
        }
    }

    return company;
};

class AttendanceService {
    /**
     * Records check-in for the current day.
     */
    static async signInToday(employeeId, { location, sign_in_location, photo }) {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const dd = String(now.getDate()).padStart(2, "0");
        const todayStr = `${yyyy}-${mm}-${dd}`;
        const loc = sign_in_location || location || null;

        // Verify the employee exists and is active
        const emp = await Employee.findOne({ where: { id: employeeId, status: true } });
        if (!emp) {
            const error = new Error("Employee not found or inactive.");
            error.statusCode = 404;
            error.errorCode = "EMPLOYEE_NOT_FOUND";
            error.messageToShow = "Employee not found.";
            throw error;
        }

        // Check if a record already exists for today
        let record = await Attendance.findOne({ where: { employee_id: employeeId, date: todayStr } });

        if (!record) {
            const photoPath = photo ? saveBase64Image(photo, "sign_in", `${employeeId}_${todayStr}.jpg`) : null;
            const createPayload = {
                employee_id: employeeId,
                date: todayStr,
                sign_in_time: now,
                status: true,
                sign_in_location: loc,
                sign_in_photo: photoPath,
            };

            record = await Attendance.create(createPayload);
            return await Attendance.findByPk(record.id);
        }

        if (record.sign_in_time) {
            return await Attendance.findByPk(record.id);
        }

        const updatePayload = { sign_in_time: now, status: true };
        if (loc) updatePayload.sign_in_location = loc;
        if (photo) {
            const photoPath = saveBase64Image(photo, "sign_in", `${employeeId}_${todayStr}.jpg`);
            if (photoPath) updatePayload.sign_in_photo = photoPath;
        }

        await record.update(updatePayload);
        return await Attendance.findByPk(record.id);
    }

    static async signOutToday(employeeId, { location, sign_out_location, photo }) {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const dd = String(now.getDate()).padStart(2, "0");
        const todayStr = `${yyyy}-${mm}-${dd}`;

        const record = await Attendance.findOne({ where: { employee_id: employeeId, date: todayStr } });
        if (!record) {
            const error = new Error("You must check-in before checking out.");
            error.statusCode = 400;
            error.errorCode = "SIGN_IN_REQUIRED";
            error.messageToShow = "Please check-in before checking out.";
            throw error;
        }

        if (record.sign_out_time) {
            return record;
        }

        // Check if checked out within 5 minutes of sign_in_time
        const elapsedMs = now - new Date(record.sign_in_time);
        const fiveMinutes = 5 * 60 * 1000;
        if (elapsedMs < fiveMinutes) {
            const remainingMs = fiveMinutes - elapsedMs;
            const remainingMinutes = Math.floor(remainingMs / 60000);
            const remainingSeconds = Math.ceil((remainingMs % 60000) / 1000);
            let timeStr = "";
            if (remainingMinutes > 0) {
                timeStr += `${remainingMinutes}m ${remainingSeconds}s`;
            } else {
                timeStr += `${remainingSeconds}s`;
            }
            const error = new Error(`Too early to clock out. Please wait another ${timeStr}.`);
            error.statusCode = 400;
            error.errorCode = "CLOCK_OUT_TOO_EARLY";
            error.messageToShow = `Please wait another ${timeStr} to clock out.`;
            throw error;
        }

        const updatePayload = { sign_out_time: now };
        const loc = sign_out_location || location || null;
        if (loc) updatePayload.sign_out_location = loc;
        if (photo) {
            const photoPath = saveBase64Image(photo, "sign_out", `${employeeId}_${todayStr}.jpg`);
            if (photoPath) updatePayload.sign_out_photo = photoPath;
        }

        await record.update(updatePayload);
        return await Attendance.findByPk(record.id);
    }

    /**
     * Gets today's attendance log status for an employee.
     */
    static async getTodayStatus(employeeId) {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const dd = String(now.getDate()).padStart(2, "0");
        const todayStr = `${yyyy}-${mm}-${dd}`;

        let record = await Attendance.findOne({ where: { employee_id: employeeId, date: todayStr } });
        return record;
    }

    /**
     * Gets the log history for a specific employee.
     */
    static async getEmployeeLogs(employeeId) {
        return await Attendance.findAll({
            where: { employee_id: employeeId },
            order: [["date", "DESC"]],
        });
    }

    /**
     * Admin: Creates a new manual attendance record.
     */
    static async createManualRecord(companyId, user, data) {
        await verifyCompanyAccess(companyId, user);

        const { employee_id, date, sign_in_time, sign_out_time, status, location, sign_in_location, sign_out_location } = data;
        if (!employee_id || !date) {
            const error = new Error("Employee ID and Date are required.");
            error.statusCode = 400;
            error.errorCode = "VALIDATION_ERROR";
            error.messageToShow = "Employee ID and Date are required.";
            throw error;
        }

        // Verify the employee belongs to this company
        const emp = await Employee.findOne({ where: { id: employee_id, company_id: companyId, status: true } });
        if (!emp) {
            const error = new Error("Employee not found in this company.");
            error.statusCode = 404;
            error.errorCode = "EMPLOYEE_NOT_FOUND";
            error.messageToShow = "Employee not found.";
            throw error;
        }

        if (user.role_name === 'Contractor' && emp.contractor_id !== user.contractor_id) {
            const error = new Error("Access denied.");
            error.statusCode = 403;
            error.errorCode = "ACCESS_DENIED";
            error.messageToShow = "Access denied.";
            throw error;
        }

        const formattedSignIn = sign_in_time ? new Date(`${date}T${sign_in_time}`) : null;
        const formattedSignOut = sign_out_time ? new Date(`${date}T${sign_out_time}`) : null;
        const loc = sign_in_location || location || null;

        return await Attendance.create({
            employee_id,
            date,
            sign_in_time: formattedSignIn,
            sign_out_time: formattedSignOut,
            status: status !== undefined ? status : true,
            sign_in_location: loc,
            sign_out_location: sign_out_location || null,
        });
    }

    /**
     * Admin: Retrieves all records for a company (filtered by month/year).
     */
    static async getAllRecords(companyId, user, { month, year }) {
        await verifyCompanyAccess(companyId, user);

        let where = {};
        if (month && year) {
            const m = parseInt(month, 10);
            const y = parseInt(year, 10);
            if (!isNaN(m) && !isNaN(y) && m >= 1 && m <= 12) {
                const start = `${y}-${String(m).padStart(2, "0")}-01`;
                const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
                const end = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
                where.date = { [Op.between]: [start, end] };
            }
        }

        const employeeWhere = { company_id: companyId, status: true };
        if (user.role_name === 'Contractor' && user.contractor_id) {
            employeeWhere.contractor_id = user.contractor_id;
        }

        return await Attendance.findAll({
            where,
            include: [
                {
                    model: Employee,
                    as: "employee",
                    where: employeeWhere,
                    attributes: ["id", "name", "email", "employee_type"],
                },
            ],
            order: [["date", "DESC"]],
        });
    }

    /**
     * Admin: Deletes an attendance record.
     */
    static async deleteRecord(companyId, user, recordId) {
        await verifyCompanyAccess(companyId, user);

        const record = await Attendance.findByPk(recordId, {
            include: [{ model: Employee, as: "employee" }],
        });

        if (!record) {
            const error = new Error("Attendance record not found.");
            error.statusCode = 404;
            error.errorCode = "RECORD_NOT_FOUND";
            error.messageToShow = "Record not found.";
            throw error;
        }

        // Verify record belongs to the company
        if (record.employee?.company_id !== companyId) {
            const error = new Error("Access denied.");
            error.statusCode = 403;
            error.errorCode = "ACCESS_DENIED";
            error.messageToShow = "Access denied.";
            throw error;
        }

        if (user.role_name === 'Contractor' && record.employee?.contractor_id !== user.contractor_id) {
            const error = new Error("Access denied.");
            error.statusCode = 403;
            error.errorCode = "ACCESS_DENIED";
            error.messageToShow = "Access denied.";
            throw error;
        }

        await record.destroy();
        return true;
    }

    /**
     * Toggles clock in/out for an employee based on daily scans.
     */
    static async clockToggle(employeeId, { location, photo }) {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const dd = String(now.getDate()).padStart(2, "0");
        const todayStr = `${yyyy}-${mm}-${dd}`;

        // Verify employee exists and is active
        const emp = await Employee.findOne({ where: { id: employeeId, status: true } });
        if (!emp) {
            const error = new Error("Employee not found or inactive.");
            error.statusCode = 404;
            error.errorCode = "EMPLOYEE_NOT_FOUND";
            error.messageToShow = "Employee not found.";
            throw error;
        }

        // Check if record exists for today
        let record = await Attendance.findOne({ where: { employee_id: employeeId, date: todayStr } });

        if (!record) {
            // No record yet -> Check In
            const photoPath = photo ? saveBase64Image(photo, "sign_in", `${employeeId}_${todayStr}.jpg`) : null;
            record = await Attendance.create({
                employee_id: employeeId,
                date: todayStr,
                sign_in_time: now,
                sign_in_location: location || null,
                sign_in_photo: photoPath,
                status: true,
            });
            return record;
        }

        if (!record.sign_out_time) {
            // Check if clocking out within 5 minutes of sign_in_time
            const elapsedMs = now - new Date(record.sign_in_time);
            const fiveMinutes = 5 * 60 * 1000;
            if (elapsedMs < fiveMinutes) {
                const remainingMs = fiveMinutes - elapsedMs;
                const remainingMinutes = Math.floor(remainingMs / 60000);
                const remainingSeconds = Math.ceil((remainingMs % 60000) / 1000);
                let timeStr = "";
                if (remainingMinutes > 0) {
                    timeStr += `${remainingMinutes}m ${remainingSeconds}s`;
                } else {
                    timeStr += `${remainingSeconds}s`;
                }
                const error = new Error(`Too early to clock out. Please wait another ${timeStr}.`);
                error.statusCode = 400;
                error.errorCode = "CLOCK_OUT_TOO_EARLY";
                error.messageToShow = `Please wait another ${timeStr} to clock out.`;
                throw error;
            }

            // Record exists but not checked out -> Check Out
            const photoPath = photo ? saveBase64Image(photo, "sign_out", `${employeeId}_${todayStr}.jpg`) : null;
            await record.update({
                sign_out_time: now,
                sign_out_location: location || null,
                sign_out_photo: photoPath,
            });
            return await Attendance.findByPk(record.id);
        }

        // Already signed in and signed out
        const error = new Error("Already clocked out for today.");
        error.statusCode = 400;
        error.errorCode = "ALREADY_CLOCKED_OUT";
        error.messageToShow = "You have already completed sign-in and sign-out for today.";
        throw error;
    }

    /**
     * Admin/System: Retrieves summary of present days for a company in a given month.
     * Returns a map of { employee_id: total_present_days }
     */
    static async getSummary(companyId, monthYear) {
        const [y, m] = monthYear.split('-');
        if (!y || !m) {
            throw new Error("Invalid monthYear format. Expected YYYY-MM");
        }
        const start = `${monthYear}-01`;
        const lastDay = new Date(Date.UTC(parseInt(y, 10), parseInt(m, 10), 0)).getUTCDate();
        const end = `${monthYear}-${String(lastDay).padStart(2, "0")}`;

        const records = await Attendance.findAll({
            where: {
                date: { [Op.between]: [start, end] },
                status: true
            },
            include: [{
                model: Employee,
                as: 'employee',
                attributes: ['id'],
                where: { company_id: companyId }
            }],
            attributes: ['employee_id']
        });

        const summaryMap = {};
        records.forEach(record => {
            const empId = record.employee_id;
            summaryMap[empId] = (summaryMap[empId] || 0) + 1;
        });

        return summaryMap;
    }
}

module.exports = AttendanceService;
