const Joi = require("joi");

const createLoanSchema = Joi.object({
    employee_id: Joi.string().guid({ version: ["uuidv4"] }).required().messages({
        "string.empty": "Employee ID is required.",
        "string.guid": "Employee ID must be a valid UUID.",
        "any.required": "Employee ID is required.",
    }),
    total_amount: Joi.number().precision(2).positive().required().messages({
        "number.base": "Total amount must be a number.",
        "number.positive": "Total amount must be greater than zero.",
        "any.required": "Total amount is required.",
    }),
    emi_amount: Joi.number().precision(2).positive().optional().allow(null, "").messages({
        "number.base": "EMI amount must be a number.",
        "number.positive": "EMI amount must be greater than zero.",
    }),
    emi_type: Joi.string().valid("Fixed", "Flexible").default("Fixed").messages({
        "any.only": "EMI type must be either 'Fixed' or 'Flexible'.",
    }),
    tenure_months: Joi.number().integer().positive().optional().allow(null, "").messages({
        "number.base": "Tenure months must be an integer.",
        "number.positive": "Tenure months must be greater than zero.",
    }),
    interest_rate: Joi.number().min(0).max(100).default(0).messages({
        "number.base": "Interest rate must be a number.",
        "number.min": "Interest rate cannot be negative.",
        "number.max": "Interest rate cannot exceed 100%.",
    }),
    interest_type: Joi.string().valid("Flat", "Reducing").default("Flat").messages({
        "any.only": "Interest type must be either 'Flat' or 'Reducing'.",
    }),
    deduction_type: Joi.string().valid("Daily", "Monthly").required().messages({
        "any.only": "Deduction type must be either 'Daily' or 'Monthly'.",
        "any.required": "Deduction type is required.",
    }),
    start_date: Joi.date().iso().required().messages({
        "date.base": "Start date must be a valid ISO date string.",
        "any.required": "Start date is required.",
    }),
});

const updateLoanSchema = Joi.object({
    status: Joi.string().valid("Active", "Paused", "Completed", "Manual_Closed").optional().messages({
        "any.only": "Invalid loan status value.",
    }),
    emi_amount: Joi.number().precision(2).positive().optional().messages({
        "number.base": "EMI amount must be a number.",
        "number.positive": "EMI amount must be greater than zero.",
    }),
});

const manualRepaymentSchema = Joi.object({
    amount: Joi.number().precision(2).positive().required().messages({
        "number.base": "Repayment amount must be a number.",
        "number.positive": "Repayment amount must be greater than zero.",
        "any.required": "Repayment amount is required.",
    }),
    payment_source: Joi.string().valid("Cash", "Bank").required().messages({
        "any.only": "Payment source must be either 'Cash' or 'Bank'.",
        "any.required": "Payment source is required.",
    }),
    description: Joi.string().allow("", null).optional(),
});

const fifoDeductionSchema = Joi.object({
    employee_id: Joi.string().guid({ version: ["uuidv4"] }).required().messages({
        "string.empty": "Employee ID is required.",
        "string.guid": "Employee ID must be a valid UUID.",
        "any.required": "Employee ID is required.",
    }),
    amount: Joi.number().precision(2).positive().required().messages({
        "number.base": "Deduction amount must be a number.",
        "number.positive": "Deduction amount must be greater than zero.",
        "any.required": "Deduction amount is required.",
    }),
    description: Joi.string().allow("", null).optional(),
});

module.exports = {
    createLoanSchema,
    updateLoanSchema,
    manualRepaymentSchema,
    fifoDeductionSchema,
};
