const express = require("express");
const router = express.Router();
const CalenderController = require("./calender.controller");
const authenticateJWT = require("../../../middlewares/auth.middleware");

// All routes are protected by JWT authentication
router.post("/", authenticateJWT, CalenderController.create);
router.get("/company/:companyId", authenticateJWT, CalenderController.getAll);
router.get("/:id", authenticateJWT, CalenderController.getById);
router.put("/:id", authenticateJWT, CalenderController.update);
router.delete("/:id", authenticateJWT, CalenderController.delete);

module.exports = router;
