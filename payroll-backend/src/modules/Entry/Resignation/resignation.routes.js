const express = require("express");
const router = express.Router();
const resignationController = require("./resignation.controller");
const authenticateJWT = require("../../../middlewares/auth.middleware");

router.get("/", authenticateJWT, resignationController.getResignations);
router.post("/", authenticateJWT, resignationController.saveResignation);
router.delete("/:id", authenticateJWT, resignationController.deleteResignation);
router.get("/employee/:uan", authenticateJWT, resignationController.getEmployeeByUan);

module.exports = router;
