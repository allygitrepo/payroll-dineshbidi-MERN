const express = require("express");
const router = express.Router();
const AddressController = require("./address.controller");
const authenticateJWT = require("../../middlewares/auth.middleware");

// All routes are protected by JWT authentication
router.post("/", authenticateJWT, AddressController.create);
router.get("/company/:companyId", authenticateJWT, AddressController.getAll);
router.get("/:id", authenticateJWT, AddressController.getById);
router.put("/:id", authenticateJWT, AddressController.update);
router.delete("/:id", authenticateJWT, AddressController.delete);

module.exports = router;
