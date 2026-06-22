const ContractorService = require("./contractor.service");
const { createContractorSchema, updateContractorSchema } = require("./contractor.validators");
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
        address_id: "Address ID",
        ccode: "Contractor Code",
        name: "Contractor Name",
        pf_code: "PF Code",
        date_of_joining: "Date of Joining",
        pan: "PAN",
        aadhar: "Aadhar",
        gst_no: "GST Number",
        bank_ac: "Bank Account",
        bank_name: "Bank Name",
        ifsc: "IFSC",
        status: "Status"
    };

    for (const [key, label] of Object.entries(mapping)) {
        const regex = new RegExp(`\\b${key}\\b`, "gi");
        clean = clean.replace(regex, label);
    }

    return clean.charAt(0).toUpperCase() + clean.slice(1);
};

class ContractorController {
    /**
     * Creates a new contractor.
     */
    static async create(req, res) {
        const { error, value } = createContractorSchema.validate(req.body);
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
            const newContractor = await ContractorService.createContractor(value, req.user.id);

            return res.status(201).json(
                successResponse(
                    "CONTRACTOR_CREATED",
                    "Contractor created successfully.",
                    "Contractor created successfully.",
                    newContractor
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "INTERNAL_SERVER_ERROR";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to create contractor."
                )
            );
        }
    }

    /**
     * Gets all contractors for a specific company.
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
            const contractors = await ContractorService.getAllContractors(companyId, req.user.id);

            return res.status(200).json(
                successResponse(
                    "CONTRACTORS_RETRIEVED",
                    "Contractors retrieved successfully.",
                    "Contractors retrieved successfully.",
                    contractors
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "CONTRACTORS_RETRIEVE_FAILED";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to retrieve contractors."
                )
            );
        }
    }

    /**
     * Gets a single contractor by ID.
     */
    static async getById(req, res) {
        const { id } = req.params;

        try {
            const contractor = await ContractorService.getContractorById(id, req.user.id);

            return res.status(200).json(
                successResponse(
                    "CONTRACTOR_RETRIEVED",
                    "Contractor retrieved successfully.",
                    "Contractor retrieved successfully.",
                    contractor
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "CONTRACTOR_RETRIEVE_FAILED";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to retrieve contractor."
                )
            );
        }
    }

    /**
     * Updates a contractor.
     */
    static async update(req, res) {
        const { id } = req.params;

        const { error, value } = updateContractorSchema.validate(req.body);
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
            const updatedContractor = await ContractorService.updateContractor(id, req.user.id, value);

            return res.status(200).json(
                successResponse(
                    "CONTRACTOR_UPDATED",
                    "Contractor updated successfully.",
                    "Contractor updated successfully.",
                    updatedContractor
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "UPDATE_FAILED";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to update contractor."
                )
            );
        }
    }

    /**
     * Deletes a contractor (Soft delete).
     */
    static async delete(req, res) {
        const { id } = req.params;

        try {
            await ContractorService.deleteContractor(id, req.user.id);

            return res.status(200).json(
                successResponse(
                    "CONTRACTOR_DELETED",
                    "Contractor deleted successfully.",
                    "Contractor deleted successfully."
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "DELETE_FAILED";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to delete contractor."
                )
            );
        }
    }
}

module.exports = ContractorController;
