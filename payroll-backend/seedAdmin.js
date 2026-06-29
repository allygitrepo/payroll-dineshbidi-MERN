const db = require("./src/database/models");
const { v4: uuidv4 } = require("uuid");

const ALL_PERMISSION_SLUGS = [
  'dashboard',
  'company', 'employee', 'kyc-update', 'contractor', 'address', 'leave-master',
  'packing-wages', 'bidi-roller-wages', 'professional-tax', 'office-staff-salary', 'challan-setup',
  'office-attendance', 'packing-attendance', 'bidi-roller-attendance',
  'office-staff', 'packers', 'bidi-roller', 'epf-challan-date', 'resignation',
  'salary-sheet', 'form-2', 'ecr-report', 'esic-report', 'pmrpy-report', 'pf-challan-yearly', 'epf-challan', 'pf-summary', 'payment-advice', 'bonus-sheet', 'gratuity-calculation', 'report-pt',
  'calender', 'user-management', 'employee-data-import', 'employee-data-export', 'kyc-export', 'attendance-printing', 'missing-information', 'delete-month-entry', 'backup', 'restore',
  '3-month-absent-list', '58-years-of-age', 'notes',
  'excel-to-text'
];

async function seedAdmin() {
    try {
        await db.sequelize.authenticate();
        console.log("Database connection OK.");
        
        // Construct the permissions object with all values set to true
        const permissions = {};
        ALL_PERMISSION_SLUGS.forEach(slug => {
            permissions[slug] = true;
        });

        // Insert the role
        const role = await db.Role.create({
            id: uuidv4(),
            name: "ADMIN",
            permissions: permissions,
            status: true
        });

        console.log("Admin Role seeded successfully!");
        console.log("Role ID:", role.id);
        
        process.exit(0);
    } catch (error) {
        console.error("Failed to seed admin role:", error);
        process.exit(1);
    }
}

seedAdmin();
