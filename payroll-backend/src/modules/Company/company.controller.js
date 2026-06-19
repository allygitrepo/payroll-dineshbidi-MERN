const CompanyService = require("./company.service");
const { createCompanySchema, updateCompanySchema } = require("./company.validators");
const { successResponse, errorResponse } = require("../../utils/response");

/**
 * Formats Joi validation error messages to be user-friendly by removing double quotes
 * and converting snake_case keys to clean Title Case labels.
 */
const formatJoiMessage = (message) => {
    if (!message) return "";
    let clean = message.replace(/"/g, "");
    
    const mapping = {
        user_id: "User ID",
        establishment_id: "Establishment ID",
        company_name: "Company Name",
        company_type: "Company Type",
        epfo_office: "EPFO Office",
        lin_number: "LIN Number",
        esic_id: "ESIC ID",
        address_line: "Address Line",
        post_office: "Post Office",
        district: "District",
        pincode: "Pincode",
        pan: "PAN",
        tan: "TAN",
        professional_tax_reg_no: "Professional Tax Reg No",
        email_id: "Email ID",
        phone: "Phone",
        website: "Website",
        cstatus: "Status"
    };

    for (const [key, label] of Object.entries(mapping)) {
        const regex = new RegExp(`\\b${key}\\b`, "gi");
        clean = clean.replace(regex, label);
    }
    
    return clean.charAt(0).toUpperCase() + clean.slice(1);
};

class CompanyController {
    /**
     * Creates a new company.
     */
    static async create(req, res) {
        const { error, value } = createCompanySchema.validate(req.body);
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
            value.user_id = req.user.id;
            const newCompany = await CompanyService.createCompany(value);

            return res.status(201).json(
                successResponse(
                    "COMPANY_CREATED",
                    "Company created successfully.",
                    "Company created successfully.",
                    newCompany
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "INTERNAL_SERVER_ERROR";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to create company."
                )
            );
        }
    }

    /**
     * Gets all companies.
     */
    static async getAll(req, res) {
        try {
            const companies = await CompanyService.getAllCompanies(req.user.id);

            return res.status(200).json(
                successResponse(
                    "COMPANIES_RETRIEVED",
                    "Companies retrieved successfully.",
                    "Companies retrieved successfully.",
                    companies
                )
            );
        } catch (err) {
            return res.status(500).json(
                errorResponse(
                    "COMPANIES_RETRIEVE_FAILED",
                    err.message,
                    "Failed to retrieve companies."
                )
            );
        }
    }

    /**
     * Gets a single company.
     */
    static async getById(req, res) {
        const { id } = req.params;

        try {
            const company = await CompanyService.getCompanyById(id, req.user.id);

            return res.status(200).json(
                successResponse(
                    "COMPANY_RETRIEVED",
                    "Company retrieved successfully.",
                    "Company retrieved successfully.",
                    company
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "COMPANY_RETRIEVE_FAILED";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to retrieve company."
                )
            );
        }
    }

    /**
     * Updates a company.
     */
    static async update(req, res) {
        const { id } = req.params;

        const { error, value } = updateCompanySchema.validate(req.body);
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
            const updatedCompany = await CompanyService.updateCompany(id, req.user.id, value);

            return res.status(200).json(
                successResponse(
                    "COMPANY_UPDATED",
                    "Company updated successfully.",
                    "Company updated successfully.",
                    updatedCompany
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "UPDATE_FAILED";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to update company."
                )
            );
        }
    }

    /**
     * Deletes a company.
     */
    static async delete(req, res) {
        const { id } = req.params;

        try {
            await CompanyService.deleteCompany(id, req.user.id);

            return res.status(200).json(
                successResponse(
                    "COMPANY_DELETED",
                    "Company deleted successfully.",
                    "Company deleted successfully."
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "DELETE_FAILED";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to delete company."
                )
            );
        }
    }
}

module.exports = CompanyController;
