const express = require("express");
const router = express.Router();
const LeaveMasterController = require("./leaveMaster.controller");
const authenticateJWT = require("../../../middlewares/auth.middleware");

router.get("/company/:companyId", authenticateJWT, LeaveMasterController.getAll);
router.post("/company/:companyId", authenticateJWT, LeaveMasterController.save);
router.delete("/:id", authenticateJWT, LeaveMasterController.delete);

module.exports = router;
