const express = require("express");
const router = express.Router();
const usersRoutes = require("./modules/Users/users.routes");
const companyRoutes = require("./modules/Company/company.routes");
const addressRoutes = require("./modules/Address/address.routes");

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
router.use("/v1/companies", companyRoutes);
router.use("/v1/addresses", addressRoutes);

module.exports = router;
