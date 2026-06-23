const express = require("express");
const router = express.Router();
const usersRoutes = require("./modules/Auth/Users/users.routes");
const companyRoutes = require("./modules/Masters/Company/company.routes");
const addressRoutes = require("./modules/Masters/Address/address.routes");
const contractorRoutes = require("./modules/Masters/Contractor/contractor.routes");
const employeeRoutes = require("./modules/Masters/Employee/employee.routes");
const challanSetupRoutes = require("./modules/Setup/ChallanSetup/challanSetup.routes");
const professionalTaxRoutes = require("./modules/Setup/ProfessionalTax/professionalTax.routes");
const bidiRollerWageRoutes = require("./modules/Setup/BidiRollerWage/bidiRollerWage.routes");
const packingWageRoutes = require("./modules/Setup/PackingWage/packingWage.routes");
const officeStaffSalaryRoutes = require("./modules/Setup/OfficeStaffSalary/officeStaffSalary.routes");
const exportRoutes = require("./modules/Export/export.routes");
const calenderRoutes = require("./modules/Setup/Calender/calender.routes");
const officeStaffEntryRoutes = require("./modules/Entry/OfficeStaffEntry/officeStaffEntry.routes");
const packersEntryRoutes = require("./modules/Entry/PackersEntry/packersEntry.routes");
const bidiRollerEntryRoutes = require("./modules/Entry/BidiRollerEntry/bidiRollerEntry.routes");


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
router.use("/v1/challan-setups", challanSetupRoutes);
router.use("/v1/professional-taxes", professionalTaxRoutes);
router.use("/v1/bidi-roller-wages", bidiRollerWageRoutes);
router.use("/v1/packing-wages", packingWageRoutes);
router.use("/v1/office-staff-salaries", officeStaffSalaryRoutes);
router.use("/v1/export", exportRoutes);
router.use("/v1/calenders", calenderRoutes);
router.use("/v1/office-staff-entries", officeStaffEntryRoutes);
router.use("/v1/packers-entries", packersEntryRoutes);
router.use("/v1/bidi-roller-entries", bidiRollerEntryRoutes);


module.exports = router;
