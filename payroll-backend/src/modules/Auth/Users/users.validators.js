const Joi = require("joi");

// Registration validation schema
const registerSchema = Joi.object({
    user_name: Joi.string().min(3).max(50).required().messages({
        "string.base": "User name must be a string.",
        "string.empty": "User name is required.",
        "string.min": "User name must be at least 3 characters long.",
        "string.max": "User name cannot exceed 50 characters.",
        "any.required": "User name is required.",
    }),
    user_id: Joi.string().min(3).max(30).alphanum().required().messages({
        "string.base": "User ID must be a string.",
        "string.empty": "User ID is required.",
        "string.min": "User ID must be at least 3 characters long.",
        "string.max": "User ID cannot exceed 30 characters.",
        "string.alphanum": "User ID must only contain alphanumeric characters.",
        "any.required": "User ID is required.",
    }),
    password: Joi.string().min(6).required().messages({
        "string.base": "Password must be a string.",
        "string.empty": "Password is required.",
        "string.min": "Password must be at least 6 characters long.",
        "any.required": "Password is required.",
    }),
    role: Joi.string().valid("admin", "user").optional().messages({
        "any.only": "Role must be either 'admin' or 'user'.",
    }),
});

// Login validation schema
const loginSchema = Joi.object({
    user_id: Joi.string().required().messages({
        "string.empty": "User ID is required.",
        "any.required": "User ID is required.",
    }),
    password: Joi.string().required().messages({
        "string.empty": "Password is required.",
        "any.required": "Password is required.",
    }),
    company_id: Joi.string().guid({ version: "uuidv4" }).optional().messages({
        "string.guid": "Company ID must be a valid UUID.",
    }),
});

// Update validation schema
const updateSchema = Joi.object({
    user_name: Joi.string().min(3).max(50).optional().messages({
        "string.min": "User name must be at least 3 characters long.",
        "string.max": "User name cannot exceed 50 characters.",
    }),
    password: Joi.string().min(6).optional().messages({
        "string.min": "Password must be at least 6 characters long.",
    }),
    role: Joi.string().valid("admin", "user").optional().messages({
        "any.only": "Role must be either 'admin' or 'user'.",
    }),
    status: Joi.boolean().optional(),
});

module.exports = {
    registerSchema,
    loginSchema,
    updateSchema,
};
