const express = require("express");
const router = express.Router();
const BidiRollerWageController = require("./bidiRollerWage.controller");
const authenticateJWT = require("../../../middlewares/auth.middleware");

// All routes are protected by JWT authentication
router.post("/", authenticateJWT, BidiRollerWageController.create);
router.get("/company/:companyId", authenticateJWT, BidiRollerWageController.getAll);
router.get("/:id", authenticateJWT, BidiRollerWageController.getById);
router.put("/:id", authenticateJWT, BidiRollerWageController.update);
router.delete("/:id", authenticateJWT, BidiRollerWageController.delete);

module.exports = router;
