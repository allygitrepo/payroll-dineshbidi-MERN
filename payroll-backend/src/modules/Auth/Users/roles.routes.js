const express = require("express");
const router = express.Router();
const rolesController = require("./roles.controller");
const authenticateJWT = require("../../../middlewares/auth.middleware");

// Using standard authentication
router.post("/", authenticateJWT, rolesController.createRole);
router.get("/", authenticateJWT, rolesController.getAllRoles);
router.put("/:id", authenticateJWT, rolesController.updateRole);
router.delete("/:id", authenticateJWT, rolesController.deleteRole);

module.exports = router;
