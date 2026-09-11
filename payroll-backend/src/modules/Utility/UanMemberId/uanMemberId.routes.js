const express = require("express");
const router = express.Router();
const uanMemberIdController = require("./uanMemberId.controller");
const authenticateJWT = require("../../../middlewares/auth.middleware");

// POST /payroll/v1/utility/uan-member-id/:companyId/bulk-update
router.post("/:companyId/bulk-update", authenticateJWT, uanMemberIdController.bulkUpdateMemberId);

module.exports = router;
