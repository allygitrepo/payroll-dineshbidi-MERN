const Joi = require("joi");

const saveChallanDateEntrySchema = Joi.object({
    id: Joi.string().uuid().optional().allow(null, ""),
    company_id: Joi.string().uuid().required().messages({
        "string.empty": "Company ID is required.",
        "any.required": "Company ID is required.",
    }),
    wage_month: Joi.string().pattern(/^(0[1-9]|1[0-2])\/\d{4}$/).required().messages({
        "string.empty": "Wage Month is required.",
        "string.pattern.base": "Wage Month must be in MM/YYYY format.",
        "any.required": "Wage Month is required.",
    }),
    ttrn: Joi.string().max(50).optional().allow(null, ""),
    crn_no: Joi.string().max(50).optional().allow(null, ""),
    due_date: Joi.date().iso().optional().allow(null, ""),
    challan_date: Joi.date().iso().optional().allow(null, ""),
    ac1ee: Joi.number().min(0).default(0),
    ac1er: Joi.number().min(0).default(0),
    ac2: Joi.number().min(0).default(0),
    ac10: Joi.number().min(0).default(0),
    ac21: Joi.number().min(0).default(0),
    ac22: Joi.number().min(0).default(0),
    total_amount: Joi.number().min(0).default(0),
    return_date: Joi.date().iso().optional().allow(null, ""),
});

module.exports = {
    saveChallanDateEntrySchema,
};
