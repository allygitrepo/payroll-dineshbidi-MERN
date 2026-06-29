const LeaveMasterService = require("./leaveMaster.service");
const { successResponse, errorResponse } = require("../../../utils/response");

class LeaveMasterController {
    /**
     * Get Leave Master configuration for a company
     */
    static async getAll(req, res) {
        const { companyId } = req.params;
        if (!companyId) {
            return res.status(400).json(
                errorResponse("VALIDATION_ERROR", "Company ID is required.", "Company ID is required.")
            );
        }

        try {
            const data = await LeaveMasterService.getLeaveMasterConfig(companyId, req.user.id);
            return res.status(200).json(
                successResponse(
                    "LEAVE_MASTER_RETRIEVED",
                    "Leave master configuration retrieved successfully.",
                    "Leave master configuration retrieved successfully.",
                    data
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "LEAVE_MASTER_RETRIEVE_FAILED";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to retrieve leave master configuration."
                )
            );
        }
    }

    /**
     * Save Leave Master configuration (cap + leave types)
     */
    static async save(req, res) {
        const { companyId } = req.params;
        if (!companyId) {
            return res.status(400).json(
                errorResponse("VALIDATION_ERROR", "Company ID is required.", "Company ID is required.")
            );
        }

        try {
            const updated = await LeaveMasterService.saveLeaveMasterConfig(companyId, req.user.id, req.body);
            return res.status(200).json(
                successResponse(
                    "LEAVE_MASTER_SAVED",
                    "Leave master configuration saved successfully.",
                    "Leave master configuration saved successfully.",
                    updated
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "SAVE_FAILED";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to save leave master configuration."
                )
            );
        }
    }

    /**
     * Delete a single leave type
     */
    static async delete(req, res) {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json(
                errorResponse("VALIDATION_ERROR", "ID is required.", "ID is required.")
            );
        }

        try {
            const updated = await LeaveMasterService.deleteLeaveType(id, req.user.id);
            return res.status(200).json(
                successResponse(
                    "LEAVE_TYPE_DELETED",
                    "Leave type deleted successfully.",
                    "Leave type deleted successfully.",
                    updated
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "DELETE_FAILED";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to delete leave type."
                )
            );
        }
    }
}

module.exports = LeaveMasterController;
