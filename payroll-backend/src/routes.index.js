const express = require("express");
const router = express.Router();
const usersRoutes = require("./modules/Auth/Users/users.routes");
const companyRoutes = require("./modules/Masters/Company/company.routes");
const addressRoutes = require("./modules/Masters/Address/address.routes");
const contractorRoutes = require("./modules/Masters/Contractor/contractor.routes");
const employeeRoutes = require("./modules/Masters/Employee/employee.routes");
const attendanceRoutes = require("./modules/Attendance/attendance.routes");

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
router.use("/v1/contractors", contractorRoutes);
router.use("/v1/employees", employeeRoutes);
router.use("/v1/attendance", attendanceRoutes);

module.exports = router;
