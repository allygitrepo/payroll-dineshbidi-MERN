const express = require("express");
const router = express.Router();
const LeaveRequestController = require("./leaveRequest.controller");
const authenticateJWT = require("../../../middlewares/auth.middleware");

// Routes prefixed with /payroll/v1/leaves
router.get("/company/:companyId", authenticateJWT, LeaveRequestController.getAll);
router.post("/", authenticateJWT, LeaveRequestController.create);
router.post("/calculate-days", authenticateJWT, LeaveRequestController.calculateDays);
router.put("/:id/approve", authenticateJWT, LeaveRequestController.approve);
router.put("/:id/reject", authenticateJWT, LeaveRequestController.reject);
router.put("/:id/cancel", authenticateJWT, LeaveRequestController.cancel);

module.exports = router;
