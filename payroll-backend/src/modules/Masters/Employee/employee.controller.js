const EmployeeService = require("./employee.service");
const { createEmployeeSchema, updateEmployeeSchema } = require("./employee.validators");
const { successResponse, errorResponse } = require("../../../utils/response");

/**
 * Formats Joi validation error messages to be user-friendly by converting snake_case keys to clean Title Case labels.
 */
const formatJoiMessage = (message) => {
    if (!message) return "";
    let clean = message.replace(/"/g, "");

    const mapping = {
        company_id: "Company ID",
        contractor_id: "Contractor ID",
        address_id: "Address ID",
        image_path: "Employee Image",
        uan: "UAN",
        ip_number: "IP Number",
        member_id: "Member ID",
        name: "Employee Name",
        dob: "Date of Birth",
        aadhar: "Aadhar Card Number",
        gender: "Gender",
        father_or_husband_name: "Father/Husband Name",
        relation: "Relation",
        marital_status: "Marital Status",
        mobile: "Mobile Number",
        qualification: "Qualification",
        date_of_joining: "Date of Joining",
        employee_type: "Type of Employee",
        nationality: "Nationality",
        email: "Email ID",
        is_international_worker: "International Worker Status",
        physical_handicap: "Physical Handicap Status",
        pmrpy: "PMRPY Status",
        kyc_details: "KYC Details",
        nominees: "Nominees List",
        family_members: "Family Members List"
    };

    for (const [key, label] of Object.entries(mapping)) {
        const regex = new RegExp(`\\b${key}\\b`, "gi");
        clean = clean.replace(regex, label);
    }

    return clean.charAt(0).toUpperCase() + clean.slice(1);
};

class EmployeeController {
    /**
     * Creates a new employee.
     */
    static async create(req, res) {
        const { error, value } = createEmployeeSchema.validate(req.body);
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
            const newEmployee = await EmployeeService.createEmployee(value, req.user.id);

            return res.status(201).json(
                successResponse(
                    "EMPLOYEE_CREATED",
                    "Employee created successfully.",
                    "Employee created successfully.",
                    newEmployee
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "INTERNAL_SERVER_ERROR";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to create employee."
                )
            );
        }
    }

    /**
     * Gets all employees for a company.
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
            const employees = await EmployeeService.getAllEmployees(companyId, req.user.id);

            return res.status(200).json(
                successResponse(
                    "EMPLOYEES_RETRIEVED",
                    "Employees retrieved successfully.",
                    "Employees retrieved successfully.",
                    employees
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "EMPLOYEES_RETRIEVE_FAILED";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to retrieve employees."
                )
            );
        }
    }

    /**
     * Gets a single employee by ID.
     */
    static async getById(req, res) {
        const { id } = req.params;

        try {
            const employee = await EmployeeService.getEmployeeById(id, req.user.id);

            return res.status(200).json(
                successResponse(
                    "EMPLOYEE_RETRIEVED",
                    "Employee retrieved successfully.",
                    "Employee retrieved successfully.",
                    employee
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "EMPLOYEE_RETRIEVE_FAILED";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to retrieve employee."
                )
            );
        }
    }

    /**
     * Updates an employee.
     */
    static async update(req, res) {
        const { id } = req.params;

        const { error, value } = updateEmployeeSchema.validate(req.body);
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
            const updatedEmployee = await EmployeeService.updateEmployee(id, req.user.id, value);

            return res.status(200).json(
                successResponse(
                    "EMPLOYEE_UPDATED",
                    "Employee updated successfully.",
                    "Employee updated successfully.",
                    updatedEmployee
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "UPDATE_FAILED";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to update employee."
                )
            );
        }
    }

    /**
     * Deletes an employee (Soft delete).
     */
    static async delete(req, res) {
        const { id } = req.params;

        try {
            await EmployeeService.deleteEmployee(id, req.user.id);

            return res.status(200).json(
                successResponse(
                    "EMPLOYEE_DELETED",
                    "Employee deleted successfully.",
                    "Employee deleted successfully."
                )
            );
        } catch (err) {
            const statusCode = err.statusCode || 500;
            const errorCode = err.errorCode || "DELETE_FAILED";
            return res.status(statusCode).json(
                errorResponse(
                    errorCode,
                    err.message,
                    err.messageToShow || "Failed to delete employee."
                )
            );
        }
    }
}

module.exports = EmployeeController;
