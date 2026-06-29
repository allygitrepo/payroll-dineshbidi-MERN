const Joi = require("joi");

const createAddressSchema = Joi.object({
    company_id: Joi.string().guid().required().messages({
        "string.base": "Company ID must be a string.",
        "string.empty": "Company ID is required.",
        "string.guid": "Company ID must be a valid UUID.",
        "any.required": "Company ID is required.",
    }),
    address: Joi.string().min(3).max(500).required().messages({
        "string.base": "Address must be a string.",
        "string.empty": "Address is required.",
        "string.min": "Address must be at least 3 characters long.",
        "string.max": "Address cannot exceed 500 characters.",
        "any.required": "Address is required.",
    }),
    post_office: Joi.string().max(100).required().messages({
        "string.base": "Post office must be a string.",
        "string.empty": "Post office is required.",
        "string.max": "Post office cannot exceed 100 characters.",
        "any.required": "Post office is required.",
    }),
    district: Joi.string().max(100).required().messages({
        "string.base": "District must be a string.",
        "string.empty": "District is required.",
        "string.max": "District cannot exceed 100 characters.",
        "any.required": "District is required.",
    }),
    pincode: Joi.string().required().messages({
        "string.base": "Pincode must be a string.",
        "string.empty": "Pincode is required.",
        "any.required": "Pincode is required.",
    }),
    status: Joi.boolean().optional(),
});

const updateAddressSchema = Joi.object({
    address: Joi.string().min(3).max(500).optional().messages({
        "string.min": "Address must be at least 3 characters long.",
        "string.max": "Address cannot exceed 500 characters.",
    }),
    post_office: Joi.string().max(100).optional().messages({
        "string.max": "Post office cannot exceed 100 characters.",
    }),
    district: Joi.string().max(100).optional().messages({
        "string.max": "District cannot exceed 100 characters.",
    }),
    pincode: Joi.string().optional(),
    status: Joi.boolean().optional(),
});

module.exports = {
    createAddressSchema,
    updateAddressSchema,
};
