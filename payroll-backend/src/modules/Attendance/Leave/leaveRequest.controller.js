const LeaveRequestService = require("./leaveRequest.service");
const { successResponse, errorResponse } = require("../../../utils/response");

const getDurationInDays = (fromDate, toDate, leaveType) => {
    if (leaveType && leaveType.startsWith("Custom Leave (")) {
        const match = leaveType.match(/Custom Leave \(([\d.]+)\s*Days?\)/i);
        if (match && match[1]) {
            return parseFloat(match[1]);
        }
    }
    if (leaveType && leaveType.toLowerCase().includes("half day")) return 0.5;
    if (!fromDate || !toDate) return 0;
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const diffTime = end - start;
    if (diffTime < 0) return 0;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

const formatRequestWithLatestBalance = async (request) => {
    if (!request) return null;
    const reqJson = request.toJSON ? request.toJSON() : request;
    if (reqJson.status === "Pending" || reqJson.status === "Rejected") {
        reqJson.remaining_leaves = await LeaveRequestService.getLatestRemainingLeaves(reqJson.employee_id);
    }
    return reqJson;
};

class LeaveRequestController {
    async getAll(req, res) {
        try {
            const { companyId } = req.params;
            if (!companyId) {
                return res.status(400).json(
                    errorResponse("VALIDATION_ERROR", "Company ID is required.", "Company ID is required.")
                );
            }
            const requests = await LeaveRequestService.getAllByCompany(companyId);
            
            const cache = {};
            const formattedRequests = [];
            for (const r of requests) {
                const reqJson = r.toJSON ? r.toJSON() : r;
                if (reqJson.status === "Pending" || reqJson.status === "Rejected") {
                    const empId = reqJson.employee_id;
                    if (cache[empId] === undefined) {
                        cache[empId] = await LeaveRequestService.getLatestRemainingLeaves(empId);
                    }
                    reqJson.remaining_leaves = cache[empId];
                }
                formattedRequests.push(reqJson);
            }

            return res.status(200).json(
                successResponse("LEAVE_REQUESTS_RETRIEVED", "Leave requests retrieved successfully.", "Leave requests retrieved successfully.", formattedRequests)
            );
        } catch (err) {
            console.error("Error fetching leave requests:", err);
            return res.status(500).json(
                errorResponse("LEAVE_REQUESTS_RETRIEVE_FAILED", err.message, "Failed to retrieve leave requests.")
            );
        }
    }

    async create(req, res) {
        try {
            const { employeeId, companyId, leaveType, fromDate, toDate, description } = req.body;
            if (!employeeId || !companyId || !leaveType || !fromDate || !toDate || !description) {
                return res.status(400).json(
                    errorResponse("VALIDATION_ERROR", "All fields are required.", "All fields are required.")
                );
            }

            // Get current remaining leaves for the employee
            const latestRemaining = await LeaveRequestService.getLatestRemainingLeaves(employeeId);

            // Calculate requested duration
            const duration = getDurationInDays(fromDate, toDate, leaveType);

            // Fetch LeaveMaster configs for the company to validate
            try {
                const db = require("../../../database/models/index");
                const leaveConfigs = await db.LeaveMaster.findAll({
                    where: { company_id: companyId, status: true }
                });
                
                // 1. Validate specific leave type duration limits
                const leaveConfig = leaveConfigs.find(c => c.leave_type === leaveType);
                if (leaveConfig && leaveConfig.leave_days !== null && leaveConfig.leave_days !== undefined && leaveConfig.leave_days !== "") {
                    const maxDays = parseFloat(leaveConfig.leave_days);
                    if (duration > maxDays) {
                        return res.status(400).json(
                            errorResponse("LEAVE_LIMIT_EXCEEDED", `Requested leave duration (${duration} days) exceeds the maximum allowed limit for ${leaveType} (${maxDays} days).`, `Leave type limit exceeded. Max allowed is ${maxDays} days.`)
                        );
                    }
                }
            } catch (err) {
                console.error("Error validating leave limits:", err);
            }

            // 2. Validate overall remaining leaves balance
            if (duration > latestRemaining) {
                return res.status(400).json(
                    errorResponse("INSUFFICIENT_LEAVES", `Requested leave duration (${duration} days) exceeds the employee's remaining leaves balance (${latestRemaining} days).`, `Insufficient remaining leaves balance (${latestRemaining} days).`)
                );
            }

            const requestDate = new Date().toISOString().split("T")[0];

            // Get dynamic yearly leave cap
            let yearlyCap = 0;
            try {
                const db = require("../../../database/models/index");
                const leaveMaster = await db.LeaveMaster.findOne({
                    where: { company_id: companyId, status: true }
                });
                if (leaveMaster && leaveMaster.yearly_leave_cap !== null && leaveMaster.yearly_leave_cap !== undefined) {
                    yearlyCap = parseFloat(leaveMaster.yearly_leave_cap);
                }
            } catch (e) {
                console.error("Error fetching dynamic yearly cap for leave request:", e);
            }

            const request = await LeaveRequestService.create({
                employee_id: employeeId,
                company_id: companyId,
                leave_type: leaveType,
                from_date: fromDate,
                to_date: toDate,
                description,
                status: "Pending",
                request_date: requestDate,
                total_leaves: yearlyCap,
                remaining_leaves: latestRemaining,
            });

            // Fetch created request with employee details loaded
            const fullRequest = await LeaveRequestService.getById(request.id);
            const formatted = await formatRequestWithLatestBalance(fullRequest);
            return res.status(201).json(
                successResponse("LEAVE_REQUEST_CREATED", "Leave request submitted successfully.", "Leave request submitted successfully.", formatted)
            );
        } catch (err) {
            console.error("Error creating leave request:", err);
            return res.status(500).json(
                errorResponse("LEAVE_REQUEST_CREATE_FAILED", err.message, "Failed to submit leave request.")
            );
        }
    }

    async approve(req, res) {
        try {
            const { id } = req.params;
            const request = await LeaveRequestService.getById(id);
            if (!request) {
                return res.status(404).json(
                    errorResponse("NOT_FOUND", "Leave request not found.", "Leave request not found.")
                );
            }

            if (request.status === "Approved") {
                return res.status(400).json(
                    errorResponse("ALREADY_APPROVED", "Leave request is already approved.", "Leave request is already approved.")
                );
            }

            // Get latest remaining leaves balance for the employee
            const latestRemaining = await LeaveRequestService.getLatestRemainingLeaves(request.employee_id);

            // Deduct days count
            const duration = getDurationInDays(request.from_date, request.to_date, request.leave_type);
            const newRemaining = Math.max(0, latestRemaining - duration);

            const updatedRequest = await LeaveRequestService.updateStatus(id, "Approved", newRemaining);
            const formatted = await formatRequestWithLatestBalance(updatedRequest);
            return res.status(200).json(
                successResponse("LEAVE_REQUEST_APPROVED", "Leave request approved successfully.", "Leave request approved successfully.", formatted)
            );
        } catch (err) {
            console.error("Error approving leave request:", err);
            return res.status(500).json(
                errorResponse("LEAVE_REQUEST_APPROVE_FAILED", err.message, "Failed to approve leave request.")
            );
        }
    }

    async reject(req, res) {
        try {
            const { id } = req.params;
            const request = await LeaveRequestService.getById(id);
            if (!request) {
                return res.status(404).json(
                    errorResponse("NOT_FOUND", "Leave request not found.", "Leave request not found.")
                );
            }

            const updatedRequest = await LeaveRequestService.updateStatus(id, "Rejected");
            const formatted = await formatRequestWithLatestBalance(updatedRequest);
            return res.status(200).json(
                successResponse("LEAVE_REQUEST_REJECTED", "Leave request rejected successfully.", "Leave request rejected successfully.", formatted)
            );
        } catch (err) {
            console.error("Error rejecting leave request:", err);
            return res.status(500).json(
                errorResponse("LEAVE_REQUEST_REJECT_FAILED", err.message, "Failed to reject leave request.")
            );
        }
    }
}

module.exports = new LeaveRequestController();
