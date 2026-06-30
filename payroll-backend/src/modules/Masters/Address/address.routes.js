const express = require("express");
const router = express.Router();
const AddressController = require("./address.controller");
const authenticateJWT = require("../../../middlewares/auth.middleware");
const requirePermission = require("../../../middlewares/permission.middleware");

// All routes are protected by JWT authentication
router.post("/", authenticateJWT, requirePermission("address", "create"), AddressController.create);
router.get("/company/:companyId", authenticateJWT, requirePermission("address", "read"), AddressController.getAll);
router.get("/:id", authenticateJWT, requirePermission("address", "read"), AddressController.getById);
router.put("/:id", authenticateJWT, requirePermission("address", "edit"), AddressController.update);
router.delete("/:id", authenticateJWT, requirePermission("address", "delete"), AddressController.delete);

module.exports = router;
