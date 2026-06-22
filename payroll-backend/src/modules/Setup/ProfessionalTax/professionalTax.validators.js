const Joi = require("joi");

const createProfessionalTaxSchema = Joi.object({
    company_id: Joi.string().guid({ version: "uuidv4" }).required().messages({
        "string.guid": "Company ID must be a valid UUID.",
        "any.required": "Company ID is required.",
    }),
    start_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
        "string.pattern.base": "Start date must be in YYYY-MM-DD format.",
        "any.required": "Start date is required.",
    }),
    end_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
        "string.pattern.base": "End date must be in YYYY-MM-DD format.",
        "any.required": "End date is required.",
    }),
    from_amount: Joi.number().precision(2).min(0).required().messages({
        "number.base": "From amount must be a number.",
        "number.min": "From amount cannot be negative.",
        "any.required": "From amount is required.",
    }),
    to_amount: Joi.number().precision(2).min(0).required().messages({
        "number.base": "To amount must be a number.",
        "number.min": "To amount cannot be negative.",
        "any.required": "To amount is required.",
    }),
    tax_rate: Joi.number().precision(2).min(0).required().messages({
        "number.base": "Tax rate must be a number.",
        "number.min": "Tax rate cannot be negative.",
        "any.required": "Tax rate is required.",
    }),
});

const updateProfessionalTaxSchema = Joi.object({
    start_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional().messages({
        "string.pattern.base": "Start date must be in YYYY-MM-DD format.",
    }),
    end_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional().messages({
        "string.pattern.base": "End date must be in YYYY-MM-DD format.",
    }),
    from_amount: Joi.number().precision(2).min(0).optional().messages({
        "number.base": "From amount must be a number.",
        "number.min": "From amount cannot be negative.",
    }),
    to_amount: Joi.number().precision(2).min(0).optional().messages({
        "number.base": "To amount must be a number.",
        "number.min": "To amount cannot be negative.",
    }),
    tax_rate: Joi.number().precision(2).min(0).optional().messages({
        "number.base": "Tax rate must be a number.",
        "number.min": "Tax rate cannot be negative.",
    }),
    status: Joi.boolean().optional(),
});

module.exports = {
    createProfessionalTaxSchema,
    updateProfessionalTaxSchema,
};
