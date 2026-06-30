const express = require("express");
const router = express.Router();
const LoanController = require("./loan.controller");
const authenticateJWT = require("../../middlewares/auth.middleware");

// Apply JWT authentication middleware to all loan routes
router.use(authenticateJWT);

router.post("/create", LoanController.create);
router.get("/employee/:employee_id", LoanController.getByEmployee);
router.put("/override/:id", LoanController.update);
router.post("/repayment/:id", LoanController.recordRepayment);
router.post("/repay-fifo", LoanController.repayFIFO);
router.get("/transactions/:id", LoanController.getTransactions);
router.get("/summary", LoanController.getSummary);

module.exports = router;
