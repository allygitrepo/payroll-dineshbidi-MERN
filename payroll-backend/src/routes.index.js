const express = require("express");
const router = express.Router();
const usersRoutes = require("./modules/Auth/Users/users.routes");
const roleRoutes = require("./modules/Auth/Users/roles.routes");
const companyRoutes = require("./modules/Masters/Company/company.routes");
const addressRoutes = require("./modules/Masters/Address/address.routes");
const contractorRoutes = require("./modules/Masters/Contractor/contractor.routes");
const employeeRoutes = require("./modules/Masters/Employee/employee.routes");
const attendanceRoutes = require("./modules/Attendance/attendance.routes");
const leaveRequestRoutes = require("./modules/Attendance/Leave/leaveRequest.routes");
const leaveMasterRoutes = require("./modules/Setup/LeaveMaster/leaveMaster.routes");
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
const challanDateEntryRoutes = require("./modules/Entry/ChallanDateEntry/challanDateEntry.routes");
const resignationRoutes = require("./modules/Entry/Resignation/resignation.routes");
const noteRoutes = require("./modules/Todo List/Note/note.routes");
// const attendanceRoutes = require("./modules/Attendance/attendance.routes");
// const leaveRequestRoutes = require("./modules/Attendance/Leave/leaveRequest.routes");
const reportRoutes = require("./modules/Report/report.routes");

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
router.use("/v1/roles", roleRoutes);
router.use("/v1/companies", companyRoutes);
router.use("/v1/addresses", addressRoutes);
router.use("/v1/contractors", contractorRoutes);
router.use("/v1/employees", employeeRoutes);
router.use("/v1/attendance", attendanceRoutes);
router.use("/v1/leaves", leaveRequestRoutes);
router.use("/v1/leave-masters", leaveMasterRoutes);
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
router.use("/v1/challan-date-entries", challanDateEntryRoutes);
router.use("/v1/resignations", resignationRoutes);
router.use("/v1/notes", noteRoutes);
router.use("/v1/attendance", attendanceRoutes);
router.use("/v1/leaves", leaveRequestRoutes);
router.use("/v1/reports", reportRoutes);
router.use("/v1/dashboard", require("./modules/Dashboard/dashboard.routes"));
router.use("/v1/utility/backup", require("./modules/Utility/Backup/backup.routes"));
router.use("/v1/utility/restore", require("./modules/Utility/Restore/restore.routes"));
router.use("/v1/utility/uan-to-ip", require("./modules/Utility/UanToIp/uanToIp.routes"));

module.exports = router;
