const express = require("express");
const router = express.Router();
const backupController = require("./backup.controller");
const authenticateJWT = require("../../../middlewares/auth.middleware");

// GET /payroll/v1/utility/backup
router.get("/", authenticateJWT, backupController.exportDatabase);

module.exports = router;
