const express = require("express");
const router = express.Router();
const EmployeeController = require("./employee.controller");
const FaceController = require("./face.controller");
const authenticateJWT = require("../../../middlewares/auth.middleware");

// All routes are protected by JWT authentication
router.post("/", authenticateJWT, EmployeeController.create);
router.get("/company/:companyId", authenticateJWT, EmployeeController.getAll);
router.get("/:id", authenticateJWT, EmployeeController.getById);
router.put("/:id", authenticateJWT, EmployeeController.update);
router.delete("/:id", authenticateJWT, EmployeeController.delete);

// Face biometrics routes
router.post("/face/enroll", authenticateJWT, FaceController.enroll);
router.post("/face/recognize", FaceController.recognize);
router.get("/face/list", authenticateJWT, FaceController.list);

module.exports = router;
