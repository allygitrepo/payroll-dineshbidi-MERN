const express = require("express");
const router = express.Router();
const ExportController = require("./export.controller");
const authenticateJWT = require("../../middlewares/auth.middleware");

// Unified authenticated export route for all modules and formats
router.get("/:module/:format", authenticateJWT, ExportController.exportData);

module.exports = router;
