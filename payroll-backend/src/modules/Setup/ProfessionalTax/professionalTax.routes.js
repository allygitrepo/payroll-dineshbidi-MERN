const express = require("express");
const router = express.Router();
const ProfessionalTaxController = require("./professionalTax.controller");
const authenticateJWT = require("../../../middlewares/auth.middleware");

// All routes are protected by JWT authentication
router.post("/", authenticateJWT, ProfessionalTaxController.create);
router.get("/company/:companyId", authenticateJWT, ProfessionalTaxController.getAll);
router.get("/:id", authenticateJWT, ProfessionalTaxController.getById);
router.put("/:id", authenticateJWT, ProfessionalTaxController.update);
router.delete("/:id", authenticateJWT, ProfessionalTaxController.delete);

module.exports = router;
