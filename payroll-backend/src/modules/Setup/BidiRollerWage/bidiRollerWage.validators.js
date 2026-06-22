const Joi = require("joi");

const createBidiRollerWageSchema = Joi.object({
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
    rate_1: Joi.number().precision(2).min(0).optional(),
    hra_1: Joi.number().precision(2).min(0).optional(),
    bonus_1: Joi.number().precision(2).min(0).optional(),
    rate_2: Joi.number().precision(2).min(0).optional(),
    hra_2: Joi.number().precision(2).min(0).optional(),
    bonus_2: Joi.number().precision(2).min(0).optional(),
});

const updateBidiRollerWageSchema = Joi.object({
    start_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional().messages({
        "string.pattern.base": "Start date must be in YYYY-MM-DD format.",
    }),
    end_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional().messages({
        "string.pattern.base": "End date must be in YYYY-MM-DD format.",
    }),
    rate_1: Joi.number().precision(2).min(0).optional(),
    hra_1: Joi.number().precision(2).min(0).optional(),
    bonus_1: Joi.number().precision(2).min(0).optional(),
    rate_2: Joi.number().precision(2).min(0).optional(),
    hra_2: Joi.number().precision(2).min(0).optional(),
    bonus_2: Joi.number().precision(2).min(0).optional(),
    status: Joi.boolean().optional(),
});

module.exports = {
    createBidiRollerWageSchema,
    updateBidiRollerWageSchema,
};
