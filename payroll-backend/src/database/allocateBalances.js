require("dotenv").config();
const db = require("../database/models/index");
const LeaveBalanceService = require("../modules/Attendance/Leave/leaveBalance.service");

async function allocateExisting() {
    try {
        console.log("Connecting to database...");
        await db.sequelize.authenticate();
        console.log("Fetching employees...");
        const employees = await db.Employee.findAll();
        
        for (const emp of employees) {
            console.log(`Running leave allocation for employee: ${emp.name} (Joined: ${emp.date_of_joining})`);
            await LeaveBalanceService.autoAllocateForEmployee(emp);
        }
        
        console.log("All existing employees' leave balances have been successfully allocated.");
        process.exit(0);
    } catch (err) {
        console.error("Failed to allocate balances:", err);
        process.exit(1);
    }
}

allocateExisting();
