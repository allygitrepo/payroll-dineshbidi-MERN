const sequelize = require("./database");
const db = require("../database/models/index");

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log("Database Connected Successfully");

        // Sync models
        // await db.sequelize.sync({ alter: true });
        console.log("Database models synchronized successfully");
    } catch (err) {
        console.log("DB connection failed");
        console.log(err.message);

        process.exit(1);
    }
};

module.exports = connectDB;

