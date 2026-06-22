const CalenderService = require("./calender.service");
const { createCalenderSchema, updateCalenderSchema } = require("./calender.validators");
const { successResponse, errorResponse } = require("../../../utils/response");

/**
 * Formats Joi validation error messages to be user-friendly by removing double quotes
 * and converting snake_case/camelCase keys to clean Title Case labels.
 */
const formatJoiMessage = (message) => {
    if (!message) return "";
    let clean = message.replace(/"/g, "");

    const mapping = {
        company_id: "Company ID",
        holiday_type: "Holiday Type",
        week_day: "Week Day",
        holiday_date: "Holiday Date",
        remark: "Remark",
        status: "Status"
    };

    for (const [key, label] of Object.entries(mapping)) {
        const regex = new RegExp(`\\b${key}\\b`, "gi");
        clean = clean.replace(regex, label);
    }

    return clean.charAt(0).toUpperCase() + clean.slice(1);
};

class CalenderController {
    /**
     * Creates a new Calender entry.
     */
    static async create(req, res) {
        const { error, value } = createCalenderSchema.validate(req.body);
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
            const newEntry = await CalenderService.createCalender(value, req.user.id);

            return res.status(201).json(
                successResponse(
                    "CALENDER_CREATED",
                    "Calender holiday entry created successfully.",
                    "Calender holiday entry created successfully.",
                    newEntry
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "INTERNAL_SERVER_ERROR";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to create calender entry."
                )
            );
        }
    }

    /**
     * Gets all Calender entries for a specific company.
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
            const entries = await CalenderService.getAllCalenders(companyId, req.user.id);

            return res.status(200).json(
                successResponse(
                    "CALENDERS_RETRIEVED",
                    "Calender holiday entries retrieved successfully.",
                    "Calender holiday entries retrieved successfully.",
                    entries
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "CALENDERS_RETRIEVE_FAILED";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to retrieve calender entries."
                )
            );
        }
    }

    /**
     * Gets a single Calender entry by ID.
     */
    static async getById(req, res) {
        const { id } = req.params;

        try {
            const entry = await CalenderService.getCalenderById(id, req.user.id);

            return res.status(200).json(
                successResponse(
                    "CALENDER_RETRIEVED",
                    "Calender holiday entry retrieved successfully.",
                    "Calender holiday entry retrieved successfully.",
                    entry
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "CALENDER_RETRIEVE_FAILED";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to retrieve calender entry."
                )
            );
        }
    }

    /**
     * Updates an existing Calender entry.
     */
    static async update(req, res) {
        const { id } = req.params;

        const { error, value } = updateCalenderSchema.validate(req.body);
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
            const updatedEntry = await CalenderService.updateCalender(id, req.user.id, value);

            return res.status(200).json(
                successResponse(
                    "CALENDER_UPDATED",
                    "Calender holiday entry updated successfully.",
                    "Calender holiday entry updated successfully.",
                    updatedEntry
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "UPDATE_FAILED";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to update calender entry."
                )
            );
        }
    }

    /**
     * Deletes a Calender entry (Soft delete).
     */
    static async delete(req, res) {
        const { id } = req.params;

        try {
            await CalenderService.deleteCalender(id, req.user.id);

            return res.status(200).json(
                successResponse(
                    "CALENDER_DELETED",
                    "Calender holiday entry deleted successfully.",
                    "Calender holiday entry deleted successfully."
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "DELETE_FAILED";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to delete calender entry."
                )
            );
        }
    }
}

module.exports = CalenderController;
