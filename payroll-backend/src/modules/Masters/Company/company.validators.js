const Joi = require("joi");

const createCompanySchema = Joi.object({
    establishment_id: Joi.string().length(15).pattern(/^[A-Z0-9]{15}$/).required().messages({
        "string.base": "Establishment ID must be a string.",
        "string.empty": "Establishment ID is required.",
        "string.length": "Establishment ID must be exactly 15 characters.",
        "string.pattern.base": "Establishment ID must be uppercase alphanumeric.",
        "any.required": "Establishment ID is required.",
    }),
    company_name: Joi.string().min(3).max(200).required().messages({
        "string.base": "Company name must be a string.",
        "string.empty": "Company name is required.",
        "string.min": "Company name must be at least 3 characters long.",
        "string.max": "Company name cannot exceed 200 characters.",
        "any.required": "Company name is required.",
    }),

    epfo_office: Joi.string().max(100).required().messages({
        "string.empty": "EPFO Office is required.",
        "string.max": "EPFO Office cannot exceed 100 characters.",
        "any.required": "EPFO Office is required.",
    }),
    lin_number: Joi.string().pattern(/^[0-9]{10}$/).optional().allow(null, "").messages({
        "string.pattern.base": "LIN Number must be exactly 10 digits.",
    }),
    esic_id: Joi.string().pattern(/^[0-9]{17}$/).optional().allow(null, "").messages({
        "string.pattern.base": "ESIC ID must be exactly 17 digits.",
    }),
    address_line: Joi.string().max(500).required().messages({
        "string.empty": "Address line is required.",
        "string.max": "Address line cannot exceed 500 characters.",
        "any.required": "Address line is required.",
    }),
    post_office: Joi.string().max(100).required().messages({
        "string.empty": "Post Office is required.",
        "string.max": "Post Office cannot exceed 100 characters.",
        "any.required": "Post Office is required.",
    }),
    district: Joi.string().max(100).required().messages({
        "string.empty": "District is required.",
        "string.max": "District cannot exceed 100 characters.",
        "any.required": "District is required.",
    }),
    pincode: Joi.string().pattern(/^[0-9]{6}$/).required().messages({
        "string.empty": "Pincode is required.",
        "string.pattern.base": "Pincode must be exactly 6 digits.",
        "any.required": "Pincode is required.",
    }),
    pan: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).required().messages({
        "string.empty": "PAN is required.",
        "string.pattern.base": "Invalid PAN format (e.g. ABCDE1234F).",
        "any.required": "PAN is required.",
    }),
    tan: Joi.string().pattern(/^[A-Z]{4}[0-9]{5}[A-Z]{1}$/).required().messages({
        "string.empty": "TAN is required.",
        "string.pattern.base": "Invalid TAN format (e.g. ABCD12345E).",
        "any.required": "TAN is required.",
    }),
    professional_tax_reg_no: Joi.string().max(50).optional().allow(null, "").messages({
        "string.max": "Professional Tax Reg No cannot exceed 50 characters.",
    }),
    email_id: Joi.string().email().required().messages({
        "string.empty": "Email ID is required.",
        "string.email": "Invalid Email ID format.",
        "any.required": "Email ID is required.",
    }),
    phone: Joi.string().pattern(/^[0-9]{10,15}$/).required().messages({
        "string.empty": "Phone number is required.",
        "string.pattern.base": "Phone number must be between 10 and 15 digits.",
        "any.required": "Phone number is required.",
    }),
    website: Joi.string().trim().empty("").custom((val) => {
        if (!val) return val;
        if (!/^https?:\/\//i.test(val)) {
            return `http://${val}`;
        }
        return val;
    }).uri().optional().allow(null, "").messages({
        "string.uri": "Invalid Website URL format.",
    }),
    company_type: Joi.string().trim().empty("").default("Proprietorship").custom((val, helpers) => {
        const lower = val.toLowerCase();
        if (lower === "proprietorship") return "Proprietorship";
        if (lower === "partnership") return "Partnership";
        if (lower === "private limited" || lower === "private_limited") return "Private Limited";
        if (lower === "public") return "Public";
        return helpers.error("any.invalid");
    }).messages({
        "any.invalid": "Company type must be one of Proprietorship, Partnership, Private Limited, or Public."
    }),
    user_id: Joi.string().optional().allow(null, ""),
});

const updateCompanySchema = Joi.object({
    establishment_id: Joi.string().length(15).pattern(/^[A-Z0-9]{15}$/).optional().messages({
        "string.length": "Establishment ID must be exactly 15 characters.",
        "string.pattern.base": "Establishment ID must be uppercase alphanumeric.",
    }),
    company_name: Joi.string().min(3).max(200).optional().messages({
        "string.min": "Company name must be at least 3 characters long.",
        "string.max": "Company name cannot exceed 200 characters.",
    }),
    company_type: Joi.string().trim().empty("").custom((val, helpers) => {
        const lower = val.toLowerCase();
        if (lower === "proprietorship") return "Proprietorship";
        if (lower === "partnership") return "Partnership";
        if (lower === "private limited" || lower === "private_limited") return "Private Limited";
        if (lower === "public") return "Public";
        return helpers.error("any.invalid");
    }).optional().messages({
        "any.invalid": "Company type must be one of Proprietorship, Partnership, Private Limited, or Public."
    }),
    epfo_office: Joi.string().max(100).optional(),
    lin_number: Joi.string().pattern(/^[0-9]{10}$/).optional().allow(null, ""),
    esic_id: Joi.string().pattern(/^[0-9]{17}$/).optional().allow(null, ""),
    address_line: Joi.string().max(500).optional(),
    post_office: Joi.string().max(100).optional(),
    district: Joi.string().max(100).optional(),
    pincode: Joi.string().pattern(/^[0-9]{6}$/).optional(),
    pan: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).optional(),
    tan: Joi.string().pattern(/^[A-Z]{4}[0-9]{5}[A-Z]{1}$/).optional(),
    professional_tax_reg_no: Joi.string().max(50).optional().allow(null, ""),
    email_id: Joi.string().email().optional(),
    phone: Joi.string().pattern(/^[0-9]{10,15}$/).optional(),
    website: Joi.string().trim().empty("").custom((val) => {
        if (!val) return val;
        if (!/^https?:\/\//i.test(val)) {
            return `http://${val}`;
        }
        return val;
    }).uri().optional().allow(null, "").messages({
        "string.uri": "Invalid Website URL format.",
    }),
    user_id: Joi.string().optional().allow(null, ""),
    cstatus: Joi.boolean().optional(),
});

module.exports = {
    createCompanySchema,
    updateCompanySchema,
};
