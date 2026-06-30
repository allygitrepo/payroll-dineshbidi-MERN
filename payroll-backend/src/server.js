require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/dbConnection");
const setupDefaultUser = require("./utils/setupDefaultUser");

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
    await setupDefaultUser();
    
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`http://localhost:${PORT}/payroll/v1/test`);
    });
});
// Trigger nodemon restart after db and ignore config updates