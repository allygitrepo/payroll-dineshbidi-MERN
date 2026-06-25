const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const restoreController = require("./restore.controller");
const authenticateJWT = require("../../../middlewares/auth.middleware");

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../../../tmp/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, 'backup_' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// POST /payroll/v1/utility/restore/preview
router.post("/preview", authenticateJWT, upload.single('sqlFile'), restoreController.previewRestore);

// POST /payroll/v1/utility/restore/execute
router.post("/execute", authenticateJWT, restoreController.executeRestore);

module.exports = router;
