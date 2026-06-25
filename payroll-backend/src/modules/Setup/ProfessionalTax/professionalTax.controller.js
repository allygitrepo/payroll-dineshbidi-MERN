const ProfessionalTaxService = require("./professionalTax.service");
const { createProfessionalTaxSchema, updateProfessionalTaxSchema } = require("./professionalTax.validators");
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
        from_amount: "From Amount",
        to_amount: "To Amount",
        tax_rate: "Tax Rate",
        status: "Status",
    };

    for (const [key, label] of Object.entries(mapping)) {
        const regex = new RegExp(`\\b${key}\\b`, "gi");
        clean = clean.replace(regex, label);
    }

    return clean.charAt(0).toUpperCase() + clean.slice(1);
};

class ProfessionalTaxController {
    /**
     * Creates a new Professional Tax slab.
     */
    static async create(req, res) {
        const { error, value } = createProfessionalTaxSchema.validate(req.body);
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
            const newPt = await ProfessionalTaxService.createProfessionalTax(value, req.user.id);

            return res.status(201).json(
                successResponse(
                    "PROFESSIONAL_TAX_CREATED",
                    "Professional Tax slab created successfully.",
                    "Professional Tax slab created successfully.",
                    newPt
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "INTERNAL_SERVER_ERROR";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to create Professional Tax slab."
                )
            );
        }
    }

    /**
     * Gets all Professional Tax slabs for a specific company.
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
            const pts = await ProfessionalTaxService.getAllProfessionalTaxes(companyId, req.user.id);

            return res.status(200).json(
                successResponse(
                    "PROFESSIONAL_TAXES_RETRIEVED",
                    "Professional Tax slabs retrieved successfully.",
                    "Professional Tax slabs retrieved successfully.",
                    pts
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "PROFESSIONAL_TAXES_RETRIEVE_FAILED";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to retrieve Professional Tax slabs."
                )
            );
        }
    }

    /**
     * Gets a single Professional Tax slab by ID.
     */
    static async getById(req, res) {
        const { id } = req.params;

        try {
            const pt = await ProfessionalTaxService.getProfessionalTaxById(id, req.user.id);

            return res.status(200).json(
                successResponse(
                    "PROFESSIONAL_TAX_RETRIEVED",
                    "Professional Tax slab retrieved successfully.",
                    "Professional Tax slab retrieved successfully.",
                    pt
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "PROFESSIONAL_TAX_RETRIEVE_FAILED";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to retrieve Professional Tax slab."
                )
            );
        }
    }

    /**
     * Updates an existing Professional Tax slab.
     */
    static async update(req, res) {
        const { id } = req.params;

        const { error, value } = updateProfessionalTaxSchema.validate(req.body);
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
            const updatedPt = await ProfessionalTaxService.updateProfessionalTax(id, req.user.id, value);

            return res.status(200).json(
                successResponse(
                    "PROFESSIONAL_TAX_UPDATED",
                    "Professional Tax slab updated successfully.",
                    "Professional Tax slab updated successfully.",
                    updatedPt
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "UPDATE_FAILED";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to update Professional Tax slab."
                )
            );
        }
    }

    /**
     * Deletes a Professional Tax slab (Soft delete).
     */
    static async delete(req, res) {
        const { id } = req.params;

        try {
            await ProfessionalTaxService.deleteProfessionalTax(id, req.user.id);

            return res.status(200).json(
                successResponse(
                    "PROFESSIONAL_TAX_DELETED",
                    "Professional Tax slab deleted successfully.",
                    "Professional Tax slab deleted successfully."
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "DELETE_FAILED";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to delete Professional Tax slab."
                )
            );
        }
    }
}

module.exports = ProfessionalTaxController;
