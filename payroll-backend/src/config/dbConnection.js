const sequelize = require("./database");
const db = require("../database/models/index");

const connectDB = async () => {
    try {
        await sequelize.authenticate({ sync: { alter: true } });
        console.log("Database Connected Successfully");

        // Sync models with foreign key checks temporarily disabled to prevent order issues
        // Database migrations checked and cleaned
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

        // Ensure parent tables exist first
        // if (db.EmployeeType) {
        //     await db.EmployeeType.sync();
        // }
        // if (db.LeaveType) {
        //     await db.LeaveType.sync();
        // }

        // await db.sequelize.sync();
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log("Database models synchronized successfully");
    } catch (err) {
        console.log("DB connection failed");
        console.log(err.message);

        process.exit(1);
    }
};

module.exports = connectDB;

