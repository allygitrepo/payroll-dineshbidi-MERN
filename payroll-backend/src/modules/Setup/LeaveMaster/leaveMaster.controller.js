const LeaveMasterService = require("./leaveMaster.service");
const LeaveBalanceService = require("../../Attendance/Leave/leaveBalance.service");
const LeaveAccrualService = require("../../Attendance/Leave/leaveAccrual.service");
const db = require("../../../database/models/index");
const { successResponse, errorResponse } = require("../../../utils/response");
const logger = require("../../../utils/logger");

class LeaveMasterController {
    /**
     * Tab 1: Leave Types
     */
    static async getTypes(req, res) {
        try {
            const { companyId } = req.params;
            const data = await LeaveMasterService.getLeaveTypes(companyId);
            return res.status(200).json(
                successResponse("LEAVE_TYPES_RETRIEVED", "Leave types retrieved successfully.", "Leave types retrieved successfully.", data)
            );
        } catch (err) {
            logger.error("Error retrieving leave types", err, { companyId: req.params.companyId });
            return res.status(500).json(errorResponse("RETRIEVE_FAILED", err.message, "Failed to retrieve leave types."));
        }
    }

    static async saveType(req, res) {
        try {
            const { companyId } = req.params;
            const data = await LeaveMasterService.saveLeaveType(companyId, req.body);
            return res.status(200).json(
                successResponse("LEAVE_TYPE_SAVED", "Leave type saved successfully.", "Leave type saved successfully.", data)
            );
        } catch (err) {
            logger.error("Error saving leave type", err, { companyId: req.params.companyId, body: req.body });
            if (err.name === "SequelizeUniqueConstraintError") {
                return res.status(409).json(
                    errorResponse("DUPLICATE_TYPE", "A leave type with this name or code already exists.", "A leave type with this name or code already exists.")
                );
            }
            return res.status(500).json(errorResponse("SAVE_FAILED", err.message, "Failed to save leave type."));
        }
    }

    static async deleteType(req, res) {
        try {
            const { companyId, id } = req.params;
            const result = await LeaveMasterService.deleteLeaveType(companyId, id);
            return res.status(200).json(
                successResponse("LEAVE_TYPE_DELETED", "Leave type deleted successfully.", "Leave type deleted successfully.", result)
            );
        } catch (err) {
            logger.error("Error deleting leave type", err, { companyId: req.params.companyId, typeId: req.params.id });
            return res.status(500).json(errorResponse("DELETE_FAILED", err.message, "Failed to delete leave type."));
        }
    }

    /**
     * Tab 2: Leave Policies Matrix
     */
    static async getPolicies(req, res) {
        try {
            const { companyId } = req.params;
            const data = await LeaveMasterService.getLeavePoliciesMatrix(companyId);
            return res.status(200).json(
                successResponse("LEAVE_POLICIES_RETRIEVED", "Leave policies retrieved successfully.", "Leave policies retrieved successfully.", data)
            );
        } catch (err) {
            logger.error("Error retrieving leave policies", err, { companyId: req.params.companyId });
            return res.status(500).json(errorResponse("RETRIEVE_FAILED", err.message, "Failed to retrieve leave policies."));
        }
    }

    static async savePolicy(req, res) {
        try {
            const { companyId } = req.params;
            const data = await LeaveMasterService.saveLeavePolicy(companyId, req.body);
            return res.status(200).json(
                successResponse("LEAVE_POLICY_SAVED", "Leave policy saved successfully.", "Leave policy saved successfully.", data)
            );
        } catch (err) {
            logger.error("Error saving leave policy", err, { companyId: req.params.companyId, body: req.body });
            if (err.name === "SequelizeUniqueConstraintError") {
                return res.status(409).json(
                    errorResponse("DUPLICATE_POLICY", "A policy configuration already exists for this employee type and leave type.", "A policy configuration already exists for this employee type and leave type.")
                );
            }
            return res.status(500).json(errorResponse("SAVE_FAILED", err.message, "Failed to save leave policy."));
        }
    }

    /**
     * Tab 3: Global Leave Settings
     */
    static async getSettings(req, res) {
        try {
            const { companyId } = req.params;
            const data = await LeaveMasterService.getGlobalSettings(companyId);
            return res.status(200).json(
                successResponse("GLOBAL_SETTINGS_RETRIEVED", "Global leave settings retrieved successfully.", "Global leave settings retrieved successfully.", data)
            );
        } catch (err) {
            logger.error("Error retrieving global settings", err, { companyId: req.params.companyId });
            return res.status(500).json(errorResponse("RETRIEVE_FAILED", err.message, "Failed to retrieve settings."));
        }
    }

    static async saveSettings(req, res) {
        try {
            const { companyId } = req.params;
            const data = await LeaveMasterService.saveGlobalSettings(companyId, req.body);
            return res.status(200).json(
                successResponse("GLOBAL_SETTINGS_SAVED", "Global leave settings saved successfully.", "Global leave settings saved successfully.", data)
            );
        } catch (err) {
            logger.error("Error saving global settings", err, { companyId: req.params.companyId, body: req.body });
            return res.status(500).json(errorResponse("SAVE_FAILED", err.message, "Failed to save settings."));
        }
    }

    /**
     * Dynamic Employee Type Master
     */
    static async getEmployeeTypes(req, res) {
        try {
            const data = await db.EmployeeType.findAll({ where: { status: true } });
            return res.status(200).json(
                successResponse("EMPLOYEE_TYPES_RETRIEVED", "Employee types retrieved successfully.", "Employee types retrieved successfully.", data)
            );
        } catch (err) {
            logger.error("Error retrieving employee types", err);
            return res.status(500).json(errorResponse("RETRIEVE_FAILED", err.message, "Failed to retrieve employee types."));
        }
    }

    /**
     * Fetch Live Employee Balances
     */
    static async getBalances(req, res) {
        try {
            const { employeeId } = req.params;
            const { companyId, leaveYear } = req.query;
            if (!companyId) {
                return res.status(400).json(errorResponse("VALIDATION_ERROR", "Company ID is required.", "Company ID is required."));
            }
            const data = await LeaveBalanceService.getEmployeeBalances(companyId, employeeId, leaveYear);
            return res.status(200).json(
                successResponse("BALANCES_RETRIEVED", "Balances retrieved successfully.", "Balances retrieved successfully.", data)
            );
        } catch (err) {
            logger.error("Error fetching employee balances", err, { employeeId: req.params.employeeId, query: req.query });
            return res.status(500).json(errorResponse("RETRIEVE_FAILED", err.message, "Failed to retrieve balances."));
        }
    }

    /**
     * Manual Balance Adjustment
     */
    static async adjustBalance(req, res) {
        try {
            const { companyId } = req.body;
            const changedBy = req.user ? req.user.id : null;
            if (!companyId) {
                return res.status(400).json(errorResponse("VALIDATION_ERROR", "Company ID is required.", "Company ID is required."));
            }
            const data = await LeaveMasterService.adjustBalance(companyId, req.body, changedBy);
            return res.status(200).json(
                successResponse("BALANCE_ADJUSTED", "Balance adjusted successfully.", "Balance adjusted successfully.", data)
            );
        } catch (err) {
            logger.error("Error adjusting balance manually", err, { body: req.body });
            return res.status(500).json(errorResponse("ADJUSTMENT_FAILED", err.message, "Failed to adjust balance."));
        }
    }

    /**
     * Run Monthly Accrual manually
     */
    static async runAccrual(req, res) {
        try {
            const { companyId } = req.params;
            const changedBy = req.user ? req.user.id : null;
            const result = await LeaveAccrualService.processMonthlyAccrual(companyId, changedBy);
            return res.status(200).json(
                successResponse("ACCRUAL_COMPLETED", "Accrual processed successfully.", "Accrual processed successfully.", result)
            );
        } catch (err) {
            logger.error("Error running monthly accrual manually", err, { companyId: req.params.companyId });
            return res.status(500).json(errorResponse("ACCRUAL_FAILED", err.message, "Failed to run accrual."));
        }
    }

    /**
     * Run Year-End Carry Forward manually
     */
    static async runCarryForward(req, res) {
        try {
            const { companyId } = req.params;
            const { fromYear, toYear } = req.body;
            const changedBy = req.user ? req.user.id : null;
            if (!fromYear || !toYear) {
                return res.status(400).json(errorResponse("VALIDATION_ERROR", "fromYear and toYear are required.", "From Year and To Year are required."));
            }
            const result = await LeaveAccrualService.processYearEndCarryForward(companyId, fromYear, toYear, changedBy);
            return res.status(200).json(
                successResponse("CARRY_FORWARD_COMPLETED", "Year-end carry forward processed successfully.", "Year-end carry forward processed successfully.", result)
            );
        } catch (err) {
            logger.error("Error running carry forward manually", err, { companyId: req.params.companyId, body: req.body });
            return res.status(500).json(errorResponse("CARRY_FORWARD_FAILED", err.message, "Failed to run carry forward."));
        }
    }

}

module.exports = LeaveMasterController;
