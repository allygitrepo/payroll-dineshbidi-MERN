const express = require("express");
const router = express.Router();
const AttendanceController = require("./attendance.controller");
const authenticateJWT = require("../../middlewares/auth.middleware");

// Employee-scoped endpoints
router.get("/my", authenticateJWT, AttendanceController.getMyAttendance);
router.get("/my/today", authenticateJWT, AttendanceController.getMyToday);
router.post("/sign-in", AttendanceController.signInToday);
router.post("/sign-out", AttendanceController.signOutToday);
router.post("/clock", AttendanceController.clockToggle);

// Admin-scoped endpoints
router.post("/", authenticateJWT, AttendanceController.createManual);
router.get("/company/:companyId", authenticateJWT, AttendanceController.getAll);
router.get("/summary/company/:companyId", authenticateJWT, AttendanceController.getSummary);
router.delete("/:id", authenticateJWT, AttendanceController.delete);

module.exports = router;
