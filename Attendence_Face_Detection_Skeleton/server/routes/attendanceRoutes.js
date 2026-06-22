const express = require("express");
const router = express.Router();
const attendanceController = require("../controller/attendanceController");

// Placeholder authorization middlewares - replace with your project's security checks
const verifyToken = (req, res, next) => {
  // Mock req.user for testing/placeholder purposes
  req.user = req.user || { id: 1, name: "Admin User", role: "admin" };
  next();
};
const isAdmin = (req, res, next) => next();

// Employee scoped endpoints
router.get("/my", verifyToken, attendanceController.getMyAttendance);
router.get("/my/today", verifyToken, attendanceController.getMyToday);
router.post("/sign-in", verifyToken, attendanceController.signInToday);
router.post("/sign-out", verifyToken, attendanceController.signOutToday);

// Admin scoped endpoints
router.post("/", verifyToken, isAdmin, attendanceController.createAttendance);
router.get("/", verifyToken, isAdmin, attendanceController.getAllAttendance);
router.get("/report", verifyToken, isAdmin, attendanceController.report);
router.get("/:id", verifyToken, attendanceController.getAttendanceById);
router.put("/:id", verifyToken, isAdmin, attendanceController.updateAttendance);
router.delete("/:id", verifyToken, isAdmin, attendanceController.deleteAttendance);

module.exports = router;
