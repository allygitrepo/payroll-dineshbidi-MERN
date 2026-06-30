const express = require("express");
const router = express.Router();
const LeaveMasterController = require("./leaveMaster.controller");
const authenticateJWT = require("../../../middlewares/auth.middleware");

// Tab 1: Leave Types CRUD
router.get("/types/company/:companyId", authenticateJWT, LeaveMasterController.getTypes);
router.post("/types/company/:companyId", authenticateJWT, LeaveMasterController.saveType);
router.delete("/types/company/:companyId/:id", authenticateJWT, LeaveMasterController.deleteType);

// Tab 2: Leave Policies CRUD
router.get("/policies/company/:companyId", authenticateJWT, LeaveMasterController.getPolicies);
router.post("/policies/company/:companyId", authenticateJWT, LeaveMasterController.savePolicy);

// Tab 3: Global Leave Settings
router.get("/settings/company/:companyId", authenticateJWT, LeaveMasterController.getSettings);
router.post("/settings/company/:companyId", authenticateJWT, LeaveMasterController.saveSettings);

// Additional Endpoints
router.get("/employee-types", authenticateJWT, LeaveMasterController.getEmployeeTypes);
router.get("/balances/:employeeId", authenticateJWT, LeaveMasterController.getBalances);
router.post("/balances/adjust", authenticateJWT, LeaveMasterController.adjustBalance);
router.post("/accrual/company/:companyId", authenticateJWT, LeaveMasterController.runAccrual);
router.post("/carry-forward/company/:companyId", authenticateJWT, LeaveMasterController.runCarryForward);



module.exports = router;
