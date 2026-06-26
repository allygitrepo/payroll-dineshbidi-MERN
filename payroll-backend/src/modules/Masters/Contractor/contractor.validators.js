const Joi = require("joi");

const createContractorSchema = Joi.object({
    company_id: Joi.string().guid().required().messages({
        "string.base": "Company ID must be a string.",
        "string.empty": "Company ID is required.",
        "string.guid": "Company ID must be a valid UUID.",
        "any.required": "Company ID is required.",
    }),
    address_id: Joi.string().guid().required().messages({
        "string.base": "Address ID must be a string.",
        "string.empty": "Address ID is required.",
        "string.guid": "Address ID must be a valid UUID.",
        "any.required": "Address ID is required.",
    }),
    ccode: Joi.string().required().messages({
        "string.base": "Contractor Code must be a string.",
        "string.empty": "Contractor Code is required.",
        "any.required": "Contractor Code is required.",
    }),
    name: Joi.string().required().messages({
        "string.base": "Contractor Name must be a string.",
        "string.empty": "Contractor Name is required.",
        "any.required": "Contractor Name is required.",
    }),
    pf_code: Joi.string().max(50).required().messages({
        "string.base": "PF Code must be a string.",
        "string.empty": "PF Code is required.",
        "string.max": "PF Code cannot exceed 50 characters.",
        "any.required": "PF Code is required.",
    }),
    date_of_joining: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
        "string.base": "Date of joining must be a string.",
        "string.empty": "Date of joining is required.",
        "string.pattern.base": "Date of joining must be in YYYY-MM-DD format.",
        "any.required": "Date of joining is required.",
    }),
    pan: Joi.string().optional().allow(null, ""),
    aadhar: Joi.string().optional().allow(null, ""),
    gst_no: Joi.string().optional().allow(null, ""),
    bank_ac: Joi.string().optional().allow(null, ""),
    bank_name: Joi.string().max(100).optional().allow(null, ""),
    ifsc: Joi.string().optional().allow(null, ""),
    status: Joi.boolean().optional(),
});

const updateContractorSchema = Joi.object({
    address_id: Joi.string().guid().optional().messages({
        "string.guid": "Address ID must be a valid UUID.",
    }),
    ccode: Joi.string().optional(),
    name: Joi.string().optional(),
    pf_code: Joi.string().max(50).optional(),
    date_of_joining: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional().messages({
        "string.pattern.base": "Date of joining must be in YYYY-MM-DD format.",
    }),
    pan: Joi.string().optional().allow(null, ""),
    aadhar: Joi.string().optional().allow(null, ""),
    gst_no: Joi.string().optional().allow(null, ""),
    bank_ac: Joi.string().optional().allow(null, ""),
    bank_name: Joi.string().max(100).optional().allow(null, ""),
    ifsc: Joi.string().optional().allow(null, ""),
    status: Joi.boolean().optional(),
});

module.exports = {
    createContractorSchema,
    updateContractorSchema,
};
