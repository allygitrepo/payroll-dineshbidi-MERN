const express = require("express");
const router = express.Router();
const NoteController = require("./note.controller");
const authenticateJWT = require("../../../middlewares/auth.middleware");

// All routes protected by JWT authentication
router.post("/", authenticateJWT, NoteController.create);
router.get("/company/:companyId", authenticateJWT, NoteController.getAll);
router.put("/:id", authenticateJWT, NoteController.update);
router.delete("/:id", authenticateJWT, NoteController.delete);

module.exports = router;
