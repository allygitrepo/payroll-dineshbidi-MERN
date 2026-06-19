const express = require("express");
const router = express.Router();
const usersRoutes = require("./modules/Users/users.routes");

router.get("/v1/test", (req, res) => {
    res.json({
        server: "Payroll",
        message: "Connected Successfully",
        status: true,
        code: "SUCCESS",
    });
});

// Register users routes under v1 version prefix
router.use("/v1/users", usersRoutes);

module.exports = router;
