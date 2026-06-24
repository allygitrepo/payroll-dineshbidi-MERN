const express = require("express");
const router = express.Router();
const uanToIpController = require("./uanToIp.controller");
const authenticateJWT = require("../../../middlewares/auth.middleware");

// POST /payroll/v1/utility/uan-to-ip/:companyId/bulk-update
router.post("/:companyId/bulk-update", authenticateJWT, uanToIpController.bulkUpdateIp);

module.exports = router;
