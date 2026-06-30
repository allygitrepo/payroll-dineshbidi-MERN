const express = require("express");
const router = express.Router();
const saasController = require("./saas.controller");
const authenticateJWT = require("../../../middlewares/auth.middleware");

// Custom middleware to ensure only SAAS_ADMIN (OWNER) can access
const requireSaaSAdmin = (req, res, next) => {
    if (req.user && req.user.role_name === 'OWNER') {
        next();
    } else {
        return res.status(403).json({
            status: false,
            message: "Forbidden",
            messageToShow: "Only SaaS Administrators can perform this action."
        });
    }
};

router.post("/clients", authenticateJWT, requireSaaSAdmin, saasController.createSaasClient);
router.get("/clients", authenticateJWT, requireSaaSAdmin, saasController.getSaasClients);
router.get("/dashboard-stats", authenticateJWT, requireSaaSAdmin, saasController.getDashboardStats);
router.get("/co-admins", authenticateJWT, requireSaaSAdmin, saasController.getCoAdmins);
router.post("/co-admins", authenticateJWT, requireSaaSAdmin, saasController.createCoAdmin);

module.exports = router;
