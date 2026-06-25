const express = require("express");
const router = express.Router();
const PackersEntryController = require("./packersEntry.controller");
const authenticateJWT = require("../../../middlewares/auth.middleware");
// Get all packer entries for a given month_year
router.get("/company", authenticateJWT, PackersEntryController.getEntries);

// Save (create or update) multiple entries
router.post("/company", authenticateJWT, PackersEntryController.saveEntries);

// Delete entries
router.delete("/company", authenticateJWT, PackersEntryController.deleteEntries);

module.exports = router;
