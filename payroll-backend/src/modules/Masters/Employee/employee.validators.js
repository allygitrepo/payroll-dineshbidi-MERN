const Joi = require("joi");

const kycSchema = Joi.object({
    pan: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).optional().allow(null, "").messages({
        "string.pattern.base": "Invalid PAN format (e.g. ABCDE1234F).",
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
});

const nomineeSchema = Joi.object({
    address_id: Joi.string().guid().required().messages({
        "string.guid": "Nominee Address ID must be a valid UUID.",
        "any.required": "Nominee Address is required.",
    }),
    name: Joi.string().min(3).max(200).required().messages({
        "string.min": "Nominee Name must be at least 3 characters.",
        "any.required": "Nominee Name is required.",
    }),
    aadhar: Joi.string().pattern(/^[0-9]{12}$/).required().messages({
        "string.pattern.base": "Nominee Aadhar must be exactly 12 digits.",
        "any.required": "Nominee Aadhar is required.",
    }),
    relation: Joi.string().min(2).max(50).required().messages({
        "any.required": "Nominee Relation is required.",
    }),
    dob: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
        "string.pattern.base": "Nominee DOB must be in YYYY-MM-DD format.",
        "any.required": "Nominee DOB is required.",
    }),
    share_percentage: Joi.number().min(0).max(100).required().messages({
        "number.min": "Share percentage cannot be negative.",
        "number.max": "Share percentage cannot exceed 100%.",
        "any.required": "Share percentage is required.",
    }),
    guardian_name: Joi.string().max(200).optional().allow(null, ""),
    guardian_address: Joi.string().max(500).optional().allow(null, ""),
});

const familyMemberSchema = Joi.object({
    relation: Joi.string().min(2).max(50).required().messages({
        "any.required": "Family Relation is required.",
    }),
    name: Joi.string().min(3).max(200).required().messages({
        "string.min": "Family Name must be at least 3 characters.",
        "any.required": "Family Name is required.",
    }),
    dob: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
        "string.pattern.base": "Family DOB must be in YYYY-MM-DD format.",
        "any.required": "Family DOB is required.",
    }),
    aadhar: Joi.string().pattern(/^[0-9]{12}$/).required().messages({
        "string.pattern.base": "Family Aadhar must be exactly 12 digits.",
        "any.required": "Family Aadhar is required.",
    }),
});

const createEmployeeSchema = Joi.object({
    company_id: Joi.string().guid().required().messages({
        "string.guid": "Company ID must be a valid UUID.",
        "any.required": "Company ID is required.",
    }),
    contractor_id: Joi.string().guid().optional().allow(null, ""),
    address_id: Joi.string().guid().required().messages({
        "string.guid": "Address ID must be a valid UUID.",
        "any.required": "Address ID is required.",
    }),
    image_path: Joi.string().max(500).optional().allow(null, ""),
    uan: Joi.string().pattern(/^[0-9]{12}$/).required().messages({
        "string.pattern.base": "UAN must be exactly 12 digits.",
        "any.required": "UAN is required.",
    }),
    ip_number: Joi.string().pattern(/^[0-9]+$/).min(10).max(20).required().messages({
        "string.pattern.base": "IP Number must contain digits only.",
        "string.min": "IP Number must be at least 10 digits.",
        "string.max": "IP Number cannot exceed 20 digits.",
        "any.required": "IP Number is required.",
    }),
    member_id: Joi.string().max(50).optional().allow(null, ""),
    name: Joi.string().min(3).max(200).required().messages({
        "string.min": "Name must be at least 3 characters.",
        "any.required": "Name is required.",
    }),
    dob: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
        "string.pattern.base": "Date of Birth must be in YYYY-MM-DD format.",
        "any.required": "Date of Birth is required.",
    }),
    aadhar: Joi.string().pattern(/^[0-9]{12}$/).required().messages({
        "string.pattern.base": "Aadhar card number must be exactly 12 digits.",
        "any.required": "Aadhar card number is required.",
    }),
    gender: Joi.string().valid("Male", "Female", "Other").required().messages({
        "any.only": "Gender must be either Male, Female, or Other.",
        "any.required": "Gender is required.",
    }),
    father_or_husband_name: Joi.string().max(200).optional().allow(null, ""),
    relation: Joi.string().max(50).optional().allow(null, ""),
    marital_status: Joi.string().max(50).optional().allow(null, ""),
    mobile: Joi.string().pattern(/^[0-9]{10,15}$/).required().messages({
        "string.pattern.base": "Mobile number must be between 10 and 15 digits.",
        "any.required": "Mobile number is required.",
    }),
    qualification: Joi.string().max(100).optional().allow(null, ""),
    date_of_joining: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
        "string.pattern.base": "Date of Joining must be in YYYY-MM-DD format.",
        "any.required": "Date of Joining is required.",
    }),
    employee_type: Joi.string().max(100).required().messages({
        "any.required": "Type of employee is required.",
    }),
    nationality: Joi.string().max(50).default("INDIAN").optional().allow(null, ""),
    email: Joi.string().email().max(100).optional().allow(null, "").messages({
        "string.email": "Invalid Email ID format.",
    }),
    is_international_worker: Joi.boolean().default(false).optional(),
    physical_handicap: Joi.boolean().default(false).optional(),
    pmrpy: Joi.boolean().default(false).optional(),
    
    // Nested objects
    kyc_details: kycSchema.optional().default({}),
    nominees: Joi.array().items(nomineeSchema).optional().default([]),
    family_members: Joi.array().items(familyMemberSchema).optional().default([]),
});

const updateEmployeeSchema = Joi.object({
    contractor_id: Joi.string().guid().optional().allow(null, ""),
    address_id: Joi.string().guid().optional().messages({
        "string.guid": "Address ID must be a valid UUID.",
    }),
    image_path: Joi.string().max(500).optional().allow(null, ""),
    uan: Joi.string().pattern(/^[0-9]{12}$/).optional().messages({
        "string.pattern.base": "UAN must be exactly 12 digits.",
    }),
    ip_number: Joi.string().pattern(/^[0-9]+$/).min(10).max(20).optional().messages({
        "string.pattern.base": "IP Number must contain digits only.",
    }),
    member_id: Joi.string().max(50).optional().allow(null, ""),
    name: Joi.string().min(3).max(200).optional(),
    dob: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional().messages({
        "string.pattern.base": "Date of Birth must be in YYYY-MM-DD format.",
    }),
    aadhar: Joi.string().pattern(/^[0-9]{12}$/).optional().messages({
        "string.pattern.base": "Aadhar card number must be exactly 12 digits.",
    }),
    gender: Joi.string().valid("Male", "Female", "Other").optional(),
    father_or_husband_name: Joi.string().max(200).optional().allow(null, ""),
    relation: Joi.string().max(50).optional().allow(null, ""),
    marital_status: Joi.string().max(50).optional().allow(null, ""),
    mobile: Joi.string().pattern(/^[0-9]{10,15}$/).optional(),
    qualification: Joi.string().max(100).optional().allow(null, ""),
    date_of_joining: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional().messages({
        "string.pattern.base": "Date of Joining must be in YYYY-MM-DD format.",
    }),
    employee_type: Joi.string().max(100).optional(),
    nationality: Joi.string().max(50).optional().allow(null, ""),
    email: Joi.string().email().max(100).optional().allow(null, "").messages({
        "string.email": "Invalid Email ID format.",
    }),
    is_international_worker: Joi.boolean().optional(),
    physical_handicap: Joi.boolean().optional(),
    pmrpy: Joi.boolean().optional(),
    status: Joi.boolean().optional(),
    
    // Nested updates
    kyc_details: kycSchema.optional(),
    nominees: Joi.array().items(nomineeSchema).optional(),
    family_members: Joi.array().items(familyMemberSchema).optional(),
});

module.exports = {
    createEmployeeSchema,
    updateEmployeeSchema,
};
