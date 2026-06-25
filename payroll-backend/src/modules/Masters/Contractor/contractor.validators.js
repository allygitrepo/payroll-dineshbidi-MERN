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
    ccode: Joi.string().min(2).max(50).required().messages({
        "string.base": "Contractor Code must be a string.",
        "string.empty": "Contractor Code is required.",
        "string.min": "Contractor Code must be at least 2 characters long.",
        "string.max": "Contractor Code cannot exceed 50 characters.",
        "any.required": "Contractor Code is required.",
    }),
    name: Joi.string().min(3).max(200).required().messages({
        "string.base": "Contractor Name must be a string.",
        "string.empty": "Contractor Name is required.",
        "string.min": "Contractor Name must be at least 3 characters long.",
        "string.max": "Contractor Name cannot exceed 200 characters.",
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
    pan: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).optional().allow(null, "").messages({
        "string.pattern.base": "Invalid PAN format (e.g. ABCDE1234F).",
    }),
    aadhar: Joi.string().pattern(/^[0-9]{12}$/).optional().allow(null, "").messages({
        "string.pattern.base": "Aadhar number must be exactly 12 digits.",
    }),
    gst_no: Joi.string().pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).optional().allow(null, "").messages({
        "string.pattern.base": "Invalid GST Number format.",
    }),
    bank_ac: Joi.string().pattern(/^[0-9]+$/).min(9).max(25).optional().allow(null, "").messages({
        "string.pattern.base": "Bank account number must contain digits only.",
        "string.min": "Bank account number must be at least 9 digits.",
        "string.max": "Bank account number cannot exceed 25 digits.",
    }),
    bank_name: Joi.string().max(100).optional().allow(null, "").messages({
        "string.max": "Bank name cannot exceed 100 characters.",
    }),
    ifsc: Joi.string().pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/).optional().allow(null, "").messages({
        "string.pattern.base": "Invalid IFSC code format (e.g., SBIN0123456).",
    }),
    status: Joi.boolean().optional(),
});

const updateContractorSchema = Joi.object({
    address_id: Joi.string().guid().optional().messages({
        "string.guid": "Address ID must be a valid UUID.",
    }),
    ccode: Joi.string().min(2).max(50).optional().messages({
        "string.min": "Contractor Code must be at least 2 characters long.",
        "string.max": "Contractor Code cannot exceed 50 characters.",
    }),
    name: Joi.string().min(3).max(200).optional().messages({
        "string.min": "Contractor Name must be at least 3 characters long.",
        "string.max": "Contractor Name cannot exceed 200 characters.",
    }),
    pf_code: Joi.string().max(50).optional(),
    date_of_joining: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional().messages({
        "string.pattern.base": "Date of joining must be in YYYY-MM-DD format.",
    }),
    pan: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).optional().allow(null, "").messages({
        "string.pattern.base": "Invalid PAN format (e.g. ABCDE1234F).",
    }),
    aadhar: Joi.string().pattern(/^[0-9]{12}$/).optional().allow(null, "").messages({
        "string.pattern.base": "Aadhar number must be exactly 12 digits.",
    }),
    gst_no: Joi.string().pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).optional().allow(null, "").messages({
        "string.pattern.base": "Invalid GST Number format.",
    }),
    bank_ac: Joi.string().pattern(/^[0-9]+$/).min(9).max(25).optional().allow(null, "").messages({
        "string.pattern.base": "Bank account number must contain digits only.",
        "string.min": "Bank account number must be at least 9 digits.",
        "string.max": "Bank account number cannot exceed 25 digits.",
    }),
    bank_name: Joi.string().max(100).optional().allow(null, ""),
    ifsc: Joi.string().pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/).optional().allow(null, "").messages({
        "string.pattern.base": "Invalid IFSC code format (e.g., SBIN0123456).",
    }),
    status: Joi.boolean().optional(),
});

module.exports = {
    createContractorSchema,
    updateContractorSchema,
};
