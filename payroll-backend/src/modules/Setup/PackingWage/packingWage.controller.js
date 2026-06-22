const PackingWageService = require("./packingWage.service");
const { createPackingWageSchema, updatePackingWageSchema } = require("./packingWage.validators");
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
        rate_1: "Rate 1",
        rate_2: "Rate 2",
        rate_3: "Rate 3",
        rate_4: "Rate 4",
        bonus: "Bonus",
        status: "Status"
    };

    for (const [key, label] of Object.entries(mapping)) {
        const regex = new RegExp(`\\b${key}\\b`, "gi");
        clean = clean.replace(regex, label);
    }

    return clean.charAt(0).toUpperCase() + clean.slice(1);
};

class PackingWageController {
    /**
     * Creates a new Packing Wages setup.
     */
    static async create(req, res) {
        const { error, value } = createPackingWageSchema.validate(req.body);
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
            const newWageSetup = await PackingWageService.createPackingWage(value, req.user.id);

            return res.status(201).json(
                successResponse(
                    "PACKING_WAGES_CREATED",
                    "Packing Wages setup created successfully.",
                    "Packing Wages setup created successfully.",
                    newWageSetup
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "INTERNAL_SERVER_ERROR";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to create Packing Wages setup."
                )
            );
        }
    }

    /**
     * Gets all Packing Wages setups for a specific company.
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
            const wagesSetups = await PackingWageService.getAllPackingWages(companyId, req.user.id);

            return res.status(200).json(
                successResponse(
                    "PACKING_WAGES_RETRIEVED",
                    "Packing Wages setups retrieved successfully.",
                    "Packing Wages setups retrieved successfully.",
                    wagesSetups
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "PACKING_WAGES_RETRIEVE_FAILED";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to retrieve Packing Wages setups."
                )
            );
        }
    }

    /**
     * Gets a single Packing Wages setup by ID.
     */
    static async getById(req, res) {
        const { id } = req.params;

        try {
            const wageSetup = await PackingWageService.getPackingWageById(id, req.user.id);

            return res.status(200).json(
                successResponse(
                    "PACKING_WAGES_RETRIEVED",
                    "Packing Wages setup retrieved successfully.",
                    "Packing Wages setup retrieved successfully.",
                    wageSetup
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "PACKING_WAGES_RETRIEVE_FAILED";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to retrieve Packing Wages setup."
                )
            );
        }
    }

    /**
     * Updates an existing Packing Wages setup.
     */
    static async update(req, res) {
        const { id } = req.params;

        const { error, value } = updatePackingWageSchema.validate(req.body);
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
            const updatedWageSetup = await PackingWageService.updatePackingWage(id, req.user.id, value);

            return res.status(200).json(
                successResponse(
                    "PACKING_WAGES_UPDATED",
                    "Packing Wages setup updated successfully.",
                    "Packing Wages setup updated successfully.",
                    updatedWageSetup
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "UPDATE_FAILED";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to update Packing Wages setup."
                )
            );
        }
    }

    /**
     * Deletes a Packing Wages setup (Soft delete).
     */
    static async delete(req, res) {
        const { id } = req.params;

        try {
            await PackingWageService.deletePackingWage(id, req.user.id);

            return res.status(200).json(
                successResponse(
                    "PACKING_WAGES_DELETED",
                    "Packing Wages setup deleted successfully.",
                    "Packing Wages setup deleted successfully."
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "DELETE_FAILED";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to delete Packing Wages setup."
                )
            );
        }
    }
}

module.exports = PackingWageController;
