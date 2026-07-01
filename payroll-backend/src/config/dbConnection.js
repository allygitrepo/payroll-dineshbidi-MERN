const sequelize = require("./database");
const db = require("../database/models/index");

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log("Database Connected Successfully");

        // Sync models with foreign key checks temporarily disabled to prevent order issues
        // Database migrations checked and cleaned
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
        await db.sequelize.sync({ alter: true });
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log("Database models synchronized successfully");
    } catch (err) {
        console.log("DB connection failed");
        console.log(err.message);

        process.exit(1);
    }
};

module.exports = connectDB;

