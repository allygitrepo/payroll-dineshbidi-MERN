const express = require("express");
const router = express.Router();
const salarySheetController = require("./SalarySheet/salarySheet.controller");
const authenticateJWT = require("../../middlewares/auth.middleware");

// GET /v1/reports/office-salary-sheet
router.get("/office-salary-sheet", authenticateJWT, salarySheetController.getOfficeSalarySheet);

// GET /v1/reports/packing-salary-sheet
router.get("/packing-salary-sheet", authenticateJWT, salarySheetController.getPackingSalarySheet);

module.exports = router;
