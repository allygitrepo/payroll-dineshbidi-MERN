const Joi = require("joi");

const createOfficeStaffSalarySchema = Joi.object({
    company_id: Joi.string().guid({ version: "uuidv4" }).required().messages({
        "string.guid": "Company ID must be a valid UUID.",
        "any.required": "Company ID is required.",
    }),
    employee_id: Joi.string().guid({ version: "uuidv4" }).required().messages({
        "string.guid": "Employee ID must be a valid UUID.",
        "any.required": "Employee ID is required.",
    }),
    start_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
        "string.pattern.base": "Start date must be in YYYY-MM-DD format.",
        "any.required": "Start date is required.",
    }),
    end_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
        "string.pattern.base": "End date must be in YYYY-MM-DD format.",
        "any.required": "End date is required.",
    }),
    salary: Joi.number().precision(2).min(0).required().messages({
        "number.base": "Salary must be a number.",
        "number.min": "Salary cannot be negative.",
        "any.required": "Salary is required.",
    }),
    standard_bonus: Joi.number().precision(2).min(0).optional(),
    additional_bonus: Joi.number().precision(2).min(0).optional(),
});

const updateOfficeStaffSalarySchema = Joi.object({
    company_id: Joi.string().guid({ version: "uuidv4" }).optional().messages({
        "string.guid": "Company ID must be a valid UUID.",
    }),
    employee_id: Joi.string().guid({ version: "uuidv4" }).optional().messages({
        "string.guid": "Employee ID must be a valid UUID.",
    }),
    start_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional().messages({
        "string.pattern.base": "Start date must be in YYYY-MM-DD format.",
    }),
    end_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional().messages({
        "string.pattern.base": "End date must be in YYYY-MM-DD format.",
    }),
    salary: Joi.number().precision(2).min(0).optional(),
    standard_bonus: Joi.number().precision(2).min(0).optional(),
    additional_bonus: Joi.number().precision(2).min(0).optional(),
    status: Joi.boolean().optional(),
});

module.exports = {
    createOfficeStaffSalarySchema,
    updateOfficeStaffSalarySchema,
};
