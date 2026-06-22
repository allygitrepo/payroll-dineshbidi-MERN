require("dotenv").config();
const bcrypt = require("bcrypt");
const db = require("./models/index");

const seedUsers = async () => {
    try {
        console.log("Connecting to database...");
        await db.sequelize.authenticate();
        console.log("Database Connected. Syncing models...");
        await db.sequelize.sync({ alter: true });

        console.log("Seeding sample users...");
        const saltRounds = 10;

        const sampleUsers = [
            {
                user_name: "System Admin",
                user_id: "admin01",
                password: "adminPassword123",
                role: "admin",
            },
            {
                user_name: "HR Manager",
                user_id: "manager01",
                password: "managerPassword123",
                role: "user",
            },
            {
                user_name: "Payroll Executive",
                user_id: "payroll01",
                password: "payrollPassword123",
                role: "user",
            },
        ];

        for (const userData of sampleUsers) {
            // Check if user already exists
            const exists = await db.User.findOne({ where: { user_id: userData.user_id } });
            if (exists) {
                console.log(`User ${userData.user_id} already exists, skipping...`);
                continue;
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

            // Create user
            await db.User.create({
                user_name: userData.user_name,
                user_id: userData.user_id,
                password: hashedPassword,
                role: userData.role,
                status: true,
            });
            console.log(`Created user: ${userData.user_name} (${userData.user_id})`);
        }

        console.log("Database seeded successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding database:", error);
        process.exit(1);
    }
};

seedUsers();
