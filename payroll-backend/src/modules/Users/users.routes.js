const express = require("express");
const router = express.Router();
const UsersController = require("./users.controller");
const authenticateJWT = require("../../middlewares/auth.middleware");

// Public routes
router.post("/register", UsersController.register);
router.post("/login", UsersController.login);
router.post("/refresh", UsersController.refresh);

// Protected routes (require JWT verification)
router.post("/logout", authenticateJWT, UsersController.logout);
router.get("/me", authenticateJWT, UsersController.getProfile);
router.put("/:id", authenticateJWT, UsersController.update);
router.delete("/:id", authenticateJWT, UsersController.delete);

module.exports = router;
