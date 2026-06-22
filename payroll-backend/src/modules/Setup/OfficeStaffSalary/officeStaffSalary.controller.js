const OfficeStaffSalaryService = require("./officeStaffSalary.service");
const { createOfficeStaffSalarySchema, updateOfficeStaffSalarySchema } = require("./officeStaffSalary.validators");
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
        employee_id: "Employee ID",
        start_date: "Start Date",
        end_date: "End Date",
        salary: "Salary",
        standard_bonus: "Standard Bonus",
        additional_bonus: "Additional Bonus",
        status: "Status"
    };

    for (const [key, label] of Object.entries(mapping)) {
        const regex = new RegExp(`\\b${key}\\b`, "gi");
        clean = clean.replace(regex, label);
    }

    return clean.charAt(0).toUpperCase() + clean.slice(1);
};

class OfficeStaffSalaryController {
    /**
     * Creates a new Office Staff Salary setup.
     */
    static async create(req, res) {
        const { error, value } = createOfficeStaffSalarySchema.validate(req.body);
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
            const newSetup = await OfficeStaffSalaryService.createOfficeStaffSalary(value, req.user.id);

            return res.status(201).json(
                successResponse(
                    "OFFICE_STAFF_SALARY_CREATED",
                    "Office Staff Salary setup created successfully.",
                    "Office Staff Salary setup created successfully.",
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
                    err.messageToShow || "Failed to create Office Staff Salary setup."
                )
            );
        }
    }

    /**
     * Gets all Office Staff Salary setups for a specific company.
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
            const setups = await OfficeStaffSalaryService.getAllOfficeStaffSalaries(companyId, req.user.id);

            return res.status(200).json(
                successResponse(
                    "OFFICE_STAFF_SALARIES_RETRIEVED",
                    "Office Staff Salary setups retrieved successfully.",
                    "Office Staff Salary setups retrieved successfully.",
                    setups
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "OFFICE_STAFF_SALARIES_RETRIEVE_FAILED";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to retrieve Office Staff Salary setups."
                )
            );
        }
    }

    /**
     * Gets a single Office Staff Salary setup by ID.
     */
    static async getById(req, res) {
        const { id } = req.params;

        try {
            const setup = await OfficeStaffSalaryService.getOfficeStaffSalaryById(id, req.user.id);

            return res.status(200).json(
                successResponse(
                    "OFFICE_STAFF_SALARY_RETRIEVED",
                    "Office Staff Salary setup retrieved successfully.",
                    "Office Staff Salary setup retrieved successfully.",
                    setup
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "OFFICE_STAFF_SALARY_RETRIEVE_FAILED";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to retrieve Office Staff Salary setup."
                )
            );
        }
    }

    /**
     * Updates an existing Office Staff Salary setup.
     */
    static async update(req, res) {
        const { id } = req.params;

        const { error, value } = updateOfficeStaffSalarySchema.validate(req.body);
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
            const updatedSetup = await OfficeStaffSalaryService.updateOfficeStaffSalary(id, req.user.id, value);

            return res.status(200).json(
                successResponse(
                    "OFFICE_STAFF_SALARY_UPDATED",
                    "Office Staff Salary setup updated successfully.",
                    "Office Staff Salary setup updated successfully.",
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
                    err.messageToShow || "Failed to update Office Staff Salary setup."
                )
            );
        }
    }

    /**
     * Deletes an Office Staff Salary setup (Soft delete).
     */
    static async delete(req, res) {
        const { id } = req.params;

        try {
            await OfficeStaffSalaryService.deleteOfficeStaffSalary(id, req.user.id);

            return res.status(200).json(
                successResponse(
                    "OFFICE_STAFF_SALARY_DELETED",
                    "Office Staff Salary setup deleted successfully.",
                    "Office Staff Salary setup deleted successfully."
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "DELETE_FAILED";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to delete Office Staff Salary setup."
                )
            );
        }
    }
}

module.exports = OfficeStaffSalaryController;
