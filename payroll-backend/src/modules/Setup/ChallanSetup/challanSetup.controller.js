const ChallanSetupService = require("./challanSetup.service");
const { createChallanSetupSchema, updateChallanSetupSchema } = require("./challanSetup.validators");
const { successResponse, errorResponse } = require("../../../utils/response");

/**
 * Formats Joi validation error messages to be user-friendly by removing double quotes
 * and converting snake_case keys to clean Title Case labels.
 */
const formatJoiMessage = (message) => {
    if (!message) return "";
    let clean = message.replace(/"/g, "");

    const mapping = {
        company_id: "Company ID",
        start_date: "Start Date",
        end_date: "End Date",
        salary_limit: "Salary Limit",
        edli_wages: "EDLI Wages",
        ac1_ee_male: "A/C No.1 EE Share (Male)",
        ac1_ee_female: "A/C No.1 EE Share (Female)",
        ac1_er: "A/C No.1 ER Share",
        ac2: "A/C No.2 ER Share",
        ac10: "A/C No.10 ER Share",
        ac21: "A/C No.21 ER Share",
        ac22: "A/C No.22 ER Share",
        ac2_min: "A/C No.2 Minimum Amount",
        ac22_min: "A/C No.22 Minimum Amount",
        pmrpy: "PMRPY Share",
        esic_wages: "ESIC Salary Limit",
        employee_share: "ESIC Employee Share",
        employer_share: "ESIC Employer Share",
        status: "Status"
    };

    for (const [key, label] of Object.entries(mapping)) {
        const regex = new RegExp(`\\b${key}\\b`, "gi");
        clean = clean.replace(regex, label);
    }

    return clean.charAt(0).toUpperCase() + clean.slice(1);
};

class ChallanSetupController {
    /**
     * Creates a new Challan Setup.
     */
    static async create(req, res) {
        const { error, value } = createChallanSetupSchema.validate(req.body);
        if (error) {
            const friendlyMessage = formatJoiMessage(error.details[0].message);
            return res.status(400).json(
                errorResponse(
                    "VALIDATION_ERROR",
                    error.details[0].message,
                    friendlyMessage,
                    error.details
                )
            );
        }

        try {
            const newSetup = await ChallanSetupService.createChallanSetup(value, req.user.id);

            return res.status(201).json(
                successResponse(
                    "CHALLAN_SETUP_CREATED",
                    "Challan setup created successfully.",
                    "Challan setup created successfully.",
                    newSetup
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "INTERNAL_SERVER_ERROR";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to create challan setup."
                )
            );
        }
    }

    /**
     * Gets all Challan Setups for a specific company.
     */
    static async getAll(req, res) {
        const { companyId } = req.params;
        if (!companyId) {
            return res.status(400).json(
                errorResponse(
                    "VALIDATION_ERROR",
                    "Company ID is required.",
                    "Company ID is required."
                )
            );
        }

        try {
            const setups = await ChallanSetupService.getAllChallanSetups(companyId, req.user.id);

            return res.status(200).json(
                successResponse(
                    "CHALLAN_SETUPS_RETRIEVED",
                    "Challan setups retrieved successfully.",
                    "Challan setups retrieved successfully.",
                    setups
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "CHALLAN_SETUPS_RETRIEVE_FAILED";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to retrieve challan setups."
                )
            );
        }
    }

    /**
     * Gets a single Challan Setup by ID.
     */
    static async getById(req, res) {
        const { id } = req.params;

        try {
            const setup = await ChallanSetupService.getChallanSetupById(id, req.user.id);

            return res.status(200).json(
                successResponse(
                    "CHALLAN_SETUP_RETRIEVED",
                    "Challan setup retrieved successfully.",
                    "Challan setup retrieved successfully.",
                    setup
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "CHALLAN_SETUP_RETRIEVE_FAILED";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to retrieve challan setup."
                )
            );
        }
    }

    /**
     * Updates an existing Challan Setup.
     */
    static async update(req, res) {
        const { id } = req.params;

        const { error, value } = updateChallanSetupSchema.validate(req.body);
        if (error) {
            const friendlyMessage = formatJoiMessage(error.details[0].message);
            return res.status(400).json(
                errorResponse(
                    "VALIDATION_ERROR",
                    error.details[0].message,
                    friendlyMessage,
                    error.details
                )
            );
        }

        try {
            const updatedSetup = await ChallanSetupService.updateChallanSetup(id, req.user.id, value);

            return res.status(200).json(
                successResponse(
                    "CHALLAN_SETUP_UPDATED",
                    "Challan setup updated successfully.",
                    "Challan setup updated successfully.",
                    updatedSetup
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "UPDATE_FAILED";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to update challan setup."
                )
            );
        }
    }

    /**
     * Deletes a Challan Setup (Soft delete).
     */
    static async delete(req, res) {
        const { id } = req.params;

        try {
            await ChallanSetupService.deleteChallanSetup(id, req.user.id);

            return res.status(200).json(
                successResponse(
                    "CHALLAN_SETUP_DELETED",
                    "Challan setup deleted successfully.",
                    "Challan setup deleted successfully."
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "DELETE_FAILED";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to delete challan setup."
                )
            );
        }
    }
}

module.exports = ChallanSetupController;
