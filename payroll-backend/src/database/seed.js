require("dotenv").config();
const bcrypt = require("bcrypt");
const db = require("./models/index");

const seedUsers = async () => {
    try {
        console.log("Connecting to database...");
        await db.sequelize.authenticate();
        console.log("Database Connected. Syncing models...");
        await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
        await db.sequelize.query("DROP TABLE IF EXISTS employee_types");
        await db.sequelize.query("DROP TABLE IF EXISTS leave_policies");
        await db.sequelize.sync({ alter: true });
        await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log("Cleaning up deprecated tables...");
        await db.sequelize.query("DROP TABLE IF EXISTS leave_masters");

        console.log("Seeding Roles...");
        let adminRole = await db.Role.findOne({ where: { name: "Admin" } });
        if (!adminRole) {
            adminRole = await db.Role.create({
                name: "Admin",
                permissions: {
                    all: true,
                    full_access: true,
                    dashboard: ["read", "write", "update", "delete"],
                    users: ["create", "read", "update", "delete"],
                    roles: ["create", "read", "update", "delete"],
                    company: ["create", "read", "update", "delete"],
                    employee: ["create", "read", "update", "delete"],
                    contractor: ["create", "read", "update", "delete"],
                    attendance: ["create", "read", "update", "delete"],
                    setup: ["create", "read", "update", "delete"],
                    reports: ["read", "export"]
                },
                status: true
            });
            console.log("Created Admin role");
        }

        let userRole = await db.Role.findOne({ where: { name: "User" } });
        if (!userRole) {
            userRole = await db.Role.create({
                name: "User",
                permissions: {
                    dashboard: ["read"],
                    employee: ["read"],
                    attendance: ["read"]
                },
                status: true
            });
            console.log("Created User role");
        }

        console.log("Seeding sample users...");
        const saltRounds = 10;

        const sampleUsers = [
            {
                user_name: "System Admin",
                user_id: "admin01",
                password: "adminPassword123",
                role_id: adminRole.id,
            },
            {
                user_name: "HR Manager",
                user_id: "manager01",
                password: "managerPassword123",
                role_id: userRole.id,
            },
            {
                user_name: "Payroll Executive",
                user_id: "payroll01",
                password: "payrollPassword123",
                role_id: userRole.id,
            },
        ];

        for (const userData of sampleUsers) {
            // Check if user already exists
            const exists = await db.User.findOne({ where: { user_id: userData.user_id } });
            if (exists) {
                console.log(`User ${userData.user_id} already exists, updating role_id...`);
                await exists.update({ role_id: userData.role_id });
                continue;
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

            // Create user
            await db.User.create({
                user_name: userData.user_name,
                user_id: userData.user_id,
                password: hashedPassword,
                role_id: userData.role_id,
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
