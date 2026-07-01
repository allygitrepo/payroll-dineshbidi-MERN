const LeaveValidationService = require("./leaveValidation.service");
const LeaveBalanceService = require("./leaveBalance.service");
const db = require("../../../database/models/index");
const { successResponse, errorResponse } = require("../../../utils/response");
const logger = require("../../../utils/logger");
const { LEAVE_STATUS, TRANSACTION_TYPE, ATTENDANCE_STATUS, DAY_TYPE } = require("./leave.constants");
const fs = require("fs");
const path = require("path");

// Helper to save base64 to file
function saveBase64File(base64Str, employeeId) {
    if (!base64Str || !base64Str.startsWith("data:")) {
        return base64Str;
    }

    try {
        const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return base64Str;
        }

        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, "base64");

        let ext = "bin";
        if (mimeType.includes("pdf")) {
            ext = "pdf";
        } else if (mimeType.includes("png")) {
            ext = "png";
        } else if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
            ext = "jpg";
        } else if (mimeType.includes("gif")) {
            ext = "gif";
        }

        const uploadsDir = path.join(__dirname, "..", "..", "..", "..", "uploads", "leave_doc");
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const filename = `leave_${employeeId}_${Date.now()}.${ext}`;
        const filePath = path.join(uploadsDir, filename);

        fs.writeFileSync(filePath, buffer);

        // Served statically at /payroll/uploads/leave_doc/
        return `uploads/leave_doc/${filename}`;
    } catch (err) {
        console.error("Failed to save base64 file upload:", err);
        return base64Str;
    }
}

class LeaveRequestController {
    /**
     * Get all leave requests for a company
     */
    async getAll(req, res) {
        try {
            const { companyId } = req.params;
            if (!companyId) {
                return res.status(400).json(
                    errorResponse("VALIDATION_ERROR", "Company ID is required.", "Company ID is required.")
                );
            }

            const employeeInclude = {
                model: db.Employee,
                as: "employee",
                attributes: ["id", "name", "image_path", "uan", "mobile", "employee_type"],
            };

            if (req.user?.role_name === 'Contractor' && req.user?.contractor_id) {
                employeeInclude.where = { contractor_id: req.user.contractor_id };
                employeeInclude.required = true;
            }

            const requests = await db.LeaveRequest.findAll({
                where: { company_id: companyId },
                include: [
                    employeeInclude,
                    {
                        model: db.LeaveType,
                        as: "leaveType",
                        attributes: ["id", "name", "code", "is_paid"],
                    }
                ],
                order: [["created_at", "DESC"]],
            });

            // Format requests with their live dynamic balances calculated on-the-fly
            const formattedRequests = [];
            for (const r of requests) {
                const reqJson = r.toJSON ? r.toJSON() : r;
                const yearStr = reqJson.from_date.split("-")[0];
                
                // Get dynamic remaining balance
                const remaining = await LeaveValidationService.getDynamicRemainingBalance(
                    companyId,
                    reqJson.employee_id,
                    reqJson.leave_type_id,
                    yearStr
                );

                reqJson.remaining_leaves = remaining;
                formattedRequests.push(reqJson);
            }

            return res.status(200).json(
                successResponse("LEAVE_REQUESTS_RETRIEVED", "Leave requests retrieved successfully.", "Leave requests retrieved successfully.", formattedRequests)
            );
        } catch (err) {
            logger.error("Error fetching leave requests", err, { companyId: req.params.companyId });
            return res.status(500).json(
                errorResponse("LEAVE_REQUESTS_RETRIEVE_FAILED", err.message, "Failed to retrieve leave requests.")
            );
        }
    }

    async create(req, res) {
        const transaction = await db.sequelize.transaction();
        try {
            const { employeeId, companyId, leaveTypeId, fromDate, toDate, dayType, reason, status, attachmentPath } = req.body;
            if (!employeeId || !companyId || !leaveTypeId || !fromDate || !toDate || !dayType) {
                await transaction.rollback();
                return res.status(400).json(
                    errorResponse("VALIDATION_ERROR", "Required fields are missing.", "Required fields are missing.")
                );
            }

            // Verify employee existence and contractor association
            const employeeObj = await db.Employee.findByPk(employeeId, { transaction });
            if (!employeeObj || employeeObj.company_id !== companyId) {
                await transaction.rollback();
                return res.status(404).json(
                    errorResponse("NOT_FOUND", "Employee not found or does not belong to this company.", "Employee not found.")
                );
            }

            if (req.user?.role_name === 'Contractor' && req.user?.contractor_id) {
                if (employeeObj.contractor_id !== req.user.contractor_id) {
                    await transaction.rollback();
                    return res.status(403).json(
                        errorResponse("ACCESS_DENIED", "Access denied. You can only submit leave requests for your own employees.", "Access denied.")
                    );
                }
            }

            const appliedStatus = status || LEAVE_STATUS.SUBMITTED; // Default to Submitted if not Draft

            const savedAttachmentPath = attachmentPath && attachmentPath.startsWith("data:")
                ? saveBase64File(attachmentPath, employeeId)
                : attachmentPath;

            // 1. Run full leave validation (only if not a draft)
            let leaveDays = 1.0;
            let leaveYear = fromDate.split("-")[0];
            let leaveType = null;

            if (appliedStatus === LEAVE_STATUS.SUBMITTED) {
                const validation = await LeaveValidationService.validateApplication(companyId, {
                    employeeId,
                    leaveTypeId,
                    fromDate,
                    toDate,
                    dayType,
                    attachmentPath: savedAttachmentPath
                }, null, transaction);
                leaveDays = validation.leaveDays;
                leaveYear = validation.leaveYear;
                leaveType = validation.leaveType;
            } else {
                // For Drafts, calculate simple duration using standard calender sandwich toggle
                const company = await db.Company.findByPk(companyId, { transaction });
                const sandwichEnabled = company ? company.sandwich_policy_enabled : false;
                leaveDays = await LeaveValidationService.calculateLeaveDays(companyId, fromDate, toDate, dayType, sandwichEnabled);
                leaveType = await db.LeaveType.findByPk(leaveTypeId, { transaction });
            }

            // 2. Create the request
            const newRequest = await db.LeaveRequest.create({
                employee_id: employeeId,
                company_id: companyId,
                leave_type_id: leaveTypeId,
                leave_type: leaveType ? leaveType.name : "Unknown",
                from_date: fromDate,
                to_date: toDate,
                number_of_days: leaveDays,
                day_type: dayType,
                reason: reason || "",
                attachment_path: savedAttachmentPath || null,
                status: appliedStatus,
                applied_date: new Date().toISOString().split("T")[0]
            }, { transaction });

            // 3. Log initial transaction if submitted
            if (appliedStatus === LEAVE_STATUS.SUBMITTED) {
                await db.LeaveTransaction.create({
                    company_id: companyId,
                    employee_id: employeeId,
                    leave_type_id: leaveTypeId,
                    leave_request_id: newRequest.id,
                    transaction_type: TRANSACTION_TYPE.LEAVE_APPLIED,
                    leave_year: leaveYear,
                    days: -leaveDays, // Shows potential deduction
                    is_paid: leaveType ? leaveType.is_paid : true,
                    description: `Leave application submitted from ${fromDate} to ${toDate} (${leaveDays} days)`
                }, { transaction });
            }

            await transaction.commit();

            const fullRequest = await db.LeaveRequest.findByPk(newRequest.id, {
                include: [
                    { model: db.Employee, as: "employee", attributes: ["id", "name", "employee_type"] },
                    { model: db.LeaveType, as: "leaveType", attributes: ["id", "name", "code", "is_paid"] }
                ]
            });

            return res.status(201).json(
                successResponse("LEAVE_REQUEST_CREATED", "Leave request submitted successfully.", "Leave request submitted successfully.", fullRequest)
            );
        } catch (err) {
            await transaction.rollback();
            const logBody = { ...req.body };
            if (logBody.attachmentPath && logBody.attachmentPath.startsWith("data:")) {
                logBody.attachmentPath = `[Base64 File Content: ${logBody.attachmentPath.substring(0, 30)}...]`;
            }
            logger.error("Error creating leave request", err, { body: logBody });

            const errMsg = err.message || "";
            // Overlapping leave range -> 409 Conflict
            if (errMsg.includes("overlapping") || errMsg.includes("overlap")) {
                return res.status(409).json(
                    errorResponse("LEAVE_OVERLAP", errMsg, "There is an overlapping leave request already submitted or approved for this date range.")
                );
            }
            // Balance, document required, inactive leave type, half-day date mismatch -> 422 Unprocessable Entity
            if (errMsg.includes("Insufficient") || errMsg.includes("Supporting document") || errMsg.includes("inactive") || errMsg.includes("Half-day")) {
                return res.status(422).json(
                    errorResponse("LEAVE_VALIDATION_FAILED", errMsg, errMsg)
                );
            }

            return res.status(500).json(
                errorResponse("LEAVE_REQUEST_CREATE_FAILED", err.message, "Failed to submit leave request.")
            );
        }
    }

    /**
     * Calculate Leave Days dynamically
     */
    async calculateDays(req, res) {
        try {
            const { companyId, fromDate, toDate, dayType } = req.body;
            if (!companyId || !fromDate || !toDate) {
                return res.status(400).json(
                    errorResponse("VALIDATION_ERROR", "companyId, fromDate, and toDate are required.", "Invalid query parameters.")
                );
            }

            const company = await db.Company.findByPk(companyId);
            const sandwichEnabled = company ? company.sandwich_policy_enabled : false;
            
            const days = await LeaveValidationService.calculateLeaveDays(
                companyId,
                fromDate,
                toDate,
                dayType || "Full Day",
                sandwichEnabled
            );

            return res.status(200).json(
                successResponse("DAYS_CALCULATED", "Leave days calculated successfully.", "Calculated leave days count.", { days })
            );
        } catch (err) {
            logger.error("Error calculating leave days", err, { body: req.body });
            return res.status(500).json(
                errorResponse("CALCULATE_DAYS_FAILED", err.message, "Failed to calculate leave days.")
            );
        }
    }

    /**
     * Approve a submitted leave request
     */
    async approve(req, res) {
        const transaction = await db.sequelize.transaction();
        try {
            const { id } = req.params;
            const changedBy = req.user ? req.user.id : null;

            // Role validation: Only Admin, Owner, or Contractor can approve
            const userRole = req.user?.role_name || '';
            const isAdmin = userRole === 'Admin' || userRole === 'ADMIN' || userRole === 'OWNER';
            const isContractor = userRole === 'Contractor';
            if (!isAdmin && !isContractor) {
                await transaction.rollback();
                return res.status(403).json(
                    errorResponse("ACCESS_DENIED", "Access denied. You do not have permission to approve leaves.", "Access denied.")
                );
            }

            const request = await db.LeaveRequest.findByPk(id, {
                include: [
                    { model: db.LeaveType, as: "leaveType" },
                    { model: db.Employee, as: "employee", attributes: ["id", "contractor_id"] }
                ],
                transaction
            });

            if (!request) {
                await transaction.rollback();
                return res.status(404).json(errorResponse("NOT_FOUND", "Leave request not found.", "Leave request not found."));
            }

            if (isContractor && req.user?.contractor_id) {
                if (!request.employee || request.employee.contractor_id !== req.user.contractor_id) {
                    await transaction.rollback();
                    return res.status(403).json(
                        errorResponse("ACCESS_DENIED", "Access denied. You can only approve leave requests for your own employees.", "Access denied.")
                    );
                }
            }

            if (request.status !== LEAVE_STATUS.SUBMITTED) {
                await transaction.rollback();
                return res.status(400).json(errorResponse("INVALID_STATE", `Cannot approve a leave request in status: ${request.status}.`, "Invalid request status."));
            }

            const leaveYear = request.from_date.split("-")[0];
            const duration = parseFloat(request.number_of_days);

            // Double check remaining balance right before approval for Paid types
            if (request.leaveType && request.leaveType.is_paid) {
                const dynamicRemaining = await LeaveValidationService.getDynamicRemainingBalance(
                    request.company_id,
                    request.employee_id,
                    request.leave_type_id,
                    leaveYear,
                    transaction
                );
                if (dynamicRemaining < 0) {
                    throw new Error(`Insufficient leave balance to approve this request.`);
                }
            }

            const userObj = await db.User.findByPk(req.user.id, { transaction });
            const actionByName = userObj ? userObj.user_name : (req.user.user_name || req.user.user_id);

            // 1. Update request status
            await request.update({ 
                status: LEAVE_STATUS.APPROVED,
                action_by_name: actionByName,
                action_by_role: req.user.role_name
            }, { transaction });

            // 2. Adjust Leave Balance (Used is incremented)
            const balanceObj = await LeaveBalanceService.getOrCreateBalance(request.company_id, request.employee_id, request.leave_type_id, leaveYear, transaction);
            const currentUsed = parseFloat(balanceObj.used) || 0.00;
            await balanceObj.update({ used: parseFloat((currentUsed + duration).toFixed(2)) }, { transaction });

            // 3. Create Leave Transaction ledger
            await db.LeaveTransaction.create({
                company_id: request.company_id,
                employee_id: request.employee_id,
                leave_type_id: request.leave_type_id,
                leave_request_id: request.id,
                transaction_type: TRANSACTION_TYPE.LEAVE_APPROVAL,
                leave_year: leaveYear,
                days: -duration,
                is_paid: request.leaveType ? request.leaveType.is_paid : true,
                description: `Approved leave application from ${request.from_date} to ${request.to_date}`,
                changed_by: changedBy
            }, { transaction });

            // 4. Update Attendance records automatically
            const start = LeaveValidationService.parseLocalDate(request.from_date);
            const end = LeaveValidationService.parseLocalDate(request.to_date);
            let current = new Date(start);

            const company = await db.Company.findByPk(request.company_id, { transaction });
            const sandwichEnabled = company ? company.sandwich_policy_enabled : false;

            while (current <= end) {
                const yyyy = current.getFullYear();
                const mm = String(current.getMonth() + 1).padStart(2, "0");
                const dd = String(current.getDate()).padStart(2, "0");
                const currentStr = `${yyyy}-${mm}-${dd}`;

                let shouldUpdateAttendance = true;
                if (!sandwichEnabled) {
                    const holiday = await LeaveValidationService.isHoliday(request.company_id, currentStr);
                    if (holiday) shouldUpdateAttendance = false;
                }

                if (shouldUpdateAttendance) {
                    let attStatus = ATTENDANCE_STATUS.PAID_LEAVE;
                    if (request.leaveType) {
                        if (!request.leaveType.is_paid) {
                            attStatus = ATTENDANCE_STATUS.UNPAID_LEAVE;
                        } else if (request.leaveType.code === "COMP_OFF") {
                            attStatus = ATTENDANCE_STATUS.COMP_OFF;
                        }
                    }

                    if (request.day_type === DAY_TYPE.FIRST_HALF || request.day_type === DAY_TYPE.SECOND_HALF) {
                        attStatus = ATTENDANCE_STATUS.HALF_DAY;
                    }

                    // Find or create attendance for this date
                    const [attRecord] = await db.Attendance.findOrCreate({
                        where: { employee_id: request.employee_id, date: currentStr },
                        defaults: {
                            employee_id: request.employee_id,
                            date: currentStr,
                            status: true,
                            attendance_status: attStatus
                        },
                        transaction
                    });

                    // Update existing records
                    if (attRecord.attendance_status !== attStatus) {
                        await attRecord.update({ attendance_status: attStatus }, { transaction });
                    }
                }

                current.setDate(current.getDate() + 1);
            }

            await transaction.commit();

            const fullRequest = await db.LeaveRequest.findByPk(id, {
                include: [
                    { model: db.Employee, as: "employee", attributes: ["id", "name", "employee_type"] },
                    { model: db.LeaveType, as: "leaveType", attributes: ["id", "name", "code", "is_paid"] }
                ]
            });

            return res.status(200).json(
                successResponse("LEAVE_REQUEST_APPROVED", "Leave request approved successfully.", "Leave request approved successfully.", fullRequest)
            );
        } catch (err) {
            await transaction.rollback();
            logger.error("Error approving leave request", err, { id: req.params.id });

            const errMsg = err.message || "";
            if (errMsg.includes("Insufficient")) {
                return res.status(422).json(
                    errorResponse("INSUFFICIENT_BALANCE", errMsg, errMsg)
                );
            }

            return res.status(500).json(
                errorResponse("LEAVE_REQUEST_APPROVE_FAILED", err.message, "Failed to approve leave request.")
            );
        }
    }

    /**
     * Reject a submitted leave request
     */
     async reject(req, res) {
        const transaction = await db.sequelize.transaction();
        try {
            const { id } = req.params;

            // Role validation: Only Admin, Owner, or Contractor can reject
            const userRole = req.user?.role_name || '';
            const isAdmin = userRole === 'Admin' || userRole === 'ADMIN' || userRole === 'OWNER';
            const isContractor = userRole === 'Contractor';
            if (!isAdmin && !isContractor) {
                await transaction.rollback();
                return res.status(403).json(
                    errorResponse("ACCESS_DENIED", "Access denied. You do not have permission to reject leaves.", "Access denied.")
                );
            }

            const request = await db.LeaveRequest.findByPk(id, {
                include: [{ model: db.Employee, as: "employee", attributes: ["id", "contractor_id"] }],
                transaction
            });
            if (!request) {
                await transaction.rollback();
                return res.status(404).json(errorResponse("NOT_FOUND", "Leave request not found.", "Leave request not found."));
            }

            if (isContractor && req.user?.contractor_id) {
                if (!request.employee || request.employee.contractor_id !== req.user.contractor_id) {
                    await transaction.rollback();
                    return res.status(403).json(
                        errorResponse("ACCESS_DENIED", "Access denied. You can only reject leave requests for your own employees.", "Access denied.")
                    );
                }
            }

            if (request.status !== LEAVE_STATUS.SUBMITTED) {
                await transaction.rollback();
                return res.status(400).json(errorResponse("INVALID_STATE", `Cannot reject a leave request in status: ${request.status}.`, "Invalid request status."));
            }

            const userObj = await db.User.findByPk(req.user.id, { transaction });
            const actionByName = userObj ? userObj.user_name : (req.user.user_name || req.user.user_id);

            await request.update({ 
                status: LEAVE_STATUS.REJECTED,
                action_by_name: actionByName,
                action_by_role: req.user.role_name
            }, { transaction });

            await transaction.commit();

            return res.status(200).json(
                successResponse("LEAVE_REQUEST_REJECTED", "Leave request rejected successfully.", "Leave request rejected successfully.", request)
            );
        } catch (err) {
            await transaction.rollback();
            logger.error("Error rejecting leave request", err, { id: req.params.id });
            return res.status(500).json(
                errorResponse("LEAVE_REQUEST_REJECT_FAILED", err.message, "Failed to reject leave request.")
            );
        }
    }

    /**
     * Cancel an approved leave request and restore balances
     */
    async cancel(req, res) {
        const transaction = await db.sequelize.transaction();
        try {
            const { id } = req.params;
            const changedBy = req.user ? req.user.id : null;

            // Role validation: Only Admin, Owner, or Contractor can cancel
            const userRole = req.user?.role_name || '';
            const isAdmin = userRole === 'Admin' || userRole === 'ADMIN' || userRole === 'OWNER';
            const isContractor = userRole === 'Contractor';
            if (!isAdmin && !isContractor) {
                await transaction.rollback();
                return res.status(403).json(
                    errorResponse("ACCESS_DENIED", "Access denied. You do not have permission to cancel leaves.", "Access denied.")
                );
            }

            const request = await db.LeaveRequest.findByPk(id, {
                include: [
                    { model: db.LeaveType, as: "leaveType" },
                    { model: db.Employee, as: "employee", attributes: ["id", "contractor_id"] }
                ],
                transaction
            });

            if (!request) {
                await transaction.rollback();
                return res.status(404).json(errorResponse("NOT_FOUND", "Leave request not found.", "Leave request not found."));
            }

            if (isContractor && req.user?.contractor_id) {
                if (!request.employee || request.employee.contractor_id !== req.user.contractor_id) {
                    await transaction.rollback();
                    return res.status(403).json(
                        errorResponse("ACCESS_DENIED", "Access denied. You can only cancel leave requests for your own employees.", "Access denied.")
                    );
                }
            }

            if (request.status !== LEAVE_STATUS.APPROVED) {
                await transaction.rollback();
                return res.status(400).json(errorResponse("INVALID_STATE", "Only approved leave requests can be cancelled.", "Only approved leaves can be cancelled."));
            }

            const leaveYear = request.from_date.split("-")[0];
            const duration = parseFloat(request.number_of_days);

            const userObj = await db.User.findByPk(req.user.id, { transaction });
            const actionByName = userObj ? userObj.user_name : (req.user.user_name || req.user.user_id);

            // 1. Update request status to Cancelled
            await request.update({ 
                status: LEAVE_STATUS.CANCELLED,
                action_by_name: actionByName,
                action_by_role: req.user.role_name
            }, { transaction });

            // 2. Revert Leave Balance (Used is decremented)
            const balanceObj = await LeaveBalanceService.getOrCreateBalance(request.company_id, request.employee_id, request.leave_type_id, leaveYear, transaction);
            const currentUsed = parseFloat(balanceObj.used) || 0.00;
            const newUsed = Math.max(0, currentUsed - duration);
            await balanceObj.update({ used: parseFloat(newUsed.toFixed(2)) }, { transaction });

            // 3. Log Cancelled Transaction ledger (positive correction)
            await db.LeaveTransaction.create({
                company_id: request.company_id,
                employee_id: request.employee_id,
                leave_type_id: request.leave_type_id,
                leave_request_id: request.id,
                transaction_type: TRANSACTION_TYPE.LEAVE_CANCELLATION,
                leave_year: leaveYear,
                days: duration,
                is_paid: request.leaveType ? request.leaveType.is_paid : true,
                description: `Cancelled approved leave application from ${request.from_date} to ${request.to_date}`,
                changed_by: changedBy
            }, { transaction });

            // 4. Restore Attendance records (Remove or revert leave status to default Present)
            const start = LeaveValidationService.parseLocalDate(request.from_date);
            const end = LeaveValidationService.parseLocalDate(request.to_date);
            let current = new Date(start);

            while (current <= end) {
                const yyyy = current.getFullYear();
                const mm = String(current.getMonth() + 1).padStart(2, "0");
                const dd = String(current.getDate()).padStart(2, "0");
                const currentStr = `${yyyy}-${mm}-${dd}`;

                const attRecord = await db.Attendance.findOne({
                    where: { employee_id: request.employee_id, date: currentStr },
                    transaction
                });

                if (attRecord) {
                    if (attRecord.sign_in_time === null && attRecord.sign_out_time === null) {
                        await attRecord.destroy({ transaction });
                    } else {
                        await attRecord.update({ attendance_status: ATTENDANCE_STATUS.PRESENT }, { transaction });
                    }
                }

                current.setDate(current.getDate() + 1);
            }

            await transaction.commit();

            const fullRequest = await db.LeaveRequest.findByPk(id, {
                include: [
                    { model: db.Employee, as: "employee", attributes: ["id", "name", "employee_type"] },
                    { model: db.LeaveType, as: "leaveType", attributes: ["id", "name", "code", "is_paid"] }
                ]
            });

            return res.status(200).json(
                successResponse("LEAVE_REQUEST_CANCELLED", "Leave request cancelled and balances restored.", "Leave request cancelled successfully.", fullRequest)
            );
        } catch (err) {
            await transaction.rollback();
            logger.error("Error cancelling leave request", err, { id: req.params.id });
            return res.status(500).json(
                errorResponse("LEAVE_REQUEST_CANCEL_FAILED", err.message, "Failed to cancel leave request.")
            );
        }
    }
}

module.exports = new LeaveRequestController();
