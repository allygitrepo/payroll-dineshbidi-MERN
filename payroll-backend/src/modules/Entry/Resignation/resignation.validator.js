const Joi = require("joi");

const saveResignationSchema = Joi.object({
    id: Joi.string().uuid().optional().allow(null, ""),
    company_id: Joi.string().uuid().required().messages({
        "string.empty": "Company ID is required.",
        "any.required": "Company ID is required.",
    }),
    account_no: Joi.string().max(50).optional().allow(null, ""),
    uan: Joi.string().max(12).optional().allow(null, ""),
    name_of_member: Joi.string().max(200).optional().allow(null, ""),
    name_of_parents: Joi.string().max(200).optional().allow(null, ""),
    date_of_leaving: Joi.date().iso().required().messages({
        "date.base": "Date of leaving must be a valid date.",
        "any.required": "Date of leaving is required.",
    }),
    reason_of_leaving: Joi.string().max(100).required().messages({
        "string.empty": "Reason of leaving is required.",
        "any.required": "Reason of leaving is required.",
    }),
});

module.exports = {
    saveResignationSchema,
};
