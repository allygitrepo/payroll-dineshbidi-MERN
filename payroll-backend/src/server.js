require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/dbConnection");
const setupDefaultUser = require("./utils/setupDefaultUser");
const seedWhatsAppTemplates = require("./utils/seedWhatsAppTemplates");

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
    await setupDefaultUser();
    await seedWhatsAppTemplates();
    
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});
// Trigger nodemon restart after db and ignore config updates