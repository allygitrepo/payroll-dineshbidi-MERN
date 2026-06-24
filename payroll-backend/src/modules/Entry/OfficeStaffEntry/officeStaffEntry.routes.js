const express = require("express");
const router = express.Router();
const officeStaffEntryController = require("./officeStaffEntry.controller");
const authenticateJWT = require("../../../middlewares/auth.middleware");

router.get("/", authenticateJWT, officeStaffEntryController.getEntries);
router.post("/", authenticateJWT, officeStaffEntryController.saveEntries);

module.exports = router;
