const express = require("express");
const WhatsAppController = require("./whatsapp.controller");
const authenticateJWT = require("../../../middlewares/auth.middleware");

const router = express.Router();

router.post("/initiate", authenticateJWT, WhatsAppController.initiate);
router.get("/status", authenticateJWT, WhatsAppController.getStatus);
router.delete("/disconnect", authenticateJWT, WhatsAppController.disconnect);

module.exports = router;
