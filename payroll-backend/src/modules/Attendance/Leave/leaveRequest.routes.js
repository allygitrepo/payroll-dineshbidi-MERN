const express = require("express");
const router = express.Router();
const LeaveRequestController = require("./leaveRequest.controller");
const authenticateJWT = require("../../../middlewares/auth.middleware");

// Routes prefixed with /payroll/v1/leaves
router.get("/company/:companyId", authenticateJWT, LeaveRequestController.getAll);
router.post("/", authenticateJWT, LeaveRequestController.create);
router.put("/:id/approve", authenticateJWT, LeaveRequestController.approve);
router.put("/:id/reject", authenticateJWT, LeaveRequestController.reject);

module.exports = router;
