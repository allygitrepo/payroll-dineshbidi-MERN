const express = require("express");
const router = express.Router();
const bidiRollerEntryController = require("./bidiRollerEntry.controller");
const authenticateJWT = require("../../../middlewares/auth.middleware");

router.get("/company", authenticateJWT, bidiRollerEntryController.getEntries);
router.post("/company", authenticateJWT, bidiRollerEntryController.saveEntries);

module.exports = router;
