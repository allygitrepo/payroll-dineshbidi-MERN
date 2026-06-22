const express = require("express");
const router = express.Router();
const PackingWageController = require("./packingWage.controller");
const authenticateJWT = require("../../../middlewares/auth.middleware");

// All routes are protected by JWT authentication
router.post("/", authenticateJWT, PackingWageController.create);
router.get("/company/:companyId", authenticateJWT, PackingWageController.getAll);
router.get("/:id", authenticateJWT, PackingWageController.getById);
router.put("/:id", authenticateJWT, PackingWageController.update);
router.delete("/:id", authenticateJWT, PackingWageController.delete);

module.exports = router;
