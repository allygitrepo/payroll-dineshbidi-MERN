const AttendanceService = require("./attendance.service");
const Employee = require("../Masters/Employee/employee.model");
const { successResponse, errorResponse } = require("../../utils/response");

/**
 * Helper to resolve the employee ID from request body or session token.
 */
const resolveEmployeeId = async (req) => {
    if (req.body.employee_id) {
        return req.body.employee_id;
    }

    if (req.user) {
        // Check if the User UUID matches an Employee ID directly
        let emp = await Employee.findOne({ where: { id: req.user.id, status: true } });
        if (emp) return emp.id;

        // Fallback: Check if the User email/user_id matches an Employee's email
        emp = await Employee.findOne({ where: { email: req.user.user_id, status: true } });
        if (emp) return emp.id;
    }

    return null;
};

class AttendanceController {
    /**
     * Signs in the current employee today.
     */
    static async signInToday(req, res) {
        try {
            const employeeId = await resolveEmployeeId(req);
            if (!employeeId) {
                return res.status(400).json(
                    errorResponse(
                        "EMPLOYEE_NOT_RESOLVED",
                        "Unable to identify the employee from session or request parameters.",
                        "Failed to identify employee profile."
                    )
                );
            }

            const { location, sign_in_location, photo } = req.body || {};
            const record = await AttendanceService.signInToday(employeeId, { location, sign_in_location, photo });

            return res.status(200).json(
                successResponse(
                    "ATTENDANCE_SIGNED_IN",
                    "Sign-in recorded successfully.",
                    "Checked in successfully.",
                    record
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "INTERNAL_SERVER_ERROR";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to check-in today."
                )
            );
        }
    }

    /**
     * Signs out the current employee today.
     */
    static async signOutToday(req, res) {
        try {
            const employeeId = await resolveEmployeeId(req);
            if (!employeeId) {
                return res.status(400).json(
                    errorResponse(
                        "EMPLOYEE_NOT_RESOLVED",
                        "Unable to identify the employee from session or request parameters.",
                        "Failed to identify employee profile."
                    )
                );
            }

            const { location, sign_out_location, photo } = req.body || {};
            const record = await AttendanceService.signOutToday(employeeId, { location, sign_out_location, photo });

            return res.status(200).json(
                successResponse(
                    "ATTENDANCE_SIGNED_OUT",
                    "Sign-out recorded successfully.",
                    "Checked out successfully.",
                    record
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "INTERNAL_SERVER_ERROR";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to check-out today."
                )
            );
        }
    }

    /**
     * Retrieves today's current log status for the active employee.
     */
    static async getMyToday(req, res) {
        try {
            const employeeId = await resolveEmployeeId(req);
            if (!employeeId) {
                return res.status(400).json(
                    errorResponse(
                        "EMPLOYEE_NOT_RESOLVED",
                        "Unable to identify the employee from session or request parameters.",
                        "Failed to identify employee profile."
                    )
                );
            }

            const record = await AttendanceService.getTodayStatus(employeeId);
            return res.status(200).json(
                successResponse(
                    "ATTENDANCE_STATUS_RETRIEVED",
                    "Today's attendance status fetched successfully.",
                    "Fetched today's check-in status successfully.",
                    record
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            return res.status(statusCode).json(
                errorResponse(
                    "INTERNAL_SERVER_ERROR",
                    err.message,
                    "Failed to fetch today's status."
                )
            );
        }
    }

    /**
     * Retrieves attendance history for the active employee.
     */
    static async getMyAttendance(req, res) {
        try {
            const employeeId = await resolveEmployeeId(req);
            if (!employeeId) {
                return res.status(400).json(
                    errorResponse(
                        "EMPLOYEE_NOT_RESOLVED",
                        "Unable to identify the employee from session or request parameters.",
                        "Failed to identify employee profile."
                    )
                );
            }

            const logs = await AttendanceService.getEmployeeLogs(employeeId);
            return res.status(200).json(
                successResponse(
                    "ATTENDANCE_LOGS_RETRIEVED",
                    "Attendance logs retrieved successfully.",
                    "Fetched attendance log history successfully.",
                    logs
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            return res.status(statusCode).json(
                errorResponse(
                    "INTERNAL_SERVER_ERROR",
                    err.message,
                    "Failed to retrieve attendance logs."
                )
            );
        }
    }

    /**
     * Admin: Creates a manual attendance record.
     */
    static async createManual(req, res) {
        try {
            const { company_id, ...recordData } = req.body || {};
            if (!company_id) {
                return res.status(400).json(
                    errorResponse(
                        "VALIDATION_ERROR",
                        "company_id is required.",
                        "Company ID is required."
                    )
                );
            }

            const newRecord = await AttendanceService.createManualRecord(company_id, req.user, recordData);
            return res.status(201).json(
                successResponse(
                    "ATTENDANCE_CREATED",
                    "Manual attendance record created successfully.",
                    "Attendance record created successfully.",
                    newRecord
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "INTERNAL_SERVER_ERROR";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to create manual attendance record."
                )
            );
        }
    }

    /**
     * Admin: Retrieves all records for a company (filtered by month/year).
     */
    static async getAll(req, res) {
        try {
            const { companyId } = req.params;
            const { month, year } = req.query;
            if (!companyId) {
                return res.status(400).json(
                    errorResponse(
                        "VALIDATION_ERROR",
                        "Company ID is required.",
                        "Company ID is required."
                    )
                );
            }

            const records = await AttendanceService.getAllRecords(companyId, req.user, { month, year });
            return res.status(200).json(
                successResponse(
                    "ATTENDANCE_LIST_RETRIEVED",
                    "Attendance list retrieved successfully.",
                    "Attendance records retrieved successfully.",
                    records
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "INTERNAL_SERVER_ERROR";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to retrieve attendance list."
                )
            );
        }
    }

    /**
     * Admin: Deletes an attendance record.
     */
    static async delete(req, res) {
        try {
            const { id } = req.params;
            const { company_id } = req.query || {};
            if (!company_id) {
                return res.status(400).json(
                    errorResponse(
                        "VALIDATION_ERROR",
                        "company_id query parameter is required.",
                        "Company ID is required."
                    )
                );
            }

            await AttendanceService.deleteRecord(company_id, req.user, id);
            return res.status(200).json(
                successResponse(
                    "ATTENDANCE_DELETED",
                    "Attendance record deleted successfully.",
                    "Attendance record deleted successfully."
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "INTERNAL_SERVER_ERROR";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to delete attendance record."
                )
            );
        }
    }

    /**
     * Kiosk Endpoint: Scan face to automatically toggle Clock In / Clock Out.
     */
    static async clockToggle(req, res) {
        try {
            const { employee_id, location, photo } = req.body || {};
            if (!employee_id) {
                return res.status(400).json(
                    errorResponse(
                        "VALIDATION_ERROR",
                        "employee_id is required.",
                        "Employee identity is required."
                    )
                );
            }

            const record = await AttendanceService.clockToggle(employee_id, { location, photo });
            const isSignOut = !!record.sign_out_time;

            return res.status(200).json(
                successResponse(
                    isSignOut ? "ATTENDANCE_SIGNED_OUT" : "ATTENDANCE_SIGNED_IN",
                    isSignOut ? "Sign-out recorded successfully." : "Sign-in recorded successfully.",
                    isSignOut ? "Checked out successfully." : "Checked in successfully.",
                    { record, action: isSignOut ? "out" : "in" }
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "INTERNAL_SERVER_ERROR";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to toggle attendance."
                )
            );
        }
    }
}

module.exports = AttendanceController;
