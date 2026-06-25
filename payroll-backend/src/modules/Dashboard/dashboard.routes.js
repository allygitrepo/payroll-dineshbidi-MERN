const express = require("express");
const router = express.Router();
const dashboardController = require("./dashboard.controller");
const authenticateJWT = require("../../middlewares/auth.middleware");

// GET /payroll/v1/dashboard/:companyId/summary
router.get("/:companyId/summary", authenticateJWT, dashboardController.getSummary);

module.exports = router;
