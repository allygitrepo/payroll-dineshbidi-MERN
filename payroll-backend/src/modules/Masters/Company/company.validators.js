const Joi = require("joi");

const createCompanySchema = Joi.object({
    establishment_id: Joi.string().required().messages({
        "string.base": "Establishment ID must be a string.",
        "string.empty": "Establishment ID is required.",
        "any.required": "Establishment ID is required.",
    }),
    company_name: Joi.string().required().messages({
        "string.base": "Company name must be a string.",
        "string.empty": "Company name is required.",
        "any.required": "Company name is required.",
    }),

    epfo_office: Joi.string().required().messages({
        "string.empty": "EPFO Office is required.",
        "any.required": "EPFO Office is required.",
    }),
    lin_number: Joi.string().optional().allow(null, ""),
    esic_id: Joi.string().optional().allow(null, ""),
    address_line: Joi.string().required().messages({
        "string.empty": "Address line is required.",
        "any.required": "Address line is required.",
    }),
    post_office: Joi.string().required().messages({
        "string.empty": "Post Office is required.",
        "any.required": "Post Office is required.",
    }),
    district: Joi.string().required().messages({
        "string.empty": "District is required.",
        "any.required": "District is required.",
    }),
    pincode: Joi.string().required().messages({
        "string.empty": "Pincode is required.",
        "any.required": "Pincode is required.",
    }),
    pan: Joi.string().required().messages({
        "string.empty": "PAN is required.",
        "any.required": "PAN is required.",
    }),
    tan: Joi.string().required().messages({
        "string.empty": "TAN is required.",
        "any.required": "TAN is required.",
    }),
    professional_tax_reg_no: Joi.string().optional().allow(null, ""),
    email_id: Joi.string().required().messages({
        "string.empty": "Email ID is required.",
        "any.required": "Email ID is required.",
    }),
    phone: Joi.string().required().messages({
        "string.empty": "Phone number is required.",
        "any.required": "Phone number is required.",
    }),
    website: Joi.string().optional().allow(null, ""),
    company_type: Joi.string().optional().allow(null, ""),
    user_id: Joi.string().optional().allow(null, ""),
});

const updateCompanySchema = Joi.object({
    establishment_id: Joi.string().optional(),
    company_name: Joi.string().optional(),
    company_type: Joi.string().optional(),
    epfo_office: Joi.string().optional(),
    lin_number: Joi.string().optional().allow(null, ""),
    esic_id: Joi.string().optional().allow(null, ""),
    address_line: Joi.string().optional(),
    post_office: Joi.string().optional(),
    district: Joi.string().optional(),
    pincode: Joi.string().optional(),
    pan: Joi.string().optional(),
    tan: Joi.string().optional(),
    professional_tax_reg_no: Joi.string().optional().allow(null, ""),
    email_id: Joi.string().optional(),
    phone: Joi.string().optional(),
    website: Joi.string().optional().allow(null, ""),
    user_id: Joi.string().optional().allow(null, ""),
    cstatus: Joi.boolean().optional(),
});

module.exports = {
    createCompanySchema,
    updateCompanySchema,
};
