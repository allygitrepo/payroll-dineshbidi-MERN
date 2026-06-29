const express = require("express");
const router = express.Router();
const ContractorController = require("./contractor.controller");
const authenticateJWT = require("../../../middlewares/auth.middleware");

// All routes are protected by JWT authentication
router.post("/", authenticateJWT, ContractorController.create);
router.get("/company/:companyId", authenticateJWT, ContractorController.getAll);
router.get("/:id", authenticateJWT, ContractorController.getById);
router.put("/:id", authenticateJWT, ContractorController.update);
router.delete("/:id", authenticateJWT, ContractorController.delete);
router.get("/:id/login", authenticateJWT, ContractorController.getLogin);
router.post("/:id/login", authenticateJWT, ContractorController.createLogin);

module.exports = router;
