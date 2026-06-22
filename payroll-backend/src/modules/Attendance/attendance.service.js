const { Op } = require("sequelize");
const sequelize = require("../../config/database");
const Attendance = require("./attendance.model");
const Employee = require("../Masters/Employee/employee.model");
const Company = require("../Masters/Company/company.model");

/**
 * Helper to verify company exists and belongs to the user.
 */
const verifyCompanyOwnership = async (companyId, userId) => {
    const company = await Company.findOne({ where: { id: companyId, cstatus: true } });
    if (!company) {
        const error = new Error("Company not found.");
        error.statusCode = 404;
        error.errorCode = "COMPANY_NOT_FOUND";
        error.messageToShow = "Company not found.";
        throw error;
    }

    if (company.user_id !== userId) {
        const error = new Error("Access denied.");
        error.statusCode = 403;
        error.errorCode = "ACCESS_DENIED";
        error.messageToShow = "Access denied.";
        throw error;
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
        const workEnd = new Date(`${todayStr}T18:00:00`);

        if (!record) {
            const createPayload = {
                employee_id: employeeId,
                date: todayStr,
                sign_in_time: now,
                status: true,
                sign_in_location: loc,
                sign_in_photo: photo || null,
            };

            if (!isNaN(workEnd) && now >= workEnd) {
                createPayload.sign_out_time = workEnd;
                createPayload.is_auto_signout = true;
            }

            record = await Attendance.create(createPayload);
            return await Attendance.findByPk(record.id);
        }

        if (record.sign_in_time) {
            // Already signed in. Auto-check out if past 6 PM and not checked out
            if (!record.sign_out_time && !isNaN(workEnd) && now >= workEnd) {
                await record.update({ sign_out_time: workEnd, is_auto_signout: true });
            }
            return await Attendance.findByPk(record.id);
        }

        const updatePayload = { sign_in_time: now, status: true };
        if (loc) updatePayload.sign_in_location = loc;
        if (photo) updatePayload.sign_in_photo = photo;

        await record.update(updatePayload);

        // Auto-check out check
        if (!record.sign_out_time && !isNaN(workEnd) && now >= workEnd) {
            await record.update({ sign_out_time: workEnd, is_auto_signout: true });
        }

        return await Attendance.findByPk(record.id);
    }

    /**
     * Records check-out for the current day.
     */
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

        // Cap sign-out time to 18:00 local if checked out late
        const workEnd = new Date(`${todayStr}T18:00:00`);
        const signOutAt = (!isNaN(workEnd) && now >= workEnd) ? workEnd : now;

        const updatePayload = { sign_out_time: signOutAt };
        const loc = sign_out_location || location || null;
        if (loc) updatePayload.sign_out_location = loc;
        if (photo) updatePayload.sign_out_photo = photo;

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

        // Auto-check out if past 6 PM and not checked out
        const workEnd = new Date(`${todayStr}T18:00:00`);
        if (record && record.sign_in_time && !record.sign_out_time && !isNaN(workEnd) && now >= workEnd) {
            await record.update({ sign_out_time: workEnd, is_auto_signout: true });
            record = await Attendance.findByPk(record.id);
        }

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
    static async createManualRecord(companyId, userId, data) {
        await verifyCompanyOwnership(companyId, userId);

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
    static async getAllRecords(companyId, userId, { month, year }) {
        await verifyCompanyOwnership(companyId, userId);

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

        return await Attendance.findAll({
            where,
            include: [
                {
                    model: Employee,
                    as: "employee",
                    where: { company_id: companyId, status: true },
                    attributes: ["id", "name", "email", "employee_type"],
                },
            ],
            order: [["date", "DESC"]],
        });
    }

    /**
     * Admin: Deletes an attendance record.
     */
    static async deleteRecord(companyId, userId, recordId) {
        await verifyCompanyOwnership(companyId, userId);

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

        await record.destroy();
        return true;
    }
}

module.exports = AttendanceService;
