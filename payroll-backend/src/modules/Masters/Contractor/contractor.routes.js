const express = require("express");
const router = express.Router();
const ContractorController = require("./contractor.controller");
const authenticateJWT = require("../../../middlewares/auth.middleware");
const requirePermission = require("../../../middlewares/permission.middleware");

// All routes are protected by JWT authentication
router.post("/", authenticateJWT, requirePermission("contractor", "create"), ContractorController.create);
router.get("/company/:companyId", authenticateJWT, requirePermission("contractor", "read"), ContractorController.getAll);
router.get("/:id", authenticateJWT, requirePermission("contractor", "read"), ContractorController.getById);
router.put("/:id", authenticateJWT, requirePermission("contractor", "edit"), ContractorController.update);
router.delete("/:id", authenticateJWT, requirePermission("contractor", "delete"), ContractorController.delete);
router.get("/:id/login", authenticateJWT, requirePermission("contractor", "read"), ContractorController.getLogin);
router.post("/:id/login", authenticateJWT, requirePermission("contractor", "edit"), ContractorController.createLogin);

module.exports = router;
