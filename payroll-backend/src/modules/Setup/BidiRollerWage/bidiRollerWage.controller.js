const BidiRollerWageService = require("./bidiRollerWage.service");
const { createBidiRollerWageSchema, updateBidiRollerWageSchema } = require("./bidiRollerWage.validators");
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
        hra_1: "HRA 1",
        bonus_1: "Bonus 1",
        rate_2: "Rate 2",
        hra_2: "HRA 2",
        bonus_2: "Bonus 2",
        status: "Status"
    };

    for (const [key, label] of Object.entries(mapping)) {
        const regex = new RegExp(`\\b${key}\\b`, "gi");
        clean = clean.replace(regex, label);
    }

    return clean.charAt(0).toUpperCase() + clean.slice(1);
};

class BidiRollerWageController {
    /**
     * Creates a new Bidi Roller Wages setup.
     */
    static async create(req, res) {
        const { error, value } = createBidiRollerWageSchema.validate(req.body);
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
            const newWageSetup = await BidiRollerWageService.createBidiRollerWage(value, req.user.id);

            return res.status(201).json(
                successResponse(
                    "BIDI_ROLLER_WAGES_CREATED",
                    "Bidi Roller Wages setup created successfully.",
                    "Bidi Roller Wages setup created successfully.",
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
                    err.messageToShow || "Failed to create Bidi Roller Wages setup."
                )
            );
        }
    }

    /**
     * Gets all Bidi Roller Wages setups for a specific company.
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
            const wagesSetups = await BidiRollerWageService.getAllBidiRollerWages(companyId, req.user.id);

            return res.status(200).json(
                successResponse(
                    "BIDI_ROLLER_WAGES_RETRIEVED",
                    "Bidi Roller Wages setups retrieved successfully.",
                    "Bidi Roller Wages setups retrieved successfully.",
                    wagesSetups
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "BIDI_ROLLER_WAGES_RETRIEVE_FAILED";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to retrieve Bidi Roller Wages setups."
                )
            );
        }
    }

    /**
     * Gets a single Bidi Roller Wages setup by ID.
     */
    static async getById(req, res) {
        const { id } = req.params;

        try {
            const wageSetup = await BidiRollerWageService.getBidiRollerWageById(id, req.user.id);

            return res.status(200).json(
                successResponse(
                    "BIDI_ROLLER_WAGES_RETRIEVED",
                    "Bidi Roller Wages setup retrieved successfully.",
                    "Bidi Roller Wages setup retrieved successfully.",
                    wageSetup
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "BIDI_ROLLER_WAGES_RETRIEVE_FAILED";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to retrieve Bidi Roller Wages setup."
                )
            );
        }
    }

    /**
     * Updates an existing Bidi Roller Wages setup.
     */
    static async update(req, res) {
        const { id } = req.params;

        const { error, value } = updateBidiRollerWageSchema.validate(req.body);
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
            const updatedWageSetup = await BidiRollerWageService.updateBidiRollerWage(id, req.user.id, value);

            return res.status(200).json(
                successResponse(
                    "BIDI_ROLLER_WAGES_UPDATED",
                    "Bidi Roller Wages setup updated successfully.",
                    "Bidi Roller Wages setup updated successfully.",
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
                    err.messageToShow || "Failed to update Bidi Roller Wages setup."
                )
            );
        }
    }

    /**
     * Deletes a Bidi Roller Wages setup (Soft delete).
     */
    static async delete(req, res) {
        const { id } = req.params;

        try {
            await BidiRollerWageService.deleteBidiRollerWage(id, req.user.id);

            return res.status(200).json(
                successResponse(
                    "BIDI_ROLLER_WAGES_DELETED",
                    "Bidi Roller Wages setup deleted successfully.",
                    "Bidi Roller Wages setup deleted successfully."
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "DELETE_FAILED";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to delete Bidi Roller Wages setup."
                )
            );
        }
    }
}

module.exports = BidiRollerWageController;
