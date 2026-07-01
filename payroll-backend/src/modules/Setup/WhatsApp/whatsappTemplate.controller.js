const { WhatsAppTemplate, Employee, Company } = require("../../../database/models");
const WhatsAppService = require("./whatsapp.service");
const { successResponse, errorResponse } = require("../../../utils/response");
const sequelize = require("../../../config/database");
const { Op } = require("sequelize");

class WhatsAppTemplateController {
    /**
     * Create a new template
     */
    static async createTemplate(req, res) {
        try {
            const companyId = req.user.company_id || req.user.id;
            const { name, content } = req.body;

            if (!name || !content) {
                return res.status(400).json(errorResponse("VALIDATION_ERROR", "Name and content are required", "Name and content are required"));
            }

            const template = await WhatsAppTemplate.create({
                company_id: companyId,
                name,
                content
            });

            return res.status(201).json(successResponse("TEMPLATE_CREATED", "Template created successfully", "Template created successfully", template));
        } catch (error) {
            return res.status(500).json(errorResponse("SERVER_ERROR", error.message, error.message));
        }
    }

    /**
     * Get all templates for the company
     */
    static async getTemplates(req, res) {
        try {
            const companyId = req.user.company_id || req.user.id;
            const templates = await WhatsAppTemplate.findAll({
                where: { company_id: companyId },
                order: [['createdAt', 'DESC']]
            });

            return res.status(200).json(successResponse("TEMPLATES_FETCHED", "Templates fetched", "Templates fetched successfully", templates));
        } catch (error) {
            return res.status(500).json(errorResponse("SERVER_ERROR", error.message, error.message));
        }
    }

    /**
     * Update a template
     */
    static async updateTemplate(req, res) {
        try {
            const companyId = req.user.company_id || req.user.id;
            const templateId = req.params.id;
            const { name, content } = req.body;

            const template = await WhatsAppTemplate.findOne({
                where: { id: templateId, company_id: companyId }
            });

            if (!template) {
                return res.status(404).json(errorResponse("NOT_FOUND", "Template not found", "Template not found"));
            }

            await template.update({ name, content });

            return res.status(200).json(successResponse("TEMPLATE_UPDATED", "Template updated", "Template updated successfully", template));
        } catch (error) {
            return res.status(500).json(errorResponse("SERVER_ERROR", error.message, error.message));
        }
    }

    /**
     * Delete a template
     */
    static async deleteTemplate(req, res) {
        try {
            const companyId = req.user.company_id || req.user.id;
            const templateId = req.params.id;

            const template = await WhatsAppTemplate.findOne({
                where: { id: templateId, company_id: companyId }
            });

            if (!template) {
                return res.status(404).json(errorResponse("NOT_FOUND", "Template not found", "Template not found"));
            }

            await template.destroy();

            return res.status(200).json(successResponse("TEMPLATE_DELETED", "Template deleted", "Template deleted successfully"));
        } catch (error) {
            return res.status(500).json(errorResponse("SERVER_ERROR", error.message, error.message));
        }
    }

    /**
     * Send bulk messages using a template
     */
    static async sendBulkMessage(req, res) {
        try {
            const companyId = req.user.company_id || req.user.id;
            const { templateId, employeeIds } = req.body;

            if (!templateId || !employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
                return res.status(400).json(errorResponse("VALIDATION_ERROR", "Invalid input", "Please select a template and at least one employee"));
            }

            // 1. Fetch template
            const template = await WhatsAppTemplate.findOne({
                where: { id: templateId, company_id: companyId }
            });

            if (!template) {
                return res.status(404).json(errorResponse("NOT_FOUND", "Template not found", "Template not found"));
            }

            // 2. Fetch employees
            const employees = await Employee.findAll({
                where: {
                    id: { [Op.in]: employeeIds },
                    company_id: companyId
                }
            });

            if (employees.length === 0) {
                return res.status(404).json(errorResponse("NOT_FOUND", "No valid employees found", "No valid employees found"));
            }

            // 3. Prepare bulk messages payload for WA-Mitra API
            // Format expected by WA-Mitra Bulk API:
            // [ { "number": "919999999999", "message": "..." }, ... ]
            const messagesPayload = [];

            for (const emp of employees) {
                // Ensure employee has a valid phone number
                if (!emp.mobile) continue;

                let mobile = emp.mobile;
                // Clean and prefix with 91 if it's a 10 digit Indian number and doesn't have country code
                mobile = mobile.replace(/\D/g, ''); // keep digits only
                if (mobile.length === 10) {
                    mobile = "91" + mobile;
                }

                // 4. Parse template dynamically
                // Currently supporting {{name}} which maps to emp.name
                let parsedMessage = template.content;
                const fullName = (emp.name || "").trim();
                
                parsedMessage = parsedMessage.replace(/{{name}}/gi, fullName);

                messagesPayload.push({
                    number: mobile,
                    message: parsedMessage
                });
            }

            if (messagesPayload.length === 0) {
                return res.status(400).json(errorResponse("NO_VALID_NUMBERS", "No valid phone numbers found", "None of the selected employees have valid phone numbers."));
            }

            // 5. Send via WhatsAppService
            const result = await WhatsAppService.sendBulkMessages(companyId, messagesPayload);

            return res.status(200).json(successResponse("BULK_SENT", "Bulk messages sent successfully", "Bulk messages sent successfully", result));

        } catch (error) {
            console.error("Bulk Send Error:", error);
            return res.status(500).json(errorResponse("SERVER_ERROR", error.message, error.message));
        }
    }
}

module.exports = WhatsAppTemplateController;
