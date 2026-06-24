const Joi = require("joi");

const createCalenderSchema = Joi.object({
    company_id: Joi.string().guid().required().messages({
        "string.guid": "Company ID must be a valid UUID.",
        "any.required": "Company ID is required.",
    }),
    holiday_type: Joi.string().valid("COMPANY", "WEEKLY").required().messages({
        "any.only": "Holiday Type must be either COMPANY or WEEKLY.",
        "any.required": "Holiday Type is required.",
    }),
    week_day: Joi.string().valid("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday").optional().allow(null, ""),
    holiday_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional().allow(null, "").messages({
        "string.pattern.base": "Holiday date must be in YYYY-MM-DD format.",
    }),
    remark: Joi.string().optional().allow(null, ""),
});

const updateCalenderSchema = Joi.object({
    company_id: Joi.string().guid().optional().messages({
        "string.guid": "Company ID must be a valid UUID.",
    }),
    holiday_type: Joi.string().valid("COMPANY", "WEEKLY").optional().messages({
        "any.only": "Holiday Type must be either COMPANY or WEEKLY.",
    }),
    week_day: Joi.string().valid("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday").optional().allow(null, ""),
    holiday_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional().allow(null, "").messages({
        "string.pattern.base": "Holiday date must be in YYYY-MM-DD format.",
    }),
    remark: Joi.string().optional().allow(null, ""),
    status: Joi.boolean().optional(),
});

module.exports = {
    createCalenderSchema,
    updateCalenderSchema,
};
