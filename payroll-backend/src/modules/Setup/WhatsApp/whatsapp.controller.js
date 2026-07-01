const WhatsAppService = require("./whatsapp.service");
const { successResponse, errorResponse } = require("../../../utils/response");

class WhatsAppController {
    /**
     * Initiate or refresh the WhatsApp Instance
     */
    static async initiate(req, res) {
        try {
            // We assume authenticateJWT middleware sets req.user.company_id
            const companyId = req.user.company_id || req.user.id;
            if (!companyId) {
                return res.status(400).json(errorResponse("MISSING_COMPANY_ID", "User is not associated with any company.", "User is not associated with any company."));
            }

            const result = await WhatsAppService.initiateOrRefreshInstance(companyId);
            return res.status(200).json(successResponse("WHATSAPP_INITIATED", "WhatsApp Initiated", "Successfully initiated WhatsApp instance", result));
        } catch (error) {
            return res.status(500).json(errorResponse("SERVER_ERROR", error.message, error.message));
        }
    }

    /**
     * Get live status of the WhatsApp Instance
     */
    static async getStatus(req, res) {
        try {
            const companyId = req.user.company_id || req.user.id;
            if (!companyId) {
                return res.status(400).json(errorResponse("MISSING_COMPANY_ID", "User is not associated with any company.", "User is not associated with any company."));
            }

            const result = await WhatsAppService.getInstanceStatus(companyId);
            return res.status(200).json(successResponse("WHATSAPP_STATUS", "WhatsApp Status", "Successfully retrieved status", result));
        } catch (error) {
            return res.status(500).json(errorResponse("SERVER_ERROR", error.message, error.message));
        }
    }

    /**
     * Delete/Disconnect the WhatsApp Instance
     */
    static async disconnect(req, res) {
        try {
            const companyId = req.user.company_id || req.user.id;
            if (!companyId) {
                return res.status(400).json(errorResponse("MISSING_COMPANY_ID", "User is not associated with any company.", "User is not associated with any company."));
            }

            const result = await WhatsAppService.deleteInstance(companyId);
            return res.status(200).json(successResponse("WHATSAPP_DISCONNECTED", "WhatsApp Disconnected", result.message, null));
        } catch (error) {
            return res.status(500).json(errorResponse("SERVER_ERROR", error.message, error.message));
        }
    }
}

module.exports = WhatsAppController;
