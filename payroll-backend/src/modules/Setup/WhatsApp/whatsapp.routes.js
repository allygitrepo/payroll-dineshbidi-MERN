const express = require("express");
const WhatsAppController = require("./whatsapp.controller");
const WhatsAppTemplateController = require("./whatsappTemplate.controller");
const authenticateJWT = require("../../../middlewares/auth.middleware");

const router = express.Router();

// Gateway endpoints
router.post("/initiate", authenticateJWT, WhatsAppController.initiate);
router.get("/status", authenticateJWT, WhatsAppController.getStatus);
router.delete("/disconnect", authenticateJWT, WhatsAppController.disconnect);

// Template endpoints
router.post("/templates", authenticateJWT, WhatsAppTemplateController.createTemplate);
router.get("/templates", authenticateJWT, WhatsAppTemplateController.getTemplates);
router.put("/templates/:id", authenticateJWT, WhatsAppTemplateController.updateTemplate);
router.delete("/templates/:id", authenticateJWT, WhatsAppTemplateController.deleteTemplate);

// Send Bulk
router.post("/send-bulk", authenticateJWT, WhatsAppTemplateController.sendBulkMessage);

module.exports = router;
