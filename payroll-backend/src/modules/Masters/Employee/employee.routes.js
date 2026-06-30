const express = require("express");
const router = express.Router();
const EmployeeController = require("./employee.controller");
const FaceController = require("./face.controller");
const authenticateJWT = require("../../../middlewares/auth.middleware");
const requirePermission = require("../../../middlewares/permission.middleware");

// All routes are protected by JWT authentication
router.post("/", authenticateJWT, requirePermission("employee", "create"), EmployeeController.create);
router.get("/company/:companyId", authenticateJWT, requirePermission("employee", "read"), EmployeeController.getAll);
router.get("/company/:companyId/missing-details", authenticateJWT, requirePermission("employee", "read"), EmployeeController.getMissingDetails);
router.get("/:id", authenticateJWT, requirePermission("employee", "read"), EmployeeController.getById);
router.put("/:id", authenticateJWT, requirePermission("employee", "edit"), EmployeeController.update);
router.delete("/:id", authenticateJWT, requirePermission("employee", "delete"), EmployeeController.delete);

// Face biometrics routes
router.post("/face/enroll", authenticateJWT, FaceController.enroll);
router.post("/face/recognize", FaceController.recognize);
router.get("/face/list", authenticateJWT, FaceController.list);

module.exports = router;
