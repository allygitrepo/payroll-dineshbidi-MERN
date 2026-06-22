const express = require("express");
const router = express.Router();
const ChallanSetupController = require("./challanSetup.controller");
const authenticateJWT = require("../../../middlewares/auth.middleware");

// All routes are protected by JWT authentication
router.post("/", authenticateJWT, ChallanSetupController.create);
router.get("/company/:companyId", authenticateJWT, ChallanSetupController.getAll);
router.get("/:id", authenticateJWT, ChallanSetupController.getById);
router.put("/:id", authenticateJWT, ChallanSetupController.update);
router.delete("/:id", authenticateJWT, ChallanSetupController.delete);

module.exports = router;
