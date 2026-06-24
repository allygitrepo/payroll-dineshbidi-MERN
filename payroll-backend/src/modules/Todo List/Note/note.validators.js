const Joi = require("joi");

const createNoteSchema = Joi.object({
    company_id: Joi.string().guid().required().messages({
        "string.guid": "Company ID must be a valid UUID.",
        "any.required": "Company ID is required.",
    }),
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
        "string.pattern.base": "Date must be in YYYY-MM-DD format.",
        "any.required": "Date is required.",
    }),
    content: Joi.string().required().messages({
        "any.required": "Note content is required.",
    }),
});

const updateNoteSchema = Joi.object({
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional().messages({
        "string.pattern.base": "Date must be in YYYY-MM-DD format.",
    }),
    content: Joi.string().optional(),
    status: Joi.boolean().optional(),
});

module.exports = {
    createNoteSchema,
    updateNoteSchema,
};
