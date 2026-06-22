const express = require("express");
const router = express.Router();
const OfficeStaffSalaryController = require("./officeStaffSalary.controller");
const authenticateJWT = require("../../../middlewares/auth.middleware");

// All routes are protected by JWT authentication
router.post("/", authenticateJWT, OfficeStaffSalaryController.create);
router.get("/company/:companyId", authenticateJWT, OfficeStaffSalaryController.getAll);
router.get("/:id", authenticateJWT, OfficeStaffSalaryController.getById);
router.put("/:id", authenticateJWT, OfficeStaffSalaryController.update);
router.delete("/:id", authenticateJWT, OfficeStaffSalaryController.delete);

module.exports = router;
