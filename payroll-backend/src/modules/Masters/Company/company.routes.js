const express = require("express");
const router = express.Router();
const CompanyController = require("./company.controller");
const authenticateJWT = require("../../../middlewares/auth.middleware");

// Public route for login screen dropdown
router.get("/public", CompanyController.getPublicCompanies);

// All routes are protected by JWT authentication
router.post("/", authenticateJWT, CompanyController.create);
router.get("/", authenticateJWT, CompanyController.getAll);
router.get("/:id", authenticateJWT, CompanyController.getById);
router.put("/:id", authenticateJWT, CompanyController.update);
router.delete("/:id", authenticateJWT, CompanyController.delete);

module.exports = router;
