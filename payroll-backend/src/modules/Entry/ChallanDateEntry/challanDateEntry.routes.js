const express = require("express");
const router = express.Router();
const challanDateEntryController = require("./challanDateEntry.controller");
const authenticateJWT = require("../../../middlewares/auth.middleware");

router.get("/", authenticateJWT, challanDateEntryController.getEntries);
router.post("/bulk", authenticateJWT, challanDateEntryController.saveBulkEntries);
router.post("/", authenticateJWT, challanDateEntryController.saveEntry);
router.delete("/:id", authenticateJWT, challanDateEntryController.deleteEntry);

module.exports = router;
