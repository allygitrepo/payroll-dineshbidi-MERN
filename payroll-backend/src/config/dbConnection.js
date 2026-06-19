const sequelize = require("./database")

const connectDB = async () => {
    try {
        await sequelize.authenticate();

        console.log("Database Connected Successfully");
    } catch (err) {
        console.log("DB connection faild");
        console.log(err.message);

        process.exit(1);
    }
};

module.exports = connectDB;

