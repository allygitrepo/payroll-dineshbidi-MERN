const express = require("express");
const router = express.Router();
const CompanyController = require("./company.controller");
const authenticateJWT = require("../../../middlewares/auth.middleware");
const requirePermission = require("../../../middlewares/permission.middleware");

// Public route for login screen dropdown
router.get("/public", CompanyController.getPublicCompanies);

// All routes are protected by JWT authentication
router.post("/", authenticateJWT, requirePermission("company", "create"), CompanyController.create);
router.get("/", authenticateJWT, requirePermission("company", "read"), CompanyController.getAll);
router.get("/:id", authenticateJWT, requirePermission("company", "read"), CompanyController.getById);
router.put("/:id", authenticateJWT, requirePermission("company", "edit"), CompanyController.update);
router.delete("/:id", authenticateJWT, requirePermission("company", "delete"), CompanyController.delete);

module.exports = router;
