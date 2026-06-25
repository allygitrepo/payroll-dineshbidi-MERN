const Joi = require("joi");

const createChallanSetupSchema = Joi.object({
    company_id: Joi.string().guid().required().messages({
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
    salary_limit: Joi.number().precision(2).min(0).optional(),
    edli_wages: Joi.number().precision(2).min(0).optional(),
    ac1_ee_male: Joi.number().precision(2).min(0).optional(),
    ac1_ee_female: Joi.number().precision(2).min(0).optional(),
    ac1_er: Joi.number().precision(2).min(0).optional(),
    ac2: Joi.number().precision(2).min(0).optional(),
    ac10: Joi.number().precision(2).min(0).optional(),
    ac21: Joi.number().precision(2).min(0).optional(),
    ac22: Joi.number().precision(2).min(0).optional(),
    ac2_min: Joi.number().precision(2).min(0).optional(),
    ac22_min: Joi.number().precision(2).min(0).optional(),
    pmrpy: Joi.number().precision(2).min(0).optional(),
    esic_wages: Joi.number().precision(2).min(0).optional(),
    employee_share: Joi.number().precision(2).min(0).optional(),
    employer_share: Joi.number().precision(2).min(0).optional(),
});

const updateChallanSetupSchema = Joi.object({
    start_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional().messages({
        "string.pattern.base": "Start date must be in YYYY-MM-DD format.",
    }),
    end_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional().messages({
        "string.pattern.base": "End date must be in YYYY-MM-DD format.",
    }),
    salary_limit: Joi.number().precision(2).min(0).optional(),
    edli_wages: Joi.number().precision(2).min(0).optional(),
    ac1_ee_male: Joi.number().precision(2).min(0).optional(),
    ac1_ee_female: Joi.number().precision(2).min(0).optional(),
    ac1_er: Joi.number().precision(2).min(0).optional(),
    ac2: Joi.number().precision(2).min(0).optional(),
    ac10: Joi.number().precision(2).min(0).optional(),
    ac21: Joi.number().precision(2).min(0).optional(),
    ac22: Joi.number().precision(2).min(0).optional(),
    ac2_min: Joi.number().precision(2).min(0).optional(),
    ac22_min: Joi.number().precision(2).min(0).optional(),
    pmrpy: Joi.number().precision(2).min(0).optional(),
    esic_wages: Joi.number().precision(2).min(0).optional(),
    employee_share: Joi.number().precision(2).min(0).optional(),
    employer_share: Joi.number().precision(2).min(0).optional(),
    status: Joi.boolean().optional(),
});

module.exports = {
    createChallanSetupSchema,
    updateChallanSetupSchema,
};
