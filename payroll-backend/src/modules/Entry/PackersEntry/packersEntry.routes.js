const express = require("express");
const router = express.Router();
const PackersEntryController = require("./packersEntry.controller");
const authenticateJWT = require("../../../middlewares/auth.middleware");
const requirePermission = require("../../../middlewares/permission.middleware");
// Get all packer entries for a given month_year
router.get("/company", authenticateJWT, requirePermission("packers", "read"), PackersEntryController.getEntries);

// Save (create or update) multiple entries
router.post("/company", authenticateJWT, requirePermission("packers", "create"), PackersEntryController.saveEntries);

// Delete entries
router.delete("/company", authenticateJWT, requirePermission("packers", "delete"), PackersEntryController.deleteEntries);

module.exports = router;
